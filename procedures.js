/*
 * procedures.js — מעקב קריאת נהלי עבודה (נהלים קריטיים)
 * -------------------------------------------------------------
 * פיצ'ר עצמאי, נטען כ-<script> רגיל אחרי app.js (ר' index.html).
 * אינו נוגע בלוגיקת הנושאים — הוא "מתחבר" לאפליקציה כך:
 *   1. הנתונים חיים בתוך state._procedures, כלומר נשמרים אוטומטית
 *      עם שאר ההתקדמות (localStorage + "שמור התקדמות" ל-progress.json)
 *      בלי לגעת בפונקציות השמירה/טעינה.
 *   2. נרשם ל-onAfterRender() (hook רשמי מ-app.js) כדי לרענן את
 *      הבאדג' בכפתור הסרגל — בלי monkey-patching.
 *
 * הקבצים עצמם יושבים ב-Google Drive (כמו שאר חומרי הקורס ב-links.js),
 * כך שהקישורים עובדים גם מהאתר המפורסם וגם מהמכשיר הנייד. עותק מקומי
 * של אותם קבצים נמצא בתיקייה "נהלים לקריאה/" והיא ב-.gitignore.
 *
 * תוכן הנהלים נשאר בעברית גם כשה-UI מתורגם — בדיוק כמו שמות הנושאים.
 */
(function () {
  'use strict';

  // ── Data ───────────────────────────────────────────────────
  // num / name / domain / updated / pages נלקחו מעמוד השער של כל נוהל.
  // driveId — מזהה הקובץ ב-Google Drive (תיקיית "נהלים לקריאה").
  const PROCEDURES = [
    { id: '01', num: '02-009', name: 'טיפול ומניעת אירועים חריגים',
      domain: 'בטיחות המטופל', updated: 'ינואר 2025', pages: 28,
      driveId: '1an5odftouzj8wCvs7d3WA3hUJs1piBrw' },
    { id: '02', num: '01.2.8', name: 'העברת מטופל במצב קריטי מיעד ליעד',
      domain: 'רפואה ואחיות', updated: 'אוקטובר 2025', pages: 23,
      driveId: '1GjPjJiU3W0M0axElaig98TIycB5annUV' },
    { id: '03', num: '3', name: 'היגיינת ידיים',
      domain: 'אפידמיולוגיה ומניעת זיהומים', updated: 'אוקטובר 2025', pages: 17,
      driveId: '1Xr4qx0L6vTaItTrjl9TZq5WtL_x-omCV' },
    { id: '04', num: '03.13', name: 'החייאה',
      domain: 'בטיחות המטופל', updated: 'דצמבר 2023', pages: 61,
      driveId: '1bGViAGFEdTx-O8Yc5z2jskR3Ox4AwLVH' },
    { id: '05', num: '002-01', name: 'הערכה, מעקב, העברה ושחרור מטופלים',
      domain: 'הנהלת ביה"ח', updated: 'ספטמבר 2024', pages: 114,
      driveId: '1gP2wV_qPAg_Dx4WJnFARs8sECadTztu9' },
    { id: '06', num: '02-032', name: 'נטילת דגימות לסוג וסקר ומתן דם ומוצריו',
      domain: 'רפואה', updated: 'אוגוסט 2025', pages: 32,
      driveId: '1jr_eKKbqQ3tNTkdNiPx0LWUkZ2m0x9oT' },
    { id: '07', num: '01.2.9', name: 'זיהוי מטופלים במערך האשפוז ובמערך האמבולטורי',
      domain: 'הנהלה', updated: 'נובמבר 2024', pages: 18,
      driveId: '1SIXl8pk1e6AIfDDumKkePZkdr9U1hpNJ' },
    { id: '08', num: '03.7.2', name: 'ניהול מלאי ומתן סמים מסוכנים במערך האשפוז ובמערך האמבולטורי',
      domain: 'טיפול תרופתי', updated: 'דצמבר 2024', pages: 18,
      driveId: '1F2wM1P0zd4y5vrob9Kh7cTmHHHCkSlv5' },
    { id: '09', num: '03.7.1', name: 'ניהול הטיפול התרופתי',
      domain: 'רפואה ואחיות', updated: 'אוגוסט 2025', pages: 89,
      driveId: '1pAITiZCnn6OK2QMY-txI5ICiu5Z_CPu-' },
  ];

  // טופס ההצהרה שנחתם אחרי קריאת כל הנהלים (Google Doc, לא PDF)
  const SIGNATURE_DOC_ID = '1wj9BDPtam-y755665X2hnDRA7RTl3kwI3eS0t1YLyqc';
  const DRIVE_FOLDER_ID = '19SP-DQQ8TX7wpiH2c9o1hcB1ehWlnSxS';

  const fileUrl = (id) => `https://drive.google.com/file/d/${id}/view`;
  const docUrl = (id) => `https://docs.google.com/document/d/${id}/edit`;
  const folderUrl = (id) => `https://drive.google.com/drive/folders/${id}`;

  // ── i18n helper ────────────────────────────────────────────
  // נופל חזרה לעברית אם I18N עדיין לא נטען (למשל בבדיקות).
  function tr(key, fallback) {
    try { if (typeof t === 'function') { const s = t(key); if (s && s !== key) return s; } } catch {}
    return fallback;
  }

  // ── State ──────────────────────────────────────────────────
  // state._procedures = { "01": { read: true, date: "2026-07-26" }, ... }
  function ensureDefaults() {
    if (typeof state === 'undefined' || !state) return null;
    if (!state._procedures || typeof state._procedures !== 'object' || Array.isArray(state._procedures)) {
      state._procedures = {};
    }
    return state._procedures;
  }
  function getProcState(id) {
    const p = ensureDefaults();
    if (!p) return { read: false, date: null };
    if (!p[id] || typeof p[id] !== 'object') p[id] = { read: false, date: null };
    return p[id];
  }

  function todayStr() {
    if (typeof localDateStr === 'function') return localDateStr();
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // ── Derived numbers ────────────────────────────────────────
  const TOTAL_PAGES = PROCEDURES.reduce((s, p) => s + p.pages, 0);

  function stats() {
    let readCount = 0, readPages = 0;
    PROCEDURES.forEach(p => {
      if (getProcState(p.id).read) { readCount++; readPages += p.pages; }
    });
    return {
      readCount, total: PROCEDURES.length,
      readPages, totalPages: TOTAL_PAGES,
      pct: PROCEDURES.length ? Math.round((readCount / PROCEDURES.length) * 100) : 0,
      allRead: readCount === PROCEDURES.length,
    };
  }

  // ── Toggle ─────────────────────────────────────────────────
  function toggleProcedure(id) {
    const ps = getProcState(id);
    ps.read = !ps.read;
    ps.date = ps.read ? todayStr() : null;
    if (typeof saveState === 'function') saveState();
    render();
    syncBadge();
  }

  // ── Render ─────────────────────────────────────────────────
  function esc(s) {
    return String(s).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function render() {
    const body = document.getElementById('proceduresBody');
    if (!body) return;
    const st = stats();

    const rows = PROCEDURES.map(p => {
      const ps = getProcState(p.id);
      return `
      <tr class="proc-tr${ps.read ? ' is-read' : ''}" id="proc-tr-${p.id}">
        <td class="proc-check-cell">
          <span class="proc-check${ps.read ? ' checked' : ''}" role="checkbox"
                tabindex="0" aria-checked="${ps.read}"
                data-proc-toggle="${p.id}"
                aria-label="${esc(p.name)}"></span>
        </td>
        <td class="proc-num">${esc(p.num)}</td>
        <td class="proc-name-cell">
          <a class="proc-name" href="${fileUrl(p.driveId)}" target="_blank" rel="noopener">${esc(p.name)}</a>
          <span class="proc-domain">${esc(p.domain)}</span>
        </td>
        <td class="proc-meta">${esc(p.updated)}</td>
        <td class="proc-meta proc-pages">${p.pages}</td>
        <td class="proc-meta proc-date">${ps.read && ps.date ? esc(ps.date) : '—'}</td>
      </tr>`;
    }).join('');

    body.innerHTML = `
      <div class="proc-summary">
        <div class="proc-summary-top">
          <span class="proc-summary-label">${esc(tr('proc.readCount', 'נהלים שנקראו'))}</span>
          <span class="proc-summary-pct">${st.readCount}/${st.total} · ${st.pct}%</span>
        </div>
        <div class="proc-bar-bg"><div class="proc-bar-fill" style="width:${st.pct}%"></div></div>
        <div class="proc-summary-sub">${st.readPages}/${st.totalPages} ${esc(tr('proc.pages', 'עמודים'))}</div>
      </div>

      <table class="proc-table">
        <thead>
          <tr>
            <th class="proc-check-cell"></th>
            <th>${esc(tr('proc.col.num', 'מס׳'))}</th>
            <th>${esc(tr('proc.col.name', 'שם הנוהל'))}</th>
            <th>${esc(tr('proc.col.updated', 'עדכון'))}</th>
            <th>${esc(tr('proc.col.pages', 'עמ׳'))}</th>
            <th>${esc(tr('proc.col.date', 'נקרא בתאריך'))}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div class="proc-sign ${st.allRead ? 'ready' : ''}">
        <div class="proc-sign-icon"><span class="material-icons">${st.allRead ? 'task_alt' : 'draw'}</span></div>
        <div class="proc-sign-text">
          <strong>${esc(tr('proc.sign.title', 'טופס חתימה על נהלים קריטיים'))}</strong>
          <span>${esc(st.allRead
            ? tr('proc.sign.ready', 'כל הנהלים סומנו כנקראו — אפשר למלא ולחתום.')
            : tr('proc.sign.pending', 'למילוי לאחר קריאת כל הנהלים ברשימה.'))}</span>
        </div>
        <a class="proc-sign-btn" href="${docUrl(SIGNATURE_DOC_ID)}" target="_blank" rel="noopener">
          <span class="material-icons">open_in_new</span>
          ${esc(tr('proc.sign.open', 'פתח טופס'))}
        </a>
      </div>

      <div class="proc-folder-note">
        <a href="${folderUrl(DRIVE_FOLDER_ID)}" target="_blank" rel="noopener">
          <span class="material-icons">folder_open</span>
          ${esc(tr('proc.folder', 'תיקיית הנהלים ב-Google Drive'))}
        </a>
      </div>`;
  }

  function syncBadge() {
    const badge = document.getElementById('proceduresBadge');
    if (!badge) return;
    const st = stats();
    badge.textContent = `${st.readCount}/${st.total}`;
    badge.classList.toggle('complete', st.allRead);
  }

  // ── Overlay open/close ─────────────────────────────────────
  function openProcedures() {
    const ov = document.getElementById('proceduresOverlay');
    if (!ov) return;
    render();
    ov.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeProcedures() {
    const ov = document.getElementById('proceduresOverlay');
    if (!ov) return;
    ov.classList.remove('open');
    document.body.style.overflow = '';
  }

  // ── Wiring ─────────────────────────────────────────────────
  function init() {
    ensureDefaults();

    // Event delegation — no inline onclick in generated markup.
    const body = document.getElementById('proceduresBody');
    if (body) {
      body.addEventListener('click', (e) => {
        const el = e.target.closest('[data-proc-toggle]');
        if (el) { e.preventDefault(); toggleProcedure(el.getAttribute('data-proc-toggle')); }
      });
      body.addEventListener('keydown', (e) => {
        if (e.key !== ' ' && e.key !== 'Enter') return;
        const el = e.target.closest('[data-proc-toggle]');
        if (el) { e.preventDefault(); toggleProcedure(el.getAttribute('data-proc-toggle')); }
      });
    }

    const ov = document.getElementById('proceduresOverlay');
    if (ov) ov.addEventListener('click', (e) => { if (e.target === ov) closeProcedures(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeProcedures(); });

    // Refresh the sidebar badge whenever the app re-renders (incl. after
    // "טען התקדמות" / language switch), via the official hook. The overlay
    // body is only re-rendered when it is actually open, so renderAll() stays
    // cheap for the 19-topic table.
    if (typeof onAfterRender === 'function') {
      onAfterRender(() => {
        syncBadge();
        if (ov && ov.classList.contains('open')) render();
      });
    }

    syncBadge();
    render();
  }

  // The <script> tag sits at the end of <body>, so the markup this module needs
  // already exists by the time it runs — init immediately when it's there.
  // (Checking readyState instead would defer init in environments that keep the
  // document in "loading" state, e.g. jsdom in the test suite.)
  if (document.getElementById('proceduresBody')) {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }

  // ── Public surface (used by index.html buttons and by the tests) ──
  window.openProcedures = openProcedures;
  window.closeProcedures = closeProcedures;
  window.PROCEDURES = PROCEDURES;
  window.proceduresStats = stats;
  window.toggleProcedure = toggleProcedure;
})();
