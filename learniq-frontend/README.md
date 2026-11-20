# LearnIQ Frontend
## Precision Assessment & Learning Intelligence SPA

The LearnIQ frontend is a high-performance single-page application built with React 19, Vite 8 (featuring Rolldown chunking), and Tailwind CSS. It delivers an Apple-grade, distraction-free examination environment for students and an operations center for academic administrators.

---

### Key Capabilities

1. **Personal Learning Cockpit**: Longitudinal telemetry dock, next-best-action hero, domain mastery channels, and one-click scorecard review.
2. **Integrity-Monitored Examination Engine**: Deterministic server-anchored timer synchronization, debounced and navigation-triggered autosave, and window defocus / tab-blur infraction tracking.
3. **Deep Diagnostic Review**: Question directory navigator, color-coded answer comparison (semantic emerald passing vs rose mistake), and detailed rationales.
4. **Three-Tier Metallic Podium**: Visual distinction between Rank 1 (Radiant Gold), Rank 2 (Metallic Platinum/Silver), and Rank 3 (Burnished Copper/Bronze).
5. **Render Cold-Start Recovery**: Progressive, non-blocking background health check with progressive status updates ("Starting LearnIQ...", "Checking server...", "Backend is waking up...", "Still waking...", "Almost ready...") and safeguards preventing duplicate submissions.

---

### Tech Stack

- **Runtime & Bundler**: React 19 + Vite 8 (Rolldown optimizer)
- **Styling**: Tailwind CSS with custom design tokens (`canvas.dark: #0e1015`, `surface.card: #15181e`, brand violet palette)
- **Icons**: Lucide React
- **Code & Syntax**: PrismJS syntax highlighting for technical items
- **Export**: html2pdf.js for client-side scorecard PDF generation
- **HTTP Client**: Axios with dual-role JWT interceptors and retry recovery queue

---

### Local Development Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   Copy `.env.example` to `.env.development.local`:
   ```bash
   cp .env.example .env.development.local
   ```
   Default: `VITE_API_URL=http://localhost:8080/api/v1`

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   The application will run on `http://localhost:5173`.

4. **Production Build & Linting**:
   ```bash
   npm run lint   # Enforces zero ESLint errors
   npm run build  # Builds optimized production bundle in ~500ms
   ```

---

### Hosted Free-Tier Note (Render Cold Starts)

When deployed on Render's free tier, the backend web service spins down after 15 minutes of inactivity. On the initial cold start, the frontend displays an accessible status overlay estimating 60–90 seconds while health-checking `/api/v1/health` in the background. Once awake, all queued requests resolve automatically without losing exam state or replaying non-idempotent submissions.
