// A working gta6-trophy-guide-01 entry (Node 22, standard library only): the guide is this directory's app/ folder,
// plain static files a browser opens at app/index.html (ES modules, CSS, no build step), offline: it loads nothing
// over the network, and its trophy list and guides are app/data/trophies.json. The program hands it in: it copies app/
// and screenshots/ from beside this file to /output and writes /output/dossier.json, the summary the judge reads (your
// screenshots, the first load's files and bytes, and your source), with the vendored make.fun library. Leave
// vendor/makefun-frontend.ts as it is: the scorer requires dossier.json to be byte for byte what its own copy writes.
//
// Leonida Platinum: a full guide and tracker for the 55 official GTA VI PlayStation 5 trophies — every trophy with
// its official name, description and grade, a guide in our own words that cites its sources, a six-stage roadmap to
// the platinum, the one suspected missable flagged, spoiler protection for the 28 hidden trophies, counters for the
// 20 tracked trophies, and progress saved in the browser with export and import. Serve it locally with
// `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// --- Leonida Platinum entry validation (authored for this entry) ---------------------------------------------
// Refuse to hand in a broken guide: the data file must hold the whole official list with a real, sourced guide
// for every trophy, the roadmap must cover every trophy, and the screenshots must be inside the gate's caps.
// This runs before anything is copied, is deterministic, and reads only files beside this one.
function validateEntry() {
  const fail = (why) => { throw new Error(`Leonida Platinum validation failed: ${why}`); };

  const dataPath = join(here, 'app', 'data', 'trophies.json');
  if (!existsSync(dataPath)) fail('app/data/trophies.json is missing');
  if (!existsSync(join(here, 'app', 'index.html'))) fail('app/index.html is missing');
  let data;
  try { data = JSON.parse(readFileSync(dataPath, 'utf8')); }
  catch { fail('app/data/trophies.json does not parse as JSON'); }

  const trophies = data.trophies;
  if (!Array.isArray(trophies) || trophies.length !== 55) fail(`expected exactly 55 trophies, found ${trophies?.length}`);
  const gradeSplit = {};
  let hidden = 0;
  const stageIds = new Set((data.roadmap ?? []).map((r) => r.stage));
  if (stageIds.size !== 6) fail(`roadmap must have exactly 6 stages, found ${stageIds.size}`);
  const seenNames = new Set();
  for (const t of trophies) {
    if (!t.name || !t.description || !t.grade) fail(`trophy id ${t.id} is missing its official name, description or grade`);
    if (seenNames.has(t.name)) fail(`duplicate trophy name: ${t.name}`);
    seenNames.add(t.name);
    gradeSplit[t.grade] = (gradeSplit[t.grade] ?? 0) + 1;
    if (t.hidden) hidden += 1;
    if (typeof t.guide !== 'string' || t.guide.length < 40) fail(`trophy "${t.name}" has no real guide (under 40 characters)`);
    if (!Array.isArray(t.sources) || t.sources.length === 0) fail(`trophy "${t.name}" cites no sources`);
    if (!stageIds.has(t.stage)) fail(`trophy "${t.name}" points at roadmap stage ${t.stage}, which does not exist`);
    if (t.target != null && !(typeof t.target === 'number' && t.target > 0)) fail(`trophy "${t.name}" has a bad tracked target`);
  }
  const expectedSplit = { platinum: 1, gold: 2, silver: 6, bronze: 46 };
  for (const [grade, n] of Object.entries(expectedSplit)) {
    if (gradeSplit[grade] !== n) fail(`grade split is wrong: expected ${n} ${grade}, found ${gradeSplit[grade] ?? 0}`);
  }
  if (hidden !== 28) fail(`expected 28 hidden trophies, found ${hidden}`);
  const missables = trophies.filter((t) => t.missable);
  if (missables.length !== 1 || missables[0].name !== 'Positive Mental Attitude') {
    fail('the missable flag must sit on Positive Mental Attitude alone');
  }

  const shotsDir = join(here, 'screenshots');
  const shots = existsSync(shotsDir) ? readdirSync(shotsDir).filter((f) => /\.(png|jpe?g)$/i.test(f)) : [];
  if (shots.length < 3 || shots.length > 4) fail(`screenshots/ must hold 3 or 4 images, found ${shots.length}`);
  for (const f of shots) {
    const size = statSync(join(shotsDir, f)).size;
    if (size > 262144) fail(`screenshot ${f} is ${size} bytes, over the 256 KiB cap`);
  }
}
validateEntry();
// --- end of validation -----------------------------------------------------------------------------------------

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files and directories in app/ or
// 48 MiB of app files: app/ counts beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
console.log('Leonida Platinum: entry validated (55 trophies, 6 roadmap stages) and handed in.');
