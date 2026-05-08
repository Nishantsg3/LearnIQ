# LearnIQ - Modern Assessment Platform

LearnIQ is a full-stack assessment platform designed to simulate real-world testing environments for students while providing powerful control and analytics for administrators.

## 🚀 Key Features

### 👨‍🎓 Student Features
- **Practice Tests**: Self-paced assessments to improve skills.
- **Main Exams**: Official timed assessments with secure submission.
- **Result Analytics**: Detailed breakdown of performance and answer keys.
- **Progress Tracking**: Visual representation of learning journey.
- **Modern UI**: Clean, intuitive interface with dark mode support.

### 👨‍💼 Admin Features
- **Test Management**: Create, edit, and manage assessments easily.
- **Question Bank**: Centralized repository for assessment content.
- **Real-time Analytics**: Insights into student performance and test trends.
- **Student Management**: Oversee student progress and results.
- **System Hardening**: Robust security and session management.

## 🛠️ Tech Stack

- **Frontend**: React.js, Vite, Tailwind CSS, Lucide Icons, Axios.
- **Backend**: Spring Boot (Java), Spring Security, JPA/Hibernate.
- **Database**: H2 (Development), PostgreSQL/MySQL (Production ready).
- **Authentication**: JWT (JSON Web Tokens).

## 📸 Screenshots
*(Placeholders for future screenshots)*

---

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v18+)
- Java JDK 17+
- Maven

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/learniq.git
cd learniq
```

### 2. Backend Setup
```bash
cd learniq-backend
# Copy env example
cp .env.example .env
# Install dependencies and run
./mvnw spring-boot:run
```

### 3. Frontend Setup
```bash
cd learniq-frontend
# Copy env example
cp .env.example .env
# Install dependencies
npm install
# Run development server
npm run dev
```

## ⚙️ Environment Variables

### Backend (`learniq-backend/.env`)
- `SPRING_DATASOURCE_URL`: Database connection URL.
- `APP_JWT_SECRET`: Secret key for JWT signing.
- `APP_SEED_ADMIN_EMAIL`: Initial admin account email.

### Frontend (`learniq-frontend/.env`)
- `VITE_API_URL`: The base URL for the backend API (e.g., `http://localhost:8080/api/v1`).

## 📂 Folder Structure

```text
LearnIQ/
├── learniq-backend/     # Spring Boot application
│   ├── src/             # Source code
│   ├── pom.xml          # Maven dependencies
│   └── Dockerfile       # Containerization config
├── learniq-frontend/    # React application (Vite)
│   ├── src/             # Components and logic
│   ├── public/          # Static assets
│   └── package.json     # Node dependencies
└── render.yaml          # Deployment configuration
```

## 🔮 Future Improvements
- [ ] AI-driven question generation.
- [ ] Proctoring integration (camera/tab-switch detection).
- [ ] Multi-language support (i18n).
- [ ] Advanced performance charts for students.

---

## 👨‍💻 Author

**Nishant Gawande**  
Electronics & Telecommunication Engineer | Full Stack Developer  

- Built LearnIQ as a complete end-to-end assessment platform.
- Focused on scalable architecture, clean UI/UX, and real-world usability.

---
