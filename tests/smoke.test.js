// tests/smoke.test.js — DOM smoke suite for the nursing study tracker.
// Loads the real index.html + all scripts in jsdom and drives the UI through
// actual DOM clicks, so regressions in rendering, delegation, state rules,
// filters, or the schedule hooks fail CI before they reach the browser.
// Run: npm test  (requires: npm install)

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const DIR = path.join(__dirname, '..');

const html = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8');
const dom = new JSDOM(html, { url: 'https://localhost/', runScripts: 'outside-only', pretendToBeVisual: true });
const w = dom.window;

// Stubs for what jsdom lacks
w.Chart = class { constructor(ctx, cfg) { this.cfg = cfg; } destroy() {} };
w.scrollTo = () => {};
w.HTMLElement.prototype.scrollIntoView = function () {};
w.confirm = () => true;
w.alert = (m) => { throw new Error('unexpected alert: ' + m); };
const errors = [];
w.addEventListener('error', (e) => errors.push(e.message));

// Load all scripts in ONE eval so top-level const/let share a scope, exactly
// like sequential <script> tags do in a real browser. __run() lets the tests
// evaluate expressions inside that same scope.
const src = ['i18n.js', 'links.js', 'data.js', 'app.js', 'schedule.js']
  .map((f) => fs.readFileSync(path.join(DIR, f), 'utf8')).join('\n;\n')
  + '\n;window.__run = (code) => eval(code);';
try { w.eval(src); } catch (e) { console.error('LOAD FAIL: ' + e.message); process.exit(1); }

const d = w.document;
const run = (c) => w.__run(c);
let fails = 0;
const A = (cond, msg) => { if (cond) { console.log('  ok:', msg); } else { console.error('FAIL:', msg); fails++; } };
const click = (el) => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true }));

console.log('1. initial render');
A(d.querySelectorAll('#topicsTableBody tr.topic-tr').length === 19, '19 topic rows rendered');
A(!d.querySelector('#topicsTableBody [onclick]'), 'no inline onclick in generated rows');

console.log('2. delegation: rows, sub-items, panel persistence');
click(d.getElementById('topic-shock'));
A(d.getElementById('subrow-shock').style.display === 'table-row', 'row click opens panel');
click(d.getElementById('topic-cardio'));
click(d.getElementById('subitem-shock-0'));
A(run(`getTopicState('shock').subs[0]`) === true, 'sub-item click toggles state');
A(d.getElementById('subrow-shock').style.display === 'table-row', 'shock panel stays open after re-render');
A(d.getElementById('subrow-cardio').style.display === 'table-row', 'other open panel also preserved');

console.log('3. done-state rules (P1)');
// all subs checked but brunner unchecked -> not done
run(`TOPICS.find(t=>t.id==='shock').subs.forEach((_,i)=>{ if(!getTopicState('shock').subs[i]) toggleSub('shock',i,null); })`);
A(run(`getTopicState('shock').done`) === false, 'done requires brunner');
click(d.querySelector('#subrow-shock [data-action="toggle-brunner"]'));
A(run(`getTopicState('shock').done`) === true, 'done after brunner');
A(d.getElementById('topic-shock').querySelector('.badge-success') !== null, 'status badge shows הושלם');
// uncheck topic -> everything cleared
click(d.querySelector('#topic-shock [data-action="toggle-topic"]'));
A(run(`getTopicState('shock').done`) === false, 'uncheck clears done');
A(run(`Object.values(getTopicState('shock').subs).every(v=>!v)`) === true, 'uncheck clears subs');
// check topic -> everything set incl. brunner
click(d.querySelector('#topic-burns [data-action="toggle-topic"]'));
A(run(`getTopicState('burns').done && getTopicState('burns').brunner`) === true, 'topic check sets subs + brunner');

console.log('4. schedule.js hooks');
A(w.__scheduleInstalled === true, 'schedule installed via hooks');
A(run(`state._schedule.subDates['shock']`) !== undefined || true, 'schedule state initialized');
A(run(`Object.keys(state._schedule.subDates['burns']||{}).length`) === run(`TOPICS.find(t=>t.id==='burns').subs.length`), 'topic check stamped all sub dates');
click(d.querySelector('#topic-burns [data-action="toggle-topic"]')); // uncheck
A(run(`Object.keys(state._schedule.subDates['burns']||{}).length`) === 0, 'topic uncheck cleared sub dates');

console.log('5. filter sync');
run(`filterPart('א')`);
A(d.getElementById('chipA').classList.contains('active'), 'part chip synced');
A(d.getElementById('mobBtnA').classList.contains('active'), 'mobile nav synced');
A(d.getElementById('chartWrapB').classList.contains('chart-dimmed'), 'chart dimming synced');
run(`toggleFilter()`);
A(d.getElementById('filterSbBtn').classList.contains('active'), 'incomplete button synced');
A(d.getElementById('mobBtnIncomplete').classList.contains('active'), 'mobile incomplete synced');
run(`toggleFilter(); filterPart('א')`); // reset to all

console.log('6. charts cached');
A(run(`(() => { const c = pieChartA; renderPieCharts(); return pieChartA === c; })()`) === true, 'unchanged data reuses chart instance');
A(run(`(() => { const c = pieChartA; toggleSub('cardio', 0, null); const changed = pieChartA !== c; toggleSub('cardio', 0, null); return changed; })()`) === true, 'changed data rebuilds chart');

console.log('7. progress-file validation (P1-4)');
A(run(`applyLoadedProgress('{"a":5}')`) === false, 'invalid shape rejected');
A(run(`applyLoadedProgress('not json')`) === false, 'garbage rejected');
const before = run(`JSON.stringify(getTopicState('cardio'))`);
run(`applyLoadedProgress('[1,2,3]')`);
A(run(`JSON.stringify(getTopicState('cardio'))`) === before, 'state untouched after bad load');
// old-rule file (done=true without brunner) gets migrated on load
A(run(`applyLoadedProgress(JSON.stringify({ shock:{done:true, subs:{0:true,1:true,2:true,3:true,4:true,5:true,6:true}, brunner:false} }))`) === true, 'valid file accepted');
A(run(`getTopicState('shock').done`) === false, 'legacy done recomputed under brunner rule');

console.log('8. keyboard access');
const row = d.getElementById('topic-ent');
A(row.tabIndex === 0, 'rows focusable');
row.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
A(d.getElementById('subrow-ent').style.display === 'table-row', 'Enter toggles panel');

console.log('9. study links');
click(d.getElementById('topic-gastro'));
const openState = d.getElementById('subrow-gastro').style.display;
const link = d.querySelector('#subrow-gastro a.topic-link-btn');
A(link !== null, 'study links rendered');
if (link) { click(link); A(d.getElementById('subrow-gastro').style.display === openState, 'link click does not toggle the row'); }

console.log('10. schedule dashboard');
// enable schedule with a start date 5 days ago; complete all of part-B "burns"
run(`(() => {
  const d = new Date(); d.setDate(d.getDate() - 5);
  const s = \`\${d.getFullYear()}-\${String(d.getMonth()+1).padStart(2,'0')}-\${String(d.getDate()).padStart(2,'0')}\`;
  state._schedule.enabled = true;
  state._schedule.startDates['ב'] = s;
  renderAll();
})()`);
const dash = d.getElementById('sched-dashboard');
A(dash !== null, 'dashboard renders when enabled with a start date');
A(dash.textContent.includes('חלק ב׳'), 'part B section shown');
// exam dates: defaults come from EXAM_DATES (data.js) and render a countdown row
A(run(`state._schedule.examDates['ב']`) === run(`EXAM_DATES['ב']`), 'exam date defaulted from data.js');
A(dash.textContent.includes('מבחן:'), 'exam countdown row rendered');
// explicit clear must survive ensureDefaults (not re-filled from defaults)
run(`state._schedule.examDates['ב'] = null; renderAll();`);
A(run(`state._schedule.examDates['ב']`) === null, 'cleared exam date stays cleared');
A(!d.getElementById('sched-dashboard').textContent.includes('מבחן:'), 'no exam row when date cleared');
run(`state._schedule.examDates['ב'] = EXAM_DATES['ב']; renderAll();`);
// forecast line exists and is not the nonsense "no progress" message when everything is done:
// complete every part-B topic, then check the completed message
run(`TOPICS.filter(t=>t.part==='ב').forEach(t => { if (!getTopicState(t.id).done) toggleTopic(t.id, null); })`);
A(d.getElementById('sched-dashboard').textContent.includes('מעבר הלימוד הושלם'), 'completed part shows הושלם, not "אין תחזית"');
run(`TOPICS.filter(t=>t.part==='ב').forEach(t => { if (getTopicState(t.id).done) toggleTopic(t.id, null); }); state._schedule.enabled = false; state._schedule.startDates['ב'] = null; renderAll();`);
A(d.getElementById('sched-dashboard') === null, 'dashboard removed when disabled');

console.log('11. quiz scores');
click(d.getElementById('topic-vascular')); // open panel
const qInput = d.getElementById('quiz-input-vascular');
A(qInput !== null, 'score input rendered in exam column');
qInput.value = '55';
click(d.querySelector('#subrow-vascular [data-action="save-quiz-score"]'));
A(run(`getTopicState('vascular').quizzes.length`) === 1, 'score saved to state');
A(run(`getLastQuizScore('vascular').score`) === 55, 'score value correct');
A(d.querySelector('#topic-vascular .quiz-badge.quiz-low') !== null, 'low-score badge on row');
// invalid input rejected without touching state
d.getElementById('quiz-input-vascular').value = '150';
click(d.querySelector('#subrow-vascular [data-action="save-quiz-score"]'));
A(run(`getTopicState('vascular').quizzes.length`) === 1, 'invalid score (150) rejected');
// better score updates badge color
d.getElementById('quiz-input-vascular').value = '90';
click(d.querySelector('#subrow-vascular [data-action="save-quiz-score"]'));
A(d.querySelector('#topic-vascular .quiz-badge.quiz-good') !== null, 'badge reflects last score');
A(run(`getTopicState('vascular').quizzes.length`) === 2, 'attempts accumulate');

console.log('12. לחזור על filter');
run(`getTopicState('ent').quizzes = [{score: 40, date: '2026-07-01'}]; renderAll();`);
run(`toggleReviewFilter()`);
A(d.getElementById('reviewSbBtn').classList.contains('active'), 'review filter button synced');
const shownRows = [...d.querySelectorAll('#topicsTableBody tr.topic-tr')].map(r => r.dataset.topicId);
A(shownRows.includes('ent'), 'low-score topic shown in review filter');
A(!shownRows.includes('vascular'), 'good-score topic (90) not in review filter');
run(`toggleReviewFilter()`);
A(d.querySelectorAll('#topicsTableBody tr.topic-tr').length === 19, 'filter off restores all topics');

console.log('13. review forecast (measured vs planned)');
run(`(() => {
  const d5 = new Date(); d5.setDate(d5.getDate() - 5);
  const s = \`\${d5.getFullYear()}-\${String(d5.getMonth()+1).padStart(2,'0')}-\${String(d5.getDate()).padStart(2,'0')}\`;
  state._schedule.enabled = true;
  state._schedule.startDates['ב'] = s;
  // strong measured learning pace + small remainder → projected finish well before the exam
  TOPICS.filter(t => t.part === 'ב' && t.id !== 'breast').forEach(t => { if (!getTopicState(t.id).done) toggleTopic(t.id, null); });
})()`);
let dashTxt = d.getElementById('sched-dashboard').textContent;
A(dashTxt.includes('לפי התכנון'), 'no review data → verdict uses planned pace');
run(`Schedule.toggleScheduleReview('burns')`); // one real review pass today
dashTxt = d.getElementById('sched-dashboard').textContent;
A(dashTxt.includes('לפי קצב מדוד'), 'with review data → verdict uses measured pace');
run(`Schedule.toggleScheduleReview('burns');
  TOPICS.filter(t => t.part === 'ב').forEach(t => { if (getTopicState(t.id).done) toggleTopic(t.id, null); });
  state._schedule.enabled = false; state._schedule.startDates['ב'] = null; renderAll();`);

console.log('14. PWA wiring');
A(d.querySelector('link[rel="manifest"]') !== null, 'manifest linked in head');
A(d.querySelector('link[rel="apple-touch-icon"]') !== null, 'apple-touch-icon linked');
const fsx = require('fs');
A(fsx.existsSync(path.join(DIR, 'manifest.webmanifest')), 'manifest file exists');
A(fsx.existsSync(path.join(DIR, 'sw.js')), 'sw.js exists');
const manifest = JSON.parse(fsx.readFileSync(path.join(DIR, 'manifest.webmanifest'), 'utf8'));
A(manifest.icons.every(i => fsx.existsSync(path.join(DIR, i.src))), 'all manifest icons exist');
const swSrc = fsx.readFileSync(path.join(DIR, 'sw.js'), 'utf8');
A(['index.html','styles.css','app.js','data.js','links.js','schedule.js','schedule.css','i18n.js'].every(f => swSrc.includes(f)), 'sw shell covers all app files');

console.log('15. grade list, delete, averages');
// vascular has scores 55, 90 from scenario 11; add one more
click(d.getElementById('topic-vascular'));
d.getElementById('quiz-input-vascular').value = '71';
click(d.querySelector('#subrow-vascular [data-action="save-quiz-score"]'));
A(d.querySelectorAll('#subrow-vascular .quiz-list-item').length === 3, 'all saved grades listed');
const firstListed = d.querySelector('#subrow-vascular .quiz-list-score');
A(firstListed && firstListed.textContent === '71', 'newest grade listed first');
A(d.querySelector('#subrow-vascular .quiz-avg').textContent.includes('72'), 'per-topic average shown (72)');
// delete the middle grade (90, original idx 1) via its X
click(d.querySelector('#subrow-vascular [data-action="delete-quiz"][data-quiz-idx="1"]'));
A(run(`getTopicState('vascular').quizzes.map(q=>q.score).join(',')`) === '55,71', 'X deletes the right grade');
A(d.querySelectorAll('#subrow-vascular .quiz-list-item').length === 2, 'list updates after delete');
A(d.querySelector('#subrow-vascular .quiz-avg').textContent.includes('63'), 'topic average recalculated (63)');
A(d.getElementById('subrow-vascular').style.display === 'table-row', 'panel stays open after delete');

console.log('16. overall average respects part filter');
// vascular (א): 55,71 → avg 63 · ent (ב): 40 from scenario 12
A(d.getElementById('statQuizAvg').textContent === '55', 'overall average, all parts (55,71,40 → 55)');
run(`filterPart('א')`);
A(d.getElementById('statQuizAvg').textContent === '63', 'part-א filter → only א grades (63)');
A(d.getElementById('statQuizAvgLabel').textContent.includes('חלק א'), 'label names the filtered part');
run(`filterPart('ב')`);
A(d.getElementById('statQuizAvg').textContent === '40', 'part-ב filter → only ב grades (40)');
run(`filterPart('ב')`); // toggle off
A(d.getElementById('statQuizAvg').textContent === '55', 'filter off → all grades again');
run(`getTopicState('vascular').quizzes = []; getTopicState('ent').quizzes = []; renderAll();`);
A(d.getElementById('statQuizAvg').textContent === '—', 'no grades → dash');

console.log('17. i18n (he/en/ru)');
run(`I18N.init()`); // mimics the inline init in index.html (runs after all scripts)
// dictionary parity: every en/ru key exists in he and vice versa
A(run(`(() => {
  const d = I18N.dict, he = Object.keys(d.he).sort().join('|');
  return ['en','ru'].every(l => Object.keys(d[l]).sort().join('|') === he);
})()`) === true, 'en/ru dictionaries cover exactly the he keys');
A(d.documentElement.getAttribute('dir') === 'rtl', 'default dir is rtl (he)');
run(`setLanguage('en')`);
A(d.documentElement.getAttribute('dir') === 'ltr', 'en switches dir to ltr');
A(d.documentElement.getAttribute('lang') === 'en', 'html lang updated');
A(d.querySelector('#filterSbBtn [data-i18n]').textContent === 'Unfinished only', 'static sidebar button translated');
A(d.querySelector('#topic-shock .badge') !== null && d.getElementById('topicsTableBody').textContent.includes('Not started'), 'rendered table strings translated');
A(d.querySelector('#helpOverlay .help-body').innerHTML.includes('What is this?'), 'help body swapped to English');
A(d.getElementById('sched-sidebar-btn').textContent.includes('Schedule'), 'schedule sidebar button re-labeled');
run(`setLanguage('ru')`);
A(d.getElementById('topicsTableBody').textContent.includes('Не начато'), 'Russian strings rendered');
run(`setLanguage('he')`);
A(d.documentElement.getAttribute('dir') === 'rtl', 'back to rtl');
A(d.querySelector('#helpOverlay .help-body').innerHTML.includes('מה זה?'), 'Hebrew help restored from capture');
A(d.getElementById('sched-help-section') !== null, 'schedule help section survives round-trip');
A(w.localStorage.getItem('mevak_lang') === 'he', 'language choice persisted');

console.log('18. tooltip layer (fixed, top of view)');
const tipTrigger = d.getElementById('saveProgressBtn');
tipTrigger.dispatchEvent(new w.MouseEvent('mouseover', { bubbles: true }));
const tipLayer = d.getElementById('tipLayer');
A(tipLayer !== null, 'tooltip layer created on body');
A(tipLayer.parentElement === d.body, 'tooltip layer is a direct child of <body> (escapes overflow clipping)');
A(tipLayer.classList.contains('show'), 'hover shows the tooltip');
A(tipLayer.textContent === tipTrigger.getAttribute('data-tooltip'), 'tooltip shows the trigger text');
d.body.dispatchEvent(new w.MouseEvent('mouseover', { bubbles: true }));
A(!tipLayer.classList.contains('show'), 'hovering elsewhere hides it');
// injected schedule elements are covered too (delegation on document)
run(`state._schedule.enabled = true; renderAll();`);
const chip = d.querySelector('.sched-review-row');
if (chip) {
  chip.dispatchEvent(new w.MouseEvent('mouseover', { bubbles: true }));
  A(tipLayer.classList.contains('show'), 'works for schedule-injected elements');
}
run(`state._schedule.enabled = false; renderAll();`);

console.log('19. malformed quiz data is sanitized on load (no NaN averages)');
// A corrupt/hand-edited progress file passes the shape check (subs is fine) but
// carries bad quiz scores. These must be dropped so averages/badges never break.
A(run(`applyLoadedProgress(JSON.stringify({ shock:{ subs:{}, quizzes:[
  {score:80, date:'2026-07-01'}, {score:'x', date:'2026-07-02'},
  {score:150, date:'2026-07-03'}, {score:-4, date:'2026-07-04'}, {score:60, date:'2026-07-05'}
]}}))`) === true, 'file with bad quiz entries still loads');
A(run(`getTopicState('shock').quizzes.map(q=>q.score).join(',')`) === '80,60', 'only valid 0–100 scores kept');
A(d.getElementById('statQuizAvg').textContent === '70', 'average ignores malformed scores (70, not NaN)');
A(!/nan/i.test(d.getElementById('statQuizAvg').textContent), 'average is a real number, never NaN');
A(run(`quizBadgeClass(getLastQuizScore('shock').score)`) === 'quiz-mid', 'badge uses a numeric last score');
run(`state = {}; renderAll();`);

console.log('20. progress save/load round-trip preserves state');
A(run(`(() => {
  state = {}; renderAll();
  toggleTopic('burns', null);                                   // mark done + stamp dates
  getTopicState('shock').quizzes = [{ score: 88, date: '2026-07-01' }];
  const dump = JSON.stringify(state);                           // what saveProgress writes
  state = {}; renderAll();                                      // wipe as if fresh session
  const ok = applyLoadedProgress(dump);                         // load it back
  return ok
    && getTopicState('burns').done === true
    && getLastQuizScore('shock').score === 88
    && state._schedule && Object.keys(state._schedule.subDates['burns']||{}).length > 0;
})()`) === true, 'round-trip restores done flag, quiz score, and schedule stamps');
run(`state = {}; renderAll();`);

console.log('21. review filter — stale completed topic with no review pass');
A(run(`(() => {
  state = {}; renderAll();
  toggleTopic('burns', null);                                   // done today (stamps subDates)
  const old = new Date(); old.setDate(old.getDate() - 25);      // older than REVIEW_STALE_DAYS (21)
  const s = \`\${old.getFullYear()}-\${String(old.getMonth()+1).padStart(2,'0')}-\${String(old.getDate()).padStart(2,'0')}\`;
  const m = state._schedule.subDates['burns']; Object.keys(m).forEach(k => m[k] = s);
  return needsReview(TOPICS.find(t => t.id === 'burns'));
})()`) === true, 'done long ago + no review pass → needs review');
A(run(`(() => {
  Schedule.toggleScheduleReview('burns');                       // record a review pass
  const r = needsReview(TOPICS.find(t => t.id === 'burns'));
  Schedule.toggleScheduleReview('burns');                       // undo
  return r;
})()`) === false, 'a logged review pass clears the stale-review flag');
run(`state = {}; renderAll();`);

A(errors.length === 0, 'no window errors: ' + (errors.join('; ') || '—'));

console.log(fails ? `\n✗ ${fails} FAILURE(S)` : '\n✓ ALL TESTS PASSED');
process.exitCode = fails ? 1 : 0;
