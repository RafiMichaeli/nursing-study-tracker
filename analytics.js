/*
 * analytics.js — אנליטיקת לימוד (קצב נדרש, burndown, heatmap)
 * -------------------------------------------------------------
 * מודול עצמאי בסגנון schedule.js: נטען אחרי app.js/schedule.js ומתחבר דרך
 * onAfterRender. קורא נתונים שכבר קיימים — state (סעיפים), state._schedule
 * (תאריכי השלמה, תאריכי מבחן) — ולא כותב שום דבר חדש ל-state מלבד
 * העדפת קיפול הפאנל (localStorage בלבד, לא progress.json).
 * עובד גם כשמעקב הלו"ז כבוי: תאריכי ההשלמה נרשמים דרך ה-hooks בכל מקרה.
 */
(function () {
  'use strict';

  const LS_COLLAPSED = 'mevak_analytics_collapsed';
  const PACE_WINDOW_DAYS = 14;      // כמו schedule.js
  const HEATMAP_MAX_WEEKS = 16;

  // ── date helpers (local, no TZ drift) ──────────────────────
  function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function dateFromStr(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
  function addDays(dt, n) { const d = new Date(dt); d.setDate(d.getDate() + n); return d; }
  function dayDiff(a, b) { return Math.round((a - b) / 86400000); }
  function fmtShort(d) { return d.toLocaleDateString(I18N.locale(), { day: '2-digit', month: '2-digit' }); }

  function sched() { return (typeof state === 'object' && state && state._schedule) ? state._schedule : {}; }

  // כל תאריכי ההשלמה של חלק נתון (או של הכול, part=null): מערך "YYYY-MM-DD"
  function stampDates(part) {
    const sd = sched().subDates || {};
    const out = [];
    TOPICS.forEach(t => {
      if (part && t.part !== part) return;
      const m = sd[t.id];
      if (!m) return;
      Object.values(m).forEach(dstr => { if (dstr) out.push(dstr); });
    });
    return out.sort();
  }

  // ── 1. קצב נדרש מול קצב בפועל ─────────────────────────────
  function partPace(part) {
    const topics = TOPICS.filter(t => t.part === part);
    let totalSubs = 0, doneSubs = 0;
    topics.forEach(t => {
      const ts = getTopicState(t.id);
      totalSubs += t.subs.length;
      doneSubs += t.subs.filter((_, i) => ts.subs[i]).length;
    });
    const remaining = totalSubs - doneSubs;

    const examStr = (sched().examDates || {})[part];
    const examDate = examStr ? dateFromStr(examStr) : null;
    const today = dateFromStr(todayStr());
    const daysToExam = examDate ? dayDiff(examDate, today) : null;
    const requiredPace = (daysToExam !== null && daysToExam > 0) ? remaining / daysToExam : null;

    // קצב בפועל בחלון נע — גבול תחתון לא-כולל, כמו schedule.js
    const stamps = stampDates(part);
    const startStr = (sched().startDates || {})[part] || stamps[0] || null;
    let actualPace = null;
    if (startStr) {
      const windowStartRaw = addDays(today, -PACE_WINDOW_DAYS);
      const dayBeforeStart = addDays(dateFromStr(startStr), -1);
      const cutoff = windowStartRaw > dayBeforeStart ? windowStartRaw : dayBeforeStart;
      const days = Math.max(1, dayDiff(today, cutoff));
      const recent = stamps.filter(s => { const d = dateFromStr(s); return d > cutoff && d <= today; }).length;
      actualPace = recent / days;
    }
    return { part, totalSubs, doneSubs, remaining, examDate, daysToExam, requiredPace, actualPace, startStr };
  }

  function paceRowHTML(p) {
    if (!p.totalSubs) return '';
    if (p.remaining === 0) {
      return `<div class="anx-pace-row"><b>${partLabel(p.part)}:</b> ${t('anx.partAllDone')}</div>`;
    }
    if (p.requiredPace === null) {
      return `<div class="anx-pace-row"><b>${partLabel(p.part)}:</b> ${t('anx.remainNoExam', { n: p.remaining })}</div>`;
    }
    const req = p.requiredPace;
    const act = p.actualPace;
    const chip = act === null ? ''
      : act >= req
        ? `<span class="sched-mini-chip sched-ahead">${t('anx.enough')}</span>`
        : `<span class="sched-mini-chip sched-behind">${t('anx.short', { n: (req - act).toFixed(1) })}</span>`;
    return `
      <div class="anx-pace-row">
        <b>${partLabel(p.part)}:</b>
        ${t('anx.row', { r: p.remaining, d: p.daysToExam, req: req.toFixed(1) })}${act !== null ? t('anx.actualPart', { w: PACE_WINDOW_DAYS, act: act.toFixed(1) }) : ''}
        ${chip}
      </div>`;
  }

  // ── 2. Burndown ─────────────────────────────────────────────
  const burnCharts = {}; // part -> Chart

  function renderBurndown(part, canvasId) {
    const ctx = document.getElementById(canvasId);
    if (!ctx || typeof Chart === 'undefined') return;
    const p = partPace(part);
    const stamps = stampDates(part);
    if (!p.startStr && !stamps.length) return;

    const today = dateFromStr(todayStr());
    const startRef = dateFromStr(p.startStr || stamps[0]);
    const endRef = p.examDate && p.examDate > today ? p.examDate : addDays(today, 7);
    const nDays = Math.max(1, dayDiff(endRef, startRef));

    // ספירת השלמות מצטברת ליום
    const perDay = {};
    stamps.forEach(s => { perDay[s] = (perDay[s] || 0) + 1; });

    const labels = [], actual = [], ideal = [];
    let done = 0;
    for (let i = 0; i <= nDays; i++) {
      const d = addDays(startRef, i);
      labels.push(fmtShort(d));
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (d <= today) { done += (perDay[key] || 0); actual.push(p.totalSubs - done); }
      else actual.push(null);
      ideal.push(p.examDate ? Math.max(0, Math.round((p.totalSubs * (1 - i / nDays)) * 10) / 10) : null);
    }

    const dark = document.documentElement.getAttribute('data-theme') !== 'light';
    const sig = JSON.stringify({ dark, labels: labels.length, actual, e: !!p.examDate, lang: I18N.lang });
    if (burnCharts[part] && burnCharts[part]._sig === sig) return;
    if (burnCharts[part]) burnCharts[part].destroy();

    const gridColor = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const textColor = dark ? '#c8cdd8' : '#495057';
    burnCharts[part] = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: t('anx.actualSeries'), data: actual, borderColor: part === 'א' ? '#4f80ff' : '#a78bfa', backgroundColor: 'transparent', pointRadius: 0, borderWidth: 2, stepped: true },
          { label: t('anx.idealSeries'), data: ideal, borderColor: '#1cbb8c', backgroundColor: 'transparent', pointRadius: 0, borderWidth: 1.5, borderDash: [6, 4] },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false, animation: false,
        plugins: { legend: { labels: { color: textColor, font: { size: 10 }, boxWidth: 14 } }, tooltip: { rtl: I18N.isRTL() } },
        scales: {
          x: { ticks: { color: textColor, font: { size: 9 }, maxTicksLimit: 8 }, grid: { color: gridColor } },
          y: { beginAtZero: true, ticks: { color: textColor, font: { size: 9 } }, grid: { color: gridColor } },
        },
      },
    });
    burnCharts[part]._sig = sig;
  }

  // ── 3. Heatmap ──────────────────────────────────────────────
  function heatLevel(n) { return n === 0 ? 0 : n <= 2 ? 1 : n <= 4 ? 2 : n <= 7 ? 3 : 4; }

  function heatmapHTML() {
    const all = stampDates(null);
    const perDay = {};
    all.forEach(s => { perDay[s] = (perDay[s] || 0) + 1; });

    const today = dateFromStr(todayStr());
    // התחלה: יום ראשון של השבוע, עד HEATMAP_MAX_WEEKS שבועות אחורה
    let start = addDays(today, -(HEATMAP_MAX_WEEKS * 7 - 1));
    if (all.length && dateFromStr(all[0]) > start) start = dateFromStr(all[0]);
    start = addDays(start, -start.getDay()); // ליישר ליום ראשון

    let html = `<div class="anx-heatmap" data-tooltip="${t('anx.heatTooltip')}">`;
    for (let w = 0; ; w++) {
      const weekStart = addDays(start, w * 7);
      if (weekStart > today) break;
      html += '<div class="anx-hm-week">';
      for (let d = 0; d < 7; d++) {
        const day = addDays(weekStart, d);
        if (day > today) { html += '<div class="anx-hm-cell anx-hm-future"></div>'; continue; }
        const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
        const n = perDay[key] || 0;
        html += `<div class="anx-hm-cell anx-hm-${heatLevel(n)}" title="${t('anx.cellTitle', { date: fmtShort(day), n })}"></div>`;
      }
      html += '</div>';
    }
    html += '</div>';
    return html;
  }

  // ── Panel ───────────────────────────────────────────────────
  function isCollapsed() { try { return localStorage.getItem(LS_COLLAPSED) === '1'; } catch { return false; } }
  function setCollapsed(v) { try { localStorage.setItem(LS_COLLAPSED, v ? '1' : '0'); } catch {} }

  let lastSig = null;

  function render(force) {
    let el = document.getElementById('anx-panel');
    if (!el) {
      el = document.createElement('div');
      el.id = 'anx-panel';
      el.className = 'anx-panel';
      const anchor = document.getElementById('sched-dashboard') || document.querySelector('.stats-row');
      if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(el, anchor.nextSibling);
      else return;
      force = true;
    } else {
      // אם הדשבורד של הלו"ז הופיע/נעלם — לשמור על הפאנל צמוד אחריו
      const anchor = document.getElementById('sched-dashboard');
      if (anchor && anchor.nextSibling !== el && anchor.parentNode) anchor.parentNode.insertBefore(el, anchor.nextSibling);
    }

    const collapsed = isCollapsed();
    const pA = partPace('א'), pB = partPace('ב');
    const hasAny = stampDates(null).length > 0 || pA.doneSubs || pB.doneSubs;

    // לרנדר מחדש (כולל גרפים) רק כשמשהו שהפאנל מציג באמת השתנה —
    // אחרת כל קליק על צ'קבוקס היה בונה מחדש שני גרפים ו-heatmap.
    const dark = document.documentElement.getAttribute('data-theme') !== 'light';
    const sig = JSON.stringify({ collapsed, dark, hasAny, a: [pA.doneSubs, pA.remaining, pA.daysToExam], b: [pB.doneSubs, pB.remaining, pB.daysToExam], n: stampDates(null).length, lang: I18N.lang });
    if (!force && sig === lastSig) return;
    lastSig = sig;
    Object.keys(burnCharts).forEach(k => { if (burnCharts[k]) { try { burnCharts[k].destroy(); } catch {} } delete burnCharts[k]; });

    el.innerHTML = `
      <div class="anx-header" id="anx-toggle">
        <span>${t('anx.title')}</span>
        <span class="material-icons anx-chev">${collapsed ? 'expand_more' : 'expand_less'}</span>
      </div>
      <div class="anx-body" style="${collapsed ? 'display:none' : ''}">
        ${paceRowHTML(pA)}
        ${paceRowHTML(pB)}
        ${hasAny ? `
          <div class="anx-charts">
            <div class="anx-chart-wrap"><div class="anx-chart-title">Burndown — ${partLabel('א')}</div><canvas id="anx-burn-a"></canvas></div>
            <div class="anx-chart-wrap"><div class="anx-chart-title">Burndown — ${partLabel('ב')}</div><canvas id="anx-burn-b"></canvas></div>
          </div>
          <div class="anx-hm-title">${t('anx.heatTitle')}</div>
          ${heatmapHTML()}
        ` : `<div class="anx-empty">${t('anx.empty')}</div>`}
      </div>`;

    const toggle = document.getElementById('anx-toggle');
    if (toggle) toggle.addEventListener('click', () => { setCollapsed(!isCollapsed()); render(true); });

    if (!collapsed && hasAny) {
      renderBurndown('א', 'anx-burn-a');
      renderBurndown('ב', 'anx-burn-b');
    }
  }

  // ── install ─────────────────────────────────────────────────
  if (typeof window.onAfterRender !== 'function') {
    console.error('[analytics] app hooks not found — was app.js loaded first?');
    return;
  }
  onAfterRender(() => render(false));
  render(true);

  window.Analytics = { render, partPace };
})();
