const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ─── 1) Read & validate args ─────────────────────────────────────────────

const version = process.argv[2];
if (!version) {
  console.error('⛔  No version specified');
  process.exit(1);
}

// ─── 2) Update module.json ─────────────────────────────────────────────

const MODULE_JSON = path.resolve(__dirname, 'module.json');
let moduleData = JSON.parse(fs.readFileSync(MODULE_JSON, 'utf8'));

moduleData.version = version;
moduleData.manifest = `https://github.com/gambit07/gambitsTemplatePreviewer/releases/latest/download/module.json`;
moduleData.download = `https://github.com/gambit07/gambitsTemplatePreviewer/releases/download/${version}/module.zip`;

fs.writeFileSync(MODULE_JSON, JSON.stringify(moduleData, null, 2) + "\n", 'utf8');
console.log(`✅ module.json bumped to v${version}`);

// ─── 3) Append to CHANGELOG.md ──────────────────────────────────────────

const NOTES_FILE = path.resolve(__dirname, 'release_notes.txt');
const CHANGELOG_FILE = path.resolve(__dirname, 'CHANGELOG.md');

if (fs.existsSync(NOTES_FILE)) {
  const notesRaw = fs.readFileSync(NOTES_FILE, 'utf8').trim();
  const dtLocal = new Date().toLocaleString('en-US', { timeZone: 'America/Detroit' });
  const dt      = new Date(dtLocal);
  const yyyy    = dt.getFullYear();
  const mm      = String(dt.getMonth()+1).padStart(2,'0');
  const dd      = String(dt.getDate()).padStart(2,'0');
  const dateStr = `${yyyy}-${mm}-${dd}`;

  // Build new entry
  const newEntry = [
    `## [v${version}] - ${dateStr}`,
    notesRaw,
    ``
  ].join("\n");

  // Read existing changelog
  let existing = '';
  if (fs.existsSync(CHANGELOG_FILE)) {
    existing = fs.readFileSync(CHANGELOG_FILE, 'utf8');
  }
  else {
    existing = "# Changelog\n\n";
  }

  // Split off the header
  const [header, ...rest] = existing.split(/\r?\n/);

  const updated = [
    header,
    '',
    newEntry,
    ...rest
  ].join("\n");

  fs.writeFileSync(CHANGELOG_FILE, updated, 'utf8');
  console.log(`📝  Prepended CHANGELOG.md entry for v${version}`);
}
else {
  console.warn(`⚠️  ${path.basename(NOTES_FILE)} not found—skipping CHANGELOG update`);
}

// ─── 4) Commit & push ───────────────────────────────────────────────────

try {
  execSync('git config user.name "github-actions[bot]"');
  execSync('git config user.email "41898282+github-actions[bot]@users.noreply.github.com"');
  execSync(`git add ${MODULE_JSON} ${CHANGELOG_FILE}`, { stdio: 'inherit' });
  execSync(`git commit -m "${version}"`, { stdio: 'inherit' });
  console.log('💾  Committed module.json and CHANGELOG.md');
} catch {
  console.log('ℹ️  Nothing to commit');
}

// ─── 5) Create GitHub Release ───────────────────────────────────────────

try {
  execSync(`gh release create ${version} \
    --title "Release ${version}" \
    --notes-file ${NOTES_FILE}`, { stdio: 'inherit' });
  console.log(`🏷   Created GitHub release v${version}`);
} catch (err) {
  console.error('❌  gh release create failed', err);
}

console.log('🎉  Release complete!');