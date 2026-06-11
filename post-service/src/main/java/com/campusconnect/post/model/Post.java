package com.campusconnect.post.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "posts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Post {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "post_id")
    private Long postId;
    
    @Column(name = "user_id")
    private Long authorId;

    @Column(name = "author_name")
    private String authorName;
    
    // LOST, FOUND, HELP
    private String type; 
    private String title;
    private String description;
    private String category;
    private String location;
    
    // OPEN, CLAIMED, COMPLETED
    private String status = "OPEN"; 
    
    @Column(name = "urgency_level")
    private Integer urgencyLevel = 0;

    @Column(name = "likes_count")
    private Integer likesCount = 0;

    @Column(name = "comments_count")
    private Integer commentsCount = 0;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;
    
    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
