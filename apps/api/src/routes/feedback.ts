import { Hono } from "hono";

export const feedbackRoute = new Hono();

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL ?? "";

feedbackRoute.post("/", async (c) => {
  if (!DISCORD_WEBHOOK_URL) {
    return c.json({ error: "Webhook not configured" }, 500);
  }

  const body = await c.req.json<{ message?: string; source?: string }>();
  const trimmed = body.message?.trim();

  if (!trimmed) {
    return c.json({ error: "Message is required" }, 400);
  }

  const source = body.source ?? "Kimi";
  const sourceLabel = source ? ` from ${source}` : "";

  try {
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `📬 **New Suggestion${sourceLabel}**\n> ${trimmed}\n\n_Sent at ${new Date().toLocaleString()}_`,
      }),
    });

    if (!response.ok) {
      return c.json({ error: "Failed to send feedback" }, 502);
    }

    return c.json({ success: true });
  } catch {
    return c.json({ error: "Failed to reach Discord" }, 502);
  }
});
