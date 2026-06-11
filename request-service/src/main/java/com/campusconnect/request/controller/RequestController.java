package com.campusconnect.request.controller;

import com.campusconnect.request.model.Request;
import com.campusconnect.request.repository.RequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/requests")
@CrossOrigin(origins = "*")
public class RequestController {

    @Autowired
    private RequestRepository requestRepository;

    @Autowired
    private RestTemplate restTemplate;

    // We assume backend services can talk to each other without internal auth or we'd pass the token
    private final String AUTH_SERVICE_URL = "http://auth-service:8085/api/users";
    private final String POST_SERVICE_URL = "http://post-service:8086/api/posts";
    
    @PostMapping("/create")
    public ResponseEntity<?> createRequest(@RequestBody Request newRequest) {
        Long userId = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        newRequest.setRequesterId(userId);
        newRequest.setStatus("PENDING");

        // ★ Block if this user already has ANY request for this post (any status)
        Optional<Request> existingAny = requestRepository.findByPostIdAndRequesterId(newRequest.getPostId(), userId);
        if (existingAny.isPresent()) {
            return ResponseEntity.badRequest().body("You have already showed interest in this post.");
        }

        // Ensure no other request is currently ACCEPTED for this post
        Optional<Request> existingAccepted = requestRepository.findByPostIdAndStatus(newRequest.getPostId(), "ACCEPTED");
        if (existingAccepted.isPresent()) {
            return ResponseEntity.badRequest().body("This post already has an accepted request.");
        }

        Request saved = requestRepository.save(newRequest);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/post/{postId}")
    public List<Request> getRequestsByPost(@PathVariable Long postId) {
        return requestRepository.findByPostId(postId);
    }

    @GetMapping("/my-requests")
    public List<Request> getMyRequests() {
        Long userId = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return requestRepository.findByRequesterId(userId);
    }

    @PostMapping("/{requestId}/accept")
    public ResponseEntity<?> acceptRequest(@PathVariable Long requestId) {
        Optional<Request> reqOpt = requestRepository.findById(requestId);
        if (reqOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Request request = reqOpt.get();
        // Verify that the current user is the author of the post (Optional but good)
        
        if ("ACCEPTED".equals(request.getStatus()) || "COMPLETED".equals(request.getStatus())) {
            return ResponseEntity.badRequest().body("Request is already accepted or completed");
        }

        request.setStatus("ACCEPTED");
        // Reject all other pending requests for the same post ID
        List<Request> allRequests = requestRepository.findByPostId(request.getPostId());
        for (Request r : allRequests) {
            if (!r.getRequestId().equals(requestId) && "PENDING".equals(r.getStatus())) {
                r.setStatus("REJECTED");
                requestRepository.save(r);
            }
        }
        
        requestRepository.save(request);

        try {
            restTemplate.put(POST_SERVICE_URL + "/" + request.getPostId() + "/status?newStatus=CLAIMED", null);
        } catch(Exception e) {
            System.err.println("Failed to update post status: " + e.getMessage());
        }

        return ResponseEntity.ok(request);
    }

    @PostMapping("/{requestId}/complete")
    public ResponseEntity<?> completeRequest(@PathVariable Long requestId, @RequestParam String type) {
        Optional<Request> reqOpt = requestRepository.findById(requestId);
        if (reqOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Request request = reqOpt.get();
        if (!"ACCEPTED".equals(request.getStatus())) {
            return ResponseEntity.badRequest().body("Only ACCEPTED requests can be marked as COMPLETED.");
        }

        request.setStatus("COMPLETED");
        requestRepository.save(request);

        // Update Gamification / Campus Reputation
        // User requested: +5 for help, +3 for lost thing
        int pointsToAdd = type.equalsIgnoreCase("HELP") ? 5 : 3;
        
        try {
            String url = AUTH_SERVICE_URL + "/" + request.getRequesterId() + "/reputation?points=" + pointsToAdd;
            restTemplate.postForEntity(url, null, String.class);
            restTemplate.put(POST_SERVICE_URL + "/" + request.getPostId() + "/status?newStatus=COMPLETED", null);
        } catch(Exception e) {
            // Logs would go here
            System.err.println("Failed to update reputation score or post status: " + e.getMessage());
        }

        return ResponseEntity.ok(request);
    }
}
