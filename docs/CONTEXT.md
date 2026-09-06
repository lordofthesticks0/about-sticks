# About This Project
This site is a static about me site built with Vite and React. It is deployed on Netlify. Serverless backend functions (Netlify On-Demand Builders) live in `netlify/functions/`.

# Purpose
This site serves as a way for me to learn about web development, specifically HTML, CSS, React, and Vite. While it is about me, it is not a portfolio, but rather a fun way to show me to my friends and family. 

# Learning
This site is a way for me to learn web dev. Thus, code should be written in a way that is easy to understand and modify. Explain it to me as if I am entirely new to web dev. 

# Stack
- HTML
- CSS
- React
- Vite
- Netlify (hosting + On-Demand Builder functions)

While Tailwind would have been useful, I want to learn about CSS and how to use it to style my site.

# Style
- Catppuccin Frappe (https://github.com/catppuccin/catppuccin/blob/main/docs/style-guide.md), with blur effects on boxes but still solid colors.
- Subpages may override the palette (e.g. Music uses Apple Music dark-mode colours, Games uses Steam dark-mode colours).
- Colors (all defined as CSS custom properties in `src/index.css`):
    - **Base layers**
        - Crust: `#232634`
        - Mantle: `#292c3c`
        - Base: `#303446`
    - **Surface layers**
        - Surface 0: `#414559`
        - Surface 1: `#51576d`
        - Surface 2: `#626880`
    - **Overlays**
        - Overlay 0: `#737994`
        - Overlay 1: `#838ba7`
        - Overlay 2: `#949cbb`
    - **Text**
        - Subtext 0: `#a5adce`
        - Subtext 1: `#b5bfe2`
        - Text: `#c6d0f5`
    - **Accents**
        - Rosewater: `#f2d5cf`
        - Flamingo: `#eebebe`
        - Pink: `#f4b8e4`
        - Mauve: `#ca9ee6`
        - Red: `#e78284`
        - Maroon: `#ea999c`
        - Peach: `#ef9f76`
        - Yellow: `#e5c890`
        - Green: `#a6d189`
        - Teal: `#81c8be`
        - Sky: `#99d1db`
        - Sapphire: `#85c1dc`
        - Blue: `#8caaee`
        - Lavender: `#babbf1`
- Typography:
    - Display: "Chiron GoRound TC"
    - Body: "Inter"

# Routes
- `/` — Home (`src/pages/Home.tsx`)
- `/music` — Music (`src/pages/Music.tsx`)
- `/games` — Games (`src/pages/Games.tsx`)
- `/moviseries` — Moviseries (`src/pages/Moviseries.tsx`) — TODO
- `/animanga` — Animanga (`src/pages/Animanga.tsx`) — TODO

# Sections

## 1. Home (`/`)
- **Hero Header** — Profile picture (Discord CDN), title, subtitle, scroll-down hint arrow.
- **Favourites** — Clickable cards that link to each subpage (component: `src/components/Favourites.tsx`).

## 2. Music (`/music`)
- Apple Music dark-mode colour scheme (overrides global Catppuccin palette on this page).
- Three categories: **Tracks**, **Albums**, **Artists** — 5 items each.
- Tracks & Albums use `MusicBox` component with Apple Music embed iframes (auto-converted from share links).
- Artists use `ArtistBox` component showing an image instead of an iframe.
- The first item in each category takes up full width (`.music-box:first-child { flex-basis: 100% }`).
- Jump-link nav at top to scroll between sections.
- Each file: `src/pages/Music.tsx`, `src/pages/Music.css`.

## 3. Games (`/games`)
- Steam dark-mode colour scheme (`#171a21`, `#1b2838`, `#2a475e`, `#66c0f4` accent blue).
- **Hero section** at the top showing Steam profile info:
    - Profile picture (256×256)
    - Display name
    - Account creation date
    - Total hours on record
    - Hours % (total hours ÷ hours since account creation)
- The game list and Steam account ID come from the shared site-content document.
- **10 games** are currently listed without categorization.
- Top 2 games take full width (`.game-box:nth-child(-n+2) { flex-basis: 100% }`), rest are side-by-side.
- Each game card shows: capsule image, playtime, achievement %, currently active players, price box, and a "Store Page" button linking to Steam.
- Slow Steam data (profile, achievements, prices, and profile items) is captured by the content uploader and stored with the site-content document.
- Playtime and currently active-player data continue to come from the separate `steam-fast` function, which remains available for the fast-changing data.
- Skeleton loading states while data is being fetched.
- Each file: `src/pages/Games.tsx`, `src/pages/Games.css`.

## 4. Moviseries (`/moviseries`) — TODO
- Placeholder page. To be built.

## 5. Animanga (`/animanga`) — TODO
- Placeholder page. To be built.

# Global Components
- **Footer** (`src/components/Footer.tsx`, `Footer.css`) — Discord info, more-coming-soon.
- **ConstructionBanner** (`src/components/ConstructionBanner.tsx`, `ConstructionBanner.css`) — Site-wide notice.
- **Favourites** (`src/components/Favourites.tsx`, `Favourites.css`) — Card grid on the home page linking to subpages.

# Netlify Functions
Located in `netlify/functions/`. The directory is configured in `netlify.toml`.
- `site-content.cjs` — Reads and validates the JSON site-content blob from Netlify Blobs. It uses the `builder()` wrapper and allows `GET` only.
- `steam-fast.cjs` — Fetches fast-changing playtime and player-count data from Steam. This function is intentionally retained for the fast data path.

The former `steam-heavy` function was removed. Its slow Steam API work now runs once during `scripts/upload-site-content.ts`, before the content blob is uploaded.

# Content Data and Uploading
The editable source file is [`data/site-content.example.yaml`](../data/site-content.example.yaml). The expected schema is documented in [`docs/netlify-blobs.md`](netlify-blobs.md).

The uploader writes to this site-wide Netlify Blobs location:

- Store: `about-sticks-content`
- Key: `site-content.json`
- Reader: `/.netlify/functions/site-content`

The YAML document contains:

- `schemaVersion` — currently `1`.
- `home` — avatar and hero text: `avatarUrl`, `avatarAlt`, `title`, `subtitle`, `subsubtitle`.
- `categories` — objects with `name`, `color`, and `path`.
- `music` — `subtitle`, `warning`, plus `tracks`, `albums`, and `artists` arrays.
- `games` — `steamId`, page `title` and `subtitle`, plus game `items` containing `appId`, `title`, and `description`.

The uploader adds a generated `steam` object to the JSON blob. It contains the Steam profile, achievement percentages keyed by app ID, price data keyed by app ID, and equipped profile-item URLs. Individual Steam requests can fail without preventing the rest of the snapshot from being uploaded; unavailable parts are stored as `null` or per-game `null` values.

Run the uploader with Bun:

```bash
bun run content:upload
```

An alternate YAML path can be supplied as the first argument:

```bash
bun run content:upload -- /path/to/site-content.yaml
```

The script uses raw HTTP requests to Netlify's Blobs API. It requests a signed upload URL with `NETLIFY_SITE_ID` and `NETLIFY_AUTH_TOKEN`, then sends the JSON payload to that URL. The write protocol uses `PUT` requests.

The frontend requests the blob through `site-content`. If that request fails—for example, when running Vite without Netlify Dev—or the endpoint returns an error, it parses the committed YAML file as a fallback. The fallback contains no generated Steam snapshot, so slow Steam values are unavailable locally until a snapshot is uploaded; the `steam-fast` request remains separate.

# Environment Variables
- `STEAM_API_KEY` — Required by the Bun uploader to authenticate with the Steam Web API. Set locally when uploading and keep it out of committed files.
- `NETLIFY_SITE_ID` — Netlify site ID used by the raw Blobs API upload.
- `NETLIFY_AUTH_TOKEN` — Netlify personal access token used by the raw Blobs API upload. Keep it secret.
