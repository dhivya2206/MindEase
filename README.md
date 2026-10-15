# 🧠 MindEase — AI-Powered Mental Wellness Platform

> A production-style full-stack application that leverages AI to provide personalized mental wellness tools, mood tracking, and professional support access.

---

## 📦 Tech Stack

| Layer       | Technology                                         |
|-------------|---------------------------------------------------|
| Frontend    | React 18 + Vite + Tailwind CSS + React Router v6 |
| Backend     | Node.js + Express.js                              |
| Database    | MongoDB + Mongoose                                |
| Deploy (FE) | Vercel                                            |
| Deploy (BE) | Render                                            |
| Deploy (DB) | MongoDB Atlas                                     |

---

## 🗂️ Project Structure

```
MindEase/
├── frontend/         # React + Vite application
├── backend/          # Express.js REST API
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- npm v9+
- MongoDB (local or Atlas)

---

### Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in your environment variables
npm install
npm run dev
```

The API will start at `http://localhost:5000`.

Health check: `GET http://localhost:5000/api/health`

---

### Frontend Setup

```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000
npm install
npm run dev
```

The frontend will start at `http://localhost:5173`.

---

## 🌐 API Endpoints

| Method | Endpoint      | Description       |
|--------|--------------|-------------------|
| GET    | /api/health  | Health check      |

*(More endpoints will be added in subsequent parts)*

---

## 🏗️ Roadmap

- **Part 1** ✅ — Project Foundation & Architecture
- **Part 2** — Authentication (JWT, sessions, refresh tokens)
- **Part 3** — AI Chatbot Integration
- **Part 4** — Mood Detection & Tracking
- **Part 5** — Appointments & Scheduling
- **Part 6** — Games & Gamification
- **Part 7** — Admin Dashboard
- **Part 17** ✅ — My Wellness Journey Analytics Dashboard (Streaks, Moods, Stress, Scores, Modalities, Games, Chats, Appointments)
- **Part 19** ✅ — Comprehensive Admin Dashboard (Users, Counsellors, Appointments, Wellness Activities, Role RBAC & Platform Analytics)
- **Part 20** ✅ — Personal Wellness Journal (Reflections, Streak Tracking, Calendar View, Mood & Intensity, Gratitude, Highlights)
- **Part 21** ✅ — Wellness Challenges & Habit-Building System (Categories, Streak Engine, Real Verification, Badges & Points, Rule-Based Recommendations)

---

## 📄 License

MIT © MindEase Team
