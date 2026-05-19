# copilot-instructions.md

This file provides guidance to Github Copilot when working with code in this repository.

## Project overview

Personal recipe manager — static SPA (no build step) hosted on **Netlify**, database on **Supabase**, AI via **Anthropic API** proxied through a Netlify serverless function. Designed to be used from a phone.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML/CSS/JS — no framework, no bundler |
| Database | Supabase (hosted Postgres) — JS client loaded via CDN |
| AI proxy | Netlify Function (`netlify/functions/claude.js`) using `@anthropic-ai/sdk` |
| AI model | `claude-haiku-4-5-20251001` — cheapest model, used only at import time |
| Hosting | Netlify (static site + serverless functions) |

## Architecture

**No build step.** `index.html` loads `style.css` and `app.js` directly. The Supabase JS client is loaded from CDN. Deploying = pushing to GitHub; Netlify auto-deploys.

**Single-file SPA.** All views are rendered by `RecipeApp` in `app.js` via `innerHTML`. Hash-based routing (`#home`, `#recipes`, `#detail/id=...`, `#add`, `#settings`).

**Config lives in `localStorage`** under the key `recipeCfg`: `{ supabaseUrl, supabaseKey, netlifyUrl }`. The user enters these once in the Settings view. `netlifyUrl` is optional — when the app is served from Netlify itself, relative paths work automatically.

**Claude is only called for:**
1. Importing a cookbook photo (vision + JSON extraction)
2. Parsing pasted recipe text into structured fields
3. The optional "AI helpt me kiezen" mood suggestion (sends only titles/tags, not full recipes)

Regular search uses Supabase `ilike` — free, no AI credits.

## Supabase schema

```sql
CREATE TABLE recipes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  source_type text DEFAULT 'overig',  -- 'youtube' | 'claude' | 'kookboek' | 'overig'
  source_url text,
  image_url text,
  cuisine text,
  tags text[] DEFAULT '{}',
  prep_time integer,                   -- minutes
  servings integer,
  ingredients text,
  instructions text,
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON recipes FOR ALL USING (true) WITH CHECK (true);
```

## Netlify function

`netlify/functions/claude.js` is the only server-side code. It proxies POST requests to the Anthropic API to avoid CORS issues. Requires env var `ANTHROPIC_API_KEY` set in Netlify dashboard. Dependencies come from root `package.json`.

## Local development

Open `index.html` directly in a browser. Supabase calls work from file:// (CORS is open). AI features (photo/text import, AI suggest) require the Netlify function to be running — use the Netlify CLI:

```bash
npm install -g netlify-cli
netlify dev
```

Then open `http://localhost:8888`. Set `ANTHROPIC_API_KEY` in a `.env` file at the root.

## Key conventions

- All user-facing text is Dutch.
- `_esc()` must be called on any user-supplied string before injecting into `innerHTML`.
- Claude API responses are expected as raw JSON (no markdown fences). System prompts explicitly request this.
- YouTube import uses the free oEmbed endpoint — no API key needed.
- The `source_type` field drives the colored badge in the UI (`source-youtube`, `source-claude`, `source-kookboek`, `source-overig`).
