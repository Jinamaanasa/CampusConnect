package com.campusconnect.request.repository;

import com.campusconnect.request.model.Request;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RequestRepository extends JpaRepository<Request, Long> {
    List<Request> findByPostId(Long postId);
    Optional<Request> findByPostIdAndStatus(Long postId, String status);
    Optional<Request> findByPostIdAndRequesterIdAndStatus(Long postId, Long requesterId, String status);
    // Used to block any re-submission from same user regardless of status
    Optional<Request> findByPostIdAndRequesterId(Long postId, Long requesterId);
    List<Request> findByRequesterId(Long requesterId);
}
