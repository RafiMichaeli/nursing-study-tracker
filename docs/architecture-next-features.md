# Architecture — Next Features

Design for three features + test-strategy upgrade. Status: proposed, not yet implemented.
Constraint honored throughout: static site, no build step, no new runtime dependencies.

---

## 1. Data-driven review forecast

**Problem.** The dashboard's exam verdict compares the projected *learning* finish against
`reviewDaysPlanned` — a constant derived from the pace you *configured*, not the pace you
actually review at. Once real review passes exist, the verdict should use measured data.

**Data already available.** `state._schedule.review[topicId] = { done, date }` — stamped by
the "סיימתי ריענון" checkbox. No schema change needed.

**Design.** In `computePartDashboard` (schedule.js):

- Measure review pace in **review-hours/day** (topic granularity is too coarse — only 18
  topics — but hours-weighting matches how the plans are already built):
  `measuredReviewRate = Σ(t.hours × reviewHoursFactor for topics reviewed in the last 14 days) / effectiveWindowDays`
  using the same exclusive-cutoff window as the learning pace.
- `remainingReviewHours = Σ(t.hours × reviewHoursFactor for unreviewed topics)`
- `projectedReviewDays = remainingReviewHours / measuredReviewRate`
- **Fallback:** zero review marks in the window → keep today's behavior (planned pace).
  The dashboard labels which mode it's in: "לפי קצב ריענון מדוד" vs "לפי התכנון".
- Exam verdict becomes: `projectedLearnFinish + projectedReviewDays ≤ examDate`?
  (Additive model; slightly pessimistic when learning/review interleave — acceptable, and
  pessimism is the right bias for an exam countdown.)

**Touched:** schedule.js only (+tests). ~40 lines.

---

## 2. Exam-score tracking

**Problem.** AI-generated quiz results evaporate; no way to see weak topics.

**Data model.** Per-topic, inside the existing progress state (same progress.json, no
migration needed — `isValidProgressData` already tolerates extra keys):

```js
state[topicId].quizzes = [ { score: 85, date: "2026-07-10" }, ... ]  // append-only history
```

**UI.**
- Column 3 (בחינות) of the expanded panel: under the copy-prompt button, a score entry —
  number input (0–100) + "שמור ציון" button (delegated `data-action="save-quiz-score"`),
  plus last score + attempt count ("ציון אחרון: 85 · ניסיון 3").
- Topic row: small score badge next to the status badge, color-coded:
  🟢 ≥ 85 · 🟡 60–84 · 🔴 < 60 (last score).
- Sidebar: "לחזור על" filter button (next to "לא-גמורים בלבד") — topics whose last score
  < 70 **or** marked done more than 21 days ago with no review pass. This is the study-triage
  view for the final week.

**Rules.** Scores never affect `done` (learning completion ≠ exam readiness — separate
signals, deliberately). Validation: clamp 0–100, reject non-numeric.

**Touched:** app.js (state, render, delegation, filter), styles.css (badge colors),
index.html (filter button), tests. ~120 lines.

---

## 3. PWA (installable + offline)

**Goal.** "Add to Home Screen" on the phone; open with no network (e.g., studying on a train).

**Components.**
- `manifest.webmanifest` — name/short_name (מעקב סיעוד המבוגר), `dir: rtl`, `lang: he`,
  theme/background colors matching the dark theme, `display: standalone`, icons.
- **Icons:** 192px + 512px PNG (generated, simple: rounded blue square + white medical
  cross — emoji fonts can't be relied on for icon rendering), `purpose: any maskable`,
  plus `apple-touch-icon` link for iOS.
- `sw.js` — service worker, **network-first with cache fallback** for all same-origin
  requests, runtime-cache for CDN assets (fonts, Chart.js):
  - Online → always fresh (no stale-deploy bugs, no cache-version bookkeeping on deploys).
  - Offline → last-seen version of everything, including CDN assets (opaque responses).
  - Cache name versioned once; activate handler purges old caches.
- Registration in app.js startup, guarded: `'serviceWorker' in navigator && location.protocol === 'https:'`
  (skips file:// usage, which keeps the open-locally workflow untouched).

**Trade-off noted:** network-first means no instant-load-from-cache benefit; for a ~150KB
site this is negligible, and it eliminates the classic "users stuck on old version" failure.

**Touched:** new manifest + sw.js + 2 icons, small additions to index.html `<head>` and
app.js startup. GitHub Pages serves everything as-is. Verify with Lighthouse PWA audit.

---

## Test strategy (current state → recommended)

**Have today:** `node --check` on all JS + jsdom smoke suite (36 assertions, real DOM
clicks) in CI on every push. That's already better than most hobby projects.

**Recommended additions, in order of value:**

1. **ESLint (flat config, `no-undef` + `no-unused-vars`)** — cheapest, highest-value gap.
   The wizard bug this project had (`closeCourseWizard()` referenced but never defined)
   is exactly the class ESLint catches statically. Config lists the cross-file globals
   (TOPICS, COURSE_LINKS, renderAll…) once. CI step: `npx eslint .`.
2. **Migrate tests to `node:test`** — Node's built-in runner (no new deps): structured
   output, `--test-name-pattern`, per-test isolation, TAP output in CI. Mechanical change
   to the existing suite.
3. **Fake clock for schedule tests** — schedule logic depends on `todayStr()`; make it
   injectable (`Schedule._setNow(dateStr)` test hook). Unlocks deterministic tests for:
   pace-window edges, behind/ahead chips, exam countdown at boundary dates (day before,
   exam day, after). Today those paths are only partially testable.
4. **One Playwright happy-path test** — real Chromium: load page, click a checkbox, toggle
   theme, reload, assert persistence. Catches what jsdom can't: CSS loading failures,
   real localStorage behavior, layout exceptions. Keep to 1–2 tests (CI cost ~1 min).
5. **After PWA lands: Lighthouse CI** — asserts installability + offline don't regress.

**Explicitly not recommended** (cost > value at this scale): visual-regression snapshots,
unit-test coverage targets, cross-browser matrices, mutation testing.

**Target shape:** lint (static) → node:test unit tests for pure logic (plans, pace windows,
done-rules, search) → jsdom integration suite (exists) → 1 Playwright E2E → Lighthouse.

---

## Suggested implementation order

1. Feature 2 (exam scores) — biggest daily-use value before Aug 2, self-contained in app.js.
2. Feature 1 (review forecast) — becomes meaningful once review passes start (~2 weeks out).
3. Test items 1–3 (lint, node:test, fake clock) — alongside features 1–2.
4. Feature 3 (PWA) + Lighthouse — anytime; independent of the rest.
