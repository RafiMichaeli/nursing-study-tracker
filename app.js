// app.js — הלוגיקה של מעקב סיעוד המבוגר (הוצא מ-index.html).
// טעינה: links.js → data.js → app.js → schedule.js (ר' index.html).

// ── localStorage keys (all in one place) ───────────────────
const LS_THEME_KEY = 'mevak_theme';
const LS_STATE_KEY = 'nursingState_adult';

// "YYYY-MM-DD" local date (no timezone drift) — same format schedule.js uses
function localDateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── Extension hooks ─────────────────────────────────────────
// Official plug-in points for add-on scripts (schedule.js). Register with the
// on*() functions instead of monkey-patching renderAll/toggleSub/toggleTopic.
const APP_HOOKS = { afterRender: [], beforeSubToggle: [], beforeTopicToggle: [] };
function onAfterRender(cb)       { APP_HOOKS.afterRender.push(cb); }
function onBeforeSubToggle(cb)   { APP_HOOKS.beforeSubToggle.push(cb); }
function onBeforeTopicToggle(cb) { APP_HOOKS.beforeTopicToggle.push(cb); }
function runHooks(list, ...args) {
  list.forEach(cb => { try { cb(...args); } catch (e) { console.error('[hook] failed', e); } });
}

// ── Theme ──────────────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem(LS_THEME_KEY) || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon(saved);
}
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(LS_THEME_KEY, next);
  updateThemeIcon(next);
  // Re-render charts for correct colors
  if (pieChartA) { pieChartA.destroy(); pieChartA = null; }
  if (pieChartB) { pieChartB.destroy(); pieChartB = null; }
  renderPieCharts();
}
function updateThemeIcon(theme) {
  const icon = document.getElementById('themeIcon');
  if (icon) icon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
  const mobIcon = document.getElementById('mobThemeIcon');
  if (mobIcon) mobIcon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
}

// ── Mobile bottom nav ──────────────────────────────────────
function mobFilter(part) {
  if (part === 'all') {
    activePart = null;
  } else {
    activePart = (activePart === part) ? null : part;
  }
  syncFilterUI();
  renderAll();
}
function mobFilterIncomplete() {
  filterIncomplete = !filterIncomplete;
  syncFilterUI();
  renderAll();
}

// ── State ──────────────────────────────────────────────────
let state = {};
let filterIncomplete = false;
let filterReview = false; // "לחזור על" — weak/stale topics
let activeCat = null;
let activePart = null; // null = all, 'א' = part A, 'ב' = part B
let searchQuery = '';

function getTopicState(id) {
  if (!state[id]) state[id] = { done: false, subs: {}, brunner: false };
  return state[id];
}

// "done" is derived: all sub-items checked AND (if the topic has Brunner
// chapters) the "קראתי ברונר" box checked — matching the in-app help & README.
// ts.done is kept as a cached copy of this rule (refreshed on every toggle)
// so progress.json stays backward-compatible and schedule.js keeps working.
function computeTopicDone(topic, ts) {
  const allSubs = topic.subs.every((_, i) => ts.subs[i]);
  return allSubs && (!topic.brunner || !!ts.brunner);
}
function refreshTopicDone(id) {
  const topic = TOPICS.find(t => t.id === id);
  if (!topic) return;
  const ts = getTopicState(id);
  ts.done = computeTopicDone(topic, ts);
}
// Normalize loaded state: coerce entry shapes + recompute all done flags
// (also migrates states saved by the old rule that ignored brunner).
function normalizeState() {
  TOPICS.forEach(t => {
    const ts = getTopicState(t.id);
    if (!ts.subs || typeof ts.subs !== 'object' || Array.isArray(ts.subs)) ts.subs = {};
    ts.brunner = !!ts.brunner;
    if (ts.quizzes !== undefined && !Array.isArray(ts.quizzes)) delete ts.quizzes;
    ts.done = computeTopicDone(t, ts);
  });
}

// ── Quiz scores (exam-readiness signal, separate from "done") ──
function getLastQuizScore(id) {
  const q = getTopicState(id).quizzes;
  return (Array.isArray(q) && q.length) ? q[q.length - 1] : null;
}
function saveQuizScore(topicId, value) {
  const n = Number(value);
  if (value === '' || !Number.isFinite(n) || n < 0 || n > 100) {
    showSaveToast(`<span style="color:var(--warning,#fcb92c)">⚠</span> ${t('quiz.invalid')}`);
    return false;
  }
  const ts = getTopicState(topicId);
  if (!Array.isArray(ts.quizzes)) ts.quizzes = [];
  ts.quizzes.push({ score: Math.round(n), date: localDateStr() });
  saveState(); renderAll();
  return true;
}
function quizBadgeClass(score) {
  return score >= 85 ? 'quiz-good' : score >= 60 ? 'quiz-mid' : 'quiz-low';
}
// "לחזור על": weak topics — low last quiz score, or done a while ago with no review pass
const REVIEW_SCORE_THRESHOLD = 70;
const REVIEW_STALE_DAYS = 21;
function needsReview(t) {
  const ts = getTopicState(t.id);
  const last = getLastQuizScore(t.id);
  if (last && last.score < REVIEW_SCORE_THRESHOLD) return true;
  if (ts.done) {
    const sched = state._schedule || {};
    const reviewed = sched.review && sched.review[t.id] && sched.review[t.id].done;
    if (!reviewed) {
      const dates = sched.subDates && sched.subDates[t.id] ? Object.values(sched.subDates[t.id]) : [];
      const lastDone = dates.sort().pop();
      if (lastDone && (new Date() - new Date(lastDone)) / 86400000 >= REVIEW_STALE_DAYS) return true;
    }
  }
  return false;
}
// Minimal shape check before accepting an external progress file, so loading
// the wrong JSON can't silently wipe real progress (and then get auto-saved).
function isValidProgressData(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  return Object.entries(data).every(([k, v]) => {
    if (k === '_schedule') return !!v && typeof v === 'object' && !Array.isArray(v);
    if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
    if ('subs' in v && (!v.subs || typeof v.subs !== 'object' || Array.isArray(v.subs))) return false;
    return true;
  });
}

function saveState() { try { localStorage.setItem(LS_STATE_KEY, JSON.stringify(state)); } catch {} }
function loadState() {
  try { const s = localStorage.getItem(LS_STATE_KEY); if (s) state = JSON.parse(s); } catch {}
  normalizeState();
}

// ── Sidebar / layout ───────────────────────────────────────
function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const main = document.getElementById('main');
  const overlay = document.getElementById('sidebarOverlay');
  const isMobile = window.innerWidth <= 900;
  if (isMobile) {
    sb.classList.toggle('open');
    overlay.style.display = sb.classList.contains('open') ? 'block' : 'none';
  } else {
    sb.classList.toggle('collapsed');
    main.classList.toggle('expanded');
  }
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').style.display = 'none';
}

// ── Filters ─────────────────────────────────────────────────
// Single source of truth for filter-related UI: sidebar chips, chart dimming,
// sidebar category links, mobile bottom-nav buttons, and the "לא-גמורים" button.
// Every function that changes activePart/activeCat/filterIncomplete calls this
// once instead of hand-syncing its own subset (which used to drift).
function syncFilterUI() {
  const setActive = (id, on) => { const el = document.getElementById(id); if (el) el.classList.toggle('active', on); };

  // Part chips (sidebar)
  setActive('chipA', activePart === 'א');
  setActive('chipB', activePart === 'ב');

  // Chart dimming
  const wrapA = document.getElementById('chartWrapA');
  const wrapB = document.getElementById('chartWrapB');
  if (wrapA) wrapA.classList.toggle('chart-dimmed', activePart === 'ב');
  if (wrapB) wrapB.classList.toggle('chart-dimmed', activePart === 'א');

  // Sidebar category links
  document.querySelectorAll('.sidebar-link').forEach(el => el.classList.remove('active'));
  const link = document.querySelector(`.sidebar-link[data-cat="${activeCat || 'all'}"]`);
  if (link) link.classList.add('active');

  // Mobile bottom-nav buttons
  setActive('mobBtnAll', !activePart);
  setActive('mobBtnA', activePart === 'א');
  setActive('mobBtnB', activePart === 'ב');
  setActive('mobBtnIncomplete', filterIncomplete);

  // "לא-גמורים בלבד" sidebar button
  setActive('filterSbBtn', filterIncomplete);

  // "לחזור על" sidebar button
  setActive('reviewSbBtn', filterReview);
}

function filterCat(cat) {
  activeCat = cat;
  syncFilterUI();
  renderAll();
}

function filterPart(part) {
  // toggle: clicking the active part deselects it
  activePart = (activePart === part) ? null : part;

  // if the category filter is from the wrong part, reset it
  if (activePart && activeCat) {
    const topic = TOPICS.find(t => t.cat === activeCat);
    if (topic && topic.part !== activePart) activeCat = null;
  }

  syncFilterUI();
  renderAll();
}

// ── Toggle functions ──────────────────────────────────────
function toggleBrunner(id) {
  getTopicState(id).brunner = !getTopicState(id).brunner;
  refreshTopicDone(id);
  saveState(); renderAll();
}
function toggleTopic(id, e) {
  if (e) e.stopPropagation();
  const ts = getTopicState(id);
  const topic = TOPICS.find(t => t.id === id);
  const willBeDone = !ts.done;
  runHooks(APP_HOOKS.beforeTopicToggle, id, willBeDone);
  // Checking marks everything (subs + brunner); unchecking clears everything —
  // previously subs stayed checked, so one sub-toggle flipped the topic back to done.
  topic.subs.forEach((_, i) => { ts.subs[i] = willBeDone; });
  if (topic.brunner) ts.brunner = willBeDone;
  ts.done = willBeDone;
  saveState(); renderAll();
}
function toggleSub(topicId, subIdx, e) {
  if (e) e.stopPropagation();
  const ts = getTopicState(topicId);
  const willBeDone = !ts.subs[subIdx];
  runHooks(APP_HOOKS.beforeSubToggle, topicId, subIdx, willBeDone);
  ts.subs[subIdx] = willBeDone;
  refreshTopicDone(topicId);
  saveState(); renderAll();
  // (open sub-rows are preserved by renderTable itself)
}
function toggleSubRow(topicId) {
  const subRow = document.getElementById(`subrow-${topicId}`);
  const chevron = document.getElementById(`chev-${topicId}`);
  if (!subRow) return;
  const isOpen = subRow.style.display !== 'none' && subRow.style.display !== '';
  subRow.style.display = isOpen ? 'none' : 'table-row';
  if (chevron) {
    chevron.textContent = isOpen ? 'expand_more' : 'expand_less';
  }
}
function expandAllRows() {
  document.querySelectorAll('.sub-tr').forEach(el => el.style.display = 'table-row');
  document.querySelectorAll('[id^="chev-"]').forEach(el => el.textContent = 'expand_less');
}
function collapseAllRows() {
  document.querySelectorAll('.sub-tr').forEach(el => el.style.display = 'none');
  document.querySelectorAll('[id^="chev-"]').forEach(el => el.textContent = 'expand_more');
}
function toggleFilter() {
  filterIncomplete = !filterIncomplete;
  syncFilterUI();
  renderAll();
}
function toggleReviewFilter() {
  filterReview = !filterReview;
  syncFilterUI();
  renderAll();
}
function resetAll() {
  if (!confirm(t('confirm.reset'))) return;
  state = {}; saveState(); renderAll();
}

// ── Search ─────────────────────────────────────────────────
// Search drives a dropdown "jump to" menu (buildSearchResults /
// renderSearchDropdown / jumpToTopic below); it does not filter the table.
function handleSearchInput(value) {
  searchQuery = value.trim().toLowerCase();
  const clearBtn = document.getElementById('searchClearBtn');
  if (clearBtn) clearBtn.classList.toggle('show', searchQuery.length > 0);
  renderSearchDropdown();
}
function clearSearch() {
  searchQuery = '';
  const input = document.getElementById('searchInput');
  if (input) input.value = '';
  const clearBtn = document.getElementById('searchClearBtn');
  if (clearBtn) clearBtn.classList.remove('show');
  renderSearchDropdown();
}
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function highlightText(text, q) {
  if (!q) return escapeHtml(text);
  const idx = text.toLowerCase().indexOf(q);
  if (idx === -1) return escapeHtml(text);
  const before = escapeHtml(text.slice(0, idx));
  const match = escapeHtml(text.slice(idx, idx + q.length));
  const after = escapeHtml(text.slice(idx + q.length));
  return `${before}<mark class="search-hit">${match}</mark>${after}`;
}
// ── Search dropdown (jump-to menu) ──────────────────────────
const MAX_DROPDOWN_GROUPS = 8;
const MAX_SUBS_PER_GROUP = 5;

function buildSearchResults(q) {
  if (!q) return [];
  const results = [];
  for (const t of TOPICS) {
    const haystack = `${t.name} ${t.meta} ${t.catLabel}`.toLowerCase();
    const topicMatched = haystack.includes(q);
    const matchedSubs = [];
    t.subs.forEach((s, i) => { if (s.toLowerCase().includes(q)) matchedSubs.push(i); });
    if (topicMatched || matchedSubs.length) {
      results.push({ topic: t, topicMatched, matchedSubs });
      if (results.length >= MAX_DROPDOWN_GROUPS) break;
    }
  }
  return results;
}

function renderSearchDropdown() {
  const dd = document.getElementById('searchDropdown');
  if (!dd) return;
  if (!searchQuery) { dd.classList.remove('show'); dd.innerHTML = ''; return; }

  const results = buildSearchResults(searchQuery);
  if (!results.length) {
    dd.innerHTML = `<div class="search-dropdown-empty">${t('search.noResults', { q: escapeHtml(searchQuery) })}</div>`;
    dd.classList.add('show');
    return;
  }

  let html = '';
  results.forEach(r => {
    const t = r.topic;
    html += `<div class="search-dropdown-group">`;
    html += `
      <div class="search-dropdown-header" onmousedown="event.preventDefault();jumpToTopic('${t.id}')">
        <span style="font-size:14px;">${t.icon}</span>
        <span>${highlightText(t.name, searchQuery)}</span>
        <span class="cat-tag">${t.catLabel}</span>
      </div>`;
    const shown = r.matchedSubs.slice(0, MAX_SUBS_PER_GROUP);
    shown.forEach(i => {
      html += `<div class="search-dropdown-sub" onmousedown="event.preventDefault();jumpToTopic('${t.id}',${i})">${highlightText(t.subs[i], searchQuery)}</div>`;
    });
    const remaining = r.matchedSubs.length - shown.length;
    if (remaining > 0) {
      html += `<div class="search-dropdown-more">${t('search.more', { n: remaining })}</div>`;
    }
    html += `</div>`;
  });
  dd.innerHTML = html;
  dd.classList.add('show');
}

function hideSearchDropdown() {
  const dd = document.getElementById('searchDropdown');
  if (dd) dd.classList.remove('show');
}

function handleSearchFocus() {
  if (searchQuery) renderSearchDropdown();
}
function handleSearchBlur() {
  // Delay so a click/mousedown on a dropdown entry (jumpToTopic, fired via onmousedown)
  // has a chance to run before the dropdown disappears.
  setTimeout(hideSearchDropdown, 150);
}
function handleSearchKeydown(e) {
  if (e.key === 'Escape') {
    hideSearchDropdown();
    e.target.blur();
    // On mobile, Escape also collapses the full-width overlay back to the icon.
    closeMobileSearch();
  }
}

// ── Mobile search: collapsed icon ⇄ full-width overlay ──────
function openMobileSearch() {
  const box = document.getElementById('topbarSearch');
  if (box) box.classList.add('mobile-search-open');
  const input = document.getElementById('searchInput');
  // Slight delay before focusing: lets the fixed-position layout settle first,
  // avoiding a layout/keyboard race on some mobile browsers.
  if (input) setTimeout(() => input.focus(), 50);
}
function closeMobileSearch() {
  const box = document.getElementById('topbarSearch');
  if (!box || !box.classList.contains('mobile-search-open')) return;
  box.classList.remove('mobile-search-open');
  const input = document.getElementById('searchInput');
  if (input) input.blur();
  clearSearch();
}

function jumpToTopic(topicId, subIdx = -1) {
  hideSearchDropdown();

  // Reset the other filters so the target topic is guaranteed to be visible,
  // regardless of whatever part/category/incomplete filter was active.
  activePart = null;
  activeCat = null;
  filterIncomplete = false;
  filterReview = false;
  syncFilterUI();

  renderAll();

  // Force this topic's sub-panel open (all sub-items, not just the matched one).
  const subRow = document.getElementById(`subrow-${topicId}`);
  const chevron = document.getElementById(`chev-${topicId}`);
  if (subRow) subRow.style.display = 'table-row';
  if (chevron) chevron.textContent = 'expand_less';

  const topicRow = document.getElementById(`topic-${topicId}`);
  if (topicRow) {
    topicRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    topicRow.classList.add('jump-flash');
    setTimeout(() => topicRow.classList.remove('jump-flash'), 1500);
  }

  if (subIdx !== -1) {
    setTimeout(() => {
      const subItem = document.getElementById(`subitem-${topicId}-${subIdx}`);
      if (subItem) {
        subItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        subItem.classList.add('jump-flash');
        setTimeout(() => subItem.classList.remove('jump-flash'), 1500);
      }
    }, 300);
  }

  // On mobile the search bar is a full-width overlay covering the topbar — once a result
  // is picked there's nothing left to search for, so collapse it back to the icon and
  // let the jumped-to content take the full screen. No-op on desktop (guarded inside
  // closeMobileSearch — the class is only ever added by openMobileSearch()).
  closeMobileSearch();
}

// ── Stats computation ─────────────────────────────────────
function calcWeightedProgress(topicList) {
  const AVG = 35;
  let total = 0, done = 0;
  topicList.forEach(t => {
    const ts = getTopicState(t.id);
    const w = t.pages || (t.subs.length * AVG);
    const pps = w / t.subs.length;
    t.subs.forEach((_, i) => { total += pps; if (ts.subs[i]) done += pps; });
  });
  return { total: Math.round(total), done: Math.round(done), pct: total ? Math.round(done/total*100) : 0 };
}

function updateStats() {
  // Apply part filter to stat cards when active
  const viewTopics = activePart ? TOPICS.filter(t => t.part === activePart) : TOPICS;

  const totalTopics = viewTopics.length;
  const totalHours  = viewTopics.reduce((a,t) => a + t.hours, 0);
  const totalPages  = viewTopics.reduce((a,t) => a + (t.pages||0), 0);
  const doneTopics  = viewTopics.filter(t => getTopicState(t.id).done).length;
  const doneSubs    = viewTopics.reduce((a,t) => { const ts=getTopicState(t.id); return a+t.subs.filter((_,i)=>ts.subs[i]).length; }, 0);
  const totalSubs   = viewTopics.reduce((a,t) => a+t.subs.length, 0);
  const doneHours   = viewTopics.filter(t=>getTopicState(t.id).done).reduce((a,t)=>a+t.hours,0);
  const donePages   = viewTopics.reduce((a,t) => {
    if (!t.pages) return a;
    const ts=getTopicState(t.id);
    return a+Math.round(t.pages*t.subs.filter((_,i)=>ts.subs[i]).length/t.subs.length);
  }, 0);

  const overall = calcWeightedProgress(viewTopics);
  const partA   = calcWeightedProgress(TOPICS.filter(t=>t.part==='א'));
  const partB   = calcWeightedProgress(TOPICS.filter(t=>t.part==='ב'));

  // Topbar
  document.getElementById('mainBar').style.width = overall.pct + '%';
  document.getElementById('pctLabel').textContent = overall.pct + '%';
  document.getElementById('subLabel').textContent = totalPages
    ? `${donePages} / ${totalPages} ${t('unit.pages')}`
    : `${doneSubs} / ${totalSubs}`;

  // Stat cards
  document.getElementById('statTopics').textContent = `${doneTopics}/${totalTopics}`;
  document.getElementById('statSubs').textContent   = doneSubs;
  document.getElementById('statHours').textContent  = doneHours;
  document.getElementById('statLeft').textContent   = totalHours - doneHours;

  // Quiz average — over every saved attempt in the visible topics; since
  // viewTopics is filtered by activePart, the חלק א׳/ב׳ buttons scope it too
  const allScores = [];
  viewTopics.forEach(t => {
    const q = getTopicState(t.id).quizzes;
    if (Array.isArray(q)) q.forEach(a => allScores.push(a.score));
  });
  const avgEl  = document.getElementById('statQuizAvg');
  const avgLbl = document.getElementById('statQuizAvgLabel');
  if (avgEl)  avgEl.textContent  = allScores.length ? String(Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)) : '—';
  if (avgLbl) avgLbl.textContent = allScores.length
    ? `${allScores.length} ${I18N.quizWord(allScores.length)}${activePart ? ` · ${partLabel(activePart)}` : ''}`
    : t('stat.noScores');

  // Sidebar
  document.getElementById('sidebarBar').style.width  = overall.pct + '%';
  document.getElementById('sidebarPct').textContent   = overall.pct + '%';
  document.getElementById('sidebarPartA').textContent = partA.pct + '%';
  document.getElementById('sidebarPartB').textContent = partB.pct + '%';

  // Footer
  const footerEl = document.getElementById('footerStats');
  if (footerEl) footerEl.textContent = t('footer.stats', { dt: doneTopics, tt: totalTopics, ds: doneSubs, ts: totalSubs, dh: doneHours });

  // Sidebar badges
  CAT_ORDER.forEach(cat => {
    const el = document.getElementById(`sb-badge-${cat}`);
    if (!el) return;
    const catTopics = TOPICS.filter(t=>t.cat===cat);
    const catDone   = catTopics.filter(t=>getTopicState(t.id).done).length;
    el.textContent = `${catDone}/${catTopics.length}`;
    el.className = catDone === catTopics.length ? 'link-badge done-badge' : 'link-badge';
  });
  // All badge
  const allBadge = document.getElementById('sb-badge-all');
  if (allBadge) allBadge.textContent = `${doneTopics}/${totalTopics}`;

  // Table count label
  const countEl = document.getElementById('tableCountLabel');
  if (countEl) {
    const showing = activeCat ? TOPICS.filter(t=>t.cat===activeCat).length : TOPICS.length;
    countEl.textContent = activeCat ? t('table.showing', { label: CAT_LABELS[activeCat] }) : t('table.count', { n: showing });
  }
}

// ── PIE CHARTS (per part) ─────────────────────────────────
let pieChartA = null, pieChartB = null;

function isDark() {
  return document.documentElement.getAttribute('data-theme') !== 'light';
}

function renderPartChart(part, canvasId, existingChart) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return existingChart;

  const dark = isDark();
  const mainColor   = part === 'א' ? '#4f80ff' : '#a78bfa';
  const doneColor   = '#1cbb8c';
  const warnColor   = '#fcb92c';
  const emptyColor  = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
  const textColor   = dark ? '#c8cdd8' : '#495057';
  const tooltipBg   = dark ? '#1a1c2a' : '#fff';
  const tooltipTitle = dark ? '#e8eaf0' : '#343a40';

  const seenCats = [];
  const labels = [], data = [], colors = [], catPcts = [];

  TOPICS.filter(t => t.part === part).forEach(t => {
    if (seenCats.includes(t.cat)) return;
    seenCats.push(t.cat);
    const catTopics = TOPICS.filter(x => x.cat === t.cat);
    const totalS = catTopics.reduce((a,x) => a + x.subs.length, 0);
    const doneS  = catTopics.reduce((a,x) => {
      const ts = getTopicState(x.id);
      return a + x.subs.filter((_,i) => ts.subs[i]).length;
    }, 0);
    const pct = totalS ? Math.round(doneS / totalS * 100) : 0;
    const totalHours = catTopics.reduce((a,x) => a + x.hours, 0);
    labels.push(t.catLabel.length > 13 ? t.catLabel.substring(0,13) + '…' : t.catLabel);
    data.push(totalHours || totalS);
    catPcts.push(pct);
    colors.push(pct === 100 ? doneColor : pct >= 50 ? mainColor : pct > 0 ? warnColor : emptyColor);
  });

  // Skip the destroy/recreate cycle when nothing the chart shows has changed —
  // renderAll() runs on every checkbox toggle and used to rebuild both pies each time.
  const sig = JSON.stringify({ dark, labels, data, catPcts, lang: I18N.lang });
  if (existingChart && existingChart._sig === sig) return existingChart;

  if (existingChart) { existingChart.destroy(); }
  const chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderColor: dark ? 'rgba(255,255,255,0.06)' : '#fff',
        borderWidth: 2,
        hoverOffset: 10,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: { font: { size: 10 }, boxWidth: 10, padding: 6, color: textColor }
        },
        tooltip: {
          rtl: I18N.isRTL(),
          backgroundColor: tooltipBg,
          titleColor: tooltipTitle,
          bodyColor: textColor,
          borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          borderWidth: 1,
          callbacks: {
            label: c => ` ${c.label}: ${catPcts[c.dataIndex]}% ${t('chart.completed')}`
          }
        }
      }
    }
  });
  chart._sig = sig;
  return chart;
}

function renderPieCharts() {
  pieChartA = renderPartChart('א', 'progressChartA', pieChartA);
  pieChartB = renderPartChart('ב', 'progressChartB', pieChartB);
}

// ── TABLE (Latest Projects) ────────────────────────────────
function renderTable() {
  const tbody = document.getElementById('topicsTableBody');
  if (!tbody) return;
  // Preserve which sub-row panels are open, so re-renders (every checkbox
  // toggle calls renderAll) don't collapse panels the user expanded.
  const openRows = new Set();
  tbody.querySelectorAll('.sub-tr').forEach(el => { if (el.style.display === 'table-row') openRows.add(el.id); });
  tbody.innerHTML = '';

  let topics = [...TOPICS];
  if (activePart) topics = topics.filter(t => t.part === activePart);
  if (activeCat) topics = topics.filter(t => t.cat === activeCat);
  if (filterIncomplete) topics = topics.filter(t => !getTopicState(t.id).done);
  if (filterReview) topics = topics.filter(needsReview);

  if (topics.length === 0) {
    let emptyMsg = t('empty.none');
    if (filterIncomplete) emptyMsg = t('empty.allDone');
    if (filterReview) emptyMsg = t('empty.review');
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--muted);">
      ${emptyMsg}
    </td></tr>`;
    return;
  }

  // Sort by CAT_ORDER
  topics.sort((a,b) => {
    const ia = CAT_ORDER.indexOf(a.cat), ib = CAT_ORDER.indexOf(b.cat);
    return ia !== ib ? ia - ib : 0;
  });

  topics.forEach(t => {
    const ts = getTopicState(t.id);
    const subsDone = t.subs.filter((_,i) => ts.subs[i]).length;
    const subsPct  = t.subs.length ? Math.round(subsDone / t.subs.length * 100) : 0;
    const isDone   = ts.done;
    const isInProg = !isDone && subsDone > 0;

    // NOTE: inside this forEach `t` is the topic — use the global alias T() for i18n
    const statusBadge = isDone
      ? `<span class="badge badge-success" data-tooltip="${T('status.doneTooltip')}">${T('status.done')}</span>`
      : isInProg
        ? `<span class="badge badge-warning" data-tooltip="${T('status.inprogTooltip')}">${T('status.inprog')}</span>`
        : `<span class="badge badge-secondary" data-tooltip="${T('status.notStartedTooltip')}">${T('status.notStarted')}</span>`;

    const partBadge = t.part === 'א'
      ? `<span class="badge badge-primary">${partLabel('א')}</span>`
      : `<span class="badge badge-purple">${partLabel('ב')}</span>`;

    const miniBarCls = isDone ? 'topic-mini-bar done' : 'topic-mini-bar';

    // Last quiz score badge (exam-readiness — independent of "done")
    const lastQuiz = getLastQuizScore(t.id);
    const scoreBadge = lastQuiz
      ? `<span class="badge quiz-badge ${quizBadgeClass(lastQuiz.score)}" data-tooltip="${T('quiz.lastTooltip', { date: lastQuiz.date })}">📝 ${lastQuiz.score}</span>`
      : '';

    // Was this topic's sub-panel open before the re-render?
    const wasOpen = openRows.has(`subrow-${t.id}`);

    // Main row (all interaction handled by the delegated tbody listener —
    // see initTableEvents; templates carry data-action instead of inline JS)
    const tr = document.createElement('tr');
    tr.className = `topic-tr${isDone ? ' row-done' : ''}`;
    tr.id = `topic-${t.id}`;
    tr.dataset.topicId = t.id;
    tr.tabIndex = 0; // keyboard: Enter/Space toggles the sub-panel
    tr.innerHTML = `
      <td>
        <input type="checkbox" class="topic-cb" ${isDone ? 'checked' : ''}
          data-action="toggle-topic" data-tooltip="${T('topic.checkboxTooltip')}">
      </td>
      <td>
        <div class="topic-name-wrap">
          <span class="topic-name-title ${isDone ? 'done' : ''}">${t.name}</span>
          <span class="topic-name-meta">${t.meta}</span>
          <div class="topic-mini-bar-bg">
            <div class="${miniBarCls}" style="width:${subsPct}%"></div>
          </div>
        </div>
      </td>
      <td class="col-hide">
        <div class="cat-cell">
          <span class="cat-icon">${t.icon}</span>
          <span class="cat-name">${t.catLabel}</span>
        </div>
      </td>
      <td>
        <span class="badge badge-hours" data-tooltip="${T('badge.hoursTooltip')}">${t.hours} ${T('unit.hours')}</span>
        ${t.pages ? `<br><span class="badge badge-pages" style="margin-top:3px;" data-tooltip="${T('badge.pagesTooltip')}">${t.pages} ${T('unit.pages')}</span>` : ''}
      </td>
      <td>
        <span class="subs-count">${subsDone}</span>
        <span class="subs-total">/${t.subs.length}</span>
      </td>
      <td>${statusBadge}${scoreBadge ? '<br>' + scoreBadge : ''}</td>
      <td class="col-hide">${partBadge}</td>
      <td>
        <button class="expand-btn" data-action="toggle-subrow" data-tooltip="${T('row.expandTooltip')}" data-tip-pos="left-edge">
          <span class="material-icons" id="chev-${t.id}">${wasOpen ? 'expand_less' : 'expand_more'}</span>
        </button>
      </td>
    `;

    // Sub row (open state preserved across re-renders; jumpToTopic() can force it open)
    const subTr = document.createElement('tr');
    subTr.className = 'sub-tr';
    subTr.id = `subrow-${t.id}`;
    subTr.dataset.topicId = t.id;
    subTr.style.display = wasOpen ? 'table-row' : 'none';

    let subHTML = `<td colspan="8"><div class="sub-content">`;

    // Sub-progress bar
    subHTML += `
      <div class="sub-prog-row">
        <div class="sub-prog-bg">
          <div class="sub-prog-fill" style="width:${subsPct}%"></div>
        </div>
        <span class="sub-prog-txt" data-tooltip="${T('sub.progressTooltip')}">${T('sub.progress', { done: subsDone, total: t.subs.length, pct: subsPct })}</span>
      </div>
    `;

    // 3-column layout
    subHTML += `<div class="sub-cols">`;

    // ── Column 1: sub-items + brunner ──
    subHTML += `<div class="sub-col-items">`;
    subHTML += `<div class="sub-col-header" data-tooltip="${T('col.subsTooltip')}">${T('col.subs')}</div>`;
    subHTML += `<div class="sub-grid">`;
    // The id on the wrapper div lets jumpToTopic() scroll to a specific sub-item.
    t.subs.forEach((sub, i) => {
      const done = !!ts.subs[i];
      subHTML += `
        <div class="sub-item" id="subitem-${t.id}-${i}" data-action="toggle-sub" data-sub-idx="${i}">
          <input type="checkbox" ${done ? 'checked' : ''}>
          <label class="${done ? 'done' : ''}">${sub}</label>
        </div>`;
    });
    subHTML += `</div>`;
    if (t.brunner) {
      subHTML += `
        <div class="brunner-row" data-action="toggle-brunner" data-tooltip="${T('brunner.tooltip')}">
          <input type="checkbox" ${ts.brunner ? 'checked' : ''}>
          <label class="${ts.brunner ? 'done' : ''}">
            ${T('brunner.read', { ref: t.brunner })}
          </label>
        </div>`;
    }
    subHTML += `</div>`;

    // ── Column 2: study links ──
    const links = TOPIC_LINKS[t.id] || [];
    subHTML += `<div class="sub-col-links">`;
    subHTML += `<div class="sub-col-header" data-tooltip="${T('col.materialsTooltip')}">${T('col.materials')}</div>`;
    if (links.length) {
      subHTML += `<div class="sub-links">`;
      links.forEach(link => {
        subHTML += `<a href="${link.url}" target="_blank" class="topic-link-btn">${link.label}</a>`;
      });
      subHTML += `</div>`;
    } else {
      subHTML += `<span style="font-size:12px;color:var(--muted);">—</span>`;
    }
    subHTML += `</div>`;

    // ── Column 3: exam-prompt copy button ──
    subHTML += `<div class="sub-col-exams">`;
    subHTML += `<div class="sub-col-header" data-tooltip="${T('col.examsTooltip')}">${T('col.exams')}</div>`;
    subHTML += `<button class="exam-gen-btn" data-action="copy-exam" data-tooltip="${T('exam.copyTooltip')}">
      <span class="material-icons" style="font-size:14px;vertical-align:middle">content_copy</span> ${T('exam.copyBtn')}
    </button>`;
    // Quiz-score entry: record the result of each practice exam
    const quizzes = Array.isArray(ts.quizzes) ? ts.quizzes : [];
    subHTML += `
      <div class="quiz-score-row">
        <input type="number" class="quiz-score-input" id="quiz-input-${t.id}" min="0" max="100" inputmode="numeric" placeholder="${T('quiz.placeholder')}">
        <button class="quiz-score-save" data-action="save-quiz-score" data-tooltip="${T('quiz.saveTooltip')}">${T('quiz.saveBtn')}</button>
      </div>`;
    // Saved-grades list (newest first) + per-topic average
    if (quizzes.length) {
      const topicAvg = Math.round(quizzes.reduce((a, q) => a + q.score, 0) / quizzes.length);
      subHTML += `<div class="quiz-list">`;
      quizzes.map((q, i) => ({ q, i })).reverse().forEach(({ q, i }) => {
        subHTML += `
          <div class="quiz-list-item">
            <span class="quiz-list-score ${quizBadgeClass(q.score)}">${q.score}</span>
            <span class="quiz-list-date">${q.date}</span>
            <button class="quiz-del" data-action="delete-quiz" data-quiz-idx="${i}" aria-label="${T('quiz.delete')}" data-tooltip="${T('quiz.delete')}">×</button>
          </div>`;
      });
      subHTML += `</div>`;
      subHTML += `<div class="quiz-avg">${T('quiz.avg')}: <b>${topicAvg}</b> · ${quizzes.length} ${I18N.quizWord(quizzes.length)}</div>`;
    } else {
      subHTML += `<div class="quiz-avg">${T('stat.noScores')}</div>`;
    }
    subHTML += `</div>`;

    subHTML += `</div>`; // /sub-cols

    subHTML += `</div></td>`;
    subTr.innerHTML = subHTML;

    tbody.appendChild(tr);
    tbody.appendChild(subTr);
  });
}

// ── Table event delegation ──────────────────────────────────
// One listener on the tbody replaces the per-row inline handlers the templates
// used to generate (and their '${id}'-quoting hazards). Rows/controls carry
// data-action + data-topic-id instead.
function onTableActivate(e) {
  const tbody = e.currentTarget;
  if (e.target.closest('a')) return; // let study links navigate, don't toggle the row

  const actEl = e.target.closest('[data-action]');
  if (actEl && tbody.contains(actEl)) {
    const host = actEl.closest('[data-topic-id]');
    const topicId = host ? host.dataset.topicId : null;
    if (!topicId) return;
    switch (actEl.dataset.action) {
      case 'toggle-topic':   toggleTopic(topicId); return;
      case 'toggle-sub':     toggleSub(topicId, Number(actEl.dataset.subIdx)); return;
      case 'toggle-brunner': toggleBrunner(topicId); return;
      case 'toggle-subrow':  toggleSubRow(topicId); return;
      case 'copy-exam':      copyExamPrompt(topicId, actEl); return;
      case 'save-quiz-score': {
        const input = document.getElementById(`quiz-input-${topicId}`);
        if (input) saveQuizScore(topicId, input.value);
        return;
      }
      case 'delete-quiz': {
        const idx = Number(actEl.dataset.quizIdx);
        const q = getTopicState(topicId).quizzes;
        if (Array.isArray(q) && idx >= 0 && idx < q.length) {
          q.splice(idx, 1);
          saveState(); renderAll();
        }
        return;
      }
    }
    return;
  }
  // Default: clicking anywhere else on a topic row toggles its sub-panel
  const row = e.target.closest('tr.topic-tr');
  if (row && row.dataset.topicId) toggleSubRow(row.dataset.topicId);
}

function initTableEvents() {
  const tbody = document.getElementById('topicsTableBody');
  if (!tbody) return;
  tbody.addEventListener('click', onTableActivate);
  // Keyboard: rows are focusable (tabIndex=0); Enter/Space toggles the panel
  tbody.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const row = e.target.closest && e.target.closest('tr.topic-tr');
    if (row && e.target === row) { e.preventDefault(); toggleSubRow(row.dataset.topicId); }
  });
}

// ── RENDER ALL ─────────────────────────────────────────────
function renderAll() {
  // Rebuilding the table momentarily changes document height, which lets the
  // browser's scroll anchoring nudge the viewport — pin the scroll position.
  const sx = window.scrollX, sy = window.scrollY;
  updateStats();
  renderTable();
  renderPieCharts();
  window.scrollTo(sx, sy);
  runHooks(APP_HOOKS.afterRender);
}

// ── SAVE / LOAD ────────────────────────────────────────────
function openHandleDB() {
  return new Promise((res,rej) => {
    const r = indexedDB.open('nursingTrackerDB_adult', 1);
    r.onupgradeneeded = e => e.target.result.createObjectStore('handles');
    r.onsuccess = e => res(e.target.result);
    r.onerror = rej;
  });
}
async function getStoredHandle() {
  try {
    const db = await openHandleDB();
    return await new Promise(res => {
      const tx = db.transaction('handles','readonly');
      const req = tx.objectStore('handles').get('progress');
      req.onsuccess = e => res(e.target.result || null);
      req.onerror = () => res(null);
    });
  } catch { return null; }
}
async function storeHandle(handle) {
  try {
    const db = await openHandleDB();
    await new Promise(res => {
      const tx = db.transaction('handles','readwrite');
      tx.objectStore('handles').put(handle,'progress');
      tx.oncomplete = res;
    });
  } catch {}
}
// ── AUTO-SAVE ──────────────────────────────────────────────
let autoSaveInterval = null;
const AUTO_SAVE_MS = 5 * 60 * 1000; // 5 minutes

function showSaveToast(msg, isAuto = false) {
  let toast = document.getElementById('saveToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'saveToast';
    toast.style.cssText = [
      'position:fixed','bottom:20px','left:20px','z-index:9999',
      'background:var(--card-bg)','border:1px solid var(--card-border)',
      'border-radius:8px','padding:9px 16px','font-size:13px',
      'color:var(--text)','box-shadow:0 4px 20px rgba(0,0,0,0.4)',
      'opacity:0','transition:opacity 0.25s','pointer-events:none',
    ].join(';');
    document.body.appendChild(toast);
  }
  toast.innerHTML = msg;
  toast.style.opacity = '1';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, isAuto ? 2500 : 2000);
}

function updateAutoSaveStatus(lastTime) {
  const chip  = document.getElementById('autoSaveChip');
  const label = document.getElementById('autoSaveLabel');
  const time  = document.getElementById('autoSaveTime');
  if (!chip) return;
  if (autoSaveInterval) {
    chip.className = 'autosave-chip active';
    label.textContent = t('autosave.active');
    time.textContent  = lastTime ? t('autosave.lastSaved', { time: lastTime }) : t('autosave.every5');
  } else {
    chip.className = 'autosave-chip inactive';
    label.textContent = t('autosave.inactive');
    time.textContent  = t('autosave.clickToStart');
  }
  // These labels are set dynamically from here on — drop the static-DOM i18n
  // tags so a later language switch doesn't overwrite the live status text.
  label.removeAttribute('data-i18n');
  time.removeAttribute('data-i18n');
}

function startAutoSave() {
  if (autoSaveInterval) return; // already running
  autoSaveInterval = setInterval(async () => {
    const handle = await getStoredHandle();
    if (!handle) return;
    try {
      const perm = await handle.queryPermission({mode:'readwrite'});
      if (perm !== 'granted') return; // don't prompt in background
      const w = await handle.createWritable();
      await w.write(JSON.stringify(state, null, 2));
      await w.close();
      const now = new Date().toLocaleTimeString(I18N.locale(), {hour:'2-digit', minute:'2-digit'});
      showSaveToast(`<span style="color:var(--success)">✓</span> ${t('toast.autoSaved', { time: now })}`, true);
      updateAutoSaveStatus(now);
    } catch {}
  }, AUTO_SAVE_MS);
}

async function saveProgress() {
  const data = JSON.stringify(state, null, 2);
  const fallback = () => {
    const blob = new Blob([data],{type:'application/json'});
    const url  = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'),{href:url,download:'progress.json'});
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  if (!window.showSaveFilePicker) { fallback(); return; }

  let handle = await getStoredHandle();
  if (handle) {
    try {
      const perm = await handle.queryPermission({mode:'readwrite'});
      if (perm !== 'granted') { const r = await handle.requestPermission({mode:'readwrite'}); if (r !== 'granted') handle = null; }
    } catch { handle = null; }
  }
  if (!handle) {
    try {
      handle = await window.showSaveFilePicker({
        suggestedName: 'progress.json',
        types: [{description:'JSON',accept:{'application/json':['.json']}}]
      });
      await storeHandle(handle);
      startAutoSave(); // begin auto-save after first successful pick
      updateAutoSaveStatus(null);
    } catch(e) { if (e.name==='AbortError') return; fallback(); return; }
  }

  try {
    const w = await handle.createWritable();
    await w.write(data); await w.close();
    const btn = document.getElementById('saveProgressBtn');
    if (btn) {
      const orig = btn.innerHTML;
      btn.innerHTML = `<span class="material-icons" style="font-size:18px;vertical-align:middle">check</span> ${t('btn.savedFlash')}`;
      setTimeout(() => { btn.innerHTML = orig; }, 1800);
    }
    const _st = new Date().toLocaleTimeString(I18N.locale(), {hour:'2-digit', minute:'2-digit'});
    showSaveToast(`<span style="color:var(--success)">✓</span> ${t('toast.saved', { time: _st })}`);
    updateAutoSaveStatus(_st);
  } catch(e) { alert(t('err.save', { msg: e.message })); }
}
// Parse + validate an external progress file; only replace state if it passes,
// so a wrong file can't wipe real progress (which auto-save would then persist).
function applyLoadedProgress(text) {
  let data;
  try { data = JSON.parse(text); } catch { return false; }
  if (!isValidProgressData(data)) return false;
  state = data;
  normalizeState();
  saveState(); renderAll();
  return true;
}
const LOAD_ERR_MSG = () => t('err.loadInvalid');

async function loadProgress(e) {
  const file = e?.target?.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = ev => { if (!applyLoadedProgress(ev.target.result)) alert(LOAD_ERR_MSG()); };
    reader.readAsText(file); e.target.value = ''; return;
  }
  if (!window.showOpenFilePicker) { document.getElementById('loadInput').click(); return; }
  try {
    const [handle] = await window.showOpenFilePicker({types:[{description:'JSON',accept:{'application/json':['.json']}}]});
    const f = await handle.getFile();
    if (!applyLoadedProgress(await f.text())) { alert(LOAD_ERR_MSG()); return; }
    // Only adopt the handle for auto-save once the file proved valid
    await storeHandle(handle);
    startAutoSave(); updateAutoSaveStatus(null);
  } catch(e) { if (e.name !== 'AbortError') alert(t('err.load')); }
}

// ── EXAM PROMPT (copy to clipboard, paste into any AI chat) ─
// SECURITY: an older in-app exam generator stored an Anthropic API key in
// localStorage and called the API directly from the browser. The feature was
// removed; this one-time cleanup purges any key left behind in existing browsers.
try { localStorage.removeItem('anthropic_api_key_v1'); } catch {}

function copyExamPrompt(topicId, btnEl) {
  const topic = TOPICS.find(t => t.id === topicId);
  if (!topic) return;
  const subsText = topic.subs.map((s, i) => `${i+1}. ${s}`).join('\n');
  const brunnerRef = topic.brunner ? `\nחומר מקור: ברונר ${topic.brunner}` : '';
  const prompt =
    `אתה מרצה לסיעוד. צור 20 שאלות אמריקאיות בעברית רפואית על הנושא: "${topic.name}" (${topic.meta}).${brunnerRef}\n\n` +
    `הסעיפים לכסות:\n${subsText}\n\n` +
    `כללים:\n` +
    `- כל שאלה: 4 אפשרויות תשובה (א, ב, ג, ד), תשובה נכונה אחת\n` +
    `- שאלות הבנה קלינית, לא רק שינון\n` +
    `- גוון: תרחישים קליניים, הגדרות, השוואות, מנגנונים\n` +
    `- הסבר קצר (2-3 משפטים) לתשובה הנכונה\n` +
    `- רמת קושי מתאימה לבחינת סיעוד`;

  const orig = btnEl.innerHTML;
  const ok = () => {
    btnEl.innerHTML = `<span class="material-icons" style="font-size:14px;vertical-align:middle">check</span> ${t('exam.copied')}`;
    btnEl.style.background = 'var(--green,#1cbb8c)';
    setTimeout(() => { btnEl.innerHTML = orig; btnEl.style.background = ''; }, 2000);
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(prompt).then(ok).catch(() => fallbackCopy(prompt, ok));
  } else {
    fallbackCopy(prompt, ok);
  }
}

function fallbackCopy(text, callback) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
  document.body.appendChild(ta);
  ta.focus(); ta.select();
  try { document.execCommand('copy'); callback(); } catch(e) { alert(t('err.copy')); }
  document.body.removeChild(ta);
}

// ── TOOLTIP LAYER ───────────────────────────────────────────
// Single fixed-position element on <body>, shared by every [data-tooltip]
// trigger (incl. ones injected later by schedule.js — event delegation).
// Replaces the old CSS ::after tooltips, which were clipped by overflow
// ancestors (table scroller, cards). Positions above the trigger (or below
// with data-tip-pos="below"), flips when there's no room, and clamps to the
// viewport so long translations (en/ru) stay fully visible at screen edges.
let _tipEl = null, _tipTarget = null;
function ensureTipEl() {
  if (_tipEl) return _tipEl;
  _tipEl = document.createElement('div');
  _tipEl.id = 'tipLayer';
  _tipEl.setAttribute('role', 'tooltip');
  document.body.appendChild(_tipEl);
  return _tipEl;
}
function showTip(target) {
  const text = target.getAttribute('data-tooltip');
  if (!text) return;
  const el = ensureTipEl();
  el.textContent = text;
  el.style.visibility = 'hidden';
  el.classList.add('show');
  const r = target.getBoundingClientRect();
  const tw = el.offsetWidth, th = el.offsetHeight;
  const pos = target.getAttribute('data-tip-pos');
  let top = (pos === 'below') ? r.bottom + 8 : r.top - th - 8;
  if (top < 8) top = r.bottom + 8;                              // no room above → flip below
  if (top + th > window.innerHeight - 8) top = r.top - th - 8;  // no room below → flip above
  let left = r.left + r.width / 2 - tw / 2;
  left = Math.max(8, Math.min(left, window.innerWidth - tw - 8));   // clamp horizontally
  top  = Math.max(8, Math.min(top,  window.innerHeight - th - 8));  // clamp vertically
  el.style.left = left + 'px';
  el.style.top  = top + 'px';
  el.style.visibility = '';
}
function hideTip() {
  if (_tipEl) _tipEl.classList.remove('show');
  _tipTarget = null;
}
function initTooltips() {
  document.addEventListener('mouseover', (e) => {
    const tgt = e.target.closest ? e.target.closest('[data-tooltip]') : null;
    if (tgt === _tipTarget) return;
    _tipTarget = tgt;
    if (tgt) showTip(tgt); else hideTip();
  });
  // Leaving the window entirely
  document.addEventListener('mouseleave', hideTip);
  // Any scroll invalidates the fixed position — just hide
  window.addEventListener('scroll', hideTip, true);
}

function openHelp() {
  document.getElementById('helpOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeHelp() {
  document.getElementById('helpOverlay').classList.remove('open');
  document.body.style.overflow = '';
}
document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeHelp(); });

// ── Startup ────────────────────────────────────────────────
initTheme();
initTableEvents();
initTooltips();
loadState();
renderAll();
// PWA: register the service worker on https (GitHub Pages) / localhost only —
// opening index.html directly from disk (file://) keeps working without it.
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => { /* offline support is best-effort */ });
}
// Resume auto-save if a file handle was stored from a previous session
getStoredHandle().then(handle => { if (handle) { startAutoSave(); updateAutoSaveStatus(null); } });

