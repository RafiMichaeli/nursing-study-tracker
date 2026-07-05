# 🏥 מעקב סיעוד המבוגר

דשבורד לימוד אינטראקטיבי לקורס סיעוד המבוגר — אייכילוב שיינברון, תשפ"ו.

> **התחלה מהירה:** [rafimichaeli.github.io/nursing-study-tracker](https://rafimichaeli.github.io/nursing-study-tracker/) — עובד גם מהטלפון. לחלופין, פתח את `index.html` מקומית. אין צורך בהתקנה.

---

## הוראות שימוש

### פתיחת הדשבורד

היכנס ל-[rafimichaeli.github.io/nursing-study-tracker](https://rafimichaeli.github.io/nursing-study-tracker/) מכל מכשיר, או פתח את `index.html` ישירות בדפדפן (Chrome, Safari, Firefox). אין צורך בהתקנה או שרת.

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

---

### שמירה וטעינה

> ההתקדמות נשמרת אוטומטית ב-localStorage של הדפדפן, אך מומלץ לשמור גיבוי חיצוני.

**שמירה ידנית**
לחץ **"שמור התקדמות"** בסרגל השמאלי. בפעם הראשונה תתבקש לבחור מיקום לקובץ `progress.json`. בפעמים הבאות הקובץ יישמר באותו מיקום אוטומטית.

**שמירה אוטומטית**
לאחר שמירה ידנית ראשונה, המערכת שומרת אוטומטית כל 5 דקות. ה-chip בסרגל השמאלי יהפוך לירוק ויציג את שעת השמירה האחרונה.

**טעינה**
לחץ **"טען התקדמות"** לטעינת קובץ `progress.json` שנשמר קודם — שימושי בעת מעבר למחשב אחר או לאחר ניקוי הדפדפן. הקובץ נבדק לפני הטעינה — קובץ לא תקין נדחה בלי לגעת בהתקדמות הקיימת.

---

### שיתוף עם חברים לקורס

אפשר פשוט לשלוח את הקישור — כל משתמש מקבל מעקב עצמאי משלו: ההתקדמות נשמרת בדפדפן של כל אחד ואינה משותפת או גלויה לאחרים. שימו לב שההתקדמות היא **לכל דפדפן בנפרד** — מעבר בין טלפון למחשב דורש העברת `progress.json` (שמור/טען). קישורי ההקלטות (🎬) דורשים התחברות למערכת הקורס.

---

### מעקב לו"ז

תוסף אופציונלי — כבוי כברירת מחדל — שמוסיף תזמון וציוני דרך על גבי המעקב הקיים.

- כפתור **"מעקב לו"ז"** בתחתית הסרגל השמאלי (בין רשימת הנושאים לכפתורי שמור/טען/אפס) פותח פאנל הגדרות: הפעלה/כיבוי, תאריך התחלה לכל חלק (א׳/ב׳), **תאריכי המבחנים** של שני החלקים, וקצב לימוד יומי בשעות — בנפרד למעבר הלמידה ולמעבר הריענון.
- כשהמעקב פעיל, כל נושא מקבל **צ'יפ סטטוס**: 🟢 מקדים / 🔵 בלו"ז / 🔴 מאחר — לפי השוואה בין מה שתוכנן לתאריך הזה לבין מה שסומן בפועל.
- בפאנל המורחב של כל נושא מופיעה שורת **"סיימתי ריענון"** — סימון נפרד למעבר חזרה שני, עם תאריך וצ'יפ סטטוס משלה.
- מעל הטבלה מופיע **כרטיס דשבורד** שמסכם, לכל חלק: 🎓 תאריך המבחן וספירה לאחור, סעיפים/נושאים שהושלמו מול הצפי היומי, תחזית תאריך סיום לפי הקצב בפועל (חלון נע של 14 יום), והאם הקצב הנוכחי משאיר מספיק ימי ריענון לפני המבחן.
- תאריכי המבחנים מגיעים כברירת מחדל מנתוני הקורס (`data.js`) וניתנים לשינוי או ניקוי בפאנל ההגדרות.
- כיבוי הפיצ'ר רק מסתיר את התצוגה — כל תאריך שכבר נרשם נשמר, ויחזור להופיע בהדלקה חוזרת. הנתונים חיים בתוך אותו `progress.json` הקיים, ולא דורשים גיבוי נפרד.

---

### שינוי מראה

לחץ על **☀️ / 🌙** בפינה הימנית העליונה לעבור בין מצב כהה ובהיר.

---

## English

Interactive study tracker for the Adult Nursing course — Ichilov Sheinbrunn, 2025–2026.

> **Quick start:** [rafimichaeli.github.io/nursing-study-tracker](https://rafimichaeli.github.io/nursing-study-tracker/) — works on mobile too. Or open `index.html` locally in any browser. No server needed.

### Features

- **Topic tracking** — check off sub-topics and Brunner reading for each of 18 chapters; a topic counts as done only when all sub-items *and* the Brunner reading are checked
- **Search** — jump-to search box in the topbar; matches topics and sub-items, highlights hits, click a result to jump straight to it (collapses to an icon on mobile)
- **Progress charts** — per-part pie charts, rebuilt only when their data actually changes
- **Smart filtering** — by part (א/ב), category, or incomplete topics only (desktop sidebar button or mobile bottom nav)
- **Expand/collapse all** — open or close every topic's detail panel at once; open panels survive re-renders
- **Study material links** — direct links to lecture slides and Brunner chapters on Google Drive
- **AI exam generator** — one-click prompt copy for Claude / ChatGPT to generate 20 MCQs
- **Reset** — wipe all saved progress in the browser (irreversible)
- **Built-in help guide** — in-app instructions modal, no need to leave the page
- **Auto-save** — saves progress to a local `progress.json` every 5 minutes; loaded files are validated before replacing existing progress
- **Dark / light theme** — persisted via localStorage
- **Mobile-ready** — bottom nav, fully responsive layout; topic rows are keyboard-accessible (Tab + Enter/Space)
- **Progress schedule (optional)** — start date, daily study pace, and **exam dates** per part: per-topic ahead/on-track/behind chips, a separate review-pass checkbox, and a dashboard with exam countdown, projected finish date from your actual 14-day pace, and whether that leaves enough review days before the exam

### How to Use

Open the [live site](https://rafimichaeli.github.io/nursing-study-tracker/), or `index.html` directly in Chrome, Safari, or Firefox. Click any topic row to expand a panel with study items, Google Drive material links, and an AI exam prompt button. Use **"שמור התקדמות"** to save progress to a local `progress.json`; auto-save kicks in every 5 minutes after the first manual save. Note: auto-save-to-file only works in Chrome/Edge (File System Access API) — Safari/Firefox fall back to a manual download each time, though in-browser progress (localStorage) is always saved automatically regardless of browser. On mobile, the sidebar becomes a slide-out drawer (☰) plus a bottom nav for quick part/status filtering.

### Progress schedule

An optional layer on top of the existing tracker, off by default. Click the **"מעקב לו"ז"** button in the sidebar footer (between the topic list and the save/load buttons) to set a start date (per part, א/ב), the exam date for each part, and a daily study-hour pace — separately for the first pass and the review pass. Once enabled: every topic gets a status chip (🟢 ahead / 🔵 on-track / 🔴 behind) comparing what was planned for today against what you've actually checked off; each topic's expanded panel gets a separate "review pass done" checkbox with its own status; and a summary card above the table shows, per part, the exam countdown, aggregate progress vs. today's expectation, a projected finish date based on your actual pace over the last 14 days, and a verdict on whether that pace leaves enough review days before the exam. Exam dates default from the course data (`data.js`) and can be edited or cleared in the settings panel. Turning the feature off only hides the display — every date already recorded stays saved (inside the same `progress.json`) and reappears if you turn it back on.

### Course structure

| Part | Track | Hours |
|------|-------|-------|
| א | Internal medicine (פנימי) | 176 academic hours |
| ב | Surgical (כירורגי) | 160 academic hours |
| **Total** | | **336 hours · 24 credits** |

18 topics across 12 categories: Surgery & Shock · Respiratory · Cardiology · Gastroenterology · Endocrinology · Urology · Immune & Rheumatology · Skin & Burns · Eyes & ENT · Neurology · Musculoskeletal · Oncology & Hematology

### Tech stack

- Static HTML/CSS/JS — zero build step, no runtime dependencies to install
- Code layout: `index.html` (markup) · `styles.css` · `data.js` (course topics + exam dates) · `links.js` (study-material links) · `app.js` (logic) · `schedule.js`/`schedule.css` (optional schedule feature, attached via explicit hooks)
- [Chart.js 4.4.1](https://www.chartjs.org/) · [Material Icons](https://fonts.google.com/icons) · [Heebo](https://fonts.google.com/specimen/Heebo)
- File System Access API — local `progress.json` save/load (validated on load)
- IndexedDB — persists the file handle between sessions for auto-save
- Tests: jsdom smoke suite (`npm test`) driving the real UI through DOM clicks, run in CI (GitHub Actions) on every push along with syntax checks

---

Ichilov-Sheinbrunn · תשפ"ו
