package com.campusconnect.request.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "actions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Action {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "action_id")
    private Long actionId;

    @Column(name = "request_id", nullable = false)
    private Long requestId;

    @Column(name = "actor_id", nullable = false)
    private Long actorId;

    // e.g. ACCEPTED, REJECTED, COMPLETED, CANCELLED
    @Column(nullable = false)
    private String actionType;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
