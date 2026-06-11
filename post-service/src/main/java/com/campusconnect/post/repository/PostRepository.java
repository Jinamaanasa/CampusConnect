package com.campusconnect.post.repository;

import com.campusconnect.post.model.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    
    // Custom query for Smart Matching!
    List<Post> findByTypeAndCategoryAndLocationAndStatus(String type, String category, String location, String status);

    // Fetch all posts for a specific user
    List<Post> findByAuthorId(Long authorId);
}
