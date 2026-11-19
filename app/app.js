// Leonida Platinum — GTA VI trophy guide & tracker.
// Offline: loads only data/trophies.json from its own folder. Progress lives in localStorage.
const KEY = 'leonida-platinum-progress-v1';
const rowsEl = document.getElementById('rows');
const gradeEl = document.getElementById('grade');
const detailEl = document.getElementById('detail');
const searchEl = document.getElementById('search');
const spoilerEl = document.getElementById('spoiler');
const hideEarnedEl = document.getElementById('hideEarned');
const listNoteEl = document.getElementById('listNote');

const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
const byId = new Map(trophies.map((t) => [t.id, t]));
const byName = new Map(trophies.map((t) => [t.name, t]));
const KINDS = [
  ['all', 'All kinds'],
  ['story', 'Story'],
  ['strangers', 'Strangers'],
  ['activity', 'Activities'],
  ['collectible', 'Collectibles'],
  ['misc', 'Misc'],
];

let state = loadState();
let kindFilter = 'all';
let selectedId = 28; // Positive Mental Attitude: the one to protect, shown first.
let view = 'checklist';

function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (raw && typeof raw === 'object') {
      return {
        earned: new Set(raw.earned ?? []),
        counts: raw.counts ?? {},
        revealed: new Set(raw.revealed ?? []),
        spoiler: raw.spoiler !== false,
        hideEarned: raw.hideEarned === true,
      };
    }
  } catch { /* fall through to a fresh state */ }
  return { earned: new Set(), counts: {}, revealed: new Set(), spoiler: true, hideEarned: false };
}

function save() {
  localStorage.setItem(KEY, JSON.stringify({
    earned: [...state.earned],
    counts: state.counts,
    revealed: [...state.revealed],
    spoiler: state.spoiler,
    hideEarned: state.hideEarned,
  }));
}

const isEarned = (t) => state.earned.has(t.id);
const isMasked = (t) => state.spoiler && t.hidden && !isEarned(t) && !state.revealed.has(t.id);
const countOf = (t) => Math.min(state.counts[t.id] ?? 0, t.target ?? 0);
const fmt = (n) => n.toLocaleString('en-US');

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
}
function gem(grade, big = false) {
  return el('span', `gem ${grade}${big ? ' big' : ''}`);
}
function badge(cls, text) {
  return el('span', `badge ${cls}`, text);
}

/* ---------------- header ---------------- */

function renderHeader() {
  const total = trophies.length;
  const earnedCount = state.earned.size;
  const pct = Math.round((earnedCount / total) * 100);
  document.getElementById('progress').textContent = `${earnedCount} of ${total} earned`;
  const ring = document.getElementById('ringFill');
  ring.style.strokeDashoffset = String(226.2 * (1 - earnedCount / total));
  document.getElementById('ringText').textContent = `${pct}%`;
  const counts = document.getElementById('gradeCounts');
  counts.replaceChildren();
  for (const g of ['platinum', 'gold', 'silver', 'bronze']) {
    const all = trophies.filter((t) => t.grade === g);
    const got = all.filter(isEarned).length;
    const li = el('li');
    li.append(gem(g), el('span', null, `${got}/${all.length}`));
    li.title = `${g}: ${got} of ${all.length} earned`;
    counts.append(li);
  }
}

/* ---------------- checklist ---------------- */

function visibleTrophies() {
  const q = searchEl.value.trim().toLowerCase();
  return trophies.filter((t) => {
    if (gradeEl.value !== 'all' && t.grade !== gradeEl.value) return false;
    if (kindFilter !== 'all' && t.kind !== kindFilter) return false;
    if (state.hideEarned && isEarned(t)) return false;
    if (q) {
      if (isMasked(t)) return false; // a masked trophy must not leak through search
      const hay = `${t.name} ${t.description} ${t.kind} ${t.grade}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function renderRows() {
  const list = visibleTrophies();
  const maskedCount = trophies.filter(isMasked).length;
  listNoteEl.textContent =
    `Showing ${list.length} of ${trophies.length} trophies` +
    (maskedCount ? ` — ${maskedCount} hidden trophies are masked by spoiler protection until earned.` : '.');
  rowsEl.replaceChildren();
  for (const t of list) {
    const masked = isMasked(t);
    const li = el('li', `row${isEarned(t) ? ' is-earned' : ''}${t.id === selectedId ? ' is-selected' : ''}${masked ? ' is-masked' : ''}`);
    li.dataset.id = String(t.id);

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = isEarned(t);
    box.setAttribute('aria-label', masked ? 'Mark hidden trophy as earned' : `Mark ${t.name} as earned`);
    box.addEventListener('click', (e) => e.stopPropagation());
    box.addEventListener('change', () => toggleEarned(t, box.checked));

    const main = el('div', 'row-main');
    const nameLine = el('div', 'row-name');
    nameLine.append(el('span', null, masked ? 'Hidden Trophy' : t.name));
    if (t.missable) nameLine.append(badge('missable', 'Missable'));
    if (t.hidden && !masked) nameLine.append(badge('hidden-badge', 'Hidden'));
    if (isEarned(t)) nameLine.append(badge('earned-badge', 'Earned'));
    main.append(nameLine);
    main.append(el('div', 'row-desc', masked
      ? 'Hidden on PlayStation until earned. Turn spoiler protection off, earn it, or reveal it in the guide panel.'
      : t.description));

    const side = el('div', 'row-side');
    side.append(el('span', `row-grade ${t.grade}`, t.grade));
    if (t.target != null) {
      side.append(el('span', 'row-count', `${fmt(countOf(t))} / ${fmt(t.target)} ${t.unit}`));
      const bar = el('span', 'mini-bar');
      const fill = el('i');
      fill.style.width = `${Math.round((countOf(t) / t.target) * 100)}%`;
      bar.append(fill);
      side.append(bar);
    } else {
      side.append(el('span', 'row-count', `Stage ${t.stage}`));
    }

    li.append(box, gem(t.grade), main, side);
    li.addEventListener('click', () => { selectedId = t.id; render(); });
    rowsEl.append(li);
  }
}

function toggleEarned(t, on) {
  if (on) {
    state.earned.add(t.id);
    if (t.target != null) state.counts[t.id] = t.target;
  } else {
    state.earned.delete(t.id);
    if (t.target != null) state.counts[t.id] = 0;
  }
  save();
  render();
}

function setCount(t, value) {
  const v = Math.max(0, Math.min(value, t.target));
  state.counts[t.id] = v;
  if (v >= t.target) state.earned.add(t.id);
  else state.earned.delete(t.id);
  save();
  render();
}

/* ---------------- detail panel ---------------- */

function renderDetail() {
  const t = byId.get(selectedId) ?? trophies[0];
  detailEl.replaceChildren();
  detailEl.append(gem(t.grade, true));

  if (isMasked(t)) {
    detailEl.append(el('h2', null, 'Hidden Trophy'));
    const note = el('p', 'masked-note',
      'This trophy is hidden on PlayStation until it is earned, so spoiler protection is keeping its name, ' +
      'description and guide out of sight. If you have already earned it in game, tick it in the list and everything ' +
      'appears. You can also reveal just this one — that is your spoiler to spend.');
    detailEl.append(note);
    const reveal = el('button', 'earn-btn', 'Reveal this trophy');
    reveal.type = 'button';
    reveal.addEventListener('click', () => { state.revealed.add(t.id); save(); render(); });
    detailEl.append(reveal);
    return;
  }

  detailEl.append(el('h2', null, t.name));
  const official = el('p', 'official', `“${t.description}”`);
  official.append(el('small', null, 'Official PlayStation description'));
  detailEl.append(official);

  const badges = el('div', 'detail-badges');
  badges.append(
    badge('kind', t.grade),
    badge('kind', KINDS.find(([k]) => k === t.kind)?.[1] ?? t.kind),
    badge('stage', `Roadmap stage ${t.stage}`),
  );
  if (t.hidden) badges.append(badge('hidden-badge', 'Hidden on PSN'));
  if (t.missable) badges.append(badge('missable', 'Missable — read the guide'));
  detailEl.append(badges);

  if (t.missable) {
    const warn = el('div', 'warn-box');
    const strong = el('strong', null, 'Do not skip the Chapter 1 spot. ');
    warn.append(strong, document.createTextNode(
      'The first meditation spot is offered at home in Chapter 1 and becomes permanently unavailable afterwards. ' +
      'It has not been confirmed that the trophy fails without it — but meditating there costs a minute.'));
    detailEl.append(warn);
  }

  if (t.target != null) {
    const box = el('div', 'counter-box');
    const line = el('div', 'counter-line');
    line.append(el('span', null, `Your count — ${t.unit}`), el('strong', null, `${fmt(countOf(t))} / ${fmt(t.target)}`));
    const bar = el('div', 'counter-bar');
    const fill = el('i');
    fill.style.width = `${Math.round((countOf(t) / t.target) * 100)}%`;
    bar.append(fill);
    const steppers = el('div', 'steppers');
    const step = t.step ?? 1;
    for (const [label, delta] of [[`−${fmt(step)}`, -step], [`+${fmt(step)}`, step], [`+${fmt(step * 10)}`, step * 10]]) {
      const b = el('button', null, label);
      b.type = 'button';
      b.addEventListener('click', () => setCount(t, countOf(t) + delta));
      steppers.append(b);
    }
    const reset = el('button', null, 'Reset');
    reset.type = 'button';
    reset.addEventListener('click', () => setCount(t, 0));
    steppers.append(reset);
    box.append(line, bar, steppers);
    detailEl.append(box);
  }

  detailEl.append(el('h3', null, 'Guide'));
  detailEl.append(el('p', 'guide', t.guide));
  detailEl.append(el('h3', null, 'Sources'));
  const sources = el('ul', 'sources');
  for (const s of t.sources) sources.append(el('li', null, s));
  detailEl.append(sources);

  const earn = el('button', `earn-btn${isEarned(t) ? ' is-earned' : ''}`, isEarned(t) ? 'Earned ✓ — tap to undo' : 'Mark as earned');
  earn.type = 'button';
  earn.addEventListener('click', () => toggleEarned(t, !isEarned(t)));
  detailEl.append(earn);
}

/* ---------------- roadmap & missables ---------------- */

function chipFor(t) {
  const chip = el('button', 'chip' + (isEarned(t) ? ' is-earned' : ''), null);
  chip.type = 'button';
  chip.append(gem(t.grade), el('span', null, isMasked(t) ? 'Hidden Trophy' : t.name));
  if (t.missable) chip.append(badge('missable', 'Missable'));
  chip.addEventListener('click', () => { selectedId = t.id; switchView('checklist'); });
  return chip;
}

function renderRoadmap() {
  const wrap = document.getElementById('roadmap');
  wrap.replaceChildren();
  for (const stage of doc.roadmap) {
    const inStage = trophies.filter((t) => t.stage === stage.stage);
    const got = inStage.filter(isEarned).length;
    const card = el('article', 'stage-card');
    const top = el('div', 'stage-top');
    top.append(
      el('span', 'stage-num', String(stage.stage)),
      el('h3', null, stage.title),
      el('span', 'stage-hours', stage.hours),
      el('span', 'stage-progress', `${got} / ${inStage.length} earned`),
    );
    card.append(top, el('p', null, stage.summary));
    const chips = el('div', 'chips');
    for (const t of inStage) chips.append(chipFor(t));
    card.append(chips);
    wrap.append(card);
  }
}

function renderMissables() {
  const wrap = document.getElementById('missables');
  wrap.replaceChildren();
  const pma = byName.get('Positive Mental Attitude');

  const alert = el('article', 'note-card alert');
  alert.append(el('h3', null, '⚠ Positive Mental Attitude — the one suspected missable'));
  alert.append(el('p', null, pma.guide));
  wrap.append(alert);

  const notes = [
    ['Everything else is safe',
      'Launch coverage agrees that no other trophy can be missed: every story trophy pops simply for finishing its mission, the stranger finales stay available in free roam, and nothing on the 100% completion checklist is missable — it only asks for 15 of the 18 meditation spots, so even the Chapter 1 spot cannot cost you A Long Road.'],
    ['Cheats disable trophies',
      'The game has 61 cheats, and they only unlock after the credits. Using any one of them disables trophies and saving — reported as lasting for the current session. Keep every trophy run cheat-free, and if you want to play with cheats, do it in a session you do not mind wasting.'],
    ['One caution, one source',
      'A single launch report (TechWiser, via the EGamers.io roundup) says the Stranger mission chains behind five hidden trophies have windows linked to story progress. No other source confirms it. The insurance is free: play stranger chains as they appear instead of saving them all for the endgame.'],
    ['No mission replay — save first',
      'Story missions cannot be replayed and there is no New Game+, but one playthrough is enough for the platinum. Use the 15 manual save slots before big missions and before one-time attempts, so a mistake costs a reload instead of a restart.'],
  ];
  for (const [title, text] of notes) {
    const card = el('article', 'note-card');
    card.append(el('h3', null, title), el('p', null, text));
    wrap.append(card);
  }
}

/* ---------------- views, filters, io ---------------- */

function switchView(next) {
  view = next;
  for (const tab of document.querySelectorAll('.view-tab')) {
    tab.classList.toggle('is-active', tab.dataset.view === view);
  }
  document.getElementById('view-checklist').hidden = view !== 'checklist';
  document.getElementById('view-roadmap').hidden = view !== 'roadmap';
  document.getElementById('view-missables').hidden = view !== 'missables';
  document.getElementById('controls').style.display = view === 'checklist' ? '' : 'none';
  render();
}

function render() {
  renderHeader();
  if (view === 'checklist') { renderRows(); renderDetail(); }
  if (view === 'roadmap') renderRoadmap();
  if (view === 'missables') renderMissables();
}

const pillsWrap = document.getElementById('kindPills');
for (const [kind, label] of KINDS) {
  const pill = el('button', `pill${kind === 'all' ? ' is-active' : ''}`, label);
  pill.type = 'button';
  pill.addEventListener('click', () => {
    kindFilter = kind;
    for (const p of pillsWrap.children) p.classList.toggle('is-active', p === pill);
    render();
  });
  pillsWrap.append(pill);
}

for (const tab of document.querySelectorAll('.view-tab')) {
  tab.addEventListener('click', () => switchView(tab.dataset.view));
}

// The grade filter keeps the starter's mechanism exactly: the <select id="grade"> holds the
// state and its change event re-renders the list. The visible grade is also offered as pills
// elsewhere in the page header counts, but this select is the one source of truth.
gradeEl.addEventListener('change', render);
searchEl.addEventListener('input', render);
spoilerEl.checked = state.spoiler;
spoilerEl.addEventListener('change', () => { state.spoiler = spoilerEl.checked; save(); render(); });
hideEarnedEl.checked = state.hideEarned;
hideEarnedEl.addEventListener('change', () => { state.hideEarned = hideEarnedEl.checked; save(); render(); });

document.getElementById('export').addEventListener('click', () => {
  const payload = JSON.stringify({
    app: 'leonida-platinum',
    version: 1,
    earned: [...state.earned].map((id) => byId.get(id)?.name).filter(Boolean),
    counts: Object.fromEntries(Object.entries(state.counts).map(([id, n]) => [byId.get(Number(id))?.name, n])),
  }, null, 2);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
  a.download = 'leonida-platinum-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});

document.getElementById('import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const names = Array.isArray(data) ? data : (data.earned ?? []);
    state.earned = new Set(names.map((n) => byName.get(n)?.id).filter((id) => id != null));
    state.counts = {};
    if (!Array.isArray(data) && data.counts) {
      for (const [name, n] of Object.entries(data.counts)) {
        const t = byName.get(name);
        if (t && typeof n === 'number') state.counts[t.id] = Math.min(n, t.target ?? n);
      }
    }
    for (const t of trophies) {
      if (t.target != null && state.earned.has(t.id)) state.counts[t.id] = t.target;
    }
    save();
    render();
  } catch {
    listNoteEl.textContent = 'That file could not be read as trophy progress — nothing was changed.';
  }
  e.target.value = '';
});

render();
