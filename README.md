# FinOps Autopilot — Landing Page

A single-page waitlist / early-access landing page for **FinOps Autopilot**, an
AWS-only cloud cost optimization agent for DevOps, Platform, and FinOps teams.

Built with [Astro 4](https://astro.build/) + Tailwind CSS, designed to deploy
to [Netlify](https://www.netlify.com/) with zero configuration.

## Stack

- **Astro 4** — static-site output, ships zero JS by default
- **Tailwind CSS 3** — design tokens via CSS variables for light/dark themes
- **Netlify Forms** — waitlist submissions (no third party)
- **Self-hosted fonts** — Inter Variable, JetBrains Mono via `@fontsource`
- **Static `sitemap.xml`** — hand-authored in `public/` (no `@astrojs/sitemap` dep)
- **Netlify** — hosting + form handling + edge headers

## Project structure

```
.
├── astro.config.mjs          # Astro + sitemap config
├── tailwind.config.mjs       # design tokens
├── netlify.toml              # build, forms, security headers
├── public/
│   ├── favicon.svg
│   └── robots.txt
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
    │   ├── SignupForm.astro  # Netlify Forms
    │   └── Footer.astro
    ├── styles/global.css
    └── pages/index.astro
```

## Local development

```bash
npm install
npm run dev          # http://localhost:4321
```

## Build

```bash
npm run build        # → dist/
npm run preview      # local preview of the build
```

## Deploy to Netlify

### Option 1 — Git integration (recommended)
1. Push this repo to GitHub.
2. In Netlify, **Add new site → Import from Git** → pick the repo.
3. Build settings are auto-detected from `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Click **Deploy**. First build runs in ~60s.

### Option 2 — CLI
```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod
```

## Form submissions

Submissions to the `early-access` form land in the Netlify dashboard under
**Forms**. To enable email or Slack notifications:
**Site settings → Forms → Form notifications**.

## Customising copy

All copy lives in two places:
- `src/site.config.ts` — site name, URL, tagline, launch date
- `src/components/*.astro` — section content, FAQ items, pain/value copy

Change `launchDate` in `src/site.config.ts` to update the countdown.

## Theme

The site boots in light mode (or dark, based on `prefers-color-scheme`) and
respects a `localStorage.theme` override. To force a default, edit the
inline script in `src/layouts/BaseLayout.astro`.
