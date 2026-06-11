package com.campusconnect.request.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "posts")
public class Post {
    
    // We only need the ID and status in Request Service to update the status.
    // The rest of the fields are managed by Post Service!
    @Id
    private Long postId;
    
    private String status;

    public Post() {}

    public Long getPostId() { return postId; }
    public void setPostId(Long postId) { this.postId = postId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
