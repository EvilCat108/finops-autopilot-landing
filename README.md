# FinOps Autopilot — Landing Page

A single-page waitlist / early-access landing page for **FinOps Autopilot**, an
AWS-only cloud cost optimization agent for DevOps, Platform, and FinOps teams.

Built with [Astro 4](https://astro.build/) + Tailwind CSS, deployed to
[Cloudflare Pages](https://pages.cloudflare.com/) with a Pages Function for
form handling and Cloudflare KV for storage.

## Stack

- **Astro 4** — static-site output, ships zero JS by default
- **Tailwind CSS 3** — design tokens via CSS variables for light/dark themes
- **Cloudflare Pages Functions** — serverless form handler at `/submit`
- **Cloudflare KV** — waitlist submissions storage
- **Self-hosted fonts** — Inter Variable, JetBrains Mono via `@fontsource`
- **Static `sitemap.xml`** — hand-authored in `public/`
- **Cloudflare Pages** — hosting + edge + functions

## Project structure

```
.
├── astro.config.mjs          # Astro config
├── tailwind.config.mjs       # design tokens
├── wrangler.toml             # Pages project name + KV binding for local dev
├── public/
│   ├── favicon.svg
│   ├── robots.txt
│   ├── sitemap.xml
│   └── _headers              # security + cache headers (CF Pages format)
├── functions/
│   ├── submit.js             # POST /submit — form handler, writes to KV
│   └── admin.js              # GET /admin?token=… — list submissions
└── src/
    ├── site.config.ts        # site name, URL, launch date
    ├── layouts/BaseLayout.astro
    ├── components/
    │   ├── Nav.astro
    │   ├── Hero.astro
    │   ├── Countdown.astro   # custom element, ~1KB
    │   ├── Pains.astro
    │   ├── ValueBullets.astro
    │   ├── HowItWorks.astro
    │   ├── FAQ.astro
    │   ├── SignupForm.astro  # posts to /submit (CF Pages Function)
    │   └── Footer.astro
    ├── styles/global.css
    └── pages/index.astro
```

## Local development

```bash
npm install
npm run dev          # http://localhost:4321  (form won't actually submit)
```

To test the form locally with full Cloudflare emulation (functions + KV):

```bash
npm run build
npm run pages:dev    # http://localhost:8788
```

## Build

```bash
npm run build        # → dist/
```

## Deploy to Cloudflare Pages

This project uses **Direct Upload** (no Git integration). The first deploy is
fully scripted via the Cloudflare API; ongoing deploys are a single CLI command.

### One-time setup (already done)

1. Created the KV namespace pair:
   ```bash
   npx wrangler kv namespace create EARLY_ACCESS
   npx wrangler kv namespace create EARLY_ACCESS --preview
   ```
2. Created the Pages project via API with Direct Upload mode
3. Bound the KV namespace (prod: `a823ebbc5d1f4fb0a84a7468e0fb90a1`,
   preview: `0748d1ebc6404cad96b1c501a1adaa92`) and the `ADMIN_TOKEN` env var
   via `PATCH /accounts/{id}/pages/projects/finops-autopilot`

### Ongoing deploys

```bash
npm run build
npx wrangler pages deploy dist --project-name finops-autopilot --branch main
```

Wrangler picks up `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` from
your shell environment. If you need to rotate the admin token, generate a new
one and update the Pages project:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# then update via dashboard: Settings → Environment variables
```

### Why Direct Upload (not Git integration)?

Git integration requires installing the Cloudflare Pages GitHub OAuth app on
your account — a one-time browser step that can't be scripted. Direct Upload
gives you identical runtime behaviour (preview URLs, KV bindings, functions,
env vars) and trades automatic-deploys-on-push for a single deploy command.

If you want Git integration later, install the OAuth app at
https://dash.cloudflare.com/ → Workers & Pages → Create → Pages → Import
from Git, then point the repo at the existing project.

## Viewing form submissions

```
https://finops-autopilot.pages.dev/admin?token=<ADMIN_TOKEN>
```

(Replace `<ADMIN_TOKEN>` with the env var value.)

## Customising copy

- `src/site.config.ts` — site name, URL, tagline, launch date
- `src/components/*.astro` — section content, FAQ items, pain/value copy

Change `launchDate` in `src/site.config.ts` to update the countdown.

## Theme

The site boots in light mode (or dark, based on `prefers-color-scheme`) and
respects a `localStorage.theme` override. To force a default, edit the
inline script in `src/layouts/BaseLayout.astro`.

## Adding a custom domain

In the Pages dashboard: **Custom domains** → **Set up a custom domain**.
Cloudflare will auto-issue and renew the TLS certificate.

## Optional: email notifications

The form currently stores submissions in KV only. To add email notifications,
use [Cloudflare Email Service](https://developers.cloudflare.com/email-service/)
once a custom domain is attached (it requires DKIM/SPF DNS records). Add a
small Pages Function that reads from KV and calls the Email Service API.
