const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Simple JSON file persistence
const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'data.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({ links: [], linkCodes: [] }, null, 2));
}

function loadData() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return { links: parsed.links || [], linkCodes: parsed.linkCodes || [], assignedTasks: parsed.assignedTasks || [] };
  } catch (e) {
    console.warn('Failed to read data file, starting fresh', e);
    return { links: [], linkCodes: [], assignedTasks: [] };
  }
}

function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ links, linkCodes, assignedTasks }, null, 2));
  } catch (e) {
    console.error('Failed to write data file', e);
  }
}

const { links, linkCodes, assignedTasks } = loadData();

const LIMITS = { parentMaxChildren: 5, childMaxParents: 2 };

const nowISO = () => new Date().toISOString();
const isExpired = (iso) => Date.now() > Date.parse(iso);
const generateId = () => `link_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
const generateSixDigit = () => Math.floor(100000 + Math.random() * 900000).toString();

function refreshCodeStatuses() {
  let changed = false;
  for (const c of linkCodes) {
    if (c.status === 'active' && isExpired(c.expiresAt)) c.status = 'expired';
    changed = true;
  }
  if (changed) saveData();
}

function countActiveForParent(parentId) {
  return links.filter((l) => l.parentId === parentId && l.status === 'active').length;
}

function countActiveForChild(childId) {
  return links.filter((l) => l.childId === childId && l.status === 'active').length;
}

// POST /api/link-codes  { parentId }
app.post('/api/link-codes', (req, res) => {
  const { parentId, ttlMinutes = 15 } = req.body || {};
  if (!parentId) return res.status(400).json({ error: 'parentId required' });

  if (countActiveForParent(parentId) >= LIMITS.parentMaxChildren) {
    return res.status(400).json({ error: 'Parent link limit reached' });
  }

  refreshCodeStatuses();
  const existing = new Set(linkCodes.filter((c) => c.status === 'active').map((c) => c.code));
  let code = generateSixDigit();
  for (let i = 0; i < 10 && existing.has(code); i++) code = generateSixDigit();

  const createdAt = nowISO();
  const expiresAt = new Date(Date.now() + ttlMinutes * 60_000).toISOString();
  const codeObj = {
    code,
    issuedBy: 'parent',
    parentId,
    createdAt,
    expiresAt,
    status: 'active',
    usedById: null,
    consumedAt: null,
  };
  linkCodes.unshift(codeObj);
  saveData();
  res.json({ code, expiresAt });
});

// POST /api/links/enter-code  { childId, code }
app.post('/api/links/enter-code', (req, res) => {
  const { childId, code } = req.body || {};
  if (!childId || !code) return res.status(400).json({ error: 'childId and code required' });
  if (countActiveForChild(childId) >= LIMITS.childMaxParents) return res.status(400).json({ error: 'Child link limit reached' });

  refreshCodeStatuses();
  const codeObj = linkCodes.find((c) => c.code === code);
  if (!codeObj) return res.status(400).json({ error: 'Invalid code' });
  if (codeObj.status !== 'active') return res.status(400).json({ error: 'Code is not active' });
  if (isExpired(codeObj.expiresAt)) return res.status(400).json({ error: 'Code has expired' });
  if (codeObj.issuedBy !== 'parent' || !codeObj.parentId) return res.status(400).json({ error: 'Code not valid for child linking' });

  // Create pending link
  const link = {
    id: generateId(),
    parentId: codeObj.parentId,
    childId,
    status: 'pending_parent',
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
  links.unshift(link);
  codeObj.status = 'consumed';
  codeObj.usedById = childId;
  codeObj.consumedAt = nowISO();
  saveData();
  res.json({ pending: true, linkId: link.id });
});

// GET /api/parents/:parentId/links/pending
app.get('/api/parents/:parentId/links/pending', (req, res) => {
  const { parentId } = req.params;
  const pending = links.filter((l) => l.parentId === parentId && l.status === 'pending_parent');
  res.json(pending);
});

// GET /api/parents/:parentId/links/active
app.get('/api/parents/:parentId/links/active', (req, res) => {
  const { parentId } = req.params;
  const active = links.filter((l) => l.parentId === parentId && l.status === 'active');
  res.json(active);
});

// POST /api/links/:id/approve
app.post('/api/links/:id/approve', (req, res) => {
  const { id } = req.params;
  const { parentId } = req.body || {};
  const link = links.find((l) => l.id === id);
  if (!link) return res.status(404).json({ error: 'Link not found' });
  if (link.parentId !== parentId) return res.status(403).json({ error: 'Not authorized' });
  if (link.status !== 'pending_parent') return res.status(400).json({ error: 'Link is not pending' });

  if (countActiveForParent(parentId) >= LIMITS.parentMaxChildren) return res.status(400).json({ error: 'Parent link limit reached' });
  if (countActiveForChild(link.childId) >= LIMITS.childMaxParents) return res.status(400).json({ error: 'Child link limit reached' });

  link.status = 'active';
  link.updatedAt = nowISO();
  saveData();
  res.json({ success: true });
});

// POST /api/links/:id/decline
app.post('/api/links/:id/decline', (req, res) => {
  const { id } = req.params;
  const link = links.find((l) => l.id === id);
  if (!link) return res.status(404).json({ error: 'Link not found' });
  link.status = 'declined';
  link.updatedAt = nowISO();
  saveData();
  res.json({ success: true });
});

// POST /api/links/unlink  { parentId, childId }
app.post('/api/links/unlink', (req, res) => {
  const { parentId, childId } = req.body || {};
  if (!parentId || !childId) return res.status(400).json({ error: 'parentId and childId required' });
  for (const l of links) {
    if (l.parentId === parentId && l.childId === childId && l.status === 'active') {
      l.status = 'declined';
      l.updatedAt = nowISO();
    }
  }
  saveData();
  res.json({ success: true });
});

// Health endpoint to verify server build/version
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, version: 'tasks-assign-enabled', endpoints: [
    'POST /api/link-codes',
    'POST /api/links/enter-code',
    'GET /api/parents/:parentId/links/pending',
    'GET /api/parents/:parentId/links/active',
    'POST /api/links/:id/approve',
    'POST /api/links/:id/decline',
    'POST /api/links/unlink',
    'POST /api/tasks/assign',
    'GET  /api/children/:childId/tasks',
    'POST /api/tasks/:id/unassign'
  ]});
});

// TASK ASSIGNMENTS
// POST /api/tasks/assign  { parentId, childId, questId }
app.post('/api/tasks/assign', (req, res) => {
  const { parentId, childId, questId, title, points } = req.body || {};
  if (!parentId || !childId || !questId) return res.status(400).json({ error: 'parentId, childId, questId required' });
  // Deactivate any previous active assignment of the same quest for this child
  for (const a of assignedTasks) {
    if (a.childId === childId && a.questId === questId && a.active) {
      a.active = false;
    }
  }
  const item = {
    id: `assign_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`,
    parentId,
    childId,
    questId,
    title: title || '',
    points: typeof points === 'number' ? points : 0,
    assignedAt: new Date().toISOString(),
    active: true,
  };
  assignedTasks.unshift(item);
  saveData();
  res.json(item);
});

// GET /api/children/:childId/tasks
app.get('/api/children/:childId/tasks', (req, res) => {
  const { childId } = req.params;
  const list = assignedTasks.filter((t) => t.childId === childId && t.active);
  res.json(list);
});

// POST /api/tasks/:id/unassign
app.post('/api/tasks/:id/unassign', (req, res) => {
  const { id } = req.params;
  const item = assignedTasks.find((t) => t.id === id);
  if (!item) return res.status(404).json({ error: 'Assignment not found' });
  item.active = false;
  saveData();
  res.json({ success: true });
});

// GET /api/parents/:parentId/children/:childId/tasks
app.get('/api/parents/:parentId/children/:childId/tasks', (req, res) => {
  const { parentId, childId } = req.params;
  const list = assignedTasks.filter((t) => t.parentId === parentId && t.childId === childId && t.active);
  res.json(list);
});

// POST /api/assignments/migrate { questMap: { questId: {title, points} }, onlyMissing?: boolean }
app.post('/api/assignments/migrate', (req, res) => {
  const { questMap = {}, onlyMissing = true } = req.body || {};
  if (!questMap || typeof questMap !== 'object') return res.status(400).json({ error: 'questMap required' });
  let updated = 0;
  for (const t of assignedTasks) {
    const info = questMap[t.questId];
    if (!info) continue;
    const needs = onlyMissing ? (!t.title || typeof t.points !== 'number' || t.points === 0) : true;
    if (needs) {
      t.title = info.title;
      t.points = info.points;
      updated++;
    }
  }
  saveData();
  res.json({ updated });
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Sibling Helper server running on http://localhost:${PORT}`);
});
