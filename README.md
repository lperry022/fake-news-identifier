# Fake News Identifier 📰 (Group 11)

A web-based tool that lets users paste a news headline or URL 📝 and receive a credibility score ✅ with clear explanations and warning flags 🚩.  
This project promotes **media literacy** by helping users verify online content 🔍 and reduce the spread of misinformation.

---

## 🚀 Mandated Tech Stack

- 🟢 **Node.js** — backend logic  
- 🟡 **Vanilla JavaScript** — frontend logic  
- 🔵 **HTML & CSS + Materialize** — UI  
- 🟣 **MongoDB** — logs & flags  

> ⚠️ Full frontend frameworks (e.g., React) are **not** used.

---

## 🎨 Frontend

**Location:** `frontend/`  
**Built with:** HTML, CSS (Materialize + custom), Vanilla JS

### Pages
- **Landing** — Hero section, input field, “Analyze” button, results card  
- **Register** — User account creation with inline validation  
- **Login** — Session login with inline validation and “remember me” option  
- **Dashboard** — Displays past checks and user profile  

### Features
- Hero section + pill input field  
- “Analyze” button (calls backend API)  
- Results card with **verdict**, **score bar**, **source reputation**, and **flags**  
- Sections: *How it Works*, *Features*, *Tech*, *Team (Group 11)*  
- Mobile-friendly layout with a purple + turquoise theme

### Run locally

**Option A – VS Code Live Server**
```bash
# open index.html in Live Server
frontend/index.html


**B) Simple HTTP server**
    
    npx http-server frontend -p 5500
    # Open http://127.0.0.1:5500

### Frontend ↔ Backend base URL
In `frontend/js/app.js` set the API base if your backend runs on another port/host:
    
    const API_BASE = ""; // same origin
    // e.g. const API_BASE = "http://localhost:3000";

---

## ⚙️ Backend

**Location:** `backend/`  
**Built with:** Express, Mongoose, `express-session` + `connect-mongo`, `bcryptjs`, `helmet`, `express-rate-limit` (ES Modules)

### Core Endpoints
- 🔐 **Auth** — register, login, logout, `GET /auth/me` (session cookie in MongoDB)  
- 👤 **Profile** — `GET /api/profile`, `PUT /api/profile` (change display name)  
- 🧪 **Analyze** — `POST /api/analyze` combines **source reputation** + **sensational keyword** checks  
- 🩺 **Health** — `GET /api/health` reports server time & Mongo status  
- 🌐 **Static** — serves the `frontend/` folder (single origin for API + assets)  

### Environment Setup
Create **`backend/.env`**:

```env
MONGO_URI=mongodb://127.0.0.1:27017/fni
SESSION_SECRET=replace_me
PORT=3000


If MONGO_URI is missing, the code falls back to mongodb://127.0.0.1:27017/fni.

### Start Development
cd backend
npm install

# Start Mongo (choose one)
brew services start mongodb-community
# or:
# docker run -d --name mongo -p 27017:27017 mongo:6

# Seed reputation sources (e.g., bbc.com → Trusted, theonion.com → Untrusted)
npm run seed:sources

# Start app (serves frontend/ too)
npm run start
# → http://localhost:3000


**Location:** `backend/`  
**Built with:** Express, Mongoose, `express-session` + `connect-mongo`, `bcryptjs`, `helmet`, `express-rate-limit` (ES Modules)

### What it does
- 🔐 **Auth** — register, login, logout, `GET /auth/me` (session cookie in MongoDB).
- 👤 **Profile** — `GET /api/profile`, `PUT /api/profile` (change display name).
- 🧪 **Analyze** — `POST /api/analyze` combines **source reputation** + **sensational keyword** checks.
- 🩺 **Health** — `GET /api/health` reports server time & Mongo status.
- 🌐 **Static** — serves the `frontend/` folder (single origin for API + assets).

### Environment (.env)
Create **`backend/.env`**:
```env
MONGO_URI=mongodb://127.0.0.1:27017/fni
SESSION_SECRET=replace_me
PORT=3000

If MONGO_URI is missing, the code falls back to mongodb://127.0.0.1:27017/fni.


Start Dev
npm install

# Start Mongo (choose one)
brew services start mongodb-community
# or:
# docker run -d --name mongo -p 27017:27017 mongo:6

# Seed reputation sources (e.g., bbc.com → Trusted, theonion.com → Untrusted)
npm run seed:sources

# Start app (serves frontend/ too)
npm run start
# → http://localhost:3000


---

## Project Structure 🗂️

    fake-news-identifier/
      frontend/
        index.html
        css/
          styles.css
        js/
          app.js
      backend/
        ...

---
Server layout (at a glance)
backend/
├─ server.js                 # app bootstrap: env, security, sessions, static, routes, sockets
├─ config/
│  └─ db.js                  # Mongo connection (fallback + logging)
├─ routes/
│  ├─ authRoutes.js          # /auth/register|login|logout, /auth/me
│  ├─ profileRoutes.js       # /api/profile (GET/PUT, requires session)
│  └─ analyzeRoutes.js       # /api/analyze (POST)
├─ controllers/
│  ├─ authController.js      # bcryptjs + express-session
│  ├─ profileController.js   # read/update user (+ optional socket emits)
│  └─ analyzeController.js   # domain extraction + scoring logic
├─ middleware/
│  ├─ auth.js                # requireAuth
│  └─ validate.js            # request validation (Zod or simple fallback)
├─ models/
│  ├─ User.js
│  ├─ Source.js
│  └─ AnalysisLog.js
└─ sockets/
   └─ initSockets.js         # (optional) user rooms + session sharing with io


Security & Reliability

🛡️ Helmet headers (CSP disabled in dev for CDN assets).

🚦 Rate limiting across routes (tune per environment).

✅ Validation (Zod or minimal middleware).

🍪 Sessions: httpOnly, sameSite: "lax", secure: false in dev (set true behind HTTPS in prod).

🔗 connect-mongo uses the existing mongoose client (mongoose.connection.getClient()).

Troubleshooting

MONGO_URI missing → ensure backend/.env or rely on the fallback URI.

connect-mongo: provide mongoUrl|client → store must use client: mongoose.connection.getClient().

Auth not sticking → frontend must call /auth/* & /api/profile with credentials: "include".

Analyzer always Unknown → run npm run seed:sources; scheme-less URLs are supported.

Production notes

Serve over HTTPS; set session cookie secure: true.

Enable a strict CSP in Helmet; host assets locally or whitelist CDNs.

Add password policy, email verification, password reset.

Add tests (unit + integration) and CI; store secrets in a proper secret manager.

## Testing 🧪 (high level)

- **Unit (backend):** scoring, keyword matching, URL parsing, API client, input sanitisation  
- **Integration:** API responses, error handling, logging  
- **E2E (frontend):** user flows (paste → analyze → result), accessibility checks (axe), core smoke before release

---

## Authors 👩‍💻👨‍💻

- **Liana Perry** — Frontend Developer, Scrum Master Sprint 1  
- **Hashaam Khan** — Backend Developer, Scrum Master Sprint 2  
- **Meetkumar Kiranbhai Parmar** — Backend Developer  
- **Rubalpreet Singh** — Backend Developer

---

## Notes 📝
- The UI follows the required **Materialize + Vanilla JS** approach and avoids disallowed frameworks.
- If the backend is offline during demos, the frontend can optionally show mock results (toggle in `app.js`).
