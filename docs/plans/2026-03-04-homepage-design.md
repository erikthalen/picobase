# Homepage Design — 2026-03-04

## Overview

Replace the default VitePress `layout: home` frontmatter homepage with a custom Vue component that delivers an engaging, product-focused landing page inspired by Supabase — but minimal in content density, matching Picobase's "pico" ethos.

## Approach

**Option B: Custom Vue home component.**

Create `.vitepress/theme/` with a `HomeLayout.vue` that replaces the VitePress home page entirely. The rest of the docs (nav, sidebar, footer) remains untouched. VitePress supports this via its theme extension system (`enhanceApp` + layout slot override or `Layout` export).

## Structure

### 1. Hero Section
- Full-viewport height, dark background
- Picobase icon mark (SVG, large, centered)
- Headline: "Your SQLite database, in the browser."
- Tagline: "Lightweight, self-hosted database manager. Runs on your machine. No cloud required."
- Two CTAs: "Get Started →" (filled, teal accent) + "View on GitHub" (outlined)

### 2. Screenshot Placeholder
- Browser-chrome frame (rounded rect with fake toolbar strip)
- Dashed-border inner area labeled "Screenshot coming soon"
- Easily replaced with `<img>` when the real screenshot is ready

### 3. Features Grid
- 2×2 grid (1-col on mobile), 4 cards:
  - Self-hosted — Your data never leaves your machine
  - SQLite native — No ORM, no abstraction layers
  - Schema visualization — Browse tables and inspect columns at a glance
  - Data management — View, insert, edit, and delete rows

### 4. Install Strip
- Narrow dark band
- Code: `npx picobase ./my-db.sqlite`

## Visual Style

- Background: `#0a0a0a`
- Text: off-white `#f0f0f0`
- Accent: teal `#2dd4bf`
- Cards: `#141414` with subtle border
- Minimal decorative elements; subtle teal glow on CTA button
- Fully responsive (mobile-first)

## Files to Create/Modify

- `packages/docs/.vitepress/theme/index.ts` — register custom theme
- `packages/docs/.vitepress/theme/HomeLayout.vue` — full home page component
- `packages/docs/.vitepress/theme/style.css` — base CSS variables / overrides
- `packages/docs/index.md` — swap `layout: home` for `layout: HomeLayout` (or use frontmatter flag)
