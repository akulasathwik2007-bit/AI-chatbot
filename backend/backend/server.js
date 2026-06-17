
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// IMPORTANT: lock this down to your real frontend domain(s) before going live.
// Using "*" is fine for local testing only.
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["*"];

app.use(
  cors({
    origin: ALLOWED_ORIGINS.includes("*") ? "*" : ALLOWED_ORIGINS,
  })
);
app.use(express.json({ limit: "1mb" }));

if (!process.env.GROQ_API_KEY) {
  console.error(
    "ERROR: GROQ_API_KEY is not set. Create a .env file (see .env.example)."
  );
  process.exit(1);
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Very basic in-memory rate limiting per IP (good enough to start;
// swap for a real solution like express-rate-limit or a reverse-proxy
// limiter before you get real traffic).
const requestLog = new Map(); // ip -> [timestamps]
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 20; // 20 requests per minute per IP

function isRateLimited(ip) {
  const now = Date.now();
  const timestamps = (requestLog.get(ip) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );
  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT_MAX;
}

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/chat", async (req, res) => {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: "Too many requests. Please slow down." });
  }

  const { messages, system } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array is required" });
  }

  // Basic shape validation to avoid passing garbage to the API
  for (const m of messages) {
    if (!m || (m.role !== "user" && m.role !== "assistant") || typeof m.content !== "string") {
      return res.status(400).json({
        error: "Each message must have role 'user' or 'assistant' and string content",
      });
    }
  }

  // Groq uses the OpenAI-style format: system message goes inside the
  // messages array itself, as the first entry.
  const groqMessages = typeof system === "string" && system.trim()
    ? [{ role: "system", content: system }, ...messages]
    : messages;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: groqMessages,
      max_tokens: 1024,
    });

    const reply = completion.choices[0]?.message?.content || "";

    res.json({ reply, raw: completion });
  } catch (err) {
    console.error("Groq API error:", err);
    const status = err.status || 500;
    res.status(status).json({
      error: "Failed to get response from AI",
      detail: err.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Chatbot backend listening on http://localhost:${PORT}`);
});
