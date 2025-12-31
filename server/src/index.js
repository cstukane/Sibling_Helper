const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const pino = require('pino');
const pinoHttp = require('pino-http');
const fs = require('fs');
const path = require('path');

const app = express();
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const AUTH_REQUIRED = process.env.AUTH_REQUIRED === 'true';
const JWT_SECRET = process.env.JWT_SECRET || '';
if (AUTH_REQUIRED && JWT_SECRET.length < 16) {
  throw new Error('JWT_SECRET must be set to at least 16 characters when AUTH_REQUIRED=true');
}

app.use(pinoHttp({
  logger,
  genReqId: (req) => req.headers['x-request-id'] || crypto.randomUUID(),
}));
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '100kb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

function authMiddleware(req, res, next) {
  if (req.path === '/health') return next();
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    if (AUTH_REQUIRED) return res.status(401).json({ error: 'Missing Authorization header' });
    return next();
  }
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return res.status(401).json({ error: 'Invalid Authorization header' });
  const token = match[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET || 'dev-secret', { algorithms: ['HS256'] });
    return next();
  } catch (err) {
    if (AUTH_REQUIRED) return res.status(401).json({ error: 'Invalid token' });
    req.log?.warn({ err }, 'Invalid JWT provided without AUTH_REQUIRED');
    return next();
  }
}

app.use('/api', authMiddleware);

// Simple JSON file persistence
const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'data.json');
const DATA_SCHEMA_VERSION = 1;
const MAX_ID_LEN = 80;
const MAX_TITLE_LEN = 200;
const ID_REGEX = /^[A-Za-z0-9._:-]+$/;

function sanitizeString(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.replace(/[^\x20-\x7E]/g, '');
}

function cleanId(value) {
  const clean = sanitizeString(value);
  if (!clean) return null;
  if (clean.length > MAX_ID_LEN) return null;
  if (!ID_REGEX.test(clean)) return null;
  return clean;
}

function cleanTitle(value) {
  if (value === undefined || value === null || value === '') return '';
  const clean = sanitizeString(value) || '';
  if (clean.length > MAX_TITLE_LEN) return null;
  return clean;
}

function cleanIso(value) {
  if (typeof value !== 'string') return null;
  const ts = Date.parse(value);
  if (Number.isNaN(ts)) return null;
  return new Date(ts).toISOString();
}

function cleanLink(value) {
  if (!value || typeof value !== 'object') return null;
  const id = cleanId(value.id);
  const parentId = cleanId(value.parentId);
  const childId = cleanId(value.childId);
  const createdAt = cleanIso(value.createdAt);
  const updatedAt = cleanIso(value.updatedAt) || createdAt;
  const status = sanitizeString(value.status);
  if (!id || !parentId || !childId || !createdAt || !updatedAt) return null;
  if (!['pending_parent', 'active', 'declined'].includes(status)) return null;
  return { id, parentId, childId, status, createdAt, updatedAt };
}

function cleanLinkCode(value) {
  if (!value || typeof value !== 'object') return null;
  const code = sanitizeString(value.code);
  const issuedBy = sanitizeString(value.issuedBy);
  const parentId = cleanId(value.parentId);
  const createdAt = cleanIso(value.createdAt);
  const expiresAt = cleanIso(value.expiresAt);
  const status = sanitizeString(value.status);
  if (!code || !/^\d{6}$/.test(code)) return null;
  if (!issuedBy || !['parent', 'child'].includes(issuedBy)) return null;
  if (issuedBy === 'parent' && !parentId) return null;
  if (!createdAt || !expiresAt) return null;
  if (!['active', 'expired', 'consumed'].includes(status)) return null;
  const usedById = cleanId(value.usedById);
  const consumedAt = cleanIso(value.consumedAt);
  return {
    code,
    issuedBy,
    parentId: parentId || null,
    createdAt,
    expiresAt,
    status,
    usedById: usedById || null,
    consumedAt: consumedAt || null,
  };
}

function cleanAssignment(value) {
  if (!value || typeof value !== 'object') return null;
  const id = cleanId(value.id);
  const parentId = cleanId(value.parentId);
  const childId = cleanId(value.childId);
  const questId = cleanId(value.questId);
  const title = cleanTitle(value.title);
  const points = Number(value.points);
  const assignedAt = cleanIso(value.assignedAt);
  const active = typeof value.active === 'boolean' ? value.active : null;
  if (!id || !parentId || !childId || !questId || !assignedAt || title === null) return null;
  if (!Number.isFinite(points) || points < 0 || points > 10000) return null;
  if (active === null) return null;
  return { id, parentId, childId, questId, title, points, assignedAt, active };
}

function normalizeLoadedData(raw) {
  const data = raw && typeof raw === 'object' ? raw : {};
  let schemaVersion = Number.isInteger(data.schemaVersion) ? data.schemaVersion : 0;
  const links = Array.isArray(data.links) ? data.links : [];
  const linkCodes = Array.isArray(data.linkCodes) ? data.linkCodes : [];
  const assignedTasks = Array.isArray(data.assignedTasks) ? data.assignedTasks : [];

  const cleanedLinks = links.map(cleanLink).filter(Boolean);
  const cleanedCodes = linkCodes.map(cleanLinkCode).filter(Boolean);
  const cleanedTasks = assignedTasks.map(cleanAssignment).filter(Boolean);

  const droppedLinks = links.length - cleanedLinks.length;
  const droppedCodes = linkCodes.length - cleanedCodes.length;
  const droppedTasks = assignedTasks.length - cleanedTasks.length;
  if (droppedLinks || droppedCodes || droppedTasks) {
    logger.warn({ droppedLinks, droppedCodes, droppedTasks }, 'Dropped invalid records during load');
  }

  const migrated = schemaVersion !== DATA_SCHEMA_VERSION;
  if (schemaVersion !== DATA_SCHEMA_VERSION) schemaVersion = DATA_SCHEMA_VERSION;

  return {
    migrated,
    normalized: {
      schemaVersion,
      links: cleanedLinks,
      linkCodes: cleanedCodes,
      assignedTasks: cleanedTasks,
    },
  };
}

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({
      schemaVersion: DATA_SCHEMA_VERSION,
      links: [],
      linkCodes: [],
      assignedTasks: [],
    }, null, 2));
  }
}

function backupDataFile(reason) {
  if (!fs.existsSync(DATA_FILE)) return;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${DATA_FILE}.bak-${stamp}`;
  try {
    fs.copyFileSync(DATA_FILE, backupPath);
    logger.info({ backupPath, reason }, 'Created data backup');
  } catch (err) {
    logger.warn({ err }, 'Failed to create data backup');
  }
}

function loadData() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    const { migrated, normalized } = normalizeLoadedData(parsed);
    if (migrated) {
      backupDataFile('schema migration');
      const payload = JSON.stringify(normalized, null, 2);
      fs.writeFileSync(DATA_FILE, payload);
    }
    return normalized;
  } catch (e) {
    logger.warn({ err: e }, 'Failed to read data file, starting fresh');
    return { schemaVersion: DATA_SCHEMA_VERSION, links: [], linkCodes: [], assignedTasks: [] };
  }
}

function saveData() {
  try {
    const payload = JSON.stringify({
      schemaVersion: DATA_SCHEMA_VERSION,
      links,
      linkCodes,
      assignedTasks,
    }, null, 2);
    const tmpFile = `${DATA_FILE}.tmp`;
    fs.writeFileSync(tmpFile, payload);
    try {
      fs.renameSync(tmpFile, DATA_FILE);
    } catch (err) {
      try {
        fs.rmSync(DATA_FILE, { force: true });
        fs.renameSync(tmpFile, DATA_FILE);
      } catch (err2) {
        fs.writeFileSync(DATA_FILE, payload);
        fs.rmSync(tmpFile, { force: true });
      }
    }
  } catch (e) {
    logger.error({ err: e }, 'Failed to write data file');
  }
}

const { links, linkCodes, assignedTasks } = loadData();

const LIMITS = { parentMaxChildren: 5, childMaxParents: 2 };

const nowISO = () => new Date().toISOString();
const isExpired = (iso) => Date.now() > Date.parse(iso);
const generateId = () => `link_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
const generateSixDigit = () => Math.floor(100000 + Math.random() * 900000).toString();

function authorizeByRole(req, res, { parentId, childId, allowAdmin = true, allowParent = true, allowChild = true }) {
  if (!AUTH_REQUIRED) return true;
  const user = req.user;
  if (!user || !user.sub) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  if (allowAdmin && user.role === 'admin') return true;
  if (allowParent && parentId && user.role === 'parent' && user.sub === parentId) return true;
  if (allowChild && childId && user.role === 'child' && user.sub === childId) return true;
  req.log?.warn({ userId: user.sub, role: user.role }, 'Authorization denied');
  res.status(403).json({ error: 'Forbidden' });
  return false;
}

function requireId(value, fieldName) {
  const clean = sanitizeString(value);
  if (!clean) return { error: `${fieldName} required` };
  if (clean.length > MAX_ID_LEN) return { error: `${fieldName} too long` };
  if (!ID_REGEX.test(clean)) return { error: `${fieldName} has invalid characters` };
  return { value: clean };
}

function requireSixDigitCode(value) {
  const clean = sanitizeString(value);
  if (!clean) return { error: 'code required' };
  if (!/^\d{6}$/.test(clean)) return { error: 'code must be 6 digits' };
  return { value: clean };
}

function parseIntInRange(value, fieldName, min, max, fallback) {
  if (value === undefined || value === null || value === '') {
    return { value: fallback };
  }
  const num = Number(value);
  if (!Number.isFinite(num) || !Number.isInteger(num)) return { error: `${fieldName} must be an integer` };
  if (num < min || num > max) return { error: `${fieldName} must be between ${min} and ${max}` };
  return { value: num };
}

function parseNumberInRange(value, fieldName, min, max, fallback) {
  if (value === undefined || value === null || value === '') {
    return { value: fallback };
  }
  const num = Number(value);
  if (!Number.isFinite(num)) return { error: `${fieldName} must be a number` };
  if (num < min || num > max) return { error: `${fieldName} must be between ${min} and ${max}` };
  return { value: num };
}

function parseOptionalTitle(value) {
  if (value === undefined || value === null || value === '') return { value: '' };
  const clean = sanitizeString(value) || '';
  if (clean.length > MAX_TITLE_LEN) return { error: 'title too long' };
  return { value: clean };
}

let transaction = Promise.resolve();
function withTransaction(work) {
  const next = transaction.then(() => work());
  transaction = next.catch(() => {});
  return next;
}

function createHttpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function respondWithError(req, res, err) {
  const status = err?.status || 500;
  const message = err?.message || 'Server error';
  if (status >= 500) req.log?.error({ err }, 'Request failed');
  return res.status(status).json({ error: message });
}

function refreshCodeStatuses() {
  let changed = false;
  for (const c of linkCodes) {
    if (c.status === 'active' && isExpired(c.expiresAt)) {
      c.status = 'expired';
      changed = true;
    }
  }
  return changed;
}

function countActiveForParent(parentId) {
  return links.filter((l) => l.parentId === parentId && l.status === 'active').length;
}

function countActiveForChild(childId) {
  return links.filter((l) => l.childId === childId && l.status === 'active').length;
}

// POST /api/link-codes  { parentId }
app.post('/api/link-codes', async (req, res) => {
  const parentIdResult = requireId(req.body?.parentId, 'parentId');
  if (parentIdResult.error) return res.status(400).json({ error: parentIdResult.error });
  const ttlResult = parseIntInRange(req.body?.ttlMinutes, 'ttlMinutes', 1, 1440, 15);
  if (ttlResult.error) return res.status(400).json({ error: ttlResult.error });
  const parentId = parentIdResult.value;
  const ttlMinutes = ttlResult.value;
  if (!authorizeByRole(req, res, { parentId, allowChild: false })) return;

  try {
    const result = await withTransaction(() => {
      refreshCodeStatuses();
      if (countActiveForParent(parentId) >= LIMITS.parentMaxChildren) {
        throw createHttpError(400, 'Parent link limit reached');
      }

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
      return { code, expiresAt };
    });
    res.json(result);
  } catch (err) {
    respondWithError(req, res, err);
  }
});

// POST /api/links/enter-code  { childId, code }
app.post('/api/links/enter-code', async (req, res) => {
  const childIdResult = requireId(req.body?.childId, 'childId');
  if (childIdResult.error) return res.status(400).json({ error: childIdResult.error });
  const codeResult = requireSixDigitCode(req.body?.code);
  if (codeResult.error) return res.status(400).json({ error: codeResult.error });
  const childId = childIdResult.value;
  const code = codeResult.value;
  if (!authorizeByRole(req, res, { childId, allowParent: false })) return;
  try {
    const result = await withTransaction(() => {
      refreshCodeStatuses();
      if (countActiveForChild(childId) >= LIMITS.childMaxParents) {
        throw createHttpError(400, 'Child link limit reached');
      }

      const codeObj = linkCodes.find((c) => c.code === code);
      if (!codeObj) throw createHttpError(400, 'Invalid code');
      if (codeObj.status !== 'active') throw createHttpError(400, 'Code is not active');
      if (isExpired(codeObj.expiresAt)) throw createHttpError(400, 'Code has expired');
      if (codeObj.issuedBy !== 'parent' || !codeObj.parentId) {
        throw createHttpError(400, 'Code not valid for child linking');
      }

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
      return { pending: true, linkId: link.id };
    });
    res.json(result);
  } catch (err) {
    respondWithError(req, res, err);
  }
});

// GET /api/parents/:parentId/links/pending
app.get('/api/parents/:parentId/links/pending', (req, res) => {
  const parentIdResult = requireId(req.params?.parentId, 'parentId');
  if (parentIdResult.error) return res.status(400).json({ error: parentIdResult.error });
  const parentId = parentIdResult.value;
  if (!authorizeByRole(req, res, { parentId, allowChild: false })) return;
  const pending = links.filter((l) => l.parentId === parentId && l.status === 'pending_parent');
  res.json(pending);
});

// GET /api/parents/:parentId/links/active
app.get('/api/parents/:parentId/links/active', (req, res) => {
  const parentIdResult = requireId(req.params?.parentId, 'parentId');
  if (parentIdResult.error) return res.status(400).json({ error: parentIdResult.error });
  const parentId = parentIdResult.value;
  if (!authorizeByRole(req, res, { parentId, allowChild: false })) return;
  const active = links.filter((l) => l.parentId === parentId && l.status === 'active');
  res.json(active);
});

// POST /api/links/:id/approve
app.post('/api/links/:id/approve', async (req, res) => {
  const idResult = requireId(req.params?.id, 'id');
  if (idResult.error) return res.status(400).json({ error: idResult.error });
  const parentIdResult = requireId(req.body?.parentId, 'parentId');
  if (parentIdResult.error) return res.status(400).json({ error: parentIdResult.error });
  const id = idResult.value;
  const parentId = parentIdResult.value;
  if (!authorizeByRole(req, res, { parentId, allowChild: false })) return;
  try {
    const result = await withTransaction(() => {
      const link = links.find((l) => l.id === id);
      if (!link) throw createHttpError(404, 'Link not found');
      if (link.parentId !== parentId) throw createHttpError(403, 'Not authorized');
      if (link.status !== 'pending_parent') throw createHttpError(400, 'Link is not pending');

      if (countActiveForParent(parentId) >= LIMITS.parentMaxChildren) {
        throw createHttpError(400, 'Parent link limit reached');
      }
      if (countActiveForChild(link.childId) >= LIMITS.childMaxParents) {
        throw createHttpError(400, 'Child link limit reached');
      }

      link.status = 'active';
      link.updatedAt = nowISO();
      saveData();
      return { success: true };
    });
    res.json(result);
  } catch (err) {
    respondWithError(req, res, err);
  }
});

// POST /api/links/:id/decline
app.post('/api/links/:id/decline', async (req, res) => {
  const idResult = requireId(req.params?.id, 'id');
  if (idResult.error) return res.status(400).json({ error: idResult.error });
  const id = idResult.value;
  const existing = links.find((l) => l.id === id);
  if (!existing) return res.status(404).json({ error: 'Link not found' });
  if (!authorizeByRole(req, res, { parentId: existing.parentId, childId: existing.childId })) return;
  try {
    const result = await withTransaction(() => {
      const link = links.find((l) => l.id === id);
      if (!link) throw createHttpError(404, 'Link not found');
      link.status = 'declined';
      link.updatedAt = nowISO();
      saveData();
      return { success: true };
    });
    res.json(result);
  } catch (err) {
    respondWithError(req, res, err);
  }
});

// POST /api/links/unlink  { parentId, childId }
app.post('/api/links/unlink', async (req, res) => {
  const parentIdResult = requireId(req.body?.parentId, 'parentId');
  if (parentIdResult.error) return res.status(400).json({ error: parentIdResult.error });
  const childIdResult = requireId(req.body?.childId, 'childId');
  if (childIdResult.error) return res.status(400).json({ error: childIdResult.error });
  const parentId = parentIdResult.value;
  const childId = childIdResult.value;
  if (!authorizeByRole(req, res, { parentId, childId })) return;
  try {
    const result = await withTransaction(() => {
      for (const l of links) {
        if (l.parentId === parentId && l.childId === childId && l.status === 'active') {
          l.status = 'declined';
          l.updatedAt = nowISO();
        }
      }
      saveData();
      return { success: true };
    });
    res.json(result);
  } catch (err) {
    respondWithError(req, res, err);
  }
});

// Health endpoint to verify server build/version
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, version: 'tasks-assign-enabled', uptimeSeconds: Math.floor(process.uptime()), endpoints: [
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
app.post('/api/tasks/assign', async (req, res) => {
  const parentIdResult = requireId(req.body?.parentId, 'parentId');
  if (parentIdResult.error) return res.status(400).json({ error: parentIdResult.error });
  const childIdResult = requireId(req.body?.childId, 'childId');
  if (childIdResult.error) return res.status(400).json({ error: childIdResult.error });
  const questIdResult = requireId(req.body?.questId, 'questId');
  if (questIdResult.error) return res.status(400).json({ error: questIdResult.error });
  const titleResult = parseOptionalTitle(req.body?.title);
  if (titleResult.error) return res.status(400).json({ error: titleResult.error });
  const pointsResult = parseNumberInRange(req.body?.points, 'points', 0, 10000, 0);
  if (pointsResult.error) return res.status(400).json({ error: pointsResult.error });
  const parentId = parentIdResult.value;
  const childId = childIdResult.value;
  const questId = questIdResult.value;
  const title = titleResult.value;
  const points = pointsResult.value;
  if (!authorizeByRole(req, res, { parentId, allowChild: false })) return;
  try {
    const result = await withTransaction(() => {
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
        title,
        points,
        assignedAt: new Date().toISOString(),
        active: true,
      };
      assignedTasks.unshift(item);
      saveData();
      return item;
    });
    res.json(result);
  } catch (err) {
    respondWithError(req, res, err);
  }
});

// GET /api/children/:childId/tasks
app.get('/api/children/:childId/tasks', (req, res) => {
  const childIdResult = requireId(req.params?.childId, 'childId');
  if (childIdResult.error) return res.status(400).json({ error: childIdResult.error });
  const childId = childIdResult.value;
  if (!authorizeByRole(req, res, { childId, allowParent: false })) return;
  const list = assignedTasks.filter((t) => t.childId === childId && t.active);
  res.json(list);
});

// POST /api/tasks/:id/unassign
app.post('/api/tasks/:id/unassign', async (req, res) => {
  const idResult = requireId(req.params?.id, 'id');
  if (idResult.error) return res.status(400).json({ error: idResult.error });
  const id = idResult.value;
  const existing = assignedTasks.find((t) => t.id === id);
  if (!existing) return res.status(404).json({ error: 'Assignment not found' });
  if (!authorizeByRole(req, res, { parentId: existing.parentId, childId: existing.childId })) return;
  try {
    const result = await withTransaction(() => {
      const item = assignedTasks.find((t) => t.id === id);
      if (!item) throw createHttpError(404, 'Assignment not found');
      item.active = false;
      saveData();
      return { success: true };
    });
    res.json(result);
  } catch (err) {
    respondWithError(req, res, err);
  }
});

// GET /api/parents/:parentId/children/:childId/tasks
app.get('/api/parents/:parentId/children/:childId/tasks', (req, res) => {
  const parentIdResult = requireId(req.params?.parentId, 'parentId');
  if (parentIdResult.error) return res.status(400).json({ error: parentIdResult.error });
  const childIdResult = requireId(req.params?.childId, 'childId');
  if (childIdResult.error) return res.status(400).json({ error: childIdResult.error });
  const parentId = parentIdResult.value;
  const childId = childIdResult.value;
  if (!authorizeByRole(req, res, { parentId, childId })) return;
  const list = assignedTasks.filter((t) => t.parentId === parentId && t.childId === childId && t.active);
  res.json(list);
});

// POST /api/assignments/migrate { questMap: { questId: {title, points} }, onlyMissing?: boolean }
app.post('/api/assignments/migrate', async (req, res) => {
  const questMap = req.body?.questMap;
  const onlyMissing = req.body?.onlyMissing !== false;
  if (!questMap || typeof questMap !== 'object' || Array.isArray(questMap)) {
    return res.status(400).json({ error: 'questMap required' });
  }
  if (!authorizeByRole(req, res, { allowParent: false, allowChild: false })) return;
  const entries = Object.entries(questMap);
  if (entries.length > 1000) return res.status(400).json({ error: 'questMap too large' });
  try {
    const result = await withTransaction(() => {
      let updated = 0;
      for (const t of assignedTasks) {
        const info = questMap[t.questId];
        if (!info) continue;
        const needs = onlyMissing ? (!t.title || typeof t.points !== 'number' || t.points === 0) : true;
        if (needs) {
          const titleResult = parseOptionalTitle(info.title);
          const pointsResult = parseNumberInRange(info.points, 'points', 0, 10000, 0);
          if (titleResult.error || pointsResult.error) continue;
          t.title = titleResult.value;
          t.points = pointsResult.value;
          updated++;
        }
      }
      saveData();
      return { updated };
    });
    res.json(result);
  } catch (err) {
    respondWithError(req, res, err);
  }
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Sibling Helper server running on http://localhost:${PORT}`);
});
