package com.campusconnect.auth.controller;

import lombok.Data;

public class Dto {
    @Data
    public static class AuthRequest {
        private String email;
        private String password;
    }

    @Data
    public static class AuthResponse {
        private String token;
        private Long userId;
        private String email;
        private String name;
        public AuthResponse(String token, Long userId, String email, String name) {
            this.token = token; this.userId = userId; this.email = email; this.name = name;
        }
    }

    @Data
    public static class RegisterRequest {
        private String name;
        private String email;
        private String password;
        private String department;
    }
}
