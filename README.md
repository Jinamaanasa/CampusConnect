# CampusConnect 

A powerful, microservices-based campus networking and communication platform designed to streamline student interaction, facilitate peer-to-peer assistance, and build a stronger campus community.

##  Overview

CampusConnect is a comprehensive platform built to solve common campus challenges. Whether you've lost an item, found something valuable, or need academic help, CampusConnect provides a centralized, secure, and professional environment for students and staff to connect. 

The application is built on a robust, scalable **Microservices Architecture** utilizing **Spring Boot** for the backend, **React** for a dynamic frontend, and **PostgreSQL** for persistent storage, all containerized and orchestrated with **Docker**.

##  Key Features

- **Secure Authentication:** Robust user registration and login system with strict access control and automatic redirects for unauthenticated users.
- **Lost & Found System:** Create and browse posts for lost or found items. Includes support for detailed descriptions and image uploads.
- **Peer-to-Peer Requests:** Request help from peers or offer assistance to others in need.
- **Real-time Notifications:** Stay updated with instant notifications for interactions on your posts or requests.
- **Reputation System:** Earn reputation points by actively helping others and contributing to the community (e.g., resolving requests, returning items).
- **Interactive Dashboard:** Track your contributions, view your posts, and monitor your reputation score in a sleek, professional interface.

##  Technology Stack

### Frontend
- **React.js**: Dynamic, responsive user interface.
- **Axios**: HTTP client for API requests.
- **Modern CSS/UI**: Premium, dark-mode ready design focusing on aesthetics and user experience.

### Backend (Microservices)
- **Spring Boot**: Core framework for all backend services.
- **Spring Cloud / API Gateway**: Inter-service communication and routing.
- **Spring Security & JWT**: Secure authentication and authorization.

### Database & Storage
- **PostgreSQL**: Relational database for all microservices (Auth, Post, Request, Notification).

### DevOps & Deployment
- **Docker & Docker Compose**: Containerization for consistent development and deployment environments.
- **Kubernetes (k8s)**: Deployment configurations for production scaling.

##  Architecture

The backend is decomposed into focused microservices to ensure scalability and maintainability:

1. **Auth Service (`/auth-service`)**: Manages user registration, login, and JWT validation.
2. **Post Service (`/post-service`)**: Handles the creation, retrieval, and management of user posts (Lost/Found).
3. **Request Service (`/request-service`)**: Manages help requests and peer interactions.
4. **Notification Service (`/notification-service`)**: Processes and delivers alerts to users.

##  Getting Started

### Prerequisites

Ensure you have the following installed on your local machine:
- [Docker](https://www.docker.com/products/docker-desktop) and Docker Compose
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [Java Development Kit (JDK)](https://adoptium.net/) (v17+)
- [Maven](https://maven.apache.org/)

### Running with Docker Compose (Easiest Method)

The entire application stack (databases + microservices + frontend) can be spun up using Docker Compose.

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/CampusConnect.git
   cd CampusConnect
   ```

2. Start the services:
   ```bash
   docker-compose up --build -d
   ```

3. Access the application:
   - Frontend: `http://localhost:3000`
   - API Gateway (if configured): `http://localhost:8080`

### Local Development Setup

If you prefer to run the services individually for development:

1. **Database**: Ensure your local PostgreSQL instance is running and the required databases (for auth, post, request, notification) are created.
2. **Backend Services**: Navigate to each service directory (`auth-service`, `post-service`, etc.) and run:
   ```bash
   mvn spring-boot:run
   ```
3. **Frontend**: Navigate to the `frontend` directory:
   ```bash
   cd frontend
   npm install
   npm start
   ```

##  Directory Structure

```text
CampusConnect/
├── auth-service/         # User authentication and management
├── post-service/         # Post creation and feed management
├── request-service/      # Help request processing
├── notification-service/ # Alert and notification delivery
├── frontend/             # React web application
├── database/             # Database schemas and initialization scripts
├── k8s/                  # Kubernetes deployment manifests
├── docker-compose.yml    # Multi-container Docker orchestration
└── README.md             # Project documentation
```

##  Contributing

We welcome contributions to make CampusConnect even better!
1. Fork the repository.
2. Create a new branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
