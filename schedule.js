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
 * וצ'יפ סטטוס פר-נושא (מקדים / בלו"ז / מאחר) המבוסס על תאריך מתוכנן
 * שמחושב באופן יחסי לפי משקל השעות (t.hours) של כל נושא.
 * לא כלול עדיין (מתוכנן להמשך): מעבר ריענון נפרד, דשבורד סיכום כללי.
 */
(function () {
  'use strict';

  const STORAGE_LOCAL_BACKUP_KEY = 'nursingSchedule_adult_settingsBackup';

  // ── Defaults / migration ──────────────────────────────────
  function ensureDefaults() {
    if (typeof state === 'undefined' || !state) return; // main app not ready yet
    if (!state._schedule) {
      state._schedule = { enabled: false, startDates: {}, paceHoursPerDay: 2.5, subDates: {} };
    }
    const s = state._schedule;
    if (!s.startDates || typeof s.startDates !== 'object') s.startDates = {};
    if (typeof s.paceHoursPerDay !== 'number' || !isFinite(s.paceHoursPerDay) || s.paceHoursPerDay <= 0) {
      s.paceHoursPerDay = 2.5;
    }
    if (!s.subDates || typeof s.subDates !== 'object') s.subDates = {};
    if (typeof s.enabled !== 'boolean') s.enabled = false;
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

  function decorate() {
    ensureDefaults();
    ensureFloatingButton();
    if (!state._schedule.enabled) {
      removeAllChips();
      return;
    }
    decorateRows();
  }

  // ── Settings UI (כפתור צף + מודל) ──────────────────────────
  function ensureFloatingButton() {
    if (document.getElementById('sched-fab')) return;
    const btn = document.createElement('button');
    btn.id = 'sched-fab';
    btn.className = 'sched-fab';
    btn.type = 'button';
    btn.title = 'מעקב לו"ז';
    btn.setAttribute('aria-label', 'הגדרות מעקב לו"ז');
    btn.textContent = '📅';
    btn.addEventListener('click', openSettingsPanel);
    document.body.appendChild(btn);
  }

  function closeSettingsPanel() {
    const el = document.getElementById('sched-overlay');
    if (el) el.remove();
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
          <label>קצב לימוד יומי (שעות)
            <input type="number" id="sched-pace" step="0.5" min="0.5" value="${s.paceHoursPerDay}">
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
      const pace = parseFloat(document.getElementById('sched-pace').value);
      s2.paceHoursPerDay = isFinite(pace) && pace > 0 ? pace : 2.5;
      // reset plan cache since pace/topics may have changed
      Object.keys(planCache).forEach(k => delete planCache[k]);
      closeSettingsPanel();
      if (typeof saveState === 'function') { try { saveState(); } catch (e) { /* noop */ } }
      if (typeof renderAll === 'function') { try { renderAll(); } catch (e) { decorate(); } }
      else { decorate(); }
    });
    document.getElementById('sched-cancel').addEventListener('click', closeSettingsPanel);
  }

  // ── Hook into the existing app (no edits to the main file) ─
  function install() {
    if (typeof window.renderAll !== 'function' || typeof window.toggleSub !== 'function' || typeof window.toggleTopic !== 'function') {
      // המסך הראשי עדיין לא סיים לטעון — ננסה שוב בעוד רגע
      setTimeout(install, 50);
      return;
    }
    if (window.__scheduleInstalled) return;
    window.__scheduleInstalled = true;

    const _renderAll = window.renderAll;
    window.renderAll = function (...args) {
      const r = _renderAll.apply(this, args);
      try { decorate(); } catch (e) { console.error('[schedule] decorate failed', e); }
      return r;
    };

    const _toggleSub = window.toggleSub;
    window.toggleSub = function (topicId, subIdx, e) {
      try {
        ensureDefaults();
        const willBeDone = !getTopicState(topicId).subs[subIdx];
        stampSub(topicId, subIdx, willBeDone);
      } catch (err) { console.error('[schedule] stampSub failed', err); }
      return _toggleSub.apply(this, arguments);
    };

    const _toggleTopic = window.toggleTopic;
    window.toggleTopic = function (id, e) {
      try {
        ensureDefaults();
        const willBeDone = !getTopicState(id).done;
        if (willBeDone) stampAllSubs(id);
      } catch (err) { console.error('[schedule] stampAllSubs failed', err); }
      return _toggleTopic.apply(this, arguments);
    };

    // ה-renderAll הראשוני של האפליקציה כבר רץ (loadState()+renderAll() בסוף
    // הסקריפט הראשי, שרץ לפני שהקובץ הזה נטען) — לכן קוראים ל-decorate פעם
    // אחת ידנית כדי "לתפוס" את המצב הנוכחי מיד.
    ensureDefaults();
    decorate();

    window.Schedule = { decorate, stampSub, stampAllSubs, openSettingsPanel };
  }

  install();
})();
