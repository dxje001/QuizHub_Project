# KvizHub UML Diagrams

This directory contains UML diagrams that illustrate the architecture and domain model of the KvizHub application.

## 📋 Available Diagrams

### 1. Domain Model Diagram (`kvizhub-domain-model.puml`)

A comprehensive class diagram showing:

- **Domain Entities**: All core business entities with their properties and relationships
- **Entity Relationships**: One-to-many and inheritance relationships between entities
- **Enums**: Business enums like QuizDifficulty, QuestionType, and AttemptStatus
- **Base Entity**: Common properties inherited by all entities

**Key Entities:**
- `User` - Represents system users (extends IdentityUser)
- `Quiz` - Quiz definitions with metadata
- `Question` - Individual questions within quizzes
- `Answer` - Answer options for questions
- `QuizAttempt` - User attempts at taking quizzes
- `UserAnswer` - Individual user responses
- `Category` - Quiz categorization

### 2. Architecture Diagram (`kvizhub-architecture.puml`)

A component diagram illustrating:

- **Clean Architecture Layers**: Domain, Application, Infrastructure, and Presentation
- **Frontend Architecture**: React components, services, stores, and types
- **Backend Architecture**: Controllers, services, repositories, and data access
- **External Dependencies**: PostgreSQL, Redis, Docker
- **Layer Dependencies**: Proper dependency direction following clean architecture principles

## 🔧 How to View Diagrams

### Option 1: PlantUML Online Server
1. Copy the content of any `.puml` file
2. Go to [PlantUML Online](http://www.plantuml.com/plantuml/uml/)
3. Paste the content and view the rendered diagram

### Option 2: VS Code Extension
1. Install the "PlantUML" extension in VS Code
2. Open any `.puml` file
3. Press `Alt+D` or use Command Palette: "PlantUML: Preview Current Diagram"

### Option 3: Local PlantUML Installation
```bash
# Install PlantUML (requires Java)
npm install -g node-plantuml

# Generate PNG from PUML
puml generate kvizhub-domain-model.puml
puml generate kvizhub-architecture.puml
```

## 📊 Diagram Details

### Domain Model Relationships

```
User (1) -----> (*) Quiz          : creates
User (1) -----> (*) QuizAttempt   : attempts
Category (1) -> (*) Quiz          : contains
Quiz (1) -----> (*) Question      : has
Question (1) -> (*) Answer        : has
Quiz (1) -----> (*) QuizAttempt   : attempted
QuizAttempt (1) -> (*) UserAnswer : contains
Question (1) -> (*) UserAnswer    : answered
```

### Architecture Dependencies

```
Frontend Services ---> API Controllers (HTTP/REST)
API Controllers ----> Application Services
Application Services -> Domain Entities
Infrastructure ------> External Systems (DB, Cache)
```

## 🎯 Design Principles

### Domain-Driven Design (DDD)
- Rich domain entities with business logic
- Clear separation between domain and infrastructure
- Aggregate roots and value objects properly modeled

### Clean Architecture
- Dependency inversion principle followed
- Inner layers don't depend on outer layers
- Domain layer is pure business logic

### SOLID Principles
- Single Responsibility: Each entity has a clear purpose
- Open/Closed: Extensible through inheritance and composition
- Liskov Substitution: Proper inheritance hierarchies
- Interface Segregation: Focused interfaces
- Dependency Inversion: Abstractions over implementations

## 🔄 Keeping Diagrams Updated

When modifying the codebase:

1. **Add new entities**: Update `kvizhub-domain-model.puml`
2. **Change relationships**: Modify relationship arrows and multiplicities
3. **Add new layers/services**: Update `kvizhub-architecture.puml`
4. **Major refactoring**: Review both diagrams for accuracy

## 📖 Legend

### UML Notation Used

- `||--o{` : One-to-many relationship
- `<|--` : Inheritance (is-a relationship)
- `..>` : Dependency/Usage
- `-->` : Association/Navigation

### Colors and Styling

- **Blue Theme**: Professional and clean appearance
- **Grouped Packages**: Logical grouping of related components
- **Notes**: Additional context for important design decisions

---

*These diagrams provide a visual overview of the KvizHub system architecture and domain model, helping developers understand the codebase structure and relationships.*