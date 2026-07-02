# Deployment Plan — Nursing Study Tracker

## 1. What this project actually is

Repo: `RafiMichaeli/nursing-study-tracker`. The entire application is **one HTML file**, `מעקב_סיעוד_המבוגר.html` (~2,450 lines, single file, no build step).

- No backend, no database, no server-side code anywhere.
- State lives in the browser: `localStorage` (theme, cached data) + `IndexedDB` (remembers a file handle) + the File System Access API (`showSaveFilePicker` / `showOpenFilePicker`) to read/write a local `progress.json` on the user's own disk.
- External calls: Chart.js and Google Fonts from CDN (`cdnjs.cloudflare.com`, `fonts.googleapis.com`), and — only when the user clicks "generate exam" — a **direct browser call** to `api.anthropic.com` using a personal Anthropic API key the user pastes in once (stored in `localStorage`, sent with the `anthropic-dangerous-direct-browser-calls` header).

This means "installing on a server" is really just **static file hosting** — there is nothing to run, no process to keep alive, no database to provision.

## 2. Artifacts to deploy — and what to leave out

Deploy only:
- `מעקב_סיעוד_המבוגר.html` → copy/rename to `index.html` for a clean root URL (Hebrew filenames work but need URL-encoding, so a plain `index.html` is simpler).
- `README.md` (optional, for the repo page).

**Do not deploy** (and they're already correctly excluded via `.gitignore`):
- `progress.json` — this is personal per-user data. It doesn't belong on a server at all; the app already keeps it local to each visitor's machine by design.
- `ספר ברונר/`, the two exam folders, and `מחסן/` (~2.5 GB total) — these are scanned textbook/exam material. Almost certainly copyrighted; publishing them on a public static host would be a copyright problem independent of hosting cost, and they'd blow past most free-tier storage limits anyway.

So the deployed artifact is effectively **one ~130 KB file**.

## 3. Architecture notes worth knowing before you deploy

- **File System Access API is Chromium-only.** Auto-save/load via `showSaveFilePicker` works in Chrome/Edge/Opera but not Safari or Firefox — those browsers silently fall back to manual JSON download. This isn't a hosting issue, but worth knowing if you use Safari on a Mac/iPhone: you'll be doing manual export/import instead of auto-save.
- **No server means no CORS/proxy needed** for the exam-generator feature — Anthropic's API explicitly supports the direct-browser-call header, so it works the same on any static host with zero extra configuration.
- **Nothing about this app benefits from a "real" server, container, or database.** Adding one would only add cost, attack surface, and maintenance for no functional gain.

## 4. Security review

**Fix now — live credential exposure:** `.git/config` in this folder has your GitHub remote configured as `https://RafiMichaeli:ghp_...@github.com/...` — a personal access token embedded directly in the URL, stored in plaintext on disk. It was never committed to any commit (checked full history — clean), but it's sitting in a config file that could leak via backups, cloud sync, or a screen share. Recommend: revoke that token at github.com → Settings → Developer settings → Personal access tokens, generate a new one, and switch to the macOS Keychain credential helper (`git config --global credential.helper osxkeychain`) or an SSH key instead of a token-in-URL.

**Low risk, by design:** the Anthropic API key is user-supplied, stored only in that browser's `localStorage`, and sent only from that browser directly to Anthropic. It never touches your server/host. The tradeoff: if you ever share the deployed URL with classmates, each person pastes in their *own* key — fine for a personal tool, worth knowing if you widen access.

**Minor, low-priority hardening:** the AI-generated quiz HTML is built via string concatenation and injected into a new `<script>` block without escaping `</script>` sequences. Since the only input is your own AI response (not attacker-controlled), this is a theoretical self-XSS at most — not worth blocking deployment on, but easy to harden later by escaping `</script>` in the JSON before insertion.

**Already good:** `progress.json` (your personal study data) is gitignored and never leaves your machine — nothing about deployment changes that. The large course-material folders are also gitignored, so a normal `git push` won't accidentally publish them.

## 5. Hosting recommendation — simplest first

### Recommended: GitHub Pages (free, ~2 minutes, zero new accounts)
Since the code is already in a GitHub repo:
1. Add `index.html` (copy of the HTML file) to the repo root, commit, push.
2. On GitHub: repo → Settings → Pages → Source: "Deploy from a branch" → branch `main`, folder `/root` → Save.
3. Site is live at `https://rafimichaeli.github.io/nursing-study-tracker/` within a minute or two.
4. Every future `git push` auto-updates the live site. No servers, no billing, no config files.

### Alternative: Cloudflare Pages (free, if you want a custom domain or faster global CDN)
Connect the same GitHub repo at pages.cloudflare.com, set build output to root, deploy. Free tier has no bandwidth cap (GitHub Pages has a soft ~100 GB/month limit, irrelevant here but worth knowing) and makes attaching a custom domain trivial.

### If you specifically want AWS: S3 static website hosting
More setup for no real benefit here, but if desired: create an S3 bucket, enable "Static website hosting," upload `index.html` with public-read, optionally front it with CloudFront + ACM for HTTPS and a custom domain. This is the "AWS free tier" path — free for 12 months on standard usage, then pennies/month after — but it's three services to configure (S3 + CloudFront + ACM) versus one click on GitHub Pages, for a file that GitHub is already hosting your source code for. Only worth it if you want this specifically under an AWS account for other reasons.

**Bottom line:** given the repo already exists on GitHub and the app is one static file with zero backend, GitHub Pages is the least amount of server work possible — flip one setting, done.
