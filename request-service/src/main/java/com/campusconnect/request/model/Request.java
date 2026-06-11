package com.campusconnect.request.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Request {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "request_id")
    private Long requestId;

    @Column(name = "post_id")
    private Long postId;

    private String postTitle;
    
    @Column(name = "requester_id")
    private Long requesterId;

    private String requesterName;
    
    // PENDING, ACCEPTED, REJECTED, COMPLETED
    private String status = "PENDING"; 

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
