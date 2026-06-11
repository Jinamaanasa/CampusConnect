package com.campusconnect.post.controller;

import com.campusconnect.post.model.Comment;
import com.campusconnect.post.model.Post;
import com.campusconnect.post.model.PostLike;
import com.campusconnect.post.repository.CommentRepository;
import com.campusconnect.post.repository.PostLikeRepository;
import com.campusconnect.post.repository.PostRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/posts")
@CrossOrigin(origins = "*") // Allows React frontend to bypass CORS constraints locally
public class PostController {

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private PostLikeRepository postLikeRepository;

    @Autowired
    private CommentRepository commentRepository;

    @PostMapping("/create")
    public Post createPost(@RequestBody Post post) {
        Long userId = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        post.setAuthorId(userId);
        post.setStatus("OPEN");
        post.setUrgencyLevel(0);
        return postRepository.save(post);
    }

    @PutMapping("/{postId}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long postId, @RequestParam String newStatus) {
        return postRepository.findById(postId).map(post -> {
            post.setStatus(newStatus);
            postRepository.save(post);
            return ResponseEntity.ok(post);
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/all")
    public List<Post> getAllPosts() {
        return postRepository.findAll();
    }

    @GetMapping("/user/{userId}")
    public List<Post> getPostsByUser(@PathVariable Long userId) {
        return postRepository.findByAuthorId(userId);
    }

    @GetMapping("/search")
    public List<Post> searchPosts(@RequestParam(required = false) String query) {
        if (query == null || query.trim().isEmpty()) {
            return postRepository.findAll();
        }
        String lowerQuery = query.toLowerCase();
        return postRepository.findAll().stream()
            .filter(p -> (p.getTitle() != null && p.getTitle().toLowerCase().contains(lowerQuery)) || 
                         (p.getDescription() != null && p.getDescription().toLowerCase().contains(lowerQuery)) ||
                         (p.getCategory() != null && p.getCategory().toLowerCase().contains(lowerQuery)))
            .toList();
    }
    
    @GetMapping("/smart-match")
    public List<Post> getMatchingPosts(@RequestParam String type, @RequestParam String category, @RequestParam String location, @RequestParam(required = false) String keyword) {
        List<Post> matches = postRepository.findByTypeAndCategoryAndLocationAndStatus(type, category, location, "OPEN");
        if (keyword != null && !keyword.trim().isEmpty()) {
            String lowerKeyword = keyword.toLowerCase();
            return matches.stream()
                .filter(p -> (p.getTitle() != null && p.getTitle().toLowerCase().contains(lowerKeyword)) || 
                             (p.getDescription() != null && p.getDescription().toLowerCase().contains(lowerKeyword)))
                .toList();
        }
        return matches;
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<?> deletePost(@PathVariable Long postId) {
        Long userId = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Optional<Post> postOpt = postRepository.findById(postId);
        if (postOpt.isPresent()) {
            Post post = postOpt.get();
            if (post.getAuthorId().equals(userId)) {
                postRepository.delete(post);
                return ResponseEntity.ok().build();
            }
            return ResponseEntity.status(403).body("You can only delete your own posts.");
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/user/{userId}/name")
    public ResponseEntity<?> updateAuthorName(@PathVariable Long userId, @RequestParam String newName) {
        List<Post> userPosts = postRepository.findByAuthorId(userId);
        for (Post p : userPosts) {
            p.setAuthorName(newName);
            postRepository.save(p);
        }
        return ResponseEntity.ok("Updated " + userPosts.size() + " posts");
    }

    @PostMapping("/{postId}/like")
    public ResponseEntity<?> toggleLike(@PathVariable Long postId) {
        Long userId = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return postRepository.findById(postId).map(post -> {
            Optional<PostLike> existingLike = postLikeRepository.findByPostIdAndUserId(postId, userId);
            int currentLikes = post.getLikesCount() == null ? 0 : post.getLikesCount();
            
            if (existingLike.isPresent()) {
                postLikeRepository.delete(existingLike.get());
                post.setLikesCount(Math.max(0, currentLikes - 1));
            } else {
                postLikeRepository.save(new PostLike(null, postId, userId));
                post.setLikesCount(currentLikes + 1);
            }
            postRepository.save(post);
            return ResponseEntity.ok(post);
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{postId}/comments")
    public List<Comment> getComments(@PathVariable Long postId) {
        return commentRepository.findByPostIdOrderByCreatedAtDesc(postId);
    }

    @PostMapping("/{postId}/comments")
    public ResponseEntity<Comment> addComment(@PathVariable Long postId, @RequestBody Comment comment) {
        Long userId = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        comment.setPostId(postId);
        comment.setAuthorId(userId);
        if (comment.getAuthorName() == null || comment.getAuthorName().isEmpty()) {
            comment.setAuthorName("Anonymous");
        }
        Comment saved = commentRepository.save(comment);

        // Increment commentsCount on Post
        postRepository.findById(postId).ifPresent(post -> {
            int currentComments = post.getCommentsCount() == null ? 0 : post.getCommentsCount();
            post.setCommentsCount(currentComments + 1);
            postRepository.save(post);
        });

        return ResponseEntity.ok(saved);
    }
}
