import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { feedbackRoute } from "./routes/feedback";
import { chemRoute } from "./routes/chem";
import { healthRoute } from "./routes/health";

const app = new Hono().basePath("/api");

// ── Middleware ──
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      process.env.FRONTEND_URL ?? "",
    ].filter(Boolean),
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
    maxAge: 86400,
  })
);

// ── Routes ──
app.route("/health", healthRoute);
app.route("/feedback", feedbackRoute);
app.route("/chem", chemRoute);

// ── Server ──
const port = Number(process.env.PORT) || 8787;

console.log(`🔥 Hono API server running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
