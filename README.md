<div align="center">
  <img src="https://raw.githubusercontent.com/Nishantsg3/LearnIQ/main/learniq-frontend/src/assets/branding/social/social-preview-banner.png" alt="LearnIQ Platform" width="100%" />

  <br />
  <br />

  <img src="https://raw.githubusercontent.com/Nishantsg3/LearnIQ/main/learniq-frontend/src/assets/branding/logos/primary-full-logo.png" alt="LearnIQ Logo" width="240" />

  <p align="center">
    <b>Precision Assessment & Learning Intelligence</b><br/>
    <i>A unified platform for intelligent assessments, performance analytics, and academic growth.</i>
  </p>

  <p align="center">
    <a href="https://learniq-frontend-7oyn.onrender.com"><b>Live Platform</b></a> •
    <a href="#-platform-preview"><b>Preview</b></a> •
    <a href="#-core-features"><b>Features</b></a> •
    <a href="#-system-architecture"><b>Architecture</b></a> •
    <a href="#-deployment-render"><b>Deployment</b></a>
  </p>
</div>

---

LearnIQ is an advanced assessment and learning platform designed for structured testing and performance tracking. It provides a synchronized, high-fidelity testing environment for students and a comprehensive intelligence dashboard for system administrators.

## 🚀 Live Environment

*   **Student & Admin Portal:** [https://learniq-frontend-7oyn.onrender.com](https://learniq-frontend-7oyn.onrender.com)
*   **API Endpoint:** `https://learniq-backend-vglf.onrender.com/api/v1`

## 📸 Platform Preview

<div align="center">

### 1. Authentication Experience
<img src="https://raw.githubusercontent.com/Nishantsg3/LearnIQ/main/learniq-frontend/src/assets/screenshots/desktop/login-desktop.png" width="800" alt="Login Interface" />
<br/><br/>
<img src="https://raw.githubusercontent.com/Nishantsg3/LearnIQ/main/learniq-frontend/src/assets/screenshots/desktop/register-desktop.png" width="800" alt="Register Interface" />
<br/><br/>
<img src="https://raw.githubusercontent.com/Nishantsg3/LearnIQ/main/learniq-frontend/src/assets/screenshots/desktop/forgot-password-desktop.png" width="800" alt="Password Recovery Interface" />

<br/><br/>

### 2. Student Intelligence Portal
<img src="https://raw.githubusercontent.com/Nishantsg3/LearnIQ/main/learniq-frontend/src/assets/screenshots/desktop/student-dashboard-desktop.png" width="800" alt="Student Dashboard" />
<br/><br/>
<img src="https://raw.githubusercontent.com/Nishantsg3/LearnIQ/main/learniq-frontend/src/assets/screenshots/desktop/student-test-interface-desktop.png" width="800" alt="Test Interface" />

<br/><br/>

### 3. Administrative Control Center
<img src="https://raw.githubusercontent.com/Nishantsg3/LearnIQ/main/learniq-frontend/src/assets/screenshots/desktop/admin-dashboard-desktop.png" width="800" alt="Admin Dashboard" />
<br/><br/>
<img src="https://raw.githubusercontent.com/Nishantsg3/LearnIQ/main/learniq-frontend/src/assets/screenshots/desktop/admin-question-bank-desktop.png" width="800" alt="Admin Question Bank" />
<br/><br/>
<img src="https://raw.githubusercontent.com/Nishantsg3/LearnIQ/main/learniq-frontend/src/assets/screenshots/desktop/admin-create-test-desktop.png" width="800" alt="Admin Create Test" />

<br/><br/>

### 4. Mobile Experience
*Fully responsive interface across all modules.*
<br/><br/>
<img src="https://raw.githubusercontent.com/Nishantsg3/LearnIQ/main/learniq-frontend/src/assets/screenshots/mobile/login-mobile.png" width="300" alt="Mobile Login" />
&nbsp;&nbsp;
<img src="https://raw.githubusercontent.com/Nishantsg3/LearnIQ/main/learniq-frontend/src/assets/screenshots/mobile/student-dashboard-mobile.png" width="300" alt="Mobile Student Dashboard" />
<br/><br/>
<img src="https://raw.githubusercontent.com/Nishantsg3/LearnIQ/main/learniq-frontend/src/assets/screenshots/mobile/admin-dashboard-mobile.png" width="300" alt="Mobile Admin Dashboard" />
&nbsp;&nbsp;
<img src="https://raw.githubusercontent.com/Nishantsg3/LearnIQ/main/learniq-frontend/src/assets/screenshots/mobile/student-test-interface-mobile.png" width="300" alt="Mobile Test Interface" />

</div>

## ✨ Core Features

### Student Portal (Identity)
*   **Unified Dashboard:** View upcoming, active, and completed assessments in a clean, dark-mode interface.
*   **Synchronized Testing:** Real-time test environment with auto-save and robust time-sync logic.
*   **Performance Intelligence:** Post-test summary reports detailing score, system rank, and time analytics.
*   **Automated Delivery:** Results and analytics delivered directly via secure email integration.

### Admin Portal (Authority)
*   **Assessment Control:** Create, schedule, and orchestrate tests globally.
*   **Question Library:** Centralized bank for managing multi-option, randomized assessment items.
*   **System Analytics:** High-level views of system performance, leaderboards, and individual student statistics.
*   **Identity Management:** Strict role-based access control ensuring data integrity and session isolation.

## 🧠 System Architecture

*   **Frontend:** React 18 + Vite (Tailwind CSS, Lucide React)
*   **Backend:** Java 17 + Spring Boot 3
*   **Authentication:** JWT (JSON Web Tokens) with strict Spring Security filters
*   **Database:** PostgreSQL (Production) / H2 (Local Development)
*   **Deployment:** Render (Static SPA & Web Service)
*   **Email:** JavaMail with SMTP delivery integration
*   **Authorization:** Role-based access control (ADMIN/STUDENT session isolation)

## 📊 System Models & Workflows

### 1. Entity-Relationship (UML Class Diagram)
```mermaid
classDiagram
    direction TB
    class User {
        +Long id
        +String name
        +String email
        +Role role
        +boolean isVerified
    }
    class Test {
        +Long id
        +String title
        +String category
        +String testType
        +int durationMinutes
        +String status
    }
    class Question {
        +Long id
        +String text
        +List~String~ options
        +String correctAnswer
        +String category
    }
    class TestAttempt {
        +Long id
        +int scorePercent
        +LocalDateTime startedAt
        +LocalDateTime submittedAt
        +Status status
    }
    
    User "1" -- "*" TestAttempt : makes >
    Test "1" -- "*" TestAttempt : has >
    Test "*" -- "*" Question : contains >
```

### 2. Platform Use Cases
```mermaid
flowchart LR
    %% Actors
    Student(((👤 Student)))
    Admin(((🛡️ Administrator)))

    %% System Boundary
    subgraph LearnIQ Platform
        %% Student Use Cases
        UC1([Take Practice Test])
        UC2([Take Main Assessment])
        UC3([View Results & Leaderboard])
        
        %% Admin Use Cases
        UC4([Manage Question Bank])
        UC5([Create & Schedule Tests])
        UC6([View System Analytics])
        UC7([Manage Students & Security])
    end

    %% Relationships
    Student --- UC1
    Student --- UC2
    Student --- UC3

    Admin --- UC4
    Admin --- UC5
    Admin --- UC6
    Admin --- UC7
    
    classDef default fill:#0d0d12,stroke:#7c3aed,stroke-width:1px,color:#fff;
    classDef actor fill:#7c3aed,stroke:#fff,stroke-width:2px,color:#fff;
    class Student,Admin actor;
```

### 3. Assessment Lifecycle Flowchart
```mermaid
flowchart TD
    %% Admin Phase
    A([Admin Creates Test]) --> B{Test Type?}
    B -->|Practice| C[Status: ACTIVE]
    B -->|Main| D[Set Start & End Window]
    D --> E[Status: SCHEDULED]
    
    E -->|Time >= Start Time| F[Status: ACTIVE]
    
    %% Student Phase
    C --> G([Student Enters Test])
    F --> G
    
    G --> H[Timer & Security Start]
    H --> I{Submission Trigger?}
    
    I -->|Student Clicks Submit| J[Calculate Score]
    I -->|Timer Expires| J
    I -->|Malpractice Detected| J
    
    %% Resolution Phase
    J --> K[Generate Analytics]
    K --> L[Send Email Report]
    L --> M([Update Leaderboards])
    
    %% Expiry
    F -->|Time >= End Time| N[Status: ARCHIVED]
    
    classDef default fill:#0d0d12,stroke:#7c3aed,stroke-width:1px,color:#fff;
    classDef highlight fill:#7c3aed,stroke:#fff,stroke-width:1px,color:#fff;
    class A,G,M highlight;
```

## 💻 Local Environment Setup

### 1. Repository
```bash
git clone https://github.com/Nishantsg3/LearnIQ.git
cd LearnIQ
```

### 2. Backend Boot
Navigate to `learniq-backend` and configure your environment variables based on `.env.example`, then run:
```bash
mvn spring-boot:run
```

### 3. Frontend Boot
Navigate to `learniq-frontend`, install dependencies, and start the Vite server:
```bash
npm install
npm run dev
```

## 🌐 Deployment (Render)

### Frontend (Static SPA)
*   **Directory:** `learniq-frontend`
*   **Build Command:** `npm install && npm run build`
*   **Publish Directory:** `dist`
*   **Environment:** `VITE_API_URL` (Set to backend URL)

### Backend (Web Service)
*   **Directory:** `learniq-backend`
*   **Build Command:** `mvn clean package -DskipTests`
*   **Start Command:** `java -jar target/*.jar`
*   **Environment Variables:**
    *   `SPRING_PROFILES_ACTIVE`: `prod`
    *   `MAIL_USERNAME` / `MAIL_PASSWORD`: SMTP Credentials
    *   `SPRING_DATASOURCE_*`: Database connection strings

---
<div align="center">
  <img src="https://raw.githubusercontent.com/Nishantsg3/LearnIQ/main/learniq-frontend/src/assets/branding/logos/standalone-icon.png" alt="LearnIQ Icon" width="48" />
  <p>LEARN<b>IQ</b> © 2026</p>
</div>
