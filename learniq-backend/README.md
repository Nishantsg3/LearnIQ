# LearnIQ Backend
## Assessment Engine & Security API

The LearnIQ backend is a Spring Boot 3 service engineered for deterministic assessment orchestration, assessment session integrity enforcement, and academic data persistence.

---

### Core Architecture

- **Framework**: Spring Boot 3.5.12 on Java 17
- **Security & Authorization**: Spring Security 6 with stateless JWT Bearer token filter (`JwtAuthenticationFilter.java`)
- **Persistence**: Spring Data JPA / Hibernate with profile-driven databases:
  - **Development (`dev`)**: File-based H2 database (`jdbc:h2:file:./data/testdb`) with auto-server mode for zero-setup local development
  - **Production (`prod`)**: PostgreSQL relational database
- **Security Boundaries**:
  - Dual-role segregation: `ROLE_ADMIN` vs `ROLE_STUDENT` with non-overlapping endpoints
  - Answer key masking: in-flight attempt DTOs omit correct answers and rationales until official post-exam review
  - Server-calculated timer expiration: client timers act strictly as display projections
  - Submission idempotency and transactional score persistence
- **Notifications**: Asynchronous JavaMail with Brevo SMTP integration

---

### API Endpoints Overview

| Method | Path | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Public | Lightweight health probe for cold-start detection |
| `POST` | `/api/v1/auth/login` | Public | Student candidate authentication |
| `POST` | `/api/v1/auth/admin-login` | Public | Administrator authentication |
| `POST` | `/api/v1/auth/register` | Public | Candidate account registration |
| `GET` | `/api/v1/tests` | Student/Admin | List active and scheduled assessments |
| `GET` | `/api/v1/tests/{id}/attempt` | Student | Hydrate in-flight attempt state |
| `POST` | `/api/v1/questions/test/{id}/submit` | Student | Transactional score calculation & attempt completion |
| `GET` | `/api/v1/admin/dashboard` | Admin | Administrative metrics, student inventory, & leaderboards |

---

### Local Setup & Execution

#### Prerequisites
- JDK 17 or higher
- Maven 3.8+ (or bundled `./mvnw`)

#### Running Locally
1. **Copy Environment Template**:
   ```bash
   cp .env.example .env
   ```
2. **Launch with Maven**:
   ```bash
   ./mvnw spring-boot:run
   ```
   The backend will start on `http://localhost:8080` using the local H2 database in `./data/testdb`.

#### Running Tests
```bash
./mvnw test
```
*Note: Executes 199 unit and integration tests across 18 test suites verifying CORS origin security, admin seeder validation, exam attempt invariants, idempotency, and asynchronous notifications.*
