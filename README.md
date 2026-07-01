# 🏥 מעקב סיעוד המבוגר

דשבורד לימוד אינטראקטיבי לקורס סיעוד המבוגר — אייכילוב שיינברון, תשפ"ו.

> **התחלה מהירה:** [rafimichaeli.github.io/nursing-study-tracker](https://rafimichaeli.github.io/nursing-study-tracker/) — עובד גם מהטלפון. לחלופין, פתח את `מעקב_סיעוד_המבוגר.html` מקומית. אין צורך בהתקנה.

---

## הוראות שימוש

### פתיחת הדשבורד

היכנס ל-[rafimichaeli.github.io/nursing-study-tracker](https://rafimichaeli.github.io/nursing-study-tracker/) מכל מכשיר, או פתח את `מעקב_סיעוד_המבוגר.html` ישירות בדפדפן (Chrome, Safari, Firefox). אין צורך בהתקנה או שרת.

---

### התמצאות בממשק

**סרגל ניווט שמאלי (Sidebar)**
- מציג את אחוז ההתקדמות הכולל, ופירוט לפי חלק א׳ וחלק ב׳.
- לחיצה על **"חלק א׳"** או **"חלק ב׳"** מסננת את הטבלה לנושאים של אותו חלק בלבד. לחיצה שנייה מבטלת את הסינון.
- קישורים מהירים לקפיצה לכל קטגוריה (כירורגיה, קרדיולוגיה, נשימה וכו׳).
- כפתור **"לא-גמורים בלבד"** מסנן את הטבלה לנושאים שטרם הושלמו.
- ציון מצב שמירה אוטומטית (chip ירוק = פעיל, כולל שעת שמירה אחרונה).
- בתחתית הסרגל: **שמור התקדמות**, **טען התקדמות**, **אפס הכל** (מוחק לצמיתות את כל הסימונים), ו-**הוראות שימוש** (פותח מדריך שימוש מובנה בתוך הדשבורד).

**סרגל עליון (Topbar)**
- מונה עמודי ברונר שהושלמו מתוך הסך הכולל.
- פס התקדמות כולל באחוזים.
- תיבת **חיפוש** (🔍) לחיפוש נושא או סעיף: הקלדה פותחת תפריט תוצאות עם הדגשת הטקסט התואם, ולחיצה על תוצאה קופצת ישירות לנושא. במובייל מוצג כסמל מכווץ שנפתח למסך מלא.

**מעל טבלת הנושאים**
- כפתורי **"פתח הכל"** / **"סגור הכל"** לפתיחה או סגירה של פאנלי הסעיפים בכל הנושאים בבת אחת.

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

---

## English

Interactive study tracker for the Adult Nursing course — Ichilov Sheinbrunn, 2025–2026.

> **Quick start:** [rafimichaeli.github.io/nursing-study-tracker](https://rafimichaeli.github.io/nursing-study-tracker/) — works on mobile too. Or open `מעקב_סיעוד_המבוגר.html` locally in any browser. No server needed.

### Features

- **Topic tracking** — check off sub-topics and Brunner reading for each of 18 chapters
- **Search** — jump-to search box in the topbar; matches topics and sub-items, highlights hits, click a result to jump straight to it (collapses to an icon on mobile)
- **Progress charts** — bar charts per part + overall donut chart
- **Smart filtering** — by part (א/ב), category, or incomplete topics only (desktop sidebar button or mobile bottom nav)
- **Expand/collapse all** — open or close every topic's detail panel at once
- **Study material links** — direct links to lecture slides and Brunner chapters on Google Drive
- **AI exam generator** — one-click prompt copy for Claude / ChatGPT to generate 20 MCQs
- **Reset** — wipe all saved progress in the browser (irreversible)
- **Built-in help guide** — in-app instructions modal, no need to leave the page
- **Auto-save** — saves progress to a local `progress.json` every 5 minutes
- **Dark / light theme** — persisted via localStorage
- **Mobile-ready** — bottom nav, fully responsive layout

### How to Use

Open the [live site](https://rafimichaeli.github.io/nursing-study-tracker/), or `מעקב_סיעוד_המבוגר.html` directly in Chrome, Safari, or Firefox. Click any topic row to expand a panel with study items, Google Drive material links, and an AI exam prompt button. Use **"שמור התקדמות"** to save progress to a local `progress.json`; auto-save kicks in every 5 minutes after the first manual save. Note: auto-save-to-file only works in Chrome/Edge (File System Access API) — Safari/Firefox fall back to a manual download each time, though in-browser progress (localStorage) is always saved automatically regardless of browser. On mobile, the sidebar becomes a slide-out drawer (☰) plus a bottom nav for quick part/status filtering.

### Course structure

| Part | Track | Hours |
|------|-------|-------|
| א | Internal medicine (פנימי) | 176 academic hours |
| ב | Surgical (כירורגי) | 160 academic hours |
| **Total** | | **336 hours · 24 credits** |

18 topics across 12 categories: Surgery & Shock · Respiratory · Cardiology · Gastroenterology · Endocrinology · Urology · Immune & Rheumatology · Skin & Burns · Eyes & ENT · Neurology · Musculoskeletal · Oncology & Hematology

### Tech stack

- Single-file HTML/CSS/JS — zero build step, zero dependencies to install
- [Chart.js 4.4.1](https://www.chartjs.org/) · [Material Icons](https://fonts.google.com/icons) · [Heebo](https://fonts.google.com/specimen/Heebo)
- File System Access API — local `progress.json` save/load
- IndexedDB — persists the file handle between sessions for auto-save

---

Ichilov-Sheinbrunn · תשפ"ו
