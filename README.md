# Relay — AI Chatbot (Groq-powered, free)

A two-part project: a backend that holds your Groq API key and talks to Groq's
LLMs, and a frontend chat UI that talks to your backend. The key never touches
the browser.

## 1. Get a free Groq API key

Sign up at https://console.groq.com — no credit card required — and create a
key at https://console.groq.com/keys

## 2. Run the backend locally

cd backend
npm install
cp .env.example .env

Open .env and paste your real key:
GROQ_API_KEY=gsk_...

Then:
npm start

Visit http://localhost:3000/health — should return {"status":"ok"}

## 3. Run the frontend locally

Open frontend/index.html directly in your browser. Click "configure" to point
it at your backend URL if it's not on localhost:3000.

## 4. Before pushing to GitHub

backend/.env (your real key) is excluded by .gitignore automatically. Double
check with `git status` before your first commit — only .env.example should
ever be committed.

## 5. Deploying for free

- Backend: Render or Railway both have free tiers for small Node apps. Set
  GROQ_API_KEY as an environment variable in their dashboard.
- Frontend: Vercel, Netlify, or GitHub Pages — all free for static sites.
- Once deployed, set ALLOWED_ORIGINS on the backend to your frontend's real
  domain so other sites can't use your free quota.

## Notes
- Model used: llama-3.3-70b-versatile via Groq. Free tier rate limits apply
  (currently around 30 requests/minute) — fine for personal projects.
- Conversation history lives in the browser tab only; refreshing clears it.
