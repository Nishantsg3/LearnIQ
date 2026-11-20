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
    <a href="./PORTFOLIO_CASE_STUDY.md"><b>Engineering Case Study</b></a> •
    <a href="#-platform-preview"><b>Preview</b></a> •
    <a href="#-core-features"><b>Features</b></a> •
    <a href="#-system-architecture"><b>Architecture</b></a> •
    <a href="#-deployment-render"><b>Deployment</b></a>
  </p>
</div>

---

> 📘 **Engineering Portfolio Spotlight**: For an in-depth breakdown of the examination state machine, resilient auto-save lifecycle, dual-role JWT security boundaries, and assessment session integrity architecture, consult [**PORTFOLIO_CASE_STUDY.md**](./PORTFOLIO_CASE_STUDY.md).

LearnIQ is an advanced assessment and learning platform designed for structured testing and performance tracking. It provides a synchronized, high-fidelity testing environment for students and a comprehensive intelligence dashboard for system administrators.

### 🌟 Key Engineering Highlights
* **Zero ESLint Errors**: Strict code hygiene enforced across the entire 45-module React application.
* **Fast Production Builds**: Optimized with Vite 8 and Rolldown chunking for cold compilations in under 700ms.
* **199 Backend Tests**: Comprehensive unit and integration test coverage across 18 test suites verifying CORS security, admin seeder safety, attempt invariants, and scoring precision.
* **Apple-Grade Design System**: Coherent visual hierarchy, neutral charcoal dark surfaces (`#0E1015` / `#15181E`), Energy Q branding, and responsive layout across desktop (1440×900) and mobile (390×844).
* **Resilient Examination Engine**: Multi-stage auto-save (debounced question responses, periodic intervals, and navigation triggers) preventing in-flight data loss.
* **Session Integrity & Anti-Abuse Controls**: Server-anchored timer synchronization, window defocus/tab-switch infraction detection with auto-submit thresholds, and payload-level answer masking to prevent network inspection.
* **Role-Isolated Security**: Dual-token JWT architecture separating Candidate and Administrator sessions with strict Spring Security filter chains.

## 🚀 Live Environment

*   **Student & Admin Portal:** [https://learniq-frontend-7oyn.onrender.com](https://learniq-frontend-7oyn.onrender.com)
*   **API Endpoint:** `https://learniq-backend-vglf.onrender.com/api/v1`

> ⏱️ **Hosted Free-Tier Notice**: The live demo backend spins down on Render after 15 minutes of inactivity. On the initial cold start, the application displays an accessible status overlay ("Starting LearnIQ…") estimating 60–90 seconds while health-checking `/api/v1/health` in the background. Once awake, all requests resolve automatically without losing exam state or replaying non-idempotent submissions.

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

*   **Frontend:** React 19 + Vite 8 (Tailwind CSS, Lucide React)
*   **Backend:** Java 17 + Spring Boot 3
*   **Authentication:** JWT (JSON Web Tokens) with strict Spring Security filters
*   **Database:** PostgreSQL (Production) / H2 (Local Development)
*   **Deployment:** Render (Static SPA & Web Service)
*   **Email:** JavaMail with SMTP delivery integration
*   **Authorization:** Role-based access control (ADMIN/STUDENT session isolation)

## 📊 System Models & Workflows

### 1. Entity-Relationship (Database Schema)
*This diagram illustrates the core database tables and how they connect to store your platform's data.*
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
*Mapping the distinct capabilities available to the Student and Administrator roles.*
```mermaid
flowchart LR
    %% Actors
    Admin(["🧍‍♂️ Admin"])
    Student(["🧍‍♂️ Student"])

    %% System Boundary
    subgraph SystemBoundary [LearnIQ System Boundary]
        direction TB

        %% Admin Use Cases
        Admin1([Manage Tests<br/>Add / Edit / Delete])
        Admin2([Manage Question Bank<br/>MCQ, Category, Level])
        Admin3([Schedule Tests<br/>Date / Time / Duration])
        Admin4([View Results & Analytics<br/>Rankings, Reports])

        Shared1([Login / Logout<br/>Admin & Student])
        Shared2([Import/Export Excel<br/>Questions via Excel])

        %% Student Use Cases
        Student1([Register & Login<br/>Update Profile])
        Student2([Practice Aptitude Test<br/>Section 1])
        Student3([Attempt Main Test<br/>Section 2 - Scheduled])

        Student4([View Scorecard<br/>Correct/Wrong Analysis])
        Student5([View Test History<br/>Retake Tests])
        Student6([Receive Result Email<br/>Auto Notification])
    end

    %% Admin Connections
    Admin --- Admin1
    Admin --- Admin2
    Admin --- Admin3
    Admin --- Admin4

    Admin1 -.->|«include»| Shared1
    Admin2 -.->|«include»| Shared2

    %% Student Connections
    Student --- Student1
    Student --- Student2
    Student --- Student3

    Student1 -.->|«include»| Student4
    Student2 -.->|«include»| Student5
    Student3 -.->|«include»| Student6

    %% Dark Mode Styling
    classDef default fill:#0d0d12,stroke:#555,stroke-width:1px,color:#fff;
    classDef boundary fill:transparent,stroke:#3b82f6,stroke-width:2px,stroke-dasharray: 5 5,color:#fff;
    classDef adminNode fill:#450a0a,stroke:#ef4444,stroke-width:2px,color:#fca5a5;
    classDef studentNode fill:#042f2e,stroke:#14b8a6,stroke-width:2px,color:#5eead4;
    classDef blueNode fill:#172554,stroke:#3b82f6,stroke-width:2px,color:#93c5fd;
    classDef orangeNode fill:#431407,stroke:#f97316,stroke-width:2px,color:#fdba74;
    classDef greenNode fill:#052e16,stroke:#22c55e,stroke-width:2px,color:#86efac;

    class SystemBoundary boundary;
    class Admin,Admin1,Admin2,Admin3,Admin4 adminNode;
    class Student,Student1,Student2,Student3 studentNode;
    class Shared1 blueNode;
    class Shared2,Student6 orangeNode;
    class Student4,Student5 greenNode;
```

### 3. Assessment Lifecycle Flowchart
*Visualizing the state transitions from test creation to auto-submission.*
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
    J --> K{Is Main Test?}
    K -->|Yes| L[Send Email Report & Update Leaderboard]
    K -->|No| M[Display Scorecard]

    %% Expiry
    F -->|Time >= End Time| N[Status: ARCHIVED]

    classDef default fill:#0d0d12,stroke:#7c3aed,stroke-width:1px,color:#fff;
    classDef highlight fill:#7c3aed,stroke:#fff,stroke-width:1px,color:#fff;
    class A,G,L highlight;
```

## 💻 Local Environment Setup

### 1. Repository
```bash
git clone https://github.com/Nishantsg3/LearnIQ.git
cd LearnIQ
```

### 2. Backend Boot
Navigate to `learniq-backend`. In development mode (`dev` profile, active by default), LearnIQ boots with zero external database setup using local H2 storage.

Provide a local JWT secret and start the Spring Boot service:
```bash
APP_JWT_SECRET=your_local_development_jwt_secret_32_chars_min ./mvnw spring-boot:run
```
For production deployments (`prod` profile), configure PostgreSQL credentials (`SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`) and production secrets via environment variables (see `learniq-backend/README.md` and `learniq-backend/.env.example`).

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
    *   **Mandatory:**
        *   `SPRING_PROFILES_ACTIVE`: `prod`
        *   `SPRING_DATASOURCE_URL`: PostgreSQL JDBC connection URL (e.g., Neon serverless pooler endpoint)
        *   `SPRING_DATASOURCE_USERNAME`: PostgreSQL database username
        *   `SPRING_DATASOURCE_PASSWORD`: PostgreSQL database password
        *   `APP_JWT_SECRET`: 64+ character cryptographic secret key for signing session tokens
        *   `APP_FRONTEND_URL`: Production frontend URL (e.g. `https://learniq-frontend-7oyn.onrender.com`) for CORS and auth redirects
    *   **Conditional Administrator Provisioning:**
        *   `APP_SEED_ADMIN_EMAIL`: Initial administrator email (defaults to `admin@learniq.com`)
        *   `APP_SEED_ADMIN_PASSWORD`: Strong password for the initial administrator. *Note: Seeding is safely skipped if omitted, empty, or set to placeholder `none`.*
    *   **Optional:**
        *   `MAIL_USERNAME` / `MAIL_PASSWORD`: Brevo SMTP relay credentials (falls back to mock delivery in dev/unconfigured environments)
        *   `MAIL_FROM`: Verified sender email address (defaults to `learniq.main@gmail.com`)

---
<div align="center">
  <img src="https://raw.githubusercontent.com/Nishantsg3/LearnIQ/main/learniq-frontend/src/assets/branding/logos/standalone-icon.png" alt="LearnIQ Icon" width="48" />
  <p>LEARN<b>IQ</b> © 2026</p>
</div>
