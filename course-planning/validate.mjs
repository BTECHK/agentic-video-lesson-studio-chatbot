#!/usr/bin/env node
// Consistency validator for the course-planning handoff package.
// Checks: all expected lessons present (3 files each), every scene-contract parses,
// every sceneType is one of the 18 registered types, storyboards reference scene ids.
// Exit 0 = green. Run: node course-planning/validate.mjs
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const VALID_TYPES = new Set(['cover','quote-card','preview-band','journey-map','tool-card-reveal',
  'capability-table','feature-grid','recap-grid','assignment-list','comparison-chats','setup-checklist',
  'voice-demo','demo-cue','dig-deeper','tool-demo','audit-quadrant','screen-flow','progression-curve']);

// Lessons planned in this sample package (the worked example). Add a row as each lesson is planned.
// Missing → fail.
const EXPECTED = [
  ['topic-1', ['lesson-1.1']],
];
const EXPECTED_TOTAL = EXPECTED.reduce((n, [, ls]) => n + ls.length, 0);

const errors = [];
const warns = [];
let lessonCount = 0, sceneCount = 0;

function checkLessonDir(dir, label) {
  const planMd = path.join(dir, 'LESSON-PLAN.md');
  const contract = path.join(dir, 'scene-contract.json');
  const story = path.join(dir, 'storyboard.md');
  for (const [f, name] of [[planMd,'LESSON-PLAN.md'],[contract,'scene-contract.json'],[story,'storyboard.md']]) {
    if (!fs.existsSync(f)) { errors.push(`${label}: missing ${name}`); }
  }
  if (!fs.existsSync(contract)) return;
  let data;
  try { data = JSON.parse(fs.readFileSync(contract,'utf8')); }
  catch (e) { errors.push(`${label}: scene-contract.json invalid JSON — ${e.message}`); return; }
  if (!Array.isArray(data.scenes) || data.scenes.length === 0) { errors.push(`${label}: no scenes[]`); return; }
  const ids = [];
  let hasInteractive = false;
  for (const s of data.scenes) {
    sceneCount++;
    ids.push(s.id);
    if (!VALID_TYPES.has(s.sceneType)) errors.push(`${label}: invalid sceneType "${s.sceneType}" (scene ${s.id})`);
    if (['screen-flow','tool-demo','comparison-chats','voice-demo','setup-checklist'].includes(s.sceneType)) hasInteractive = true;
  }
  // storyboard should reference each scene id
  if (fs.existsSync(story)) {
    const sb = fs.readFileSync(story,'utf8');
    for (const id of ids) if (!sb.includes(id)) warns.push(`${label}: storyboard doesn't reference scene "${id}"`);
  }
  // grounding: plan should cite an outline source
  if (fs.existsSync(planMd)) {
    const pm = fs.readFileSync(planMd,'utf8');
    if (!/outline source/i.test(pm)) warns.push(`${label}: LESSON-PLAN.md missing "Outline source"`);
  }
  data.__hasInteractive = hasInteractive;
}

// Lessons
for (const [topic, lessons] of EXPECTED) {
  for (const l of lessons) {
    lessonCount++;
    const dir = path.join(ROOT, 'lessons', topic, l);
    if (!fs.existsSync(dir)) { errors.push(`MISSING lesson dir: lessons/${topic}/${l}`); continue; }
    checkLessonDir(dir, `${topic}/${l}`);
  }
}

// Shared contracts present
for (const f of ['00-START-HERE.md','VIDEO-PRODUCTION-BIBLE.md','contracts/scene-type-catalog.md',
  'contracts/interactive-mandate.md','contracts/motion-contract.md','contracts/render-contract.md',
  'contracts/asset-manifest.md','contracts/scene-contract.schema.json','contracts/brand-tokens-ref.md',
  'contracts/planning-to-render.md']) {
  if (!fs.existsSync(path.join(ROOT, f))) errors.push(`MISSING shared artifact: ${f}`);
}

console.log(`[validate] lessons checked: ${lessonCount} (expected ${EXPECTED_TOTAL}) · scenes: ${sceneCount} · warnings: ${warns.length} · errors: ${errors.length}`);
if (warns.length) console.log('WARNINGS:\n' + warns.map(w => '  ⚠ ' + w).join('\n'));
if (errors.length) { console.error('ERRORS:\n' + errors.map(e => '  ✗ ' + e).join('\n')); process.exit(1); }
console.log('[validate] GREEN ✓ — package consistent.');
