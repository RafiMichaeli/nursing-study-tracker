# 🏥 מעקב סיעוד המבוגר

דשבורד לימוד אינטראקטיבי לקורס סיעוד המבוגר — אייכילוב שיינברון, תשפ"ו.

> **התחלה מהירה:** פתח את `מעקב_סיעוד_המבוגר.html` בדפדפן. אין צורך בהתקנה.

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

---

## English

Interactive study tracker for the Adult Nursing course — Ichilov Sheinbrunn, 2025–2026.

> **Quick start:** open `מעקב_סיעוד_המבוגר.html` in any browser. No server needed.

### Features

- **Topic tracking** — check off sub-topics and Brunner reading for each of 18 chapters
- **Progress charts** — bar charts per part + overall donut chart
- **Smart filtering** — by part (א/ב), category, or incomplete topics only
- **Study material links** — direct links to lecture slides and Brunner chapters on Google Drive
- **AI exam generator** — one-click prompt copy for Claude / ChatGPT to generate 20 MCQs
- **Auto-save** — saves progress to a local `progress.json` every 5 minutes
- **Dark / light theme** — persisted via localStorage
- **Mobile-ready** — bottom nav, fully responsive layout

### How to Use

Open `מעקב_סיעוד_המבוגר.html` directly in Chrome, Safari, or Firefox. Click any topic row to expand a panel with study items, Google Drive material links, and an AI exam prompt button. Use **"שמור התקדמות"** to save progress to a local `progress.json`; auto-save kicks in every 5 minutes after the first manual save.

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
