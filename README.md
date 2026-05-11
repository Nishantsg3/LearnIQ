# LearnIQ

LearnIQ is an assessment and learning platform designed for structured testing and performance tracking. It provides a synchronized testing environment for students and a management dashboard for administrators.

## Features

### Student Portal
*   **Assessment Dashboard:** View upcoming and completed tests.
*   **Test Environment:** Synchronized interface with auto-save and time-sync logic.
*   **Performance Analysis:** Summary reports with score, rank, and time taken.
*   **Automated Results:** Performance summaries delivered via email upon submission.

### Admin Portal
*   **Test Management:** Create, schedule, and monitor assessments.
*   **Question Bank:** Manage questions with multi-option support.
*   **Analytics:** View test results, leaderboards, and student statistics.
*   **Access Control:** Role-based authentication and secure identity management.

## Tech Stack

*   **Frontend:** React 18, Vite, Lucide Icons, CSS3
*   **Backend:** Java 17, Spring Boot 3, Spring Security, JWT
*   **Email:** JavaMail with SMTP integration
*   **Database:** PostgreSQL (Production), H2 (Local)
*   **Hosting:** Render (Static Site & Web Service)

## Local Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Nishantsg3/LearnIQ.git
cd LearnIQ
```

### 2. Backend Setup
1.  Navigate to `learniq-backend`.
2.  Create a `.env` file based on `.env.example`.
3.  Run the application:
```bash
mvn spring-boot:run
```

### 3. Frontend Setup
1.  Navigate to `learniq-frontend`.
2.  Install dependencies:
```bash
npm install
```
3.  Run the development server:
```bash
npm run dev
```

## Deployment Guide (Render)

### Frontend (Static Site)
*   **Root Directory:** `learniq-frontend`
*   **Build Command:** `npm install && npm run build`
*   **Publish Directory:** `dist`
*   **Environment Variable:** `VITE_API_URL` (Backend API URL)

### Backend (Web Service)
*   **Root Directory:** `learniq-backend`
*   **Runtime:** `Java`
*   **Build Command:** `mvn clean package -DskipTests`
*   **Start Command:** `java -jar target/*.jar`
*   **Environment Variables:**
    *   `SPRING_PROFILES_ACTIVE`: `prod`
    *   `MAIL_USERNAME`: Gmail address
    *   `MAIL_PASSWORD`: Gmail App Password
    *   `SPRING_DATASOURCE_URL`: PostgreSQL JDBC URL
    *   `SPRING_DATASOURCE_USERNAME`: DB Username
    *   `SPRING_DATASOURCE_PASSWORD`: DB Password

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
