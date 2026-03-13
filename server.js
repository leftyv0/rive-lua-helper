const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

const SCRIPTS_DIR = path.join(__dirname, 'scripts');
const METADATA_PATH = path.join(SCRIPTS_DIR, '.metadata.json');

const ALLOWED_TYPES = [
  'node', 'layout', 'converter', 'path-effect',
  'transition-condition', 'listener-action', 'util', 'test'
];

// --- Helpers ---

function validateType(type) {
  return ALLOWED_TYPES.includes(type);
}

function validateName(name) {
  if (!name || typeof name !== 'string') return false;
  if (name.includes('..') || name.includes('/') || name.includes('\\')) return false;
  if (!name.endsWith('.luau')) return false;
  if (name.length > 100) return false;
  return /^[a-zA-Z0-9_\-]+\.luau$/.test(name);
}

function readMetadata() {
  try {
    return JSON.parse(fs.readFileSync(METADATA_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

function writeMetadata(data) {
  fs.writeFileSync(METADATA_PATH, JSON.stringify(data, null, 2));
}

function metaKey(type, name) {
  return `${type}/${name}`;
}

// --- Routes ---

// List all scripts grouped by protocol type
app.get('/api/scripts', (req, res) => {
  const metadata = readMetadata();
  const result = {};

  for (const type of ALLOWED_TYPES) {
    const dir = path.join(SCRIPTS_DIR, type);
    let files = [];
    try {
      files = fs.readdirSync(dir).filter(f => f.endsWith('.luau')).sort();
    } catch { /* empty dir */ }

    result[type] = files.map(name => {
      const key = metaKey(type, name);
      const stat = fs.statSync(path.join(dir, name));
      return {
        name,
        description: metadata[key]?.description || '',
        created: metadata[key]?.created || stat.birthtime.toISOString(),
        modified: stat.mtime.toISOString()
      };
    });
  }

  res.json(result);
});

// Read a script
app.get('/api/scripts/:type/:name', (req, res) => {
  const { type, name } = req.params;
  if (!validateType(type)) return res.status(400).json({ error: 'Invalid script type' });
  if (!validateName(name)) return res.status(400).json({ error: 'Invalid script name' });

  const filePath = path.join(SCRIPTS_DIR, type, name);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Script not found' });

  const content = fs.readFileSync(filePath, 'utf-8');
  const metadata = readMetadata();
  const key = metaKey(type, name);

  res.json({
    name,
    type,
    content,
    description: metadata[key]?.description || '',
    created: metadata[key]?.created || '',
    modified: fs.statSync(filePath).mtime.toISOString()
  });
});

// Create a new script
app.post('/api/scripts/:type/:name', (req, res) => {
  const { type, name } = req.params;
  if (!validateType(type)) return res.status(400).json({ error: 'Invalid script type' });
  if (!validateName(name)) return res.status(400).json({ error: 'Invalid script name' });

  const filePath = path.join(SCRIPTS_DIR, type, name);
  if (fs.existsSync(filePath)) return res.status(409).json({ error: 'Script already exists' });

  const content = req.body.content || '';
  const description = req.body.description || '';

  fs.writeFileSync(filePath, content);

  const metadata = readMetadata();
  const key = metaKey(type, name);
  metadata[key] = {
    description,
    created: new Date().toISOString()
  };
  writeMetadata(metadata);

  res.status(201).json({ name, type, content, description });
});

// Update a script
app.put('/api/scripts/:type/:name', (req, res) => {
  const { type, name } = req.params;
  if (!validateType(type)) return res.status(400).json({ error: 'Invalid script type' });
  if (!validateName(name)) return res.status(400).json({ error: 'Invalid script name' });

  const filePath = path.join(SCRIPTS_DIR, type, name);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Script not found' });

  if (req.body.content !== undefined) {
    fs.writeFileSync(filePath, req.body.content);
  }

  if (req.body.description !== undefined) {
    const metadata = readMetadata();
    const key = metaKey(type, name);
    if (!metadata[key]) metadata[key] = {};
    metadata[key].description = req.body.description;
    writeMetadata(metadata);
  }

  res.json({ ok: true });
});

// Rename a script
app.put('/api/scripts/:type/:name/rename', (req, res) => {
  const { type, name } = req.params;
  const newName = req.body.newName;

  if (!validateType(type)) return res.status(400).json({ error: 'Invalid script type' });
  if (!validateName(name)) return res.status(400).json({ error: 'Invalid script name' });
  if (!validateName(newName)) return res.status(400).json({ error: 'Invalid new name' });

  const oldPath = path.join(SCRIPTS_DIR, type, name);
  const newPath = path.join(SCRIPTS_DIR, type, newName);

  if (!fs.existsSync(oldPath)) return res.status(404).json({ error: 'Script not found' });
  if (fs.existsSync(newPath)) return res.status(409).json({ error: 'Target name already exists' });

  fs.renameSync(oldPath, newPath);

  const metadata = readMetadata();
  const oldKey = metaKey(type, name);
  const newKey = metaKey(type, newName);
  if (metadata[oldKey]) {
    metadata[newKey] = metadata[oldKey];
    delete metadata[oldKey];
    writeMetadata(metadata);
  }

  res.json({ ok: true, newName });
});

// Delete a script
app.delete('/api/scripts/:type/:name', (req, res) => {
  const { type, name } = req.params;
  if (!validateType(type)) return res.status(400).json({ error: 'Invalid script type' });
  if (!validateName(name)) return res.status(400).json({ error: 'Invalid script name' });

  const filePath = path.join(SCRIPTS_DIR, type, name);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Script not found' });

  fs.unlinkSync(filePath);

  const metadata = readMetadata();
  const key = metaKey(type, name);
  delete metadata[key];
  writeMetadata(metadata);

  res.json({ ok: true });
});

// Check modified timestamp for a script (used by frontend polling)
app.get('/api/scripts/:type/:name/modified', (req, res) => {
  const { type, name } = req.params;
  if (!validateType(type)) return res.status(400).json({ error: 'Invalid script type' });
  if (!validateName(name)) return res.status(400).json({ error: 'Invalid script name' });

  const filePath = path.join(SCRIPTS_DIR, type, name);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Script not found' });

  const stat = fs.statSync(filePath);
  res.json({ modified: stat.mtime.toISOString() });
});

// Git status for the repo
app.get('/api/git/status', (req, res) => {
  const { execSync } = require('child_process');
  try {
    const output = execSync('git status --porcelain', { cwd: __dirname, encoding: 'utf-8' });
    const lines = output.trim().split('\n').filter(Boolean);
    res.json({ clean: lines.length === 0, changed: lines.length, files: lines.slice(0, 20) });
  } catch {
    res.json({ clean: null, changed: 0, files: [] });
  }
});

app.listen(PORT, () => {
  console.log(`Rive Scripts playground running at http://localhost:${PORT}`);
});
