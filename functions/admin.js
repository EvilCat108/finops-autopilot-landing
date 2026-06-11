// Cloudflare Pages Function — minimal admin viewer for waitlist submissions.
// Route: GET /admin?token=<ADMIN_TOKEN>
// Reads KV namespace `EARLY_ACCESS`, renders the last 200 entries as HTML.

const ROLE_LABEL = {
  devops: "DevOps / SRE",
  platform: "Platform Engineering",
  finops: "FinOps",
  leadership: "CTO / VP Eng",
  other: "Other",
};

const SPEND_LABEL = {
  lt5k: "< $5k",
  "5to25k": "$5k – $25k",
  "25to100k": "$25k – $100k",
  "100to500k": "$100k – $500k",
  gt500k: "$500k+",
};

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
  );
}

function page({ entries, generatedAt }) {
  const rows = entries
    .map(
      (e) => `
      <tr>
        <td><code>${escapeHtml(e.submittedAt)}</code></td>
        <td>${escapeHtml(e.email)}</td>
        <td>${escapeHtml(ROLE_LABEL[e.role] || e.role)}</td>
        <td>${escapeHtml(SPEND_LABEL[e.spend] || e.spend)}</td>
        <td>${escapeHtml(e.country || "")}</td>
      </tr>`
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Early access signups · FinOps Autopilot</title>
  <style>
    body { font: 14px/1.5 -apple-system, system-ui, sans-serif; margin: 0; padding: 32px; max-width: 1200px; color: #0a0a0b; background: #fff; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    p.meta { color: #6b6b73; margin: 0 0 24px; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #e5e5e7; }
    th { background: #f7f7f8; font-weight: 600; }
    code { font-family: ui-monospace, SFMono-Regular, monospace; font-size: 12px; }
    .empty { color: #6b6b73; padding: 24px 0; }
  </style>
</head>
<body>
  <h1>Early access signups</h1>
  <p class="meta">${entries.length} of last 200 · generated ${escapeHtml(generatedAt)}</p>
  ${
    entries.length === 0
      ? `<p class="empty">No submissions yet.</p>`
      : `<table>
          <thead>
            <tr><th>Submitted</th><th>Email</th><th>Role</th><th>AWS spend</th><th>Country</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>`
  }
</body>
</html>`;
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const expected = env.ADMIN_TOKEN;

  if (!expected) {
    return new Response("ADMIN_TOKEN env var is not set", { status: 500 });
  }
  if (!token || token !== expected) {
    return new Response("Unauthorized", { status: 401 });
  }

  let keys;
  try {
    const result = await env.EARLY_ACCESS.list({ prefix: "sub:", limit: 200 });
    keys = result.keys || [];
  } catch (err) {
    return new Response(`KV read error: ${err.message}`, { status: 500 });
  }

  // Newest first — keys are `sub:<ts>:<uuid>`, so string sort works.
  keys.sort((a, b) => (a.name < b.name ? 1 : -1));

  const entries = [];
  for (const k of keys) {
    const v = await env.EARLY_ACCESS.get(k.name, { type: "json" });
    if (v) entries.push(v);
  }

  return new Response(
    page({ entries, generatedAt: new Date().toISOString() }),
    { headers: { "content-type": "text/html; charset=utf-8" } }
  );
}
