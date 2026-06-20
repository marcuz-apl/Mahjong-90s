# Next.js 15 App Router SEO Configuration Guide

This document records the design and implementation notes for the Search Engine Optimization (SEO) strategy applied to the **Arcade Mahjong 90s** simulator project.

---

## 1. Global Layout Metadata
Next.js 15 uses native metadata exports from layouts to define global headers that propagate recursively to all sub-routes.

- **File**: `src/app/layout.js`
- **Configuration**:
  - Global `title` and `description` to capture core retro arcade mahjong intent.
  - Custom `keywords` targeting niche search queries (`電子基盤`, `天開眼`, `懷舊街機麻將`).
  - Open Graph (`openGraph`) objects specifying site previews when sharing URLs on social messaging platforms (LINE, Telegram, Discord, Facebook).
  - Canonical link tags to prevent duplicate indexing warnings.

---

## 2. Dynamic Sitemap (`sitemap.js`)
Next.js supports file-based sitemap generation via a special `sitemap.js` route in the root of the app directory.

- **File**: `src/app/sitemap.js`
- **Output Route**: `/sitemap.xml`
- **Purpose**: Generates dynamic URLs listing the landing page `/` and guidelines page `/readme` along with metadata changes (modification dates, priority weights, and change frequencies).

---

## 3. Crawler Control (`robots.js`)
To prevent index bloat and search engines ranking internal APIs, we configure crawler rules.

- **File**: `src/app/robots.js`
- **Output Route**: `/robots.txt`
- **Purpose**:
  - Allows full indexing of user-facing routes (`/` and `/readme`).
  - Disallows crawlers from indexing administrative pages (`/admin`) and backend data operations (`/api/*`).

---

## 4. Structured Data (JSON-LD)
JSON-LD structured data is injected into the HTML stream of [page.js](file:///root/projects/Arcade-Mahjong-90s/src/app/page.js).

- **Type**: `VideoGame`
- **Schema Details**:
  - `name`: 街機麻將 Arcade Mahjong 90s
  - `genre`: Tabletop / Mahjong
  - `playMode`: SinglePlayer
  - `applicationCategory`: Game
- **Purpose**: Enables search engines to render special Rich Result Snippets (interactive game metadata, gameplay category badges) directly inside search results.
