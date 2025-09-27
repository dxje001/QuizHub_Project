# QuizHub - Online Quiz Platform

**Student:** Dušan
**Course:** Web Development 2
**Academic Year:** 2024/2025
**Project Type:** Full-Stack Web Application

## Project Overview

QuizHub is a comprehensive online quiz platform that I developed as my final project for the Web Development 2 course. The application allows users to create, manage, and take quizzes in a modern, responsive web environment with real-time features.

## What I Built

This project demonstrates my understanding of modern web development technologies and architectural patterns:

### Frontend (React + TypeScript)
- **Framework:** React 18 with TypeScript for type safety
- **Build Tool:** Vite for fast development and optimized builds
- **Styling:** Tailwind CSS for modern, responsive design
- **State Management:** Zustand for lightweight state management
- **UI Components:** Custom components built with shadcn/ui
- **Authentication:** JWT-based authentication with token refresh

### Backend (.NET 6)
- **Architecture:** Clean Architecture with separation of concerns
- **API:** RESTful API with comprehensive endpoints
- **Authentication:** JWT tokens with role-based authorization
- **Database:** Entity Framework Core with SQL Server
- **Real-time:** SignalR for live quiz features (planned)

### Key Features I Implemented
1. **User Authentication & Authorization**
   - User registration and login
   - Role-based access (Admin/User)
   - Profile management with password change

2. **Quiz Management**
   - Create quizzes with multiple question types
   - Edit and delete quizzes
   - Categorize quizzes by difficulty and topic

3. **Quiz Taking Experience**
   - Interactive quiz interface
   - Real-time scoring
   - Results tracking and history

4. **Admin Dashboard**
   - User management
   - Quiz oversight
   - System statistics

5. **Additional Features**
   - Leaderboard system
   - Progress tracking
   - Responsive design for mobile devices

## Technical Challenges I Solved

1. **State Management:** Implemented efficient state management across the application using Zustand
2. **Authentication Flow:** Created a secure authentication system with automatic token refresh
3. **API Integration:** Built a robust API service layer with proper error handling
4. **Database Design:** Designed a normalized database schema with proper relationships
5. **Clean Architecture:** Implemented clean architecture principles in the backend

## Project Structure

```
QuizHub/
├── backend/
│   └── src/
│       ├── KvizHub.API/          # Web API controllers and configuration
│       ├── KvizHub.Application/  # Business logic and DTOs
│       ├── KvizHub.Domain/       # Entity models and enums
│       ├── KvizHub.Infrastructure/ # Data access and services
│       └── KvizHub.Shared/       # Common utilities
├── frontend/
│   └── src/
│       ├── components/    # Reusable UI components
│       ├── pages/        # Page components
│       ├── services/     # API service layer
│       ├── stores/       # State management
│       └── types/        # TypeScript type definitions
└── docs/                 # Documentation and diagrams
```

## How to Run My Project

### Prerequisites
- Node.js 18+
- .NET 6 SDK
- SQL Server (or SQL Server Express)

### Backend Setup
```bash
cd backend/src/KvizHub.API
dotnet restore
dotnet ef database update
dotnet run
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Using Docker (Alternative)
```bash
docker-compose up
```

## What I Learned

Through this project, I gained hands-on experience with:

- **Full-stack development** using modern technologies
- **Clean Architecture** principles and separation of concerns
- **Entity Framework Core** for database operations
- **React Hooks** and modern React patterns
- **TypeScript** for better code quality and developer experience
- **API design** and RESTful principles
- **Authentication and authorization** implementation
- **Responsive web design** with Tailwind CSS
- **Git version control** and project organization

## Testing and Validation

I thoroughly tested the application including:
- User registration and login flows
- Quiz creation and management
- Taking quizzes and viewing results
- Admin functionality
- Responsive design on different devices

All major features are working as intended, and the application handles edge cases gracefully.

## Future Enhancements

Given more time, I would like to add:
- Live quiz rooms with real-time collaboration
- More question types (drag-and-drop, image-based)
- Advanced analytics and reporting
- Social features (sharing, comments)
- Mobile app using React Native

## Reflection

This project was an excellent opportunity to apply everything I learned in the Web Development 2 course. I'm particularly proud of implementing clean architecture in the backend and creating a polished, user-friendly frontend. The project challenged me to think about scalability, security, and user experience simultaneously.

## Technologies Used

**Frontend:**
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- React Router

**Backend:**
- .NET 6
- Entity Framework Core
- SQL Server
- AutoMapper
- JWT Authentication

**Tools:**
- Git & GitHub
- Docker
- Postman (API testing)
- VS Code / Visual Studio

---

*This project represents my understanding and application of modern web development practices learned throughout the Web Development 2 course.*