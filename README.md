# dv.interview-AI 🤖

AI-powered mock interview platform with voice interaction, real-time evaluation, code editor support, and gamification.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Available Scripts](#available-scripts)
- [Deployment](#deployment)
- [License](#license)

## Overview

dv.interview-AI is a full-stack web application that simulates realistic technical and HR mock interviews. Candidates interact with an AI interviewer through voice (Web Speech API) and text, receive per-question scoring across correctness, communication, and confidence, and get a detailed analytics dashboard with downloadable PDF reports after each session.

The platform supports resume-based question generation, an integrated Monaco code editor for coding questions, AI-generated study guides, and a badge/achievement system to track progress over time.

## Features

### Interview Experience
- **Voice-based interaction** — real-time speech-to-text (Web Speech API) and AI voice synthesis (SpeechSynthesis)
- **Animated AI interviewer** — male or female video avatars that lip-sync when speaking and freeze when listening
- **Resume parsing** — upload a PDF resume; the AI extracts skills and projects to generate personalized questions
- **Two interview modes** — Technical (role-specific deep dives) and HR (behavioral & communication evaluation)
- **Configurable difficulty** — questions generated at easy, mid, and hard levels based on selected role and experience
- **60-second timer** — per-question countdown with auto-submit to simulate real interview pressure

### In-Interview Tools
- **Live transcript** — real-time display of what the microphone is picking up
- **"Get a Hint" lifeline** — AI-generated hints for tough questions (costs 5 credits per use)
- **Integrated code editor** — Monaco Editor (VS Code engine) with language selection (JavaScript, Python, Java, C++) that slides in for coding questions; auto-closes on next question

### Post-Interview Analytics
- **Performance dashboard** — radar charts (Recharts) for correctness, communication, and confidence
- **Per-question breakdown** — individual scores, your verbal answer, written code (if any), and AI feedback for every question
- **AI study guide** — personalized learning paths generated from your weak areas
- **Downloadable PDF reports** — executive-summary PDFs via jsPDF & AutoTable

### Gamification & Engagement
- **Achievement badges** — earned independently based on performance rules:
  - 🏆 *First Steps* — complete your first interview
  - 🏆 *High Performer* — average score ≥ 8/10
  - 🏆 *Perfectionist* — average score ≥ 9.5/10
  - 🏆 *Smooth Talker* — average communication score ≥ 8.5/10
- **Celebratory modal** — animated popup when new badges are earned
- **Achievements section** — badges displayed with names on the Dashboard and History pages

### Monetization
- **Credits system** — new users start with 150 free credits; each interview costs 30 credits
- **Razorpay integration** — three pricing tiers (Starter/Pro/Enterprise) with secure HMAC-SHA256 signature verification
- **Pricing page** — accessible from the navbar

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend Framework** | React 19 (Vite 8) |
| **Styling** | Tailwind CSS 3 |
| **Animations** | Framer Motion |
| **Charts** | Recharts |
| **Code Editor** | Monaco Editor (`@monaco-editor/react`) |
| **PDF Generation** | jsPDF + jspdf-autotable |
| **Authentication (Client)** | Firebase Auth (Google Sign-In popup) |
| **HTTP Client** | Axios (with httpOnly cookie credentials) |
| **Routing** | React Router DOM v7 |
| **Backend Runtime** | Node.js + Express 4 |
| **Database** | MongoDB Atlas (Mongoose 8) |
| **Authentication (Server)** | Firebase Admin SDK + JWT (httpOnly cookies) |
| **AI / LLM** | OpenRouter API (Llama 4 Maverick via `meta-llama/llama-4-maverick`) |
| **Payments** | Razorpay SDK |
| **Resume Parsing** | Multer (memory storage, 5 MB limit) + pdf-parse |
| **Speech** | Web Speech API (SpeechRecognition + SpeechSynthesis) |

## Project Structure

```
dv.Interview-AI/
├── client/                          # React frontend (Vite)
│   ├── public/
│   │   ├── images/                  # Landing page assets
│   │   │   └── Videos/              # AI interviewer video loops (male-ai.mp4, female-ai.mp4)
│   │   ├── favicon.svg
│   │   └── _redirects               # SPA redirect rule for Netlify/Render
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthModal.jsx        # Google Sign-In modal
│   │   │   └── Navbar.jsx           # Top nav with credits display, pricing link, profile dropdown
│   │   ├── pages/
│   │   │   ├── Home.jsx             # Landing page with feature showcase
│   │   │   ├── InterviewSetup.jsx   # Role/mode/resume selection before starting
│   │   │   ├── InterviewSession.jsx # Live interview: voice, timer, code editor, hints
│   │   │   ├── Dashboard.jsx        # Post-interview analytics, charts, study guide, PDF export
│   │   │   ├── History.jsx          # Interview history list with achievements banner
│   │   │   └── Pricing.jsx          # Credit purchase tiers (Razorpay checkout)
│   │   ├── utils/
│   │   │   ├── api.js               # Axios instance (baseURL, withCredentials)
│   │   │   ├── firebase.js          # Firebase client initialization
│   │   │   └── speech.js            # Web Speech API helpers (speak, listen, feature detection)
│   │   ├── App.jsx                  # Router, AuthContext provider, protected routes
│   │   ├── App.css                  # Component-level styles
│   │   ├── index.css                # Global styles, Tailwind directives, Inter font
│   │   └── main.jsx                 # React DOM entry point
│   ├── .env.example                 # Template for client environment variables
│   ├── index.html                   # HTML shell
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vite.config.js
│
├── server/                          # Express backend API
│   ├── config/
│   │   ├── db.js                    # MongoDB connection (Mongoose)
│   │   └── firebaseAdmin.js         # Firebase Admin SDK init (supports JSON env var or local file)
│   ├── controllers/
│   │   ├── authController.js        # Google login (Firebase ID token → JWT cookie), logout, profile
│   │   ├── interviewController.js   # Resume parse, start, answer (with code eval), complete (badges + study guide), hint, history
│   │   └── paymentController.js     # Razorpay order creation and HMAC signature verification
│   ├── middleware/
│   │   ├── isAuth.js                # JWT cookie verification middleware
│   │   └── multerConfig.js          # PDF-only file upload (memory storage, 5 MB limit)
│   ├── models/
│   │   ├── User.js                  # name, email, credits (default 150), badges[], createdAt
│   │   └── Interview.js             # mode, role, experience, questions[{text, answerText, codeContent, codeLanguage, scores, feedback}], averageScore, studyGuide[], status, interviewer
│   ├── routes/
│   │   ├── authRoutes.js            # POST /google, GET /logout, GET /profile
│   │   ├── interviewRoutes.js       # POST resume-parse/start/answer/hint/complete, GET history/:id
│   │   └── paymentRoutes.js         # POST create-order, POST verify
│   ├── server.js                    # Express app entry point (CORS, cookie-parser, routes, health check)
│   ├── .env.example                 # Template for server environment variables
│   └── package.json
│
├── reference-screenshots/           # App screenshots (22 PNGs)
├── .gitignore
└── README.md
```

## Prerequisites

- **Node.js** v18 or higher
- **MongoDB** — a MongoDB Atlas cluster (or local MongoDB instance)
- **Firebase project** — with Google Sign-In enabled under Authentication → Sign-in method
- **Firebase Admin SDK** — service account JSON file (downloaded from Firebase Console → Project Settings → Service accounts)
- **OpenRouter account** — API key from [openrouter.ai](https://openrouter.ai)
- **Razorpay account** — test or live API keys from [dashboard.razorpay.com](https://dashboard.razorpay.com)

## Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/dv.Interview-AI.git
cd dv.Interview-AI

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

## Configuration

### Server (`server/.env`)

Copy the example and fill in your values:

```bash
cp server/.env.example server/.env
```

```env
# Backend port
PORT=5000

# MongoDB Atlas connection string
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database_name>

# Secret used to sign JWT session cookies
JWT_SECRET=your_jwt_signing_secret_here

# Path to Firebase Admin SDK service account JSON (relative to server/)
FIREBASE_SERVICE_ACCOUNT=./firebaseServiceAccount.json

# OpenRouter API key for AI question generation and evaluation
OPENROUTER_API_KEY=sk-or-v1-your_openrouter_api_key_here

# Razorpay payment gateway credentials
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Frontend URL (used for CORS origin validation)
CLIENT_URL=http://localhost:5173
```

> **Note:** Place your Firebase Admin SDK JSON file at `server/firebaseServiceAccount.json`. This file is git-ignored. For cloud deployments (e.g., Render), you can alternatively paste the entire JSON as the `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable — the server auto-detects both formats.

### Client (`client/.env`)

```bash
cp client/.env.example client/.env
```

```env
# Firebase Web SDK configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Razorpay publishable key (must match the server's RAZORPAY_KEY_ID)
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id
```

> **Optional:** Set `VITE_API_URL` to override the backend URL (defaults to `http://localhost:5000/api`). Required when deploying the frontend and backend to separate domains.

## Usage

Start both servers in separate terminals:

**Terminal 1 — Backend (port 5000):**
```bash
cd server
npm run dev
```

**Terminal 2 — Frontend (port 5173):**
```bash
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser (Chrome recommended for full Web Speech API support).

### Typical Workflow

1. Click **"Start Interview"** on the landing page → sign in with Google
2. Select interview mode (Technical / HR), job role, experience level, and optionally upload your resume
3. Choose a male or female AI interviewer → the session begins
4. Answer each question by speaking into your microphone or typing; optionally open the **Code Editor** for coding questions
5. Use **"Get a Hint"** if stuck (costs 5 credits)
6. After all questions, view your **Analytics Dashboard** with scores, AI feedback, study guide, and earned badges
7. Download a **PDF report** of your performance

## API Reference

All endpoints are prefixed with `/api`. Protected routes require a valid `token` httpOnly cookie (set on login).

### Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/google` | No | Exchange Firebase ID token for JWT session cookie |
| `GET` | `/profile` | Yes | Get current user profile (name, email, credits, badges) |
| `GET` | `/logout` | Yes | Clear session cookie |

### Interviews (`/api/interview`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/resume-parse` | Yes | Upload PDF resume (multipart, field: `resume`). Returns `{ skills[], projects[] }` |
| `POST` | `/start` | Yes | Start interview. Body: `{ role, mode, experience?, interviewer?, resumeSkills?, resumeProjects? }`. Deducts 30 credits. Returns `{ interviewId, questions[], credits }` |
| `POST` | `/answer` | Yes | Submit answer. Body: `{ interviewId, questionIndex, answerText, codeContent?, codeLanguage? }`. Returns `{ feedback, scores }` |
| `POST` | `/hint` | Yes | Generate hint. Body: `{ interviewId, questionIndex }`. Deducts 5 credits. Returns `{ hint, newCredits }` |
| `POST` | `/complete/:id` | Yes | Complete interview. Calculates average score, generates study guide, awards badges. Returns `{ interview, newBadges[] }` |
| `GET` | `/history` | Yes | Get all interviews for the current user (sorted by date descending) |
| `GET` | `/:id` | Yes | Get full interview detail by ID |

### Payments (`/api/payment`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/create-order` | Yes | Create Razorpay order. Body: `{ amount, credits }`. Returns `{ orderId, amount, currency }` |
| `POST` | `/verify` | Yes | Verify payment signature. Body: `{ order_id, payment_id, signature, credits }`. Adds credits on success |

### Health Check

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/health` | No | Returns `{ status: "ok" }` |

## Available Scripts

### Client (`client/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server on port 5173 with HMR |
| `npm run build` | Production build to `client/dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run oxlint |

### Server (`server/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start server with `--watch` flag (auto-restart on file changes) |
| `npm start` | Start server in production mode (`node server.js`) |

## Deployment

The project is structured for deployment as two separate services (e.g., on Render):

### Backend (Render Web Service)
1. Set the **root directory** to `server`
2. **Build command:** `npm install`
3. **Start command:** `npm start`
4. Add all `server/.env` variables to the Render environment
5. For Firebase Admin SDK: paste the entire contents of `firebaseServiceAccount.json` as the `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable (the server auto-detects JSON strings)
6. Set `CLIENT_URL` to your deployed frontend URL (e.g., `https://your-app.onrender.com`)

### Frontend (Render Static Site or Netlify)
1. Set the **root directory** to `client`
2. **Build command:** `npm install && npm run build`
3. **Publish directory:** `dist`
4. Add all `client/.env` variables to the build environment
5. Set `VITE_API_URL` to your deployed backend URL (e.g., `https://your-api.onrender.com/api`)

> **Important:** The `client/public/_redirects` file is already configured for SPA routing on static hosts.

## License

MIT License
