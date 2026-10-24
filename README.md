# Sosick Thrifts

Pick up & delivery plus Verified Plugs for Nairobi. Run by **VosteyArts** (WhatsApp 0112 275 881).
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
| `admin/index.html` | VosteyArts' portal: orders, team, charges, plugs, backup |

## How an order flows

1. The customer fills the slip (or chats with Sosi).
2. WhatsApp opens with the order already written, plus an `SOS-1234` code and an optional map pin.
3. VosteyArts pastes the slip into **Admin → Orders**, assigns a rider and moves it New → Picked up → On the way → Delivered.

## Adding a Verified Plug

1. In **Admin → Verified Plugs**, add the seller and tick the five Sosick Test checks as they pass.
2. **Go live** only unlocks once all five are ticked.
3. Press **Copy live plugs for website** and paste the result over `plugs: []` in `assets/data.js`.

## Turning on charges later

The delivery fee is charged from day one. Set its amount in **Admin → Charges**, and if you want the site to show
a starting price, put it in `deliveryFeeFrom` in `assets/data.js` (e.g. `150`).

The extra charges (per km, service fee, rush, late-night, featured spot) are set up but **off**. When VosteyArts
decides the time is right, he switches them on in **Admin → Charges** and you set `extraFees: true` in
`assets/data.js` so the website stops saying "no extra charges".

## Known limits (next steps)

- Admin data is saved **on the device only** (browser storage). Next step: a shared database and real login (e.g. Supabase) so orders, team and plugs sync and plugs publish automatically.
- `/admin/` has no password yet. It can't change the public site, only that device's own data, but a login comes with the database.
- Sosi is a scripted helper. A real AI brain can be added later behind a small server (costs money per chat).
