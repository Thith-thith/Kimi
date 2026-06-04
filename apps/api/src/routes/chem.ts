import { Hono } from "hono";

export const chemRoute = new Hono();

const CHEM_API_URL = process.env.CHEM_API_URL ?? "http://10.0.0.149:8000";

// Proxy all requests to the chemistry API backend
chemRoute.all("/*", async (c) => {
  const path = c.req.path.replace(/^\/api\/chem/, "") || "/";
  const url = `${CHEM_API_URL}${path}`;

  try {
    const headers = new Headers(c.req.raw.headers);
    headers.delete("host");

    const response = await fetch(url, {
      method: c.req.method,
      headers,
      body:
        c.req.method !== "GET" && c.req.method !== "HEAD"
          ? c.req.raw.body
          : undefined,
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch {
    return c.json({ error: "Chemistry API unavailable" }, 502);
  }
});
