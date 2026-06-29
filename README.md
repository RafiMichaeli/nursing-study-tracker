# 🏥 מעקב סיעוד המבוגר

Interactive study tracker for the Adult Nursing course — Ichilov Sheinbrunn, 2025–2026.

> **Quick start:** open `מעקב_סיעוד_המבוגר.html` in any browser. No server needed.

---

## Features

- **Topic tracking** — check off sub-topics and Brunner reading for each of 18 chapters
- **Progress charts** — bar charts per part + overall donut chart
- **Smart filtering** — by part (א/ב), category, or incomplete topics only
- **Study material links** — direct links to lecture slides and Brunner chapters on Google Drive
- **AI exam generator** — one-click prompt copy for Claude / ChatGPT to generate 20 MCQs
- **Auto-save** — saves progress to a local `progress.json` every 5 minutes
- **Dark / light theme** — persisted via localStorage
- **Mobile-ready** — bottom nav, fully responsive layout

---

## How to Use

### Opening the dashboard

Open `מעקב_סיעוד_המבוגר.html` directly in Chrome, Safari, or Firefox. No installation or server required.

---

### Interface overview

**Left sidebar**
- Shows overall progress percentage, broken down by Part א and Part ב.
- Clicking **"חלק א'"** or **"חלק ב'"** filters the table to that part only; click again to clear.
- Quick-links jump to each category (Surgery, Cardiology, Respiratory, etc.).
- The auto-save status chip shows whether auto-save is active and when the last save occurred.

**Top bar**
- Shows a Brunner page counter (pages completed / total) and an overall progress bar.

**Topic table**
- Each row is one study topic with its category, page count, estimated hours, status, and progress %.
- Status is calculated automatically:

| Status | Condition |
|--------|-----------|
| Not Started | No sub-topics checked |
| In Progress | At least one sub-topic checked |
| Done | All sub-topics + Brunner reading completed |

---

### Working with a topic

Click any row to expand a panel with three columns:

**1 — Study items**
Check off each sub-topic as you complete it. At the bottom, mark **"קראתי ברונר"** after reading the Brunner chapters for that topic.

**2 — Study materials**
Direct links to lecture slides and Brunner PDF chapters on Google Drive. Lecture recordings (🎬) are linked where available.

**3 — Exams**
- **"העתק פרומפט ליצירת מבחן במערכת AI"** — copies a ready-made prompt to your clipboard. Paste it into Claude, ChatGPT, or any other AI to get 20 Hebrew multiple-choice questions with explanations at nursing-level difficulty.
- Links to existing practice exams for the topic (where available).

---

### Saving and loading progress

> Progress is saved automatically in the browser's localStorage, but an external backup is recommended.

**Manual save**
Click **"שמור התקדמות"** in the left sidebar. The first time, you'll be asked to choose a location for `progress.json`. Subsequent saves go to the same file automatically.

**Auto-save**
After the first manual save, the dashboard saves automatically every 5 minutes. The sidebar chip turns green and shows the last save time when auto-save is active.

**Load**
Click **"טען התקדמות"** to load a previously saved `progress.json` — useful when switching computers or after clearing browser storage.

---

### Theme

Click **☀️ / 🌙** (top-right corner) to toggle between dark and light mode.

---

## Course structure

| Part | Track | Hours |
|------|-------|-------|
| א | Internal medicine (פנימי) | 176 academic hours |
| ב | Surgical (כירורגי) | 160 academic hours |
| **Total** | | **336 hours · 24 credits** |

18 topics across 12 categories: Surgery & Shock · Respiratory · Cardiology · Gastroenterology · Endocrinology · Urology · Immune & Rheumatology · Skin & Burns · Eyes & ENT · Neurology · Musculoskeletal · Oncology & Hematology

---

## Tech stack

- Single-file HTML/CSS/JS — zero build step, zero dependencies to install
- [Chart.js 4.4.1](https://www.chartjs.org/) — charts
- [Material Icons](https://fonts.google.com/icons) — icons
- [Heebo](https://fonts.google.com/specimen/Heebo) — Hebrew font
- File System Access API — local `progress.json` save/load
- IndexedDB — persists the file handle between sessions for auto-save

---

Ichilov-Sheinbrunn · תשפ"ו

---

## הוראות שימוש

### פתיחת הדשבורד

פתח את `מעקב_סיעוד_המבוגר.html` ישירות בדפדפן (Chrome, Safari, Firefox). אין צורך בהתקנה או שרת.

---

### התמצאות בממשק

**סרגל ניווט שמאלי (Sidebar)**
- מציג את אחוז ההתקדמות הכולל, ופירוט לפי חלק א׳ וחלק ב׳.
- לחיצה על **"חלק א׳"** או **"חלק ב׳"** מסננת את הטבלה לנושאים של אותו חלק בלבד. לחיצה שנייה מבטלת את הסינון.
- קישורים מהירים לקפיצה לכל קטגוריה (כירורגיה, קרדיולוגיה, נשימה וכו׳).
- ציון מצב שמירה אוטומטית (chip ירוק = פעיל, כולל שעת שמירה אחרונה).

**סרגל עליון (Topbar)**
- מונה עמודי ברונר שהושלמו מתוך הסך הכולל.
- פס התקדמות כולל באחוזים.

**טבלת הנושאים**
- כל שורה = נושא לימוד עם קטגוריה, מספר עמודים, שעות, סטטוס ואחוז התקדמות.
- הסטטוס מחושב אוטומטית:

| סטטוס | תנאי |
|-------|-------|
| Not Started | אף סעיף לא סומן |
| In Progress | לפחות סעיף אחד סומן |
| Done | כל הסעיפים + קריאת ברונר הושלמו |

---

### עבודה עם נושא

לחיצה על שורת נושא פותחת פאנל מורחב עם שלוש עמודות:

**1 — סעיפי לימוד**
סמן V ליד כל סעיף שסיימת ללמוד. בתחתית — **"קראתי ברונר"**: סמן לאחר קריאת פרקי הברונר לנושא זה.

**2 — חומר לימוד**
קישורים ישירים לשקפי ההרצאות ולפרקי הברונר ב-Google Drive. קישורים להקלטות (🎬) כאשר קיימים.

**3 — בחינות**
- **"העתק פרומפט ליצירת מבחן במערכת AI"** — מעתיק לקליפבורד פרומפט מוכן. הדבק אותו ב-Claude, ChatGPT וכו׳ לקבלת 20 שאלות אמריקאיות בעברית עם הסברים, ברמת סיעוד.
- קישורים למבחנים קיימים לנושא (אם קיימים).

---

### שמירה וטעינה

> ההתקדמות נשמרת אוטומטית ב-localStorage של הדפדפן, אך מומלץ לשמור גיבוי חיצוני.

**שמירה ידנית**
לחץ **"שמור התקדמות"** בסרגל השמאלי. בפעם הראשונה תתבקש לבחור מיקום לקובץ `progress.json`. בפעמים הבאות הקובץ יישמר באותו מיקום אוטומטית.

**שמירה אוטומטית**
לאחר שמירה ידנית ראשונה, המערכת שומרת אוטומטית כל 5 דקות. ה-chip בסרגל השמאלי יהפוך לירוק ויציג את שעת השמירה האחרונה.

**טעינה**
לחץ **"טען התקדמות"** לטעינת קובץ `progress.json` שנשמר קודם — שימושי בעת מעבר למחשב אחר או לאחר ניקוי הדפדפן.

---

### שינוי מראה

לחץ על **☀️ / 🌙** בפינה הימנית העליונה לעבור בין מצב כהה ובהיר.
