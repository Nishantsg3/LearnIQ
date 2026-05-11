# LearnIQ — Research-Grade Assessment Platform

![LearnIQ Cover](https://via.placeholder.com/1200x600/0d0d10/8b5cf6?text=LearnIQ+Assessment+Platform)

LearnIQ is a high-fidelity, enterprise-grade assessment ecosystem designed for precision testing and deep academic analytics. Built with a futuristic, dark-themed aesthetic, it provides a premium experience for both educators and students.

## 🚀 Live Demo & Deployment

*   **Frontend:** [Vercel Deployment](https://learniq-frontend.vercel.app)
*   **Backend:** [Render Hosting](https://learniq-backend.onrender.com)
*   **Database:** [Neon PostgreSQL](https://neon.tech)

## ✨ Core Features

### 👨‍🎓 Student Experience
*   **Dynamic Dashboard:** Real-time progress tracking and upcoming assessments.
*   **High-Fidelity Testing:** Secure, synchronized test environment with auto-save and proctor-ready logic.
*   **Deep Analysis:** Automated performance summaries with rank calculation, duration tracking, and correct/wrong heatmaps.
*   **Automated Results:** Instant branded HTML reports delivered directly to the student's inbox.

### 👩‍💼 Admin Intelligence
*   **Test Lifecycle Management:** Create, schedule, and live-monitor assessments with granular control.
*   **Question Bank:** Modular repository for managing complex questions with multi-option support.
*   **Academic Analytics:** Comprehensive data visualization for test scores, leaderboards, and student engagement.
*   **Premium Controls:** Role-based access control with secure identity verification.

## 🛠️ Technology Stack

*   **Frontend:** React 18, Vite, Lucide Icons, Vanilla CSS (Premium Dark System)
*   **Backend:** Java 17, Spring Boot 3, Spring Security, JWT (Token-based Auth)
*   **Email Engine:** JavaMail (Gmail SMTP Integration) with HTML Template System
*   **Database:** PostgreSQL (Production), H2 (Local Development)
*   **Deployment:** Vercel (Frontend), Render (Backend), Neon (Database)

## 🏗️ Architecture Overview

LearnIQ follows a decoupled, stateless architecture ensuring maximum scalability:
1.  **Frontend:** Single Page Application (SPA) communicating via a secure REST API.
2.  **Backend:** Modular Spring Boot service layer with JWT-based stateless authentication.
3.  **Data Layer:** JPA/Hibernate for database abstraction with profile-based storage logic.

## 📸 Screenshots

| Login Portal | Student Dashboard | Test Environment |
| :--- | :--- | :--- |
| ![Login](https://via.placeholder.com/400x300/0d0d10/8b5cf6?text=Login+Portal) | ![Dashboard](https://via.placeholder.com/400x300/0d0d10/8b5cf6?text=Dashboard) | ![Testing](https://via.placeholder.com/400x300/0d0d10/8b5cf6?text=Testing+UI) |

## ⚙️ Local Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Nishantsg3/LearnIQ.git
cd LearnIQ
```

### 2. Backend Setup
1.  Navigate to `learniq-backend`.
2.  Create a `.env` file based on `.env.example`.
3.  Configure your **Gmail App Password** for SMTP.
4.  Run the application:
```bash
mvn spring-boot:run
```

### 3. Frontend Setup
1.  Navigate to `learniq-frontend`.
2.  Install dependencies:
```bash
npm install
```
3.  Run the dev server:
```bash
npm run dev
```

## 🚀 Render Deployment Guide

LearnIQ is optimized for zero-config deployment on **Render**.

### 1. Frontend (Static Site)
*   **Root Directory:** `learniq-frontend`
*   **Build Command:** `npm install && npm run build`
*   **Publish Directory:** `dist`
*   **Redirects/Rewrites:** 
    *   Source: `/*`
    *   Destination: `/index.html`
    *   Action: `Rewrite`
*   **Env Vars:** 
    *   `VITE_API_URL`: Your deployed backend URL (e.g., `https://learniq-backend.onrender.com/api/v1`)

### 2. Backend (Web Service)
*   **Root Directory:** `learniq-backend`
*   **Runtime:** `Java`
*   **Build Command:** `mvn clean package -DskipTests`
*   **Start Command:** `java -jar target/*.jar`
*   **Env Vars:**
    *   `SPRING_PROFILES_ACTIVE`: `prod`
    *   `MAIL_USERNAME`: Your Gmail address
    *   `MAIL_PASSWORD`: Your Gmail App Password
    *   `APP_JWT_SECRET`: A long random string
    *   `SPRING_DATASOURCE_URL`: PostgreSQL JDBC URL (from Neon)
    *   `SPRING_DATASOURCE_USERNAME`: DB Username
    *   `SPRING_DATASOURCE_PASSWORD`: DB Password

## 📬 SMTP Configuration

LearnIQ uses **Gmail SMTP** for free production email delivery. 
1.  Go to your Google Account Settings.
2.  Enable 2FA.
3.  Search for **App Passwords**.
4.  Generate a "Mail" password and add it to your `.env` as `MAIL_PASSWORD`.

## 🗺️ Roadmap

- [ ] PDF Scorecard Generation
- [ ] AI-Powered Question Recommendations
- [ ] Advanced Proctoring with Tab-Switch Detection
- [ ] Excel/CSV Bulk Question Import

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
**Built with precision by LearnIQ Engineering.**
