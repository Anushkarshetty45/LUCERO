# LUCERO — AI-Powered Study Platform

LUCERO is a web application that helps students study smarter using AI. It combines course management, PDF analysis, flashcards, quizzes, mind maps, group video calls, and a real-time AI chatbot — all in one place.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, React Router v7 |
| Backend / Auth | Supabase (PostgreSQL + Auth + Realtime) |
| AI | Google Gemini API |
| Video Calls | PeerJS (WebRTC) + Supabase Realtime |
| 3D / Visuals | Three.js, @react-three/fiber |
| Proxy Server | Node.js + Express (port 3002) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project
- A Google Gemini API key

### Install & Run

```bash
# Frontend
npm install
npm start          # runs on http://localhost:3000

# Backend proxy (separate terminal)
cd server
npm install
npm start          # runs on http://localhost:3002
```

### Environment Variables

Create `.env` in the project root:

```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_GEMINI_API_KEY=your_gemini_api_key
```

Create `.env` in `/server`:

```
GROQ_API_KEY=your_groq_api_key
ALLOWED_ORIGINS=http://localhost:3000
PORT=3002
```

---

## Features

- **Google OAuth** — sign in and sign up with Google only
- **PDF Analyzer** — upload a PDF, get AI summary, explanation, quizzes, flashcards, and mind maps; history is saved
- **Courses** — create courses with topics, lessons, and notes
- **AI Chatbot** — ask questions, get instant AI answers
- **Study Timer** — Pomodoro-style focus sessions with break reminders
- **Group Study** — real-time video calls (PeerJS WebRTC) with chat, screen share, and raise hand
- **Themes** — 10 visual themes synced to your account; Home and Auth pages always use the default dark theme
- **Analytics** — track daily study time and progress

---

## Project Structure

```
src/
  pages/          # Route-level pages (Dashboard, Auth, Home, Course, Profile, Settings)
  components/     # Feature components (PDFAnalyzer, VideoRoom, ChatbotModal, etc.)
  contexts/       # React context (Theme, Timer, Settings, LiveStudy)
  services/       # API layer (supabase.ts, api.ts, pdfAnalysisApi.ts)
  hooks/          # Custom hooks (useAuth, useTimer, useSeason, etc.)
  styles/         # Theme definitions and global CSS
server/           # Express proxy for AI API calls
public/           # Static assets and index.html (with CSP headers)
```

---

## Authentication

- Google OAuth only — no email or password
- Sign up collects your name before redirecting to Google
- Supabase handles sessions via PKCE flow
- On logout, theme resets to default and saved preferences are cleared from localStorage
