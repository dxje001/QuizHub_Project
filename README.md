# QuizHub – Web Application for Quiz Management
Comparison of Monolithic and Microservices Architectures Using Load Testing on AWS

QuizHub is a full–stack web application for creating, managing, and solving quizzes.  
The project includes two complete backend implementations:

- Monolithic architecture (local deployment)
- Microservices architecture (AWS deployment with Docker, Nginx, EC2, RDS)

The goal is to compare their performance using K6 load testing.

---

## Features

### User Management
- Registration and login
- JWT authentication
- User roles: Admin, Creator, User

### Quiz Management
- Create and edit quizzes
- Questions, answers, categories
- Time limits and scoring
- Browse and filter quizzes

### Quiz Execution
- Start quiz sessions
- Submit answers
- Score calculation
- Display results

### Results and Statistics
- Store results per user
- Leaderboards
- Personal history

---

## Technologies

### Backend
- ASP.NET Core 8 (Web API)
- Entity Framework Core
- PostgreSQL
- Serilog
- JWT Authentication

### Frontend
- React 18
- TypeScript
- Vite
- Zustand
- Tailwind CSS
- Axios

### Infrastructure
- Docker and Docker Compose
- AWS EC2
- AWS RDS (PostgreSQL)
- Nginx API Gateway
- K6 Load Testing

---

## Architecture Overview

### Monolithic Architecture

Single ASP.NET Core project structured using Clean Architecture:

```
backend/
├── KvizHub.API
├── KvizHub.Application
├── KvizHub.Domain
└── KvizHub.Infrastructure
```

Characteristics:
- One deployment unit  
- One database  
- Direct in-memory communication  

---

### Microservices Architecture

Three independent services, each with its own database:

```
backend/src/
├── KvizHub.AuthService
├── KvizHub.QuizService
└── KvizHub.ExecutionService
```

Service ports:

| Service | Port |
|---------|------|
| AuthService | 5001 |
| QuizService | 5002 |
| ExecutionService | 5003 |
| API Gateway (Nginx) | 80 |

Nginx routing:

```
/api/auth/**       → AuthService
/api/quiz/**       → QuizService
/api/category/**   → QuizService
/api/execution/**  → ExecutionService
/api/results/**    → ExecutionService
```

---

## Installation and Running

### Monolithic (Local)

```
docker-compose up -d
```

Services:
- Backend API: http://localhost:5000
- Frontend: http://localhost:3050
- PostgreSQL database

---

### Microservices (Local or AWS)

```
docker-compose up -d
```

Runs:
- AuthService
- QuizService
- ExecutionService
- Nginx API Gateway

Environment variables required:
- Connection strings
- JWT secret
- CORS configuration

On AWS:
- Containers run on EC2
- Databases hosted on RDS
- Traffic routed through Nginx

---

## Performance Testing (K6)

Load testing includes:
- 5 users (low load)
- 20 users (medium load)
- 50 users (high load)

### Summary of Results

| Metric | Better Architecture | Explanation |
|--------|---------------------|-------------|
| Average Response Time | Monolith | No network latency |
| p95 Latency | Monolith | Faster in-memory processing |
| Throughput | Monolith | Less overhead |
| Error Rate | Monolith | Fewer failure points |
| Scalability | Microservices | Independent service scaling |

Key Insight:
- Monolith performs better under low and medium load.
- Microservices introduce network latency and service chaining.
- Microservices excel at horizontal scalability, not raw performance.

---

## Project Structure

```
QuizHub_Project/
├── backend/
│   ├── monolith/
│   └── microservices/
├── frontend/
├── k6-tests/
└── documentation/
```

---

## API Examples

### Authentication
```
POST /api/auth/login
POST /api/auth/register
```

### Quiz Management
```
GET    /api/quiz/{id}
POST   /api/quiz
DELETE /api/quiz/{id}
```

### Quiz Execution
```
POST /api/execution/start
POST /api/execution/submit
GET  /api/results/user
```

---

## Author
Dušan Stefanović  
Applied Software Engineering  
University of Novi Sad

