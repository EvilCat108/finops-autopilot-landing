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

### One-time setup

1. **Create the KV namespace** (one prod, one for preview/local dev):
   ```bash
   npx wrangler login
   npx wrangler kv:namespace create EARLY_ACCESS
   npx wrangler kv:namespace create EARLY_ACCESS --preview
   ```
   Paste the returned IDs into `wrangler.toml` (`id` and `preview_id`).

2. **Generate an admin token** (for viewing submissions):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Save this — you'll need it in the dashboard step below.

3. **Connect the GitHub repo** to Cloudflare Pages:
   - Go to https://dash.cloudflare.com/ → **Workers & Pages** → **Create** → **Pages** → **Import from Git**
   - Pick `EvilCat108/finops-autopilot-landing`
   - Build settings:
     - Build command: `npm run build`
     - Build directory: `dist`
   - Click **Save and Deploy**

4. **Bind the KV namespace** in the Pages dashboard:
   - Project → **Settings** → **Functions** → **KV namespace bindings**
   - Add binding: Variable name `EARLY_ACCESS` → select the namespace you created

5. **Set the admin token env var**:
   - Project → **Settings** → **Environment variables**
   - Variable name: `ADMIN_TOKEN`
   - Value: paste the 64-char hex string from step 2

### Ongoing

- Push to `main` → automatic production deploy to `https://finops-autopilot.pages.dev`
- Open a PR → automatic preview deploy at `https://<hash>.finops-autopilot.pages.dev`

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
