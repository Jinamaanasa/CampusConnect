package com.campusconnect.auth.controller;

import com.campusconnect.auth.model.User;
import com.campusconnect.auth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserProfile(@PathVariable Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setPassword(null);
            return ResponseEntity.ok(user);
        }
        return ResponseEntity.notFound().build();
    }

    @Autowired
    private org.springframework.web.client.RestTemplate restTemplate;

    private final String POST_SERVICE_URL = "http://post-service:8086/api/posts";

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> updateProfile(@PathVariable Long id, @RequestBody Map<String, String> updates) {
        System.out.println("Updating profile for user ID: " + id);
        
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            String oldName = user.getName();
            boolean nameChanged = false;

            if (updates.containsKey("name") && updates.get("name") != null && !updates.get("name").isBlank()) {
                String newName = updates.get("name");
                if (!newName.equals(oldName)) {
                    user.setName(newName);
                    nameChanged = true;
                }
            }
            if (updates.containsKey("department")) {
                user.setDepartment(updates.get("department"));
            }
            userRepository.save(user);

            // Sync name change to post-service
            if (nameChanged) {
                try {
                    restTemplate.put(POST_SERVICE_URL + "/user/" + id + "/name?newName=" + user.getName(), null);
                } catch (Exception e) {
                    System.err.println("Failed to sync name change to post-service: " + e.getMessage());
                }
            }

            User responseUser = new User(user.getId(), user.getName(), user.getEmail(), null, user.getDepartment(), user.getReputationScore());
            return ResponseEntity.ok(responseUser);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/reputation")
    @Transactional
    public ResponseEntity<?> updateReputation(@PathVariable Long id, @RequestParam int points) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            int current = user.getReputationScore() == null ? 0 : user.getReputationScore();
            user.setReputationScore(current + points);
            userRepository.save(user);
            return ResponseEntity.ok("Reputation updated to: " + user.getReputationScore());
        }
        return ResponseEntity.notFound().build();
    }
}
