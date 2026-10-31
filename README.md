# Sosick

Pick up & delivery plus Verified Plugs for Nairobi. WhatsApp 0112 275 881.
Plain HTML, CSS and JavaScript with no build step. It can be hosted free on GitHub Pages.

## What's where

| File | What it does |
|---|---|
| `index.html` | The public website |
| `assets/data.js` | **Edit this one.** WhatsApp number, delivery fee, extra-charges switch, delivery areas, categories, Verified Plugs |
| `assets/app.js` | Order slip → WhatsApp, plug search, area lists |
| `assets/sosi.js` | Sosi, the chat helper (rule-based, no paid AI) |
| `assets/style.css` | Yellow/black look |
| `assets/logo.svg`, `favicon.svg` | Placeholder logo. Swap in the real one when it lands |
| `admin/index.html` | The owner's portal: orders, team, charges, plugs, backup |

## How it fits together

- **Database:** Supabase, in the owner's own account (project `esluujzrscwswxjehkrm`, region eu-west-1). `supabase/setup.sql` creates everything; put the owner's email in it before running.
- **Website orders** open WhatsApp with the slip **and** drop a copy into the admin's Orders list, marked *website*.
- **Verified Plugs:** add a seller in Admin → Verified Plugs, tick the five Sosick Test checks, press **Go live**. It shows on the website straight away. The database itself refuses "live" unless all five checks are ticked.
- **Charges:** switch extras on in Admin → Charges. The website stops saying "no extra charges" by itself.
- **Admin sign-in:** email link, no password. Only emails in the `admins` table get any data. Anyone else can sign in but sees nothing.
- **Public key:** `assets/data.js` holds the Supabase *public* (anon) key. That's intended; the database rules decide what it can do. Never put the service-role key in this repo.

## Logo

`tools/make_logo.py` draws the logo (SOSICK in chunky block letters on a black bar with a yellow stripe). It writes:
`assets/logo-wordmark.svg` (animated, header), `logo-wordmark-static.svg`, `logo-badge.svg` (round badge for profile pictures), `logo.svg` + `favicon.svg` (square icon).
