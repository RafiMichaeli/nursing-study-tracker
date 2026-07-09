/*
 * i18n.js — UI language support (עברית / English / Русский)
 * -------------------------------------------------------------
 * Loaded FIRST (in <head>) so `t()` is available to every other script
 * and so lang/dir are set before the body renders (no RTL→LTR flash).
 *
 * Scope: UI chrome only. Course content (topic names, sub-items,
 * categories, study-material links, the AI exam prompt) stays in Hebrew —
 * it mirrors the Hebrew syllabus and Brunner materials.
 *
 * How it works:
 *   - DICT holds one flat key→string map per language; t(key, params)
 *     resolves in the current language with {param} interpolation and
 *     falls back to Hebrew for any missing key.
 *   - Static HTML is tagged with data-i18n / data-i18n-html /
 *     data-i18n-tooltip / data-i18n-placeholder / data-i18n-title /
 *     data-i18n-aria attributes; applyStatic() walks them.
 *   - JS-rendered strings (app.js / schedule.js / analytics.js) call t()
 *     directly, so a renderAll() after switching refreshes everything.
 *   - The help overlay is Hebrew in index.html; en/ru bodies live here
 *     (helpHtml). The Hebrew original (incl. the section schedule.js
 *     injects) is captured once in init() and restored when going back.
 *   - Choice persists in localStorage; <html lang dir> follow the language
 *     (he = rtl, en/ru = ltr — the stylesheet uses logical properties).
 */
(function () {
  'use strict';

  const LS_LANG_KEY = 'mevak_lang';

  const LANGS = {
    he: { name: 'עברית',  dir: 'rtl', locale: 'he-IL' },
    en: { name: 'English', dir: 'ltr', locale: 'en-GB' },
    ru: { name: 'Русский', dir: 'ltr', locale: 'ru-RU' },
  };

  const DICT = {
  he: {
    'docTitle': 'סיעוד המבוגר — מעקב לימודים',
    'brand': 'סיעוד המבוגר',
    'brandSub': 'רפי מיכאלי · הסבה ט׳ · תשפ"ו',
    'overallProgress': 'התקדמות כוללת',
    'partA': 'חלק א׳',
    'partB': 'חלק ב׳',
    'chipTooltipA': 'לחץ לסינון נושאי חלק א׳ בלבד — לחץ שוב לביטול הסינון',
    'chipTooltipB': 'לחץ לסינון נושאי חלק ב׳ בלבד — לחץ שוב לביטול הסינון',
    'nav': 'ניווט',
    'allTopics': 'כל הנושאים',
    'autosave.chipTooltip': 'שמירה אוטומטית שומרת כל 5 דקות לאחר שמירה ידנית ראשונה',
    'autosave.active': 'שמירה אוטומטית פעילה',
    'autosave.inactive': 'שמירה אוטומטית לא פעילה',
    'autosave.lastSaved': 'נשמר לאחרונה · {time}',
    'autosave.every5': 'כל 5 דקות',
    'autosave.clickToStart': 'לחץ "שמור" להפעלה',
    'btn.incomplete': 'לא-גמורים בלבד',
    'btn.incompleteTooltip': 'הצג רק נושאים שטרם הושלמו',
    'btn.review': 'לחזור על',
    'btn.reviewTooltip': 'נושאים עם ציון מבחן נמוך מ-70, או שהושלמו לפני 21+ יום בלי ריענון',
    'btn.save': 'שמור התקדמות',
    'btn.saveTooltip': 'שמור התקדמות לקובץ JSON. לאחר שמירה ראשונה — שמירה אוטומטית כל 5 דקות',
    'btn.load': 'טען התקדמות',
    'btn.loadTooltip': 'טען קובץ התקדמות שנשמר קודם — שימושי בעת מעבר למחשב אחר',
    'btn.reset': 'אפס הכל',
    'btn.resetTooltip': '⚠ מחק את כל ההתקדמות לצמיתות — לא ניתן לשחזר',
    'btn.help': 'הוראות שימוש',
    'btn.helpTooltip': 'פתח מדריך שימוש',
    'search.placeholder': 'חיפוש נושא או סעיף...',
    'search.back': 'חזרה',
    'search.clear': 'נקה חיפוש',
    'search.tooltip': 'חיפוש',
    'search.noResults': 'אין תוצאות עבור "{q}"',
    'search.more': '+{n} סעיפים נוספים',
    'icon.searchBack': 'arrow_forward',
    'topbar.pagesTooltip': 'עמודי ברונר שהושלמו מתוך סך כל עמודי הקורס',
    'topbar.meta': '336 ש"א · תשפ"ו',
    'theme.toggle': 'החלף ערכת נושא',
    'lang.tooltip': 'שפת ממשק / Language / Язык',
    'pageTitleHtml': 'סיעוד המבוגר — <strong>מעקב התקדמות לימודים</strong>',
    'btn.expandAll': 'פתח הכל',
    'btn.expandAllTooltip': 'פתח את פאנל הסעיפים לכל הנושאים',
    'btn.collapseAll': 'סגור הכל',
    'btn.collapseAllTooltip': 'סגור את כל פאנלי הסעיפים',
    'stat.topics': 'נושאים',
    'stat.topicsDone': 'נושאים הושלמו',
    'stat.subs': 'סעיפים',
    'stat.subsReviewed': 'סעיפים שנסקרו',
    'stat.hoursDone': 'ש"א הושלמו',
    'stat.acadHours': 'שעות אקדמיות',
    'stat.hoursLeft': 'ש"א נותרות',
    'stat.untilEnd': 'עד סיום הסילבוס',
    'stat.quizAvg': 'ממוצע מבחנים',
    'stat.noScores': 'טרם נשמרו ציונים',
    'chart.titleA': 'התקדמות לימוד — חלק א׳',
    'chart.titleB': 'התקדמות לימוד — חלק ב׳',
    'chart.completed': 'הושלם',
    'table.title': 'נושאי לימוד',
    'table.showing': 'מציג: {label}',
    'table.count': '{n} נושאים',
    'th.topic': 'נושא',
    'th.category': 'קטגוריה',
    'th.hours': 'ש"א / עמ\'',
    'th.hoursTooltip': 'שעות אקדמיות ועמודי ברונר לנושא',
    'th.subs': 'סעיפים',
    'th.subsTooltip': 'מספר סעיפי הלימוד שסומנו כהושלמו',
    'th.status': 'סטטוס',
    'th.statusTooltip': 'טרם החל | בתהליך | הושלם (כל הסעיפים + ברונר)',
    'th.part': 'חלק',
    'footer.text': 'סיעוד המבוגר · הסבה ט׳ לסיעוד · אייכילוב-שיינברון · תשפ"ו · רפי מיכאלי',
    'footer.stats': '{dt}/{tt} נושאים · {ds}/{ts} סעיפים · {dh} ש"א הושלמו',
    'mob.all': 'הכל',
    'mob.remaining': 'נותר',
    'mob.appearance': 'מראה',
    'help.title': 'הוראות שימוש — מעקב סיעוד המבוגר',
    'unit.hours': 'ש"א',
    'unit.pages': 'עמ\'',
    'status.done': 'הושלם',
    'status.doneTooltip': 'כל הסעיפים וברונר הושלמו',
    'status.inprog': 'בתהליך',
    'status.inprogTooltip': 'חלק מהסעיפים הושלמו — המשך ללמוד',
    'status.notStarted': 'טרם החל',
    'status.notStartedTooltip': 'טרם התחלת ללמוד נושא זה',
    'quiz.lastTooltip': 'ציון המבחן האחרון ({date})',
    'topic.checkboxTooltip': 'סמן לסיום מהיר של הנושא כולו',
    'badge.hoursTooltip': 'שעות אקדמיות מוקצות לנושא',
    'badge.pagesTooltip': 'עמודי ברונר לנושא זה',
    'row.expandTooltip': 'פתח/סגור סעיפי הנושא',
    'sub.progress': '{done} / {total} סעיפים · {pct}%',
    'sub.progressTooltip': 'סעיפים שסימנת כהושלמו מתוך סך הסעיפים בנושא',
    'col.subs': '📋 סעיפי לימוד',
    'col.subsTooltip': 'רשימת הסעיפים לסימון — V ליד כל סעיף שלמדת',
    'col.materials': '📄 חומר לימוד',
    'col.materialsTooltip': 'קישורים לשקפי ההרצאות ולפרקי הברונר ב-Google Drive',
    'col.exams': '📝 בחינות',
    'col.examsTooltip': 'צור מבחן אמריקאי על הנושא בעזרת AI',
    'brunner.read': '📖 קראתי ברונר — {ref}',
    'brunner.tooltip': 'סמן לאחר קריאת פרקי הברונר — נדרש להשלמת הנושא',
    'exam.copyBtn': 'העתק פרומפט ליצירת מבחן במערכת AI',
    'exam.copyTooltip': 'מעתיק פרומפט מוכן — הדבק ב-Claude, ChatGPT וכו\' לקבלת 20 שאלות אמריקאיות בעברית',
    'exam.copied': 'הועתק!',
    'quiz.placeholder': 'ציון',
    'quiz.saveBtn': 'שמור ציון',
    'quiz.saveTooltip': 'שמור את ציון המבחן — נושאים עם ציון נמוך יופיעו בסינון \'לחזור על\'',
    'quiz.delete': 'מחק ציון זה',
    'quiz.avg': 'ממוצע',
    'quiz.one': 'מבחן',
    'quiz.few': 'מבחנים',
    'quiz.many': 'מבחנים',
    'quiz.invalid': 'ציון חייב להיות מספר בין 0 ל-100',
    'empty.none': 'אין נושאים להצגה',
    'empty.allDone': 'כל הנושאים הושלמו! 🎉',
    'empty.review': 'אין נושאים לחזרה — כל הציונים טובים והריענונים עדכניים 💪',
    'confirm.reset': 'לאפס את כל הסימונים?',
    'toast.autoSaved': 'נשמר אוטומטית · {time}',
    'toast.saved': 'נשמר בהצלחה · {time}',
    'btn.savedFlash': 'נשמר!',
    'err.save': 'שגיאה בשמירה: {msg}',
    'err.load': 'שגיאה בטעינה',
    'err.loadInvalid': 'שגיאה בטעינה — הקובץ שנבחר אינו קובץ התקדמות תקין. ההתקדמות הקיימת לא נגעה.',
    'err.copy': 'העתקה נכשלה — אנא העתק ידנית',
    // schedule.js
    'sched.btn': 'מעקב לו"ז',
    'sched.btnTooltip': 'הגדרות מעקב לו"ז — תאריך התחלה, קצב יומי וסטטוס לכל נושא',
    'sched.title': '📅 מעקב לו"ז',
    'sched.aria': 'הגדרות מעקב לו"ז',
    'sched.enable': 'הפעל מעקב לו"ז',
    'sched.start': 'תאריך התחלה',
    'sched.exam': '🎓 תאריך מבחן',
    'sched.optional': '(אופציונלי, אפשר למלא בהמשך)',
    'sched.pace1': 'קצב לימוד יומי — מעבר ראשון (שעות)',
    'sched.paceReview': 'קצב לימוד יומי — ריענון (שעות)',
    'sched.note': '💡 אם תכבה את המעקב — הצ\'יפים ייעלמו, אבל כל התאריכים שכבר נרשמו יישמרו, ויחזרו להופיע ברגע שתדליק שוב.',
    'sched.saveBtn': 'שמור',
    'sched.cancel': 'ביטול',
    'sched.ahead': 'מקדים',
    'sched.aheadTooltip': 'לפני הלו"ז שקבעת',
    'sched.ontrack': 'בלו"ז',
    'sched.ontrackTooltip': 'בקצב שתכננת',
    'sched.behind': 'מאחר',
    'sched.behindTooltip': 'מאחורי הלו"ז שקבעת',
    'sched.revAheadTooltip': 'ריענון לפני הזמן',
    'sched.revOnTimeTooltip': 'ריענון בזמן',
    'sched.revLateTooltip': 'ריענון מאחר',
    'sched.revOnTime': 'בזמן',
    'sched.reviewDone': '🔁 סיימתי ריענון',
    'sched.reviewDoneTooltip': 'סמן אחרי שעברת שוב על הנושא במעבר הריענון',
    'sched.examLine': '🎓 מבחן: {date} · {countdown}',
    'sched.inDays': 'בעוד {n} ימים',
    'sched.today': 'היום!',
    'sched.past': 'עבר',
    'sched.study': 'לימוד: {d}/{t} סעיפים (ציפייה להיום: {e})',
    'sched.reviewLine': 'ריענון: {d}/{t} נושאים (ציפייה להיום: {e})',
    'sched.pass1Done': 'מעבר הלימוד הושלם ✔️',
    'sched.noProgress': 'אין התקדמות ב-{n} הימים האחרונים — אין תחזית זמינה',
    'sched.noData': 'אין עדיין מספיק נתונים לתחזית',
    'sched.finishOnTime': 'לפי הקצב הנוכחי: סיום {date} (בדיוק בזמן)',
    'sched.finishEarly': 'לפי הקצב הנוכחי: סיום {date} ({n} ימים לפני המתוכנן)',
    'sched.finishLate': 'לפי הקצב הנוכחי: סיום {date} ({n} ימים אחרי המתוכנן)',
    'sched.verdictMiss': 'בקצב הנוכחי לא מסיימים לפני המבחן ({n} ימים חסרים)',
    'sched.verdictTight': 'נשארים רק {m} ימים לריענון (נדרש {src}: {need})',
    'sched.verdictOk': 'מספיק: {m} ימים לריענון (נדרש {src}: {need})',
    'sched.byMeasured': 'לפי קצב מדוד',
    'sched.byPlan': 'לפי התכנון',
    // analytics.js
    'anx.title': '📊 אנליטיקת לימוד',
    'anx.partAllDone': 'כל הסעיפים הושלמו ✔️',
    'anx.remainNoExam': 'נותרו {n} סעיפים · אין תאריך מבחן להשוואה',
    'anx.row': 'נותרו {r} סעיפים · {d} ימים למבחן ← נדרש <b>{req}</b>/יום',
    'anx.actualPart': ' · בפועל ({w} יום): <b>{act}</b>/יום',
    'anx.enough': 'בקצב מספיק',
    'anx.short': 'חסר {n}/יום',
    'anx.actualSeries': 'נותר בפועל',
    'anx.idealSeries': 'קו יעד (עד המבחן)',
    'anx.heatTitle': 'מפת עקביות (סעיפים ליום)',
    'anx.heatTooltip': 'סעיפים שהושלמו בכל יום — כהה יותר = יותר',
    'anx.cellTitle': '{date} · {n} סעיפים',
    'anx.empty': 'התחל לסמן סעיפים — הגרפים יופיעו כאן מעצמם.',
    // helpHtml: he uses the original captured from index.html (see init)
    'helpHtml': '',
  },

  en: {
    'docTitle': 'Adult Nursing — Study Tracker',
    'brand': 'Adult Nursing',
    'brandSub': 'Rafi Michaeli · Cohort 9 · 5786',
    'overallProgress': 'Overall progress',
    'partA': 'Part A',
    'partB': 'Part B',
    'chipTooltipA': 'Click to show only Part A topics — click again to clear',
    'chipTooltipB': 'Click to show only Part B topics — click again to clear',
    'nav': 'Navigation',
    'allTopics': 'All topics',
    'autosave.chipTooltip': 'Auto-save runs every 5 minutes after the first manual save',
    'autosave.active': 'Auto-save on',
    'autosave.inactive': 'Auto-save off',
    'autosave.lastSaved': 'Last saved · {time}',
    'autosave.every5': 'Every 5 minutes',
    'autosave.clickToStart': 'Click "Save" to enable',
    'btn.incomplete': 'Unfinished only',
    'btn.incompleteTooltip': 'Show only topics not yet completed',
    'btn.review': 'To review',
    'btn.reviewTooltip': 'Topics with a quiz score below 70, or completed 21+ days ago without a review pass',
    'btn.save': 'Save progress',
    'btn.saveTooltip': 'Save progress to a JSON file. After the first save — auto-save every 5 minutes',
    'btn.load': 'Load progress',
    'btn.loadTooltip': 'Load a previously saved progress file — useful when switching computers',
    'btn.reset': 'Reset all',
    'btn.resetTooltip': '⚠ Permanently delete all progress — cannot be undone',
    'btn.help': 'User guide',
    'btn.helpTooltip': 'Open the user guide',
    'search.placeholder': 'Search topic or item...',
    'search.back': 'Back',
    'search.clear': 'Clear search',
    'search.tooltip': 'Search',
    'search.noResults': 'No results for "{q}"',
    'search.more': '+{n} more items',
    'icon.searchBack': 'arrow_back',
    'topbar.pagesTooltip': 'Brunner pages completed out of all course pages',
    'topbar.meta': '336 academic hrs · 5786',
    'theme.toggle': 'Toggle theme',
    'lang.tooltip': 'שפת ממשק / Language / Язык',
    'pageTitleHtml': 'Adult Nursing — <strong>Study Progress Tracker</strong>',
    'btn.expandAll': 'Expand all',
    'btn.expandAllTooltip': 'Open the item panel of every topic',
    'btn.collapseAll': 'Collapse all',
    'btn.collapseAllTooltip': 'Close all item panels',
    'stat.topics': 'Topics',
    'stat.topicsDone': 'topics completed',
    'stat.subs': 'Items',
    'stat.subsReviewed': 'items covered',
    'stat.hoursDone': 'Hours done',
    'stat.acadHours': 'academic hours',
    'stat.hoursLeft': 'Hours left',
    'stat.untilEnd': 'until the syllabus is done',
    'stat.quizAvg': 'Quiz average',
    'stat.noScores': 'No scores saved yet',
    'chart.titleA': 'Study progress — Part A',
    'chart.titleB': 'Study progress — Part B',
    'chart.completed': 'done',
    'table.title': 'Study topics',
    'table.showing': 'Showing: {label}',
    'table.count': '{n} topics',
    'th.topic': 'Topic',
    'th.category': 'Category',
    'th.hours': 'Hrs / pp.',
    'th.hoursTooltip': 'Academic hours and Brunner pages for the topic',
    'th.subs': 'Items',
    'th.subsTooltip': 'Number of study items marked complete',
    'th.status': 'Status',
    'th.statusTooltip': 'Not started | In progress | Done (all items + Brunner)',
    'th.part': 'Part',
    'footer.text': 'Adult Nursing · Nursing Retraining Cohort 9 · Ichilov–Sheinbrun · 5786 · Rafi Michaeli',
    'footer.stats': '{dt}/{tt} topics · {ds}/{ts} items · {dh} hrs done',
    'mob.all': 'All',
    'mob.remaining': 'Left',
    'mob.appearance': 'Theme',
    'help.title': 'User Guide — Adult Nursing Tracker',
    'unit.hours': 'hrs',
    'unit.pages': 'pp.',
    'status.done': 'Done',
    'status.doneTooltip': 'All items and Brunner completed',
    'status.inprog': 'In progress',
    'status.inprogTooltip': 'Some items completed — keep going',
    'status.notStarted': 'Not started',
    'status.notStartedTooltip': "You haven't started this topic yet",
    'quiz.lastTooltip': 'Latest quiz score ({date})',
    'topic.checkboxTooltip': 'Check to quickly complete the whole topic',
    'badge.hoursTooltip': 'Academic hours allocated to the topic',
    'badge.pagesTooltip': 'Brunner pages for this topic',
    'row.expandTooltip': "Open/close the topic's items",
    'sub.progress': '{done} / {total} items · {pct}%',
    'sub.progressTooltip': "Items you've marked done out of all items in the topic",
    'col.subs': '📋 Study items',
    'col.subsTooltip': "Check off each item you've studied",
    'col.materials': '📄 Study materials',
    'col.materialsTooltip': 'Links to lecture slides and Brunner chapters on Google Drive',
    'col.exams': '📝 Quizzes',
    'col.examsTooltip': 'Generate an AI multiple-choice quiz for this topic',
    'brunner.read': '📖 Brunner read — {ref}',
    'brunner.tooltip': 'Check after reading the Brunner chapters — required to complete the topic',
    'exam.copyBtn': 'Copy AI quiz prompt',
    'exam.copyTooltip': 'Copies a ready-made prompt — paste into Claude, ChatGPT etc. for 20 multiple-choice questions in Hebrew',
    'exam.copied': 'Copied!',
    'quiz.placeholder': 'Score',
    'quiz.saveBtn': 'Save score',
    'quiz.saveTooltip': "Save the quiz score — low-scoring topics appear under 'To review'",
    'quiz.delete': 'Delete this score',
    'quiz.avg': 'Average',
    'quiz.one': 'quiz',
    'quiz.few': 'quizzes',
    'quiz.many': 'quizzes',
    'quiz.invalid': 'Score must be a number between 0 and 100',
    'empty.none': 'No topics to show',
    'empty.allDone': 'All topics completed! 🎉',
    'empty.review': 'Nothing to review — all scores are good and reviews are fresh 💪',
    'confirm.reset': 'Reset all checkmarks?',
    'toast.autoSaved': 'Auto-saved · {time}',
    'toast.saved': 'Saved · {time}',
    'btn.savedFlash': 'Saved!',
    'err.save': 'Save failed: {msg}',
    'err.load': 'Load failed',
    'err.loadInvalid': 'Load failed — the selected file is not a valid progress file. Existing progress was not touched.',
    'err.copy': 'Copy failed — please copy manually',
    'sched.btn': 'Schedule',
    'sched.btnTooltip': 'Schedule settings — start date, daily pace and per-topic status',
    'sched.title': '📅 Schedule',
    'sched.aria': 'Schedule settings',
    'sched.enable': 'Enable schedule tracking',
    'sched.start': 'Start date',
    'sched.exam': '🎓 Exam date',
    'sched.optional': '(optional, can be set later)',
    'sched.pace1': 'Daily study pace — first pass (hours)',
    'sched.paceReview': 'Daily study pace — review (hours)',
    'sched.note': '💡 Turning tracking off only hides the chips — every recorded date is kept and reappears when you turn it back on.',
    'sched.saveBtn': 'Save',
    'sched.cancel': 'Cancel',
    'sched.ahead': 'Ahead',
    'sched.aheadTooltip': 'Ahead of the schedule you set',
    'sched.ontrack': 'On track',
    'sched.ontrackTooltip': 'At your planned pace',
    'sched.behind': 'Behind',
    'sched.behindTooltip': 'Behind the schedule you set',
    'sched.revAheadTooltip': 'Review ahead of time',
    'sched.revOnTimeTooltip': 'Review on time',
    'sched.revLateTooltip': 'Review late',
    'sched.revOnTime': 'On time',
    'sched.reviewDone': '🔁 Review done',
    'sched.reviewDoneTooltip': 'Check after going over the topic again in the review pass',
    'sched.examLine': '🎓 Exam: {date} · {countdown}',
    'sched.inDays': 'in {n} days',
    'sched.today': 'today!',
    'sched.past': 'passed',
    'sched.study': 'Study: {d}/{t} items (expected by today: {e})',
    'sched.reviewLine': 'Review: {d}/{t} topics (expected by today: {e})',
    'sched.pass1Done': 'Study pass completed ✔️',
    'sched.noProgress': 'No progress in the last {n} days — no forecast available',
    'sched.noData': 'Not enough data for a forecast yet',
    'sched.finishOnTime': 'At the current pace: finish {date} (right on time)',
    'sched.finishEarly': 'At the current pace: finish {date} ({n} days early)',
    'sched.finishLate': 'At the current pace: finish {date} ({n} days late)',
    'sched.verdictMiss': "At this pace you won't finish before the exam ({n} days short)",
    'sched.verdictTight': 'Only {m} days left for review (needed {src}: {need})',
    'sched.verdictOk': 'Enough: {m} days for review (needed {src}: {need})',
    'sched.byMeasured': 'by measured pace',
    'sched.byPlan': 'by plan',
    'anx.title': '📊 Study analytics',
    'anx.partAllDone': 'all items completed ✔️',
    'anx.remainNoExam': '{n} items left · no exam date to compare against',
    'anx.row': '{r} items left · {d} days to exam ← required <b>{req}</b>/day',
    'anx.actualPart': ' · actual (last {w} days): <b>{act}</b>/day',
    'anx.enough': 'pace sufficient',
    'anx.short': 'short {n}/day',
    'anx.actualSeries': 'Actual remaining',
    'anx.idealSeries': 'Target line (to exam)',
    'anx.heatTitle': 'Consistency map (items per day)',
    'anx.heatTooltip': 'Items completed each day — darker = more',
    'anx.cellTitle': '{date} · {n} items',
    'anx.empty': 'Start checking items — the charts will appear here on their own.',
    'helpHtml': `
      <h2>What is this?</h2>
      <p>A personal study dashboard for the Adult Nursing course. It tracks your progress across 18 study topics, organized into Part A and Part B. Course content (topic names, items, study links) is shown in Hebrew, matching the syllabus and the Brunner textbook.</p>
      <h2>How to open</h2>
      <ul>
        <li>From any device, including your phone: <code>rafimichaeli.github.io/nursing-study-tracker</code></li>
        <li>Locally: open the file directly in a browser — no installation needed.</li>
      </ul>
      <h2>Finding your way around</h2>
      <h3><span class="material-icons">menu</span> Sidebar — wide screens</h3>
      <ul>
        <li>Shows the <strong>overall progress percentage</strong> and a breakdown for Part A and Part B.</li>
        <li>Clicking <strong>"Part A"</strong> or <strong>"Part B"</strong> filters the table. Clicking again clears it.</li>
        <li>Quick links to categories: surgery, cardiology, respiratory, etc.</li>
        <li>The <strong>"Unfinished only"</strong> button filters the table to topics not yet completed.</li>
        <li>The <strong>"To review"</strong> button filters to weak topics: last quiz score below 70, or completed 21+ days ago without a review pass.</li>
        <li>At the bottom of the sidebar: Save / Load / Reset all / User guide.</li>
      </ul>
      <h3><span class="material-icons">smartphone</span> Mobile navigation</h3>
      <ul>
        <li>The ☰ icon opens the full sidebar as a slide-out menu, including the save buttons and this guide at its bottom.</li>
        <li>A fixed bottom bar with 5 buttons: All, Part A, Part B, Left, and Theme — for quick access.</li>
      </ul>
      <h3><span class="material-icons">view_headline</span> Top bar</h3>
      <ul>
        <li><strong>Page counter</strong>: how many Brunner pages are done out of the total.</li>
        <li><strong>Overall progress</strong> percentage with a progress bar.</li>
        <li><strong>Search</strong> (🔍): see "Searching topics and items" below.</li>
      </ul>
      <h3><span class="material-icons">unfold_more</span> Quick expand/collapse</h3>
      <p>Above the table: <strong>"Expand all"</strong> and <strong>"Collapse all"</strong> open or close every topic's item panel at once.</p>
      <h2>Searching topics and items</h2>
      <ul>
        <li>Type a topic or item name in the top-bar search box — a results menu opens with the matching text highlighted.</li>
        <li>Clicking a result jumps straight to the topic (and opens its item panel if a specific item was picked).</li>
        <li>The ✕ button clears the search; Escape closes the results menu.</li>
        <li>On mobile the search is a collapsed icon; tapping it opens a full-width search box.</li>
      </ul>
      <h2>The topics table</h2>
      <p>Each row is a study topic showing: name, category, Brunner pages, hours, status and progress.</p>
      <table class="help-table">
        <tr><th>Status</th><th>Condition</th></tr>
        <tr><td>Not Started</td><td>No item checked</td></tr>
        <tr><td>In Progress</td><td>At least one item checked</td></tr>
        <tr><td>Done</td><td>All items + Brunner reading completed</td></tr>
      </table>
      <h2>Working with a topic</h2>
      <p>Clicking a row opens an expanded panel with three columns:</p>
      <h3><span class="material-icons">checklist</span> 1 — Study items</h3>
      <p>Check each item you've finished. At the bottom — <strong>"Brunner read"</strong>: check after reading the chapters.</p>
      <h3><span class="material-icons">menu_book</span> 2 — Study materials</h3>
      <p>Direct links to the lecture slides and Brunner chapters on Google Drive. Recording links (🎬) where available.</p>
      <h3><span class="material-icons">quiz</span> 3 — Quizzes</h3>
      <p><strong>"Copy AI quiz prompt"</strong> — copies a ready prompt to the clipboard. Paste into Claude / ChatGPT to get 20 multiple-choice questions in Hebrew with explanations.</p>
      <div class="help-step"><div class="help-step-num">1</div><span>Click a topic to open its panel</span></div>
      <div class="help-step"><div class="help-step-num">2</div><span>Click "Copy AI quiz prompt"</span></div>
      <div class="help-step"><div class="help-step-num">3</div><span>Open Claude / ChatGPT and paste (Cmd+V)</span></div>
      <div class="help-step"><div class="help-step-num">4</div><span>You'll get 20 nursing-level questions</span></div>
      <h2>Tracking quiz scores</h2>
      <ul>
        <li><strong>Saving a score</strong>: after taking a quiz, enter the score (0–100) in the quiz column and click <strong>"Save score"</strong>.</li>
        <li><strong>Score list</strong>: all saved scores are listed (newest first) with a date. Clicking <strong>×</strong> next to a score deletes it.</li>
        <li><strong>Per-topic average</strong> shows under the list; a colored <strong>score badge</strong> appears on the topic row based on the latest score (green ≥85 · yellow 60–84 · red &lt;60).</li>
        <li><strong>Overall average</strong>: the "Quiz average" card at the top sums up all scores. The <strong>Part A / Part B</strong> filter applies to it too.</li>
        <li>Scores don't affect "Done" status — they're a separate readiness signal, saved in the same progress.json.</li>
      </ul>
      <h2>Install as an app (PWA)</h2>
      <ul>
        <li>From the live site you can add the tracker <strong>to your home screen</strong>: Android — ⋮ menu → "Add to Home screen"; iPhone — Share → "Add to Home Screen".</li>
        <li>Once installed it opens full-screen and <strong>works offline</strong> (with the last-seen version). Progress is saved locally as usual.</li>
      </ul>
      <h2>Saving and loading</h2>
      <div class="help-tip"><span class="material-icons">info</span> Progress is saved automatically to localStorage, but an external backup is recommended.</div>
      <h3><span class="material-icons">save</span> Manual save</h3>
      <p>Click <strong>"Save progress"</strong>. The first time, you pick a location for <code>progress.json</code>. After that it saves to the same place automatically.</p>
      <h3><span class="material-icons">autorenew</span> Auto-save</h3>
      <p>After the first manual save the app saves <strong>every 5 minutes</strong>. The sidebar chip turns green and shows the last save time.</p>
      <div class="help-tip"><span class="material-icons">info</span> Automatic save/load to a file works only in Chrome / Edge. In Safari and Firefox (including iPhone) each save downloads a file — progress itself is still auto-saved in the browser either way.</div>
      <h3><span class="material-icons">folder_open</span> Loading</h3>
      <p>Click <strong>"Load progress"</strong> to load a previously saved file — useful when switching computers.</p>
      <h3><span class="material-icons">delete</span> Reset</h3>
      <p><strong>"Reset all"</strong> deletes all checkmarks in this browser. Irreversible — back up first.</p>
      <h2>Appearance</h2>
      <p>Click <strong>☀️ / 🌙</strong> in the top corner, or in the mobile bottom bar, to switch between dark and light mode.</p>
      <h2>Interface language</h2>
      <p>Click the <strong>🌐 globe</strong> button in the top bar to switch the interface between עברית, English and Русский. Course content stays in Hebrew, matching the syllabus.</p>
      <div id="sched-help-section">
        <h2>Schedule tracking</h2>
        <p>An optional add-on — off by default — that layers timing and milestones on top of the tracker.</p>
        <h3><span class="material-icons">event</span> Enabling</h3>
        <p>The <strong>"Schedule"</strong> button at the bottom of the sidebar opens a settings panel: on/off, a start date for Part A (and optionally Part B), both exam dates, and a daily study pace in hours — separately for the study pass and the review pass.</p>
        <h3><span class="material-icons">school</span> Exam countdown</h3>
        <p>The dashboard shows, per part, the exam date, days remaining, and whether at the current pace you'll finish studying with enough review days before the exam.</p>
        <h3><span class="material-icons">flag</span> Per-topic status chip</h3>
        <ul>
          <li>🟢 Ahead — you've done more items than planned by today.</li>
          <li>🔵 On track — exactly at your planned pace.</li>
          <li>🔴 Behind — fewer items than should be done by today.</li>
        </ul>
        <h3><span class="material-icons">autorenew</span> Review pass</h3>
        <p>Each topic's expanded panel gets a <strong>"Review done"</strong> row — a separate checkmark for the second pass, with its own date and status chip.</p>
        <h3><span class="material-icons">insights</span> Summary dashboard</h3>
        <p>A card above the table sums items/topics done vs. the daily expectation, plus a projected finish date at your current pace.</p>
        <div class="help-tip"><span class="material-icons">info</span> Turning the feature off only hides the display — every recorded date is kept and returns when re-enabled. The data lives in the same progress.json.</div>
      </div>
    `,
  },

  ru: {
    'docTitle': 'Сестринское дело у взрослых — трекер учёбы',
    'brand': 'Сестринское дело',
    'brandSub': 'Рафи Михаэли · 9-й поток · 5786',
    'overallProgress': 'Общий прогресс',
    'partA': 'Часть А',
    'partB': 'Часть Б',
    'chipTooltipA': 'Нажмите, чтобы показать только темы части А — повторное нажатие снимает фильтр',
    'chipTooltipB': 'Нажмите, чтобы показать только темы части Б — повторное нажатие снимает фильтр',
    'nav': 'Навигация',
    'allTopics': 'Все темы',
    'autosave.chipTooltip': 'Автосохранение выполняется каждые 5 минут после первого ручного сохранения',
    'autosave.active': 'Автосохранение включено',
    'autosave.inactive': 'Автосохранение выключено',
    'autosave.lastSaved': 'Сохранено · {time}',
    'autosave.every5': 'Каждые 5 минут',
    'autosave.clickToStart': 'Нажмите «Сохранить», чтобы включить',
    'btn.incomplete': 'Только незавершённые',
    'btn.incompleteTooltip': 'Показать только незавершённые темы',
    'btn.review': 'На повторение',
    'btn.reviewTooltip': 'Темы с оценкой ниже 70 или завершённые 21+ день назад без повторения',
    'btn.save': 'Сохранить прогресс',
    'btn.saveTooltip': 'Сохранить прогресс в JSON-файл. После первого сохранения — автосохранение каждые 5 минут',
    'btn.load': 'Загрузить прогресс',
    'btn.loadTooltip': 'Загрузить сохранённый файл прогресса — удобно при смене компьютера',
    'btn.reset': 'Сбросить всё',
    'btn.resetTooltip': '⚠ Безвозвратно удалить весь прогресс — восстановление невозможно',
    'btn.help': 'Инструкция',
    'btn.helpTooltip': 'Открыть инструкцию',
    'search.placeholder': 'Поиск темы или пункта...',
    'search.back': 'Назад',
    'search.clear': 'Очистить поиск',
    'search.tooltip': 'Поиск',
    'search.noResults': 'Ничего не найдено по запросу «{q}»',
    'search.more': 'ещё +{n}',
    'icon.searchBack': 'arrow_back',
    'topbar.pagesTooltip': 'Прочитано страниц Бруннера из общего числа страниц курса',
    'topbar.meta': '336 акад. ч. · 5786',
    'theme.toggle': 'Сменить тему',
    'lang.tooltip': 'שפת ממשק / Language / Язык',
    'pageTitleHtml': 'Сестринское дело у взрослых — <strong>трекер прогресса учёбы</strong>',
    'btn.expandAll': 'Развернуть всё',
    'btn.expandAllTooltip': 'Открыть панель пунктов у всех тем',
    'btn.collapseAll': 'Свернуть всё',
    'btn.collapseAllTooltip': 'Закрыть все панели пунктов',
    'stat.topics': 'Темы',
    'stat.topicsDone': 'тем завершено',
    'stat.subs': 'Пункты',
    'stat.subsReviewed': 'пунктов пройдено',
    'stat.hoursDone': 'Часы: сделано',
    'stat.acadHours': 'академических часов',
    'stat.hoursLeft': 'Часы: осталось',
    'stat.untilEnd': 'до конца программы',
    'stat.quizAvg': 'Средний балл',
    'stat.noScores': 'Оценок пока нет',
    'chart.titleA': 'Прогресс — часть А',
    'chart.titleB': 'Прогресс — часть Б',
    'chart.completed': 'выполнено',
    'table.title': 'Учебные темы',
    'table.showing': 'Показано: {label}',
    'table.count': 'Тем: {n}',
    'th.topic': 'Тема',
    'th.category': 'Категория',
    'th.hours': 'Ч. / стр.',
    'th.hoursTooltip': 'Академические часы и страницы Бруннера по теме',
    'th.subs': 'Пункты',
    'th.subsTooltip': 'Число пунктов, отмеченных выполненными',
    'th.status': 'Статус',
    'th.statusTooltip': 'Не начато | В работе | Готово (все пункты + Бруннер)',
    'th.part': 'Часть',
    'footer.text': 'Сестринское дело у взрослых · переквалификация, 9-й поток · Ихилов–Шейнбрун · 5786 · Рафи Михаэли',
    'footer.stats': '{dt}/{tt} тем · {ds}/{ts} пунктов · {dh} ч. сделано',
    'mob.all': 'Все',
    'mob.remaining': 'Осталось',
    'mob.appearance': 'Тема',
    'help.title': 'Инструкция — трекер «Сестринское дело»',
    'unit.hours': 'ч.',
    'unit.pages': 'стр.',
    'status.done': 'Готово',
    'status.doneTooltip': 'Все пункты и Бруннер выполнены',
    'status.inprog': 'В работе',
    'status.inprogTooltip': 'Часть пунктов выполнена — продолжайте',
    'status.notStarted': 'Не начато',
    'status.notStartedTooltip': 'Вы ещё не начали эту тему',
    'quiz.lastTooltip': 'Последняя оценка ({date})',
    'topic.checkboxTooltip': 'Отметьте, чтобы быстро завершить всю тему',
    'badge.hoursTooltip': 'Академические часы по теме',
    'badge.pagesTooltip': 'Страницы Бруннера по теме',
    'row.expandTooltip': 'Открыть/закрыть пункты темы',
    'sub.progress': '{done} / {total} пунктов · {pct}%',
    'sub.progressTooltip': 'Отмеченные пункты из всех пунктов темы',
    'col.subs': '📋 Пункты',
    'col.subsTooltip': 'Отмечайте каждый изученный пункт',
    'col.materials': '📄 Материалы',
    'col.materialsTooltip': 'Ссылки на слайды лекций и главы Бруннера в Google Drive',
    'col.exams': '📝 Тесты',
    'col.examsTooltip': 'Создайте тест по теме с помощью ИИ',
    'brunner.read': '📖 Бруннер прочитан — {ref}',
    'brunner.tooltip': 'Отметьте после чтения глав Бруннера — нужно для завершения темы',
    'exam.copyBtn': 'Скопировать промпт для теста (ИИ)',
    'exam.copyTooltip': 'Копирует готовый промпт — вставьте в Claude, ChatGPT и т.п., чтобы получить 20 вопросов на иврите',
    'exam.copied': 'Скопировано!',
    'quiz.placeholder': 'Балл',
    'quiz.saveBtn': 'Сохранить',
    'quiz.saveTooltip': 'Сохраните оценку — темы с низким баллом попадут в фильтр «На повторение»',
    'quiz.delete': 'Удалить оценку',
    'quiz.avg': 'Среднее',
    'quiz.one': 'тест',
    'quiz.few': 'теста',
    'quiz.many': 'тестов',
    'quiz.invalid': 'Оценка должна быть числом от 0 до 100',
    'empty.none': 'Нет тем для отображения',
    'empty.allDone': 'Все темы завершены! 🎉',
    'empty.review': 'Повторять нечего — все оценки хорошие, повторения свежие 💪',
    'confirm.reset': 'Сбросить все отметки?',
    'toast.autoSaved': 'Автосохранение · {time}',
    'toast.saved': 'Сохранено · {time}',
    'btn.savedFlash': 'Сохранено!',
    'err.save': 'Ошибка сохранения: {msg}',
    'err.load': 'Ошибка загрузки',
    'err.loadInvalid': 'Ошибка загрузки — выбранный файл не является файлом прогресса. Текущий прогресс не изменён.',
    'err.copy': 'Не удалось скопировать — скопируйте вручную',
    'sched.btn': 'График',
    'sched.btnTooltip': 'Настройки графика — дата начала, дневной темп и статус по темам',
    'sched.title': '📅 График',
    'sched.aria': 'Настройки графика',
    'sched.enable': 'Включить график',
    'sched.start': 'Дата начала',
    'sched.exam': '🎓 Дата экзамена',
    'sched.optional': '(необязательно, можно позже)',
    'sched.pace1': 'Дневной темп — первый проход (часы)',
    'sched.paceReview': 'Дневной темп — повторение (часы)',
    'sched.note': '💡 При выключении графика метки исчезнут, но все записанные даты сохранятся и вернутся при включении.',
    'sched.saveBtn': 'Сохранить',
    'sched.cancel': 'Отмена',
    'sched.ahead': 'Опережение',
    'sched.aheadTooltip': 'Опережаете свой график',
    'sched.ontrack': 'По графику',
    'sched.ontrackTooltip': 'В запланированном темпе',
    'sched.behind': 'Отставание',
    'sched.behindTooltip': 'Отстаёте от графика',
    'sched.revAheadTooltip': 'Повторение раньше срока',
    'sched.revOnTimeTooltip': 'Повторение вовремя',
    'sched.revLateTooltip': 'Повторение с опозданием',
    'sched.revOnTime': 'Вовремя',
    'sched.reviewDone': '🔁 Повторение завершено',
    'sched.reviewDoneTooltip': 'Отметьте после повторного прохода темы',
    'sched.examLine': '🎓 Экзамен: {date} · {countdown}',
    'sched.inDays': 'через {n} дн.',
    'sched.today': 'сегодня!',
    'sched.past': 'прошёл',
    'sched.study': 'Учёба: {d}/{t} пунктов (план на сегодня: {e})',
    'sched.reviewLine': 'Повторение: {d}/{t} тем (план на сегодня: {e})',
    'sched.pass1Done': 'Первый проход завершён ✔️',
    'sched.noProgress': 'Нет прогресса за последние {n} дней — прогноз недоступен',
    'sched.noData': 'Пока недостаточно данных для прогноза',
    'sched.finishOnTime': 'При текущем темпе: финиш {date} (точно в срок)',
    'sched.finishEarly': 'При текущем темпе: финиш {date} (на {n} дн. раньше плана)',
    'sched.finishLate': 'При текущем темпе: финиш {date} (на {n} дн. позже плана)',
    'sched.verdictMiss': 'В текущем темпе не успеть до экзамена (не хватает {n} дн.)',
    'sched.verdictTight': 'На повторение остаётся лишь {m} дн. (нужно {src}: {need})',
    'sched.verdictOk': 'Достаточно: {m} дн. на повторение (нужно {src}: {need})',
    'sched.byMeasured': 'по фактическому темпу',
    'sched.byPlan': 'по плану',
    'anx.title': '📊 Аналитика',
    'anx.partAllDone': 'все пункты выполнены ✔️',
    'anx.remainNoExam': 'осталось {n} пунктов · нет даты экзамена для сравнения',
    'anx.row': 'осталось {r} пунктов · {d} дн. до экзамена ← нужно <b>{req}</b>/день',
    'anx.actualPart': ' · фактически (за {w} дн.): <b>{act}</b>/день',
    'anx.enough': 'темп достаточный',
    'anx.short': 'не хватает {n}/день',
    'anx.actualSeries': 'Факт. остаток',
    'anx.idealSeries': 'Целевая линия (до экзамена)',
    'anx.heatTitle': 'Карта регулярности (пунктов в день)',
    'anx.heatTooltip': 'Выполненные пункты по дням — темнее = больше',
    'anx.cellTitle': '{date} · {n} пунктов',
    'anx.empty': 'Начните отмечать пункты — графики появятся сами.',
    'helpHtml': `
      <h2>Что это?</h2>
      <p>Личная панель учёта учёбы по курсу «Сестринское дело у взрослых». Отслеживает прогресс по 18 темам, разбитым на часть А и часть Б. Учебное содержание (названия тем, пункты, ссылки на материалы) остаётся на иврите — как в программе курса и учебнике Бруннера.</p>
      <h2>Как открыть</h2>
      <ul>
        <li>С любого устройства, включая телефон: <code>rafimichaeli.github.io/nursing-study-tracker</code></li>
        <li>Локально: просто откройте файл в браузере, установка не нужна.</li>
      </ul>
      <h2>Интерфейс</h2>
      <h3><span class="material-icons">menu</span> Боковая панель — широкий экран</h3>
      <ul>
        <li>Показывает <strong>общий процент прогресса</strong> и разбивку по частям А и Б.</li>
        <li>Нажатие на <strong>«Часть А»</strong> или <strong>«Часть Б»</strong> фильтрует таблицу. Повторное нажатие снимает фильтр.</li>
        <li>Быстрые ссылки на категории: хирургия, кардиология, дыхание и т.д.</li>
        <li>Кнопка <strong>«Только незавершённые»</strong> оставляет в таблице незавершённые темы.</li>
        <li>Кнопка <strong>«На повторение»</strong> показывает слабые темы: последняя оценка ниже 70 или тема завершена 21+ день назад без повторения.</li>
        <li>Внизу панели: Сохранить / Загрузить / Сбросить всё / Инструкция.</li>
      </ul>
      <h3><span class="material-icons">smartphone</span> Навигация на телефоне</h3>
      <ul>
        <li>Значок ☰ открывает боковую панель как выдвижное меню, включая кнопки сохранения и инструкцию внизу.</li>
        <li>Фиксированная нижняя панель с 5 кнопками: Все, Часть А, Часть Б, Осталось, Тема.</li>
      </ul>
      <h3><span class="material-icons">view_headline</span> Верхняя панель</h3>
      <ul>
        <li><strong>Счётчик страниц</strong>: сколько страниц Бруннера прочитано из общего числа.</li>
        <li><strong>Общий прогресс</strong> с индикатором.</li>
        <li><strong>Поиск</strong> (🔍): см. раздел «Поиск» ниже.</li>
      </ul>
      <h3><span class="material-icons">unfold_more</span> Быстрое раскрытие</h3>
      <p>Над таблицей: кнопки <strong>«Развернуть всё»</strong> и <strong>«Свернуть всё»</strong> — открывают или закрывают панели пунктов всех тем разом.</p>
      <h2>Поиск тем и пунктов</h2>
      <ul>
        <li>Введите название темы или пункта в поле поиска — откроется меню результатов с подсветкой совпадений.</li>
        <li>Клик по результату переносит к теме (и открывает панель пунктов, если выбран конкретный пункт).</li>
        <li>Кнопка ✕ очищает поиск; Escape закрывает меню результатов.</li>
        <li>На телефоне поиск свёрнут в значок; нажатие открывает поле во всю ширину.</li>
      </ul>
      <h2>Таблица тем</h2>
      <p>Каждая строка — учебная тема: название, категория, страницы Бруннера, часы, статус и прогресс.</p>
      <table class="help-table">
        <tr><th>Статус</th><th>Условие</th></tr>
        <tr><td>Not Started</td><td>Ни один пункт не отмечен</td></tr>
        <tr><td>In Progress</td><td>Отмечен хотя бы один пункт</td></tr>
        <tr><td>Done</td><td>Все пункты + чтение Бруннера выполнены</td></tr>
      </table>
      <h2>Работа с темой</h2>
      <p>Клик по строке открывает расширенную панель с тремя колонками:</p>
      <h3><span class="material-icons">checklist</span> 1 — Пункты</h3>
      <p>Отмечайте каждый завершённый пункт. Внизу — <strong>«Бруннер прочитан»</strong>: отметьте после чтения глав.</p>
      <h3><span class="material-icons">menu_book</span> 2 — Материалы</h3>
      <p>Прямые ссылки на слайды лекций и главы Бруннера в Google Drive. Записи (🎬) — где есть.</p>
      <h3><span class="material-icons">quiz</span> 3 — Тесты</h3>
      <p><strong>«Скопировать промпт для теста (ИИ)»</strong> — копирует готовый промпт в буфер. Вставьте в Claude / ChatGPT и получите 20 вопросов с вариантами ответов на иврите с пояснениями.</p>
      <div class="help-step"><div class="help-step-num">1</div><span>Кликните тему, чтобы открыть панель</span></div>
      <div class="help-step"><div class="help-step-num">2</div><span>Нажмите «Скопировать промпт для теста»</span></div>
      <div class="help-step"><div class="help-step-num">3</div><span>Откройте Claude / ChatGPT и вставьте (Cmd+V)</span></div>
      <div class="help-step"><div class="help-step-num">4</div><span>Получите 20 вопросов уровня сестринского экзамена</span></div>
      <h2>Учёт оценок за тесты</h2>
      <ul>
        <li><strong>Сохранение оценки</strong>: после теста введите балл (0–100) в колонке тестов и нажмите <strong>«Сохранить»</strong>.</li>
        <li><strong>Список оценок</strong>: все сохранённые оценки показаны списком (новые сверху) с датой. Кнопка <strong>×</strong> удаляет оценку.</li>
        <li><strong>Среднее по теме</strong> — под списком; цветной <strong>бейдж</strong> в строке темы отражает последнюю оценку (зелёный ≥85 · жёлтый 60–84 · красный &lt;60).</li>
        <li><strong>Общее среднее</strong>: карточка «Средний балл» вверху суммирует все оценки. Фильтр <strong>часть А / часть Б</strong> действует и на неё.</li>
        <li>Оценки не влияют на статус «Готово» — это отдельный показатель готовности, хранится в том же progress.json.</li>
      </ul>
      <h2>Установка как приложение (PWA)</h2>
      <ul>
        <li>С живого сайта трекер можно добавить <strong>на главный экран</strong>: Android — меню ⋮ → «Добавить на главный экран»; iPhone — Поделиться → «На экран "Домой"».</li>
        <li>После установки открывается на весь экран и <strong>работает без интернета</strong> (последняя загруженная версия). Прогресс сохраняется локально как обычно.</li>
      </ul>
      <h2>Сохранение и загрузка</h2>
      <div class="help-tip"><span class="material-icons">info</span> Прогресс автоматически сохраняется в localStorage, но рекомендуется внешняя резервная копия.</div>
      <h3><span class="material-icons">save</span> Ручное сохранение</h3>
      <p>Нажмите <strong>«Сохранить прогресс»</strong>. В первый раз выберите место для файла <code>progress.json</code>. Далее сохраняется туда же автоматически.</p>
      <h3><span class="material-icons">autorenew</span> Автосохранение</h3>
      <p>После первого ручного сохранения — автосохранение <strong>каждые 5 минут</strong>. Индикатор в панели станет зелёным и покажет время последнего сохранения.</p>
      <div class="help-tip"><span class="material-icons">info</span> Автоматическое сохранение/загрузка в файл работает только в Chrome / Edge. В Safari и Firefox (включая iPhone) каждое сохранение скачивает файл — сам прогресс всё равно сохраняется в браузере.</div>
      <h3><span class="material-icons">folder_open</span> Загрузка</h3>
      <p>Нажмите <strong>«Загрузить прогресс»</strong>, чтобы загрузить сохранённый файл — удобно при смене компьютера.</p>
      <h3><span class="material-icons">delete</span> Сброс</h3>
      <p><strong>«Сбросить всё»</strong> удаляет все отметки в этом браузере. Необратимо — сделайте копию заранее.</p>
      <h2>Внешний вид</h2>
      <p>Нажмите <strong>☀️ / 🌙</strong> в верхнем углу или в нижней панели на телефоне, чтобы переключить тёмный/светлый режим.</p>
      <h2>Язык интерфейса</h2>
      <p>Кнопка <strong>🌐</strong> в верхней панели переключает интерфейс между עברית, English и Русский. Учебное содержание остаётся на иврите.</p>
      <div id="sched-help-section">
        <h2>График учёбы</h2>
        <p>Необязательная надстройка — по умолчанию выключена — добавляет сроки и контрольные точки поверх трекера.</p>
        <h3><span class="material-icons">event</span> Включение</h3>
        <p>Кнопка <strong>«График»</strong> внизу боковой панели открывает настройки: вкл/выкл, дата начала части А (и при желании части Б), даты обоих экзаменов и дневной темп в часах — отдельно для первого прохода и для повторения.</p>
        <h3><span class="material-icons">school</span> Обратный отсчёт до экзамена</h3>
        <p>Панель показывает по каждой части дату экзамена, сколько дней осталось и успеете ли вы при текущем темпе закончить с достаточным запасом дней на повторение.</p>
        <h3><span class="material-icons">flag</span> Метка статуса по теме</h3>
        <ul>
          <li>🟢 Опережение — сделано больше пунктов, чем планировалось к сегодняшнему дню.</li>
          <li>🔵 По графику — точно в запланированном темпе.</li>
          <li>🔴 Отставание — меньше пунктов, чем должно быть готово к сегодняшнему дню.</li>
        </ul>
        <h3><span class="material-icons">autorenew</span> Повторение</h3>
        <p>В расширенной панели каждой темы появляется строка <strong>«Повторение завершено»</strong> — отдельная отметка второго прохода со своей датой и меткой статуса.</p>
        <h3><span class="material-icons">insights</span> Сводная панель</h3>
        <p>Над таблицей — карточка: выполненные пункты/темы против дневного плана и прогноз даты финиша при текущем темпе.</p>
        <div class="help-tip"><span class="material-icons">info</span> Выключение функции лишь скрывает отображение — все записанные даты сохраняются и вернутся при включении. Данные живут в том же progress.json.</div>
      </div>
    `,
  },
  };

  // ── Engine ─────────────────────────────────────────────────
  let lang = 'he';
  try {
    const saved = localStorage.getItem(LS_LANG_KEY);
    if (saved && LANGS[saved]) lang = saved;
  } catch {}

  function t(key, params) {
    let s = DICT[lang][key];
    if (s === undefined) s = DICT.he[key];
    if (s === undefined) return key;
    if (params) for (const k in params) s = s.split('{' + k + '}').join(params[k]);
    return s;
  }

  function partLabel(part) { return part === 'א' ? t('partA') : t('partB'); }

  // Russian-aware plural picker: quizCount(1)→"тест", (3)→"теста", (7)→"тестов".
  // For he/en, `few` and `many` are identical, so the same rule is harmless.
  function quizWord(n) {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return t('quiz.one');
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return t('quiz.few');
    return t('quiz.many');
  }

  function applyStatic(root) {
    const scope = root || document;
    scope.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.getAttribute('data-i18n')); });
    scope.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.getAttribute('data-i18n-html')); });
    scope.querySelectorAll('[data-i18n-tooltip]').forEach(el => { el.setAttribute('data-tooltip', t(el.getAttribute('data-i18n-tooltip'))); });
    scope.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder'))); });
    scope.querySelectorAll('[data-i18n-title]').forEach(el => { el.setAttribute('title', t(el.getAttribute('data-i18n-title'))); });
    scope.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria'))); });
  }

  function applyDocAttrs() {
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', LANGS[lang].dir);
  }

  function applyHelp() {
    const body = document.querySelector('#helpOverlay .help-body');
    if (!body) return;
    const html = t('helpHtml');
    if (html) body.innerHTML = html;
  }

  function markMenuActive() {
    document.querySelectorAll('#langMenu [data-lang]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });
  }

  function setLanguage(next) {
    if (!LANGS[next] || next === lang) { closeLangMenu(); return; }
    lang = next;
    try { localStorage.setItem(LS_LANG_KEY, lang); } catch {}
    applyDocAttrs();
    document.title = t('docTitle');
    applyStatic();
    applyHelp();
    markMenuActive();
    closeLangMenu();
    // Re-render everything JS-generated (table, stats, charts, schedule,
    // analytics — they all hang off renderAll / its afterRender hooks).
    if (typeof window.renderAll === 'function') { try { window.renderAll(); } catch {} }
    window.dispatchEvent(new CustomEvent('i18n:changed', { detail: { lang } }));
  }

  // ── Language menu (topbar globe button) ────────────────────
  function toggleLangMenu(e) {
    if (e) e.stopPropagation();
    const menu = document.getElementById('langMenu');
    if (menu) menu.classList.toggle('show');
  }
  function closeLangMenu() {
    const menu = document.getElementById('langMenu');
    if (menu) menu.classList.remove('show');
  }
  document.addEventListener('click', (e) => {
    if (!e.target.closest || !e.target.closest('.lang-menu-wrap')) closeLangMenu();
  });

  // ── Init (called from index.html after all scripts loaded) ──
  function init() {
    // Capture the original Hebrew help body — including the section
    // schedule.js injected — so switching back to he restores it verbatim.
    const body = document.querySelector('#helpOverlay .help-body');
    if (body && !DICT.he.helpHtml) DICT.he.helpHtml = body.innerHTML;
    applyDocAttrs();
    document.title = t('docTitle');
    applyStatic();
    if (lang !== 'he') applyHelp();
    markMenuActive();
  }

  // Set lang/dir as early as possible (this file loads in <head>) so the
  // body lays out in the right direction from the first paint.
  applyDocAttrs();

  // ── Exports ────────────────────────────────────────────────
  window.t = t;
  window.T = t; // alias for scopes where a local `t` (e.g. a topic) shadows the global
  window.partLabel = partLabel;
  window.setLanguage = setLanguage;
  window.toggleLangMenu = toggleLangMenu;
  window.I18N = {
    get lang() { return lang; },
    isRTL: () => LANGS[lang].dir === 'rtl',
    locale: () => LANGS[lang].locale,
    languages: Object.keys(LANGS),
    dict: DICT,
    quizWord,
    applyStatic,
    init,
  };
})();
