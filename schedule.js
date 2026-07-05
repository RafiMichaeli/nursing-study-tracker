/*
 * schedule.js — מעקב לו"ז (MVP)
 * -------------------------------------------------------------
 * פיצ'ר עצמאי לגמרי, נטען כ-<script> רגיל אחרי הסקריפט הראשי של
 * מעקב_סיעוד_המבוגר.html. אינו עורך את הקובץ הראשי (heבד "include"
 * אחת) — הוא "מתחבר" אליו על ידי:
 *   1. גישה ישירה למשתנה הגלובלי המשותף `state` (מוגדר עם let בסקריפט
 *      הראשי — נגיש לכל סקריפט קלאסי שנטען אחריו).
 *   2. עטיפת 3 פונקציות גלובליות קיימות: renderAll / toggleSub / toggleTopic.
 *
 * כל הנתונים של הפיצ'ר חיים בתוך state._schedule — כלומר הם נשמרים
 * אוטומטית עם שאר ההתקדמות (localStorage + "שמור התקדמות" ל-progress.json)
 * בלי לגעת בפונקציות השמירה/טעינה הקיימות בכלל.
 *
 * MVP הנוכחי כולל: הפעלה/כיבוי, תאריך התחלה לכל חלק, קצב יומי (שעות),
 * צ'יפ סטטוס פר-נושא (מקדים / בלו"ז / מאחר) המבוסס על תאריך מתוכנן
 * שמחושב באופן יחסי לפי משקל השעות (t.hours) של כל נושא, מעבר ריענון
 * נפרד (צ'ק-בוקס + תאריך משלו לכל נושא, רץ אחרי שכל מעבר הלימוד הסתיים),
 * ודשבורד סיכום כללי עם תחזית תאריך סיום.
 */
(function () {
  'use strict';

  const STORAGE_LOCAL_BACKUP_KEY = 'nursingSchedule_adult_settingsBackup';
  const RECENT_PACE_WINDOW_DAYS = 14; // חלון נע לחישוב "הקצב הנוכחי" בדשבורד

  // ── Defaults / migration ──────────────────────────────────
  function ensureDefaults() {
    if (typeof state === 'undefined' || !state) return; // main app not ready yet
    if (!state._schedule) {
      state._schedule = {
        enabled: false, startDates: {}, paceHoursPerDay: 2.5, subDates: {},
        paceHoursPerDayReview: 1.5, reviewHoursFactor: 0.35, review: {},
      };
    }
    const s = state._schedule;
    if (!s.startDates || typeof s.startDates !== 'object') s.startDates = {};
    if (typeof s.paceHoursPerDay !== 'number' || !isFinite(s.paceHoursPerDay) || s.paceHoursPerDay <= 0) {
      s.paceHoursPerDay = 2.5;
    }
    if (typeof s.paceHoursPerDayReview !== 'number' || !isFinite(s.paceHoursPerDayReview) || s.paceHoursPerDayReview <= 0) {
      s.paceHoursPerDayReview = 1.5;
    }
    if (typeof s.reviewHoursFactor !== 'number' || !isFinite(s.reviewHoursFactor) || s.reviewHoursFactor <= 0) {
      s.reviewHoursFactor = 0.35;
    }
    if (!s.subDates || typeof s.subDates !== 'object') s.subDates = {};
    if (!s.review || typeof s.review !== 'object') s.review = {};
    if (typeof s.enabled !== 'boolean') s.enabled = false;
    // תאריכי מבחנים: ברירת מחדל מ-EXAM_DATES (data.js), ניתן לעריכה בהגדרות.
    // ממלאים ברירת מחדל רק אם המפתח לא קיים כלל — ניקוי מפורש (null) נשמר.
    if (!s.examDates || typeof s.examDates !== 'object') s.examDates = {};
    ['א', 'ב'].forEach(p => {
      if (!(p in s.examDates) && typeof EXAM_DATES !== 'undefined' && EXAM_DATES[p]) s.examDates[p] = EXAM_DATES[p];
    });
  }

  // ── Date helpers (local dates, no timezone drift) ─────────
  function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function dateFromStr(s) {
    // "YYYY-MM-DD" -> local midnight Date
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  function addDays(dateObj, n) {
    const d = new Date(dateObj);
    d.setDate(d.getDate() + n);
    return d;
  }

  // ── Planned schedule (computed on demand, not stored) ─────
  // מחלק את הימים בין הנושאים של חלק נתון באופן יחסי למשקל t.hours,
  // ובתוך כל נושא — מפזר את הסעיפים שלו על פני טווח הימים של הנושא.
  function computePlan(part) {
    ensureDefaults();
    const pace = state._schedule.paceHoursPerDay;
    const topics = TOPICS.filter(t => t.part === part);
    let cumHours = 0;
    const plan = {};
    topics.forEach(t => {
      const startOffset = Math.floor(cumHours / pace);
      cumHours += (t.hours || 1);
      const endOffset = Math.max(startOffset, Math.ceil(cumHours / pace) - 1);
      const span = endOffset - startOffset + 1;
      const n = t.subs.length || 1;
      const subOffsets = t.subs.map((_, i) => startOffset + Math.floor((i * span) / n));
      plan[t.id] = { startOffset, endOffset, subOffsets };
    });
    return plan;
  }

  const planCache = {}; // part -> {pace, topicsLen, plan}
  function getPlanForPart(part) {
    ensureDefaults();
    const pace = state._schedule.paceHoursPerDay;
    const topicsLen = TOPICS.filter(t => t.part === part).length;
    const cached = planCache[part];
    if (cached && cached.pace === pace && cached.topicsLen === topicsLen) return cached.plan;
    const plan = computePlan(part);
    planCache[part] = { pace, topicsLen, plan };
    return plan;
  }

  function getPlannedDateForSub(topic, subIdx) {
    const start = state._schedule.startDates[topic.part];
    if (!start) return null;
    const plan = getPlanForPart(topic.part);
    const p = plan[topic.id];
    if (!p) return null;
    return addDays(dateFromStr(start), p.subOffsets[subIdx]);
  }

  // ── Review-pass plan (מעבר ריענון) ────────────────────────
  // רץ אחרי שמעבר הלימוד (pass 1) של כל החלק מסתיים, וחוזר על אותו סדר
  // נושאים בקצב נפרד ובמשקל שעות מוקטן (reviewHoursFactor * t.hours).
  function computeReviewPlan(part) {
    ensureDefaults();
    const s = state._schedule;
    const pass1Plan = getPlanForPart(part);
    const topics = TOPICS.filter(t => t.part === part);
    const pass1TotalDays = topics.reduce((max, t) => Math.max(max, pass1Plan[t.id] ? pass1Plan[t.id].endOffset : 0), -1) + 1;
    let cumHours = 0;
    const plan = {};
    topics.forEach(t => {
      const startOffset = pass1TotalDays + Math.floor(cumHours / s.paceHoursPerDayReview);
      cumHours += (t.hours || 1) * s.reviewHoursFactor;
      const endOffset = Math.max(startOffset, pass1TotalDays + Math.ceil(cumHours / s.paceHoursPerDayReview) - 1);
      plan[t.id] = { startOffset, endOffset };
    });
    return plan;
  }

  const reviewPlanCache = {};
  function getReviewPlanForPart(part) {
    ensureDefaults();
    const s = state._schedule;
    const key = `${s.paceHoursPerDay}|${s.paceHoursPerDayReview}|${s.reviewHoursFactor}`;
    const topicsLen = TOPICS.filter(t => t.part === part).length;
    const cached = reviewPlanCache[part];
    if (cached && cached.key === key && cached.topicsLen === topicsLen) return cached.plan;
    const plan = computeReviewPlan(part);
    reviewPlanCache[part] = { key, topicsLen, plan };
    return plan;
  }

  function getPlannedReviewDate(topic) {
    const start = state._schedule.startDates[topic.part];
    if (!start) return null;
    const plan = getReviewPlanForPart(topic.part);
    const p = plan[topic.id];
    if (!p) return null;
    return addDays(dateFromStr(start), p.endOffset);
  }

  // ── Recording actual completion dates ─────────────────────
  function stampSub(topicId, subIdx, willBeDone) {
    ensureDefaults();
    const sd = state._schedule.subDates;
    if (willBeDone) {
      if (!sd[topicId]) sd[topicId] = {};
      sd[topicId][subIdx] = todayStr();
    } else if (sd[topicId]) {
      delete sd[topicId][subIdx];
    }
  }
  function stampAllSubs(topicId) {
    const t = TOPICS.find(x => x.id === topicId);
    if (!t) return;
    const ts = getTopicState(topicId);
    t.subs.forEach((_, i) => {
      if (!ts.subs[i]) stampSub(topicId, i, true);
    });
  }

  function stampReview(topicId, willBeDone) {
    ensureDefaults();
    const r = state._schedule.review;
    if (willBeDone) {
      r[topicId] = { done: true, date: todayStr() };
    } else {
      r[topicId] = { done: false, date: null };
    }
  }
  function getReviewState(topicId) {
    ensureDefaults();
    return state._schedule.review[topicId] || { done: false, date: null };
  }
  // פונקציה גלובלית חדשה — נקראת מה-onclick של צ'ק-בוקס הריענון שאנחנו מזריקים.
  // לא עוטפת שום פונקציה קיימת (אין כזו במערכת המקורית), רק קוראת ל-saveState/renderAll
  // הקיימים כדי להתנהג בדיוק כמו כל שאר הפעולות (toggleBrunner וכו').
  function toggleScheduleReview(topicId) {
    const willBeDone = !getReviewState(topicId).done;
    stampReview(topicId, willBeDone);
    if (typeof saveState === 'function') { try { saveState(); } catch (e) { /* noop */ } }
    if (typeof renderAll === 'function') { try { renderAll(); } catch (e) { decorate(); } }
    else { decorate(); }
  }

  // ── Status per topic (מקדים / בלו"ז / מאחר) ───────────────
  function computeTopicStatus(t, ts) {
    const start = state._schedule.startDates[t.part];
    if (!start) return null;
    const plan = getPlanForPart(t.part);
    const p = plan[t.id];
    if (!p) return null;
    const today = dateFromStr(todayStr());
    const startDate = dateFromStr(start);
    let expected = 0, actual = 0;
    t.subs.forEach((_, i) => {
      const planned = addDays(startDate, p.subOffsets[i]);
      if (planned <= today) expected++;
      if (ts.subs[i]) actual++;
    });
    const delta = actual - expected;
    if (delta > 0) return { level: 'ahead', delta };
    if (delta === 0) return { level: 'ontrack', delta: 0 };
    return { level: 'behind', delta: -delta };
  }

  function chipHTML(status) {
    if (!status) return '';
    if (status.level === 'ahead') {
      return `<span class="sched-chip sched-ahead" data-tooltip="לפני הלו&quot;ז שקבעת">🟢 מקדים${status.delta > 1 ? ` (${status.delta})` : ''}</span>`;
    }
    if (status.level === 'ontrack') {
      return `<span class="sched-chip sched-ontrack" data-tooltip="בקצב שתכננת">🔵 בלו&quot;ז</span>`;
    }
    return `<span class="sched-chip sched-behind" data-tooltip="מאחורי הלו&quot;ז שקבעת">🔴 מאחר${status.delta > 1 ? ` (${status.delta})` : ''}</span>`;
  }

  // ── סטטוס נקודתי למעבר הריענון (נושא שלם, לא סעיף-סעיף) ───
  function computeReviewStatus(t) {
    const plannedDate = getPlannedReviewDate(t);
    if (!plannedDate) return null;
    const today = dateFromStr(todayStr());
    const rs = getReviewState(t.id);
    if (rs.done && rs.date) {
      const delta = Math.round((dateFromStr(rs.date) - plannedDate) / 86400000);
      if (delta < 0) return { level: 'ahead', delta: -delta };
      if (delta === 0) return { level: 'ontrack', delta: 0 };
      return { level: 'behind', delta };
    }
    if (today > plannedDate) {
      const delta = Math.round((today - plannedDate) / 86400000);
      return { level: 'behind', delta };
    }
    return null; // עוד לא הגיע התור — אין צ'יפ
  }

  function reviewChipHTML(status) {
    if (!status) return '';
    if (status.level === 'ahead') return `<span class="sched-chip sched-ahead" data-tooltip="ריענון לפני הזמן">🟢 מקדים</span>`;
    if (status.level === 'ontrack') return `<span class="sched-chip sched-ontrack" data-tooltip="ריענון בזמן">🔵 בזמן</span>`;
    return `<span class="sched-chip sched-behind" data-tooltip="ריענון מאחר">🔴 מאחר${status.delta > 1 ? ` (${status.delta})` : ''}</span>`;
  }

  function reviewRowHTML(t) {
    const rs = getReviewState(t.id);
    const status = computeReviewStatus(t);
    return `
      <div class="brunner-row sched-review-row" data-topic-id="${t.id}" data-tooltip="סמן אחרי שעברת שוב על הנושא במעבר הריענון">
        <input type="checkbox" ${rs.done ? 'checked' : ''}>
        <label class="${rs.done ? 'done' : ''}">🔁 סיימתי ריענון</label>
        ${reviewChipHTML(status)}
      </div>`;
  }

  // ── DOM: per-topic-row chip injection ──────────────────────
  function decorateRows() {
    TOPICS.forEach(t => {
      const row = document.getElementById(`topic-${t.id}`);
      if (!row || !row.cells) return;
      const cell = row.cells[5]; // עמודת הסטטוס הקיימת (הושלם/בתהליך/טרם החל)
      if (!cell) return;
      const existing = cell.querySelector('.sched-chip');
      if (existing) existing.remove();
      if (!state._schedule.enabled) return;
      const ts = getTopicState(t.id);
      const status = computeTopicStatus(t, ts);
      if (status) cell.insertAdjacentHTML('beforeend', chipHTML(status));
    });
  }

  function removeAllChips() {
    document.querySelectorAll('.sched-chip').forEach(el => el.remove());
  }

  // ── DOM: review-row injection (בתוך פאנל הסעיפים המורחב) ───
  function decorateReviewRows() {
    TOPICS.forEach(t => {
      const subRow = document.getElementById(`subrow-${t.id}`);
      if (!subRow) return;
      const container = subRow.querySelector('.sub-col-items');
      if (!container) return;
      const existing = container.querySelector('.sched-review-row');
      if (existing) existing.remove();
      container.insertAdjacentHTML('beforeend', reviewRowHTML(t));
      const row = container.querySelector('.sched-review-row');
      if (row) {
        row.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleScheduleReview(t.id);
        });
      }
    });
  }

  function removeAllReviewRows() {
    document.querySelectorAll('.sched-review-row').forEach(el => el.remove());
  }

  // ── Dashboard summary (כמות אחרי stats-row הקיים) ──────────
  function computePartDashboard(part) {
    const start = state._schedule.startDates[part];
    if (!start) return null;
    const topics = TOPICS.filter(t => t.part === part);
    if (!topics.length) return null;
    const plan = getPlanForPart(part);
    const reviewPlan = getReviewPlanForPart(part);
    const today = dateFromStr(todayStr());
    const startDate = dateFromStr(start);

    let totalSubs = 0, doneSubs = 0, expectedSubs = 0;
    let totalTopics = 0, reviewedTopics = 0, expectedReviewedTopics = 0;
    let lastPass1Offset = -1, lastReviewOffset = -1;

    topics.forEach(t => {
      const ts = getTopicState(t.id);
      const p = plan[t.id];
      totalSubs += t.subs.length;
      lastPass1Offset = Math.max(lastPass1Offset, p.endOffset);
      t.subs.forEach((_, i) => {
        if (ts.subs[i]) doneSubs++;
        if (addDays(startDate, p.subOffsets[i]) <= today) expectedSubs++;
      });

      totalTopics++;
      const rp = reviewPlan[t.id];
      lastReviewOffset = Math.max(lastReviewOffset, rp.endOffset);
      if (getReviewState(t.id).done) reviewedTopics++;
      if (addDays(startDate, rp.endOffset) <= today) expectedReviewedTopics++;
    });

    // "קצב נוכחי" = קצב סעיפים/יום בחלון נע של RECENT_PACE_WINDOW_DAYS הימים
    // האחרונים (מבוסס על תאריכי ההשלמה בפועל ב-subDates), ולא ממוצע מצטבר
    // מתחילת המעקב — כדי שהתחזית תשקף שיפור/האטה אמיתיים ולא תיטשטש עם הזמן.
    // אם המעקב צעיר מ-14 יום, החלון מצטמצם לכל הימים שחלפו (=daysElapsed),
    // כלומר מתנהג בדיוק כמו הממוצע המצטבר הישן עד שיש מספיק נתונים.
    // cutoff הוא גבול תחתון *לא-כולל*: החלון הוא (cutoff, today] — בדיוק
    // effectiveWindowDays ימים. קודם נספרו 15 ימי עבודה וחולקו ב-14, מה
    // שניפח את הקצב בכ-7%. כשהמעקב צעיר מהחלון, הגבול הוא יום לפני תאריך
    // ההתחלה כך שיום ההתחלה עצמו נספר.
    const windowStartRaw = addDays(today, -RECENT_PACE_WINDOW_DAYS);
    const dayBeforeStart = addDays(startDate, -1);
    const cutoff = windowStartRaw > dayBeforeStart ? windowStartRaw : dayBeforeStart;
    const effectiveWindowDays = Math.max(1, Math.round((today - cutoff) / 86400000));
    let recentDone = 0;
    topics.forEach(t => {
      const sd = state._schedule.subDates[t.id];
      if (!sd) return;
      t.subs.forEach((_, i) => {
        const dstr = sd[i];
        if (!dstr) return;
        const d = dateFromStr(dstr);
        if (d > cutoff && d <= today) recentDone++;
      });
    });
    const rate = recentDone / effectiveWindowDays; // subs/day, קצב אחרון

    const remaining = totalSubs - doneSubs;
    const projectedDaysLeft = rate > 0 ? Math.ceil(remaining / rate) : null;
    const projectedFinishDate = projectedDaysLeft !== null ? addDays(today, projectedDaysLeft) : null;
    const plannedFinishDate = addDays(startDate, lastPass1Offset);
    const finishDeltaDays = projectedFinishDate ? Math.round((projectedFinishDate - plannedFinishDate) / 86400000) : null;

    // ── מבחן: ספירה לאחור + האם מסיימים (לימוד + ריענון) לפני המבחן ──
    const examStr = state._schedule.examDates[part];
    const examDate = examStr ? dateFromStr(examStr) : null;
    const daysToExam = examDate ? Math.round((examDate - today) / 86400000) : null;
    // כמה ימי ריענון מתוכננים לחלק הזה (לפי הקצב והמקדם שהוגדרו)
    const reviewDaysPlanned = Math.max(0, lastReviewOffset - lastPass1Offset);
    // מרווח בין סיום הלימוד הצפוי (לפי הקצב בפועל) לבין המבחן
    const examMarginDays = (examDate && projectedFinishDate)
      ? Math.round((examDate - projectedFinishDate) / 86400000)
      : null;

    return {
      part, totalSubs, doneSubs, expectedSubs,
      totalTopics, reviewedTopics, expectedReviewedTopics,
      plannedFinishDate, projectedFinishDate, finishDeltaDays,
      examDate, daysToExam, examMarginDays, reviewDaysPlanned,
    };
  }

  function fmtDate(d) {
    if (!d) return '—';
    return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function dashboardPartHTML(data) {
    const subsAheadBehind = data.doneSubs - data.expectedSubs;
    const subsLabel = subsAheadBehind > 0
      ? `<span class="sched-mini-chip sched-ahead">מקדים (${subsAheadBehind})</span>`
      : subsAheadBehind < 0
        ? `<span class="sched-mini-chip sched-behind">מאחר (${-subsAheadBehind})</span>`
        : `<span class="sched-mini-chip sched-ontrack">בלו"ז</span>`;
    const finishLabel = data.doneSubs === data.totalSubs
      ? 'מעבר הלימוד הושלם ✔️'
      : data.finishDeltaDays === null
        ? (data.doneSubs > 0
            ? `אין התקדמות ב-${RECENT_PACE_WINDOW_DAYS} הימים האחרונים — אין תחזית זמינה`
            : 'אין עדיין מספיק נתונים לתחזית')
        : data.finishDeltaDays === 0
          ? `לפי הקצב הנוכחי: סיום ${fmtDate(data.projectedFinishDate)} (בדיוק בזמן)`
          : data.finishDeltaDays < 0
            ? `לפי הקצב הנוכחי: סיום ${fmtDate(data.projectedFinishDate)} (${-data.finishDeltaDays} ימים לפני המתוכנן)`
            : `לפי הקצב הנוכחי: סיום ${fmtDate(data.projectedFinishDate)} (${data.finishDeltaDays} ימים אחרי המתוכנן)`;
    // ── שורת מבחן: ספירה לאחור + פסיקה האם הקצב מספיק ──
    let examRow = '';
    if (data.examDate) {
      const countdown = data.daysToExam > 0
        ? `בעוד ${data.daysToExam} ימים`
        : data.daysToExam === 0 ? 'היום!' : 'עבר';
      let verdict = '';
      if (data.daysToExam >= 0 && data.doneSubs < data.totalSubs) {
        if (data.examMarginDays === null) {
          verdict = ''; // אין קצב מדוד — אין פסיקה
        } else if (data.examMarginDays < 0) {
          verdict = `<span class="sched-mini-chip sched-behind">בקצב הנוכחי לא מסיימים לפני המבחן (${-data.examMarginDays} ימים חסרים)</span>`;
        } else if (data.examMarginDays < data.reviewDaysPlanned) {
          verdict = `<span class="sched-mini-chip sched-behind">נשארים רק ${data.examMarginDays} ימים לריענון (תוכנן: ${data.reviewDaysPlanned})</span>`;
        } else {
          verdict = `<span class="sched-mini-chip sched-ahead">מספיק: ${data.examMarginDays} ימים לריענון לפני המבחן</span>`;
        }
      }
      examRow = `
        <div class="sched-dash-row">
          <span>🎓 מבחן: ${fmtDate(data.examDate)} · ${countdown}</span>
          ${verdict}
        </div>`;
    }

    return `
      <div class="sched-dash-part">
        <div class="sched-dash-part-title">חלק ${data.part}׳</div>
        ${examRow}
        <div class="sched-dash-row">
          <span>לימוד: ${data.doneSubs}/${data.totalSubs} סעיפים (ציפייה להיום: ${data.expectedSubs})</span>
          ${subsLabel}
        </div>
        <div class="sched-dash-row">
          <span>ריענון: ${data.reviewedTopics}/${data.totalTopics} נושאים (ציפייה להיום: ${data.expectedReviewedTopics})</span>
        </div>
        <div class="sched-dash-forecast">${finishLabel}</div>
      </div>`;
  }

  function renderDashboard() {
    const dataA = computePartDashboard('א');
    const dataB = computePartDashboard('ב');
    if (!dataA && !dataB) { removeDashboard(); return; }
    let el = document.getElementById('sched-dashboard');
    if (!el) {
      el = document.createElement('div');
      el.id = 'sched-dashboard';
      el.className = 'sched-dashboard';
      const anchor = document.querySelector('.stats-row');
      if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(el, anchor.nextSibling);
      else document.body.insertBefore(el, document.body.firstChild);
    }
    el.innerHTML = `<div class="sched-dash-header">📅 מעקב לו"ז</div>` +
      (dataA ? dashboardPartHTML(dataA) : '') +
      (dataB ? dashboardPartHTML(dataB) : '');
  }

  function removeDashboard() {
    const el = document.getElementById('sched-dashboard');
    if (el) el.remove();
  }

  function decorate() {
    ensureDefaults();
    ensureSidebarButton();
    if (!state._schedule.enabled) {
      removeAllChips();
      removeAllReviewRows();
      removeDashboard();
      return;
    }
    decorateRows();
    decorateReviewRows();
    renderDashboard();
  }

  // ── Settings UI (כפתור בסיידבר + מודל) ─────────────────────
  // מוזרק כילד ראשון של .sidebar-footer — כלומר מיד אחרי רשימת הנושאים
  // (.sidebar-nav) ולפני הכפתורים הקיימים (שמור/טען/אפס/עזרה), בדיוק איפה
  // שרפי ביקש. משתמשים ב-class sb-btn הקיים כדי שהכפתור ייראה זהה לשאר
  // כפתורי הסיידבר (כולל תמיכה במצב כהה/בהיר) בלי להוסיף CSS חדש בשביל זה.
  // לא fixed/floating יותר — כך שגם ההתנגשויות עם ה-mobile-bottom-nav
  // ועם ה-save-toast (ר' schedule.css) כבר לא רלוונטיות; במובייל הכפתור
  // נגיש בדיוק כמו שאר כפתורי הסיידבר, דרך תפריט ה-☰.
  function ensureSidebarButton() {
    if (document.getElementById('sched-sidebar-btn')) return;
    const footer = document.querySelector('.sidebar-footer');
    if (!footer) return; // מבנה לא נמצא — מדלגים, לא קריטי
    const btn = document.createElement('button');
    btn.id = 'sched-sidebar-btn';
    btn.className = 'sb-btn';
    btn.type = 'button';
    btn.setAttribute('data-tooltip', 'הגדרות מעקב לו"ז — תאריך התחלה, קצב יומי וסטטוס לכל נושא');
    btn.innerHTML = `<span class="material-icons">event</span> מעקב לו"ז`;
    btn.addEventListener('click', openSettingsPanel);
    footer.insertAdjacentElement('afterbegin', btn);
  }

  function closeSettingsPanel() {
    const el = document.getElementById('sched-overlay');
    if (el) el.remove();
  }

  // ── Help modal: מוסיף סעיף תיעוד לפאנל "הוראות שימוש" הקיים ──
  // מוזרק דרך JS (לא נערך בתוך index.html עצמו) כדי לשמור על אותו עיקרון
  // הפרדה שהפיצ'ר כולו בנוי עליו. רץ פעם אחת בהתקנה, לא תלוי במצב enabled —
  // זו תיעוד סטטי, לא UI דינמי, אז אין צורך להסתיר/להציג אותו לפי הכפתור.
  function injectHelpSection() {
    if (document.getElementById('sched-help-section')) return;
    const body = document.querySelector('#helpOverlay .help-body');
    if (!body) return; // המבנה הקיים לא נמצא — לא קריטי, רק מדלגים
    body.insertAdjacentHTML('beforeend', `
      <div id="sched-help-section">
        <h2>מעקב לו"ז (חדש)</h2>
        <p>תוסף אופציונלי — כבוי כברירת מחדל — שמוסיף תזמון וציוני דרך על גבי המעקב הקיים.</p>
        <h3><span class="material-icons">event</span> הפעלה</h3>
        <p>כפתור <strong>"מעקב לו&quot;ז"</strong> בתחתית הסרגל השמאלי (מתחת לרשימת הנושאים, ליד שמור/טען/אפס) פותח פאנל הגדרות: הפעל/כבה, תאריך התחלה לחלק א׳ (ואופציונלית לחלק ב׳), תאריכי המבחנים של שני החלקים, וקצב לימוד יומי בשעות — בנפרד למעבר הלמידה ולמעבר הריענון.</p>
        <h3><span class="material-icons">school</span> ספירה לאחור למבחן</h3>
        <p>הדשבורד מציג לכל חלק את תאריך המבחן, כמה ימים נותרו, והאם בקצב הנוכחי מסיימים את הלימוד עם מספיק ימי ריענון לפני המבחן.</p>
        <h3><span class="material-icons">flag</span> צ'יפ סטטוס לכל נושא</h3>
        <ul>
          <li>🟢 מקדים — עברת יותר סעיפים ממה שהיה מתוכנן עד היום.</li>
          <li>🔵 בלו"ז — בדיוק בקצב שתכננת.</li>
          <li>🔴 מאחר — פחות סעיפים ממה שהיה אמור להיות מוכן עד היום.</li>
        </ul>
        <h3><span class="material-icons">autorenew</span> מעבר ריענון</h3>
        <p>בפאנל המורחב של כל נושא מופיעה שורת <strong>"סיימתי ריענון"</strong> — סימון נפרד למעבר חזרה שני, עם תאריך וצ'יפ סטטוס משלו.</p>
        <h3><span class="material-icons">insights</span> דשבורד סיכום</h3>
        <p>מעל הטבלה מופיע כרטיס שמסכם סעיפים/נושאים שהושלמו מול הצפי היומי, ותחזית תאריך סיום לפי הקצב הנוכחי שלך.</p>
        <div class="help-tip">
          <span class="material-icons">info</span>
          כיבוי הפיצ'ר רק מסתיר את התצוגה — כל תאריך שכבר נרשם נשמר, ויחזור להופיע בהדלקה חוזרת. הנתונים חיים בתוך אותו progress.json הקיים.
        </div>
      </div>
    `);
  }

  function openSettingsPanel() {
    ensureDefaults();
    closeSettingsPanel();
    const s = state._schedule;

    const overlay = document.createElement('div');
    overlay.id = 'sched-overlay';
    overlay.className = 'sched-overlay';
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeSettingsPanel(); });

    overlay.innerHTML = `
      <div class="sched-panel" role="dialog" aria-label="הגדרות מעקב לו&quot;ז">
        <h3>📅 מעקב לו"ז</h3>
        <label class="sched-toggle-row">
          <input type="checkbox" id="sched-enabled" ${s.enabled ? 'checked' : ''}>
          <span>הפעל מעקב לו"ז</span>
        </label>
        <div class="sched-fields">
          <label>תאריך התחלה — חלק א׳
            <input type="date" id="sched-start-a" value="${s.startDates['א'] || ''}">
          </label>
          <label>תאריך התחלה — חלק ב׳ <span class="sched-optional">(אופציונלי, אפשר למלא בהמשך)</span>
            <input type="date" id="sched-start-b" value="${s.startDates['ב'] || ''}">
          </label>
          <label>🎓 תאריך מבחן — חלק א׳
            <input type="date" id="sched-exam-a" value="${s.examDates['א'] || ''}">
          </label>
          <label>🎓 תאריך מבחן — חלק ב׳
            <input type="date" id="sched-exam-b" value="${s.examDates['ב'] || ''}">
          </label>
          <label>קצב לימוד יומי — מעבר ראשון (שעות)
            <input type="number" id="sched-pace" step="0.5" min="0.5" value="${s.paceHoursPerDay}">
          </label>
          <label>קצב לימוד יומי — ריענון (שעות)
            <input type="number" id="sched-pace-review" step="0.5" min="0.5" value="${s.paceHoursPerDayReview}">
          </label>
        </div>
        <p class="sched-note">💡 אם תכבה את המעקב — הצ'יפים ייעלמו, אבל כל התאריכים שכבר נרשמו יישמרו, ויחזרו להופיע ברגע שתדליק שוב.</p>
        <div class="sched-actions">
          <button type="button" id="sched-save" class="sched-btn-primary">שמור</button>
          <button type="button" id="sched-cancel" class="sched-btn-secondary">ביטול</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('sched-save').addEventListener('click', () => {
      ensureDefaults();
      const s2 = state._schedule;
      s2.enabled = document.getElementById('sched-enabled').checked;
      const startA = document.getElementById('sched-start-a').value;
      const startB = document.getElementById('sched-start-b').value;
      s2.startDates['א'] = startA || null;
      s2.startDates['ב'] = startB || null;
      const examA = document.getElementById('sched-exam-a').value;
      const examB = document.getElementById('sched-exam-b').value;
      s2.examDates['א'] = examA || null;
      s2.examDates['ב'] = examB || null;
      const pace = parseFloat(document.getElementById('sched-pace').value);
      s2.paceHoursPerDay = isFinite(pace) && pace > 0 ? pace : 2.5;
      const paceReview = parseFloat(document.getElementById('sched-pace-review').value);
      s2.paceHoursPerDayReview = isFinite(paceReview) && paceReview > 0 ? paceReview : 1.5;
      // reset plan caches since pace/topics may have changed
      Object.keys(planCache).forEach(k => delete planCache[k]);
      Object.keys(reviewPlanCache).forEach(k => delete reviewPlanCache[k]);
      closeSettingsPanel();
      if (typeof saveState === 'function') { try { saveState(); } catch (e) { /* noop */ } }
      if (typeof renderAll === 'function') { try { renderAll(); } catch (e) { decorate(); } }
      else { decorate(); }
    });
    document.getElementById('sched-cancel').addEventListener('click', closeSettingsPanel);
  }

  // ── Hook into the app via its official extension hooks ─────
  // app.js (שנטען לפנינו) חושף onAfterRender / onBeforeSubToggle /
  // onBeforeTopicToggle — אין יותר עטיפת פונקציות גלובליות (monkey-patching),
  // כך ששינוי שמות פנימי ב-app.js לא ישבור אותנו בשקט.
  function install() {
    if (typeof window.onAfterRender !== 'function') {
      console.error('[schedule] app hooks not found — was app.js loaded first?');
      return;
    }
    if (window.__scheduleInstalled) return;
    window.__scheduleInstalled = true;

    onAfterRender(decorate);

    onBeforeSubToggle((topicId, subIdx, willBeDone) => {
      ensureDefaults();
      stampSub(topicId, subIdx, willBeDone);
    });

    onBeforeTopicToggle((id, willBeDone) => {
      ensureDefaults();
      if (willBeDone) {
        stampAllSubs(id);
      } else {
        // הנושא מבוטל — האפליקציה הראשית מנקה גם את כל הסעיפים,
        // אז מוחקים גם את תאריכי ההשלמה שלהם (אחרת תחזית הקצב תספור אותם).
        const t = TOPICS.find(x => x.id === id);
        if (t) t.subs.forEach((_, i) => stampSub(id, i, false));
      }
    });

    // ה-renderAll הראשוני של האפליקציה כבר רץ לפני שהקובץ הזה נטען —
    // לכן קוראים ל-decorate פעם אחת ידנית כדי "לתפוס" את המצב הנוכחי מיד.
    ensureDefaults();
    decorate();
    injectHelpSection();

    window.Schedule = { decorate, stampSub, stampAllSubs, stampReview, toggleScheduleReview, openSettingsPanel };
  }

  install();
})();
