# Fake News Identifier 📰 (Group 11)

A web-based tool that lets users paste a news headline or URL 📝 and receive a credibility score ✅ with clear explanations and warning flags 🚩.  
This project promotes **media literacy** by helping users verify online content 🔍 and reduce the spread of misinformation.

---

## Mandated Tech Stack 🧰

- 🟢 **Node.js** (backend logic)  
- 🟡 **Vanilla JavaScript** (frontend logic)  
- 🔵 **HTML & CSS + Materialize** (UI)  
- 🟣 **MongoDB** (logs & flags)

> Full frontend frameworks (e.g., React) are **not** used.

---

## Frontend 🎨

**Location:** `frontend/`  
**Built with:** HTML, CSS (Materialize + custom), Vanilla JS

### What’s included
- Hero section + pill input field  
- “Analyze” button (calls backend API)  
- Results card with **verdict**, **score bar**, **source reputation**, and **flags**  
- Sections: *How it Works*, *Features*, *Tech*, *Team (Group 11)*  
- Mobile-friendly layout with a purple + turquoise theme

### Run locally
Choose one:

**A) VS Code Live Server**  
Open `frontend/index.html` with Live Server.

**B) Simple HTTP server**
    
    npx http-server frontend -p 5500
    # Open http://127.0.0.1:5500

### Frontend ↔ Backend base URL
In `frontend/js/app.js` set the API base if your backend runs on another port/host:
    
    const API_BASE = ""; // same origin
    // e.g. const API_BASE = "http://localhost:3000";

---

## Backend ⚙️

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
