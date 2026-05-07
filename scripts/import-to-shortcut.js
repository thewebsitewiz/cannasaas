#!/usr/bin/env node
/**
 * Shortcut.com import script — CannaSaas
 *
 * Reads cannasaas-epics.csv and cannasaas-stories.csv from the same directory
 * and creates matching Epics and Stories in Shortcut via REST API v3.
 *
 * Usage:
 *   SHORTCUT_API_TOKEN=xxx node import-to-shortcut.js                       # live import
 *   SHORTCUT_API_TOKEN=xxx node import-to-shortcut.js --dry-run             # no writes
 *   SHORTCUT_API_TOKEN=xxx node import-to-shortcut.js --workflow-state-id=N # force state
 *
 * Get an API token: Shortcut → Settings → Account Settings → API Tokens
 *
 * Requires Node 18+ (uses native fetch). No npm install needed.
 *
 * Idempotency:
 *   - Epics: skipped if an epic with the same name already exists.
 *   - Stories: NOT deduplicated. Re-running will create duplicate stories.
 *     If a partial run fails, archive the partial stories before re-running,
 *     or comment out already-created stories in the CSV.
 */

const fs = require('fs');
const path = require('path');

const API_BASE = 'https://api.app.shortcut.com/api/v3';
const TOKEN = process.env.SHORTCUT_API_TOKEN;
const RATE_LIMIT_MS = 350; // ~3 req/sec, well under Shortcut's published limits

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const stateArg = args.find(a => a.startsWith('--workflow-state-id='));
const FORCED_STATE_ID = stateArg ? parseInt(stateArg.split('=')[1], 10) : null;

if (!TOKEN && !DRY_RUN) {
  console.error('ERROR: SHORTCUT_API_TOKEN environment variable required.');
  console.error('Generate one at: https://app.shortcut.com/settings/account/api-tokens');
  process.exit(1);
}

// ----------------------------------------------------------------------------
// Minimal CSV parser — handles quoted fields, embedded commas, escaped quotes
// ----------------------------------------------------------------------------
function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false, i = 0;

  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i += 2; }
      else if (c === '"') { inQuotes = false; i++; }
      else { field += c; i++; }
    } else {
      if (c === '"') { inQuotes = true; i++; }
      else if (c === ',') { row.push(field); field = ''; i++; }
      else if (c === '\r') { i++; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; }
      else { field += c; i++; }
    }
  }
  if (field || row.length) { row.push(field); rows.push(row); }

  const [header, ...data] = rows;
  return data
    .filter(r => r.some(cell => cell && cell.length > 0))
    .map(r => Object.fromEntries(header.map((h, idx) => [h, r[idx] || ''])));
}

// ----------------------------------------------------------------------------
// API client
// ----------------------------------------------------------------------------
async function api(method, endpoint, body = null) {
  if (DRY_RUN) {
    const preview = body ? JSON.stringify(body).slice(0, 80) : '';
    console.log(`  [dry-run] ${method} ${endpoint} ${preview}`);
    return { id: Math.floor(Math.random() * 1_000_000) };
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Shortcut-Token': TOKEN,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`${method} ${endpoint} → ${res.status}: ${errText}`);
  }
  return res.json();
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------
async function resolveWorkflowStateId() {
  if (FORCED_STATE_ID) return FORCED_STATE_ID;
  if (DRY_RUN) return 999_999;

  const workflows = await api('GET', '/workflows');
  for (const wf of workflows) {
    const unstarted = wf.states.find(s => s.type === 'unstarted');
    if (unstarted) {
      console.log(`Using workflow state "${unstarted.name}" (id=${unstarted.id}) from workflow "${wf.name}"`);
      return unstarted.id;
    }
  }
  throw new Error('No "unstarted" workflow state found. Pass --workflow-state-id=N explicitly.');
}

function parseLabels(labelsStr) {
  if (!labelsStr) return [];
  return labelsStr.split(',').map(s => s.trim()).filter(Boolean).map(name => ({ name }));
}

// ----------------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------------
async function main() {
  console.log(DRY_RUN ? '═══ DRY RUN — no API writes ═══\n' : '═══ LIVE IMPORT ═══\n');

  const epicsPath   = path.join(__dirname, 'cannasaas-epics.csv');
  const storiesPath = path.join(__dirname, 'cannasaas-stories.csv');

  if (!fs.existsSync(epicsPath))   { console.error(`Missing: ${epicsPath}`);   process.exit(1); }
  if (!fs.existsSync(storiesPath)) { console.error(`Missing: ${storiesPath}`); process.exit(1); }

  const epics   = parseCSV(fs.readFileSync(epicsPath, 'utf-8'));
  const stories = parseCSV(fs.readFileSync(storiesPath, 'utf-8'));

  console.log(`Loaded ${epics.length} epics, ${stories.length} stories\n`);

  const workflowStateId = await resolveWorkflowStateId();
  console.log();

  // Pre-fetch existing epics to avoid duplicates
  const existingEpics = DRY_RUN ? [] : await api('GET', '/epics');
  const existingByName = new Map(existingEpics.map(e => [e.name, e]));

  // ── Create epics ────────────────────────────────────────────────────────
  console.log('--- Epics ---');
  const epicNameToId = new Map();
  let epicsCreated = 0, epicsSkipped = 0, epicsFailed = 0;

  for (const epic of epics) {
    if (existingByName.has(epic.name)) {
      const existing = existingByName.get(epic.name);
      epicNameToId.set(epic.name, existing.id);
      console.log(`  · skip (exists): ${epic.name} → id=${existing.id}`);
      epicsSkipped++;
      continue;
    }
    try {
      const result = await api('POST', '/epics', {
        name: epic.name,
        description: epic.description || '',
        labels: parseLabels(epic.labels),
      });
      epicNameToId.set(epic.name, result.id);
      console.log(`  ✓ ${epic.name} → id=${result.id}`);
      epicsCreated++;
      await sleep(RATE_LIMIT_MS);
    } catch (err) {
      console.error(`  ✗ ${epic.name}: ${err.message}`);
      epicsFailed++;
    }
  }
  console.log(`Epics: ${epicsCreated} created, ${epicsSkipped} skipped, ${epicsFailed} failed\n`);

  // ── Create stories ──────────────────────────────────────────────────────
  console.log('--- Stories ---');
  let storiesCreated = 0, storiesFailed = 0;
  const storyResults = [];

  for (const story of stories) {
    const epicId = epicNameToId.get(story.epic);
    if (story.epic && !epicId) {
      console.error(`  ! "${story.name}": epic "${story.epic}" not found — creating without epic`);
    }

    const payload = {
      name: story.name,
      description: story.description || '',
      story_type: story.type || 'feature',
      workflow_state_id: workflowStateId,
      labels: parseLabels(story.labels),
    };
    if (epicId) payload.epic_id = epicId;

    try {
      const result = await api('POST', '/stories', payload);
      console.log(`  ✓ ${story.name} → id=${result.id}`);
      storyResults.push({ name: story.name, id: result.id, epic: story.epic });
      storiesCreated++;
      await sleep(RATE_LIMIT_MS);
    } catch (err) {
      console.error(`  ✗ ${story.name}: ${err.message}`);
      storiesFailed++;
    }
  }
  console.log(`\nStories: ${storiesCreated} created, ${storiesFailed} failed\n`);

  // ── Summary ─────────────────────────────────────────────────────────────
  const summary = {
    timestamp: new Date().toISOString(),
    dryRun: DRY_RUN,
    workflowStateId,
    epics: { created: epicsCreated, skipped: epicsSkipped, failed: epicsFailed },
    stories: { created: storiesCreated, failed: storiesFailed },
    epicNameToId: Object.fromEntries(epicNameToId),
    storyResults,
  };
  const summaryPath = path.join(__dirname, 'import-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`Summary → ${summaryPath}`);
}

main().catch(err => {
  console.error('\nFATAL:', err.message);
  process.exit(1);
});
