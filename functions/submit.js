// Cloudflare Pages Function — handles the waitlist form submission.
// Route: POST /submit
// Backing store: Cloudflare KV namespace bound as `EARLY_ACCESS`.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ALLOWED_ROLES = new Set([
  "devops",
  "platform",
  "finops",
  "leadership",
  "other",
]);

const ALLOWED_SPEND = new Set([
  "lt5k",
  "5to25k",
  "25to100k",
  "100to500k",
  "gt500k",
]);

function bad(message, status = 400) {
  return new Response(message, { status, headers: { "content-type": "text/plain" } });
}

export async function onRequestPost({ request, env }) {
  let data;
  try {
    data = await request.formData();
  } catch {
    return bad("Invalid form data");
  }

  // 1. Honeypot — any value in bot-field means it's a bot.
  if ((data.get("bot-field") || "").toString().trim() !== "") {
    return bad("Bad request", 400);
  }

  // 2. Required fields.
  const email = (data.get("email") || "").toString().trim().toLowerCase();
  const role = (data.get("role") || "").toString().trim();
  const spend = (data.get("spend") || "").toString().trim();

  if (!EMAIL_RE.test(email)) return bad("Invalid email");
  if (!ALLOWED_ROLES.has(role)) return bad("Invalid role");
  if (!ALLOWED_SPEND.has(spend)) return bad("Invalid spend range");

  // 3. Persist to KV. 1 year TTL is plenty for a waitlist.
  const key = `sub:${Date.now()}:${crypto.randomUUID()}`;
  const record = {
    email,
    role,
    spend,
    submittedAt: new Date().toISOString(),
    ip: request.headers.get("cf-connecting-ip") || "unknown",
    country: request.headers.get("cf-ipcountry") || "unknown",
    userAgent: request.headers.get("user-agent") || "unknown",
  };

  try {
    await env.EARLY_ACCESS.put(key, JSON.stringify(record), {
      expirationTtl: 60 * 60 * 24 * 365,
    });
  } catch (err) {
    return new Response(`Storage error: ${err.message}`, { status: 500 });
  }

  // 4. 303 See Other — works for both standard form POST and fetch().
  return Response.redirect(
    new URL("/?submitted=true#signup", request.url),
    303
  );
}

export async function onRequestGet() {
  return new Response("Method Not Allowed", { status: 405 });
}
