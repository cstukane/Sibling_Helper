import type { Link, LinkCode, LinkLimits } from '../types/linkingTypes';
import { getEnv } from './env';
import { apiRequest, startOfflineQueueProcessor } from '../api/request';

const LINKS_KEY = 'links';
const LINK_CODES_KEY = 'link_codes';

startOfflineQueueProcessor();

function readLinks(): Link[] {
  try {
    const raw = localStorage.getItem(LINKS_KEY);
    return raw ? (JSON.parse(raw) as Link[]) : [];
  } catch {
    return [];
  }
}

function writeLinks(links: Link[]) {
  localStorage.setItem(LINKS_KEY, JSON.stringify(links));
}

function readCodes(): LinkCode[] {
  try {
    const raw = localStorage.getItem(LINK_CODES_KEY);
    return raw ? (JSON.parse(raw) as LinkCode[]) : [];
  } catch {
    return [];
  }
}

function writeCodes(codes: LinkCode[]) {
  localStorage.setItem(LINK_CODES_KEY, JSON.stringify(codes));
}

function nowISO() {
  return new Date().toISOString();
}

function isExpired(iso: string) {
  return Date.now() > Date.parse(iso);
}

function generateSixDigit(): string {
  let code = '';
  while (code.length < 6) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

function uniqueCode(existing: Set<string>): string {
  // Try up to N times for uniqueness
  for (let i = 0; i < 20; i++) {
    const c = generateSixDigit();
    if (!existing.has(c)) return c;
  }
  // Fallback to uuid-derived numeric string
  return (Date.now() % 1000000).toString().padStart(6, '0');
}

function generateId(): string {
  // Simple collision-resistant id for local use
  return `link_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const linkingService = {
  getLimits(): LinkLimits {
    return { parentMaxChildren: 5, childMaxParents: 2 };
  },

  listLinks(): Link[] {
    const links = readLinks();
    // Auto-expire any links erroneously marked pending for too long? For now just return.
    return links;
  },

  getLink(id: string): Link | undefined {
    return readLinks().find((l) => l.id === id);
  },

  listCodes(): LinkCode[] {
    const codes = readCodes();
    // Update status for any expired codes
    let dirty = false;
    const updated = codes.map((c) => {
      if (c.status === 'active' && isExpired(c.expiresAt)) {
        dirty = true;
        return { ...c, status: 'expired' } as LinkCode;
      }
      return c;
    });
    if (dirty) writeCodes(updated);
    return updated;
  },

  getActiveLinksForParent(parentId: string): Link[] {
    return this.listLinks().filter((l) => l.parentId === parentId && l.status === 'active');
  },

  getActiveLinksForChild(childId: string): Link[] {
    return this.listLinks().filter((l) => l.childId === childId && l.status === 'active');
  },

  getPendingForParent(parentId: string): Link[] {
    return this.listLinks().filter((l) => l.parentId === parentId && l.status === 'pending_parent');
  },

  getPendingForChild(childId: string): Link[] {
    return this.listLinks().filter((l) => l.childId === childId && l.status === 'pending_child');
  },

  generateCodeForParent(parentId: string, ttlMinutes = 15): { code: string } {
    const { ENABLE_SYNC, API_BASE_URL } = getEnv();
    if (ENABLE_SYNC || API_BASE_URL) {
      throw new Error('Use generateCodeForParentAsync when sync is enabled');
    }
    const { parentMaxChildren } = this.getLimits();
    const active = this.getActiveLinksForParent(parentId).length;
    if (active >= parentMaxChildren) throw new Error('You have reached the maximum of 5 linked children');
    const codes = this.listCodes();
    const existingSet = new Set(codes.map((c) => c.code));
    const code = uniqueCode(existingSet);
    const createdAt = nowISO();
    const expiresAt = new Date(Date.now() + ttlMinutes * 60_000).toISOString();
    const newCode: LinkCode = { code, issuedBy: 'parent', parentId, createdAt, expiresAt, status: 'active', usedById: null, consumedAt: null };
    writeCodes([newCode, ...codes]);
    return { code };
  },

  async generateCodeForParentAsync(parentId: string, ttlMinutes = 15): Promise<{ code: string; expiresAt?: string }>{
    const { ENABLE_SYNC, API_BASE_URL } = getEnv();
    if (ENABLE_SYNC || API_BASE_URL) {
      return apiRequest('/api/link-codes', {
        method: 'POST',
        body: JSON.stringify({ parentId, ttlMinutes })
      }, { queueIfOffline: true });
    }
    return this.generateCodeForParent(parentId, ttlMinutes);
  },

  validateCode(code: string): { valid: boolean; reason?: string; codeObj?: LinkCode } {
    const codes = this.listCodes();
    const found = codes.find((c) => c.code === code);
    if (!found) return { valid: false, reason: 'Invalid code' };
    if (found.status !== 'active') return { valid: false, reason: 'Code is not active' };
    if (isExpired(found.expiresAt)) return { valid: false, reason: 'Code has expired' };
    return { valid: true, codeObj: found };
  },

  // Child enters a parent-issued code -> creates link pending parent approval
  async enterCodeAsChild(childId: string, code: string): Promise<{ pending: boolean; linkId?: string; error?: string }>{
    const { ENABLE_SYNC, API_BASE_URL } = getEnv();
    if (ENABLE_SYNC || API_BASE_URL) {
      try {
        const res = await apiRequest('/api/links/enter-code', {
          method: 'POST',
          body: JSON.stringify({ childId, code })
        }, { queueIfOffline: true });
        return { pending: !!res.pending, linkId: res.linkId };
      } catch (e: any) {
        if (e?.queued) {
          return { pending: false, error: 'Offline: request queued. Try again when online.' };
        }
        return { pending: false, error: e?.message || 'Invalid or expired code' };
      }
    }
    const { childMaxParents } = this.getLimits();
    const currentActive = this.getActiveLinksForChild(childId).length;
    if (currentActive >= childMaxParents) {
      return { pending: false, error: 'You are already linked to the maximum number of parents' };
    }
    const validation = this.validateCode(code);
    if (!validation.valid || !validation.codeObj) {
      return { pending: false, error: validation.reason || 'Invalid or expired code' };
    }
    const codeObj = validation.codeObj;
    if (codeObj.issuedBy !== 'parent' || !codeObj.parentId) {
      return { pending: false, error: 'This code is not valid for child linking' };
    }

    // Consume code and create pending link
    const links = readLinks();
    const newLink: Link = {
      id: generateId(),
      parentId: codeObj.parentId,
      childId,
      status: 'pending_parent',
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };
    writeLinks([newLink, ...links]);

    // mark code consumed
    const codes = this.listCodes();
    const updatedCodes: LinkCode[] = codes.map((c): LinkCode =>
      c.code === code
        ? { ...c, status: 'consumed', usedById: childId, consumedAt: nowISO() }
        : c
    );
    writeCodes(updatedCodes);

    return { pending: true, linkId: newLink.id };
  },

  // Parent approves a pending link
  approveLinkAsParent(parentId: string, linkId: string): { success: boolean; error?: string } {
    const { ENABLE_SYNC, API_BASE_URL } = getEnv();
    if (ENABLE_SYNC || API_BASE_URL) {
      throw new Error('Use approveLinkAsParentAsync when sync is enabled');
    }
    const links = readLinks();
    const link = links.find((l) => l.id === linkId);
    if (!link) return { success: false, error: 'Link not found' };
    if (link.parentId !== parentId) return { success: false, error: 'Not authorized' };
    if (link.status !== 'pending_parent') return { success: false, error: 'Link is not pending' };

    const { parentMaxChildren, childMaxParents } = this.getLimits();
    const parentActive = links.filter((l) => l.parentId === parentId && l.status === 'active').length;
    if (parentActive >= parentMaxChildren) return { success: false, error: 'Parent link limit reached' };
    const childActive = links.filter((l) => l.childId === link.childId && l.status === 'active').length;
    if (childActive >= childMaxParents) return { success: false, error: 'Child link limit reached' };

    const updated: Link[] = links.map((l): Link =>
      l.id === linkId ? { ...l, status: 'active', updatedAt: nowISO() } : l
    );
    writeLinks(updated);
    return { success: true };
  },

  async approveLinkAsParentAsync(parentId: string, linkId: string): Promise<{ success: boolean; error?: string }>{
    const { ENABLE_SYNC, API_BASE_URL } = getEnv();
    if (ENABLE_SYNC || API_BASE_URL) {
      try {
        await apiRequest(`/api/links/${encodeURIComponent(linkId)}/approve`, {
          method: 'POST',
          body: JSON.stringify({ parentId })
        }, { queueIfOffline: true });
        return { success: true };
      } catch (e: any) {
        if (e?.queued) {
          return { success: false, error: 'Offline: approval queued. Try again when online.' };
        }
        return { success: false, error: e?.message || 'Failed to approve link' };
      }
    }
    return this.approveLinkAsParent(parentId, linkId);
  },

  declineLink(linkId: string): void {
    const links = readLinks();
    const updated: Link[] = links.map((l): Link =>
      l.id === linkId ? { ...l, status: 'declined', updatedAt: nowISO() } : l
    );
    writeLinks(updated);
  },

  async declineLinkAsync(linkId: string): Promise<void> {
    const { ENABLE_SYNC, API_BASE_URL } = getEnv();
    if (ENABLE_SYNC || API_BASE_URL) {
      await apiRequest(`/api/links/${encodeURIComponent(linkId)}/decline`, { method: 'POST' }, { queueIfOffline: true });
      return;
    }
    this.declineLink(linkId);
  },

  unlink(parentId: string, childId: string): void {
    const links = readLinks();
    const updated: Link[] = links.map((l): Link =>
      l.parentId === parentId && l.childId === childId && l.status === 'active'
        ? { ...l, status: 'declined', updatedAt: nowISO() }
        : l
    );
    writeLinks(updated);
  },

  async unlinkAsync(parentId: string, childId: string): Promise<void> {
    const { ENABLE_SYNC, API_BASE_URL } = getEnv();
    if (ENABLE_SYNC || API_BASE_URL) {
      await apiRequest('/api/links/unlink', {
        method: 'POST',
        body: JSON.stringify({ parentId, childId })
      }, { queueIfOffline: true });
      return;
    }
    this.unlink(parentId, childId);
  },

  async getPendingForParentRemote(parentId: string) {
    const { ENABLE_SYNC, API_BASE_URL } = getEnv();
    if (!(ENABLE_SYNC || API_BASE_URL)) return this.getPendingForParent(parentId);
    return apiRequest(`/api/parents/${encodeURIComponent(parentId)}/links/pending`, { method: 'GET' }, { cacheTtlMs: 5000 });
  },

  async getActiveForParentRemote(parentId: string) {
    const { ENABLE_SYNC, API_BASE_URL } = getEnv();
    if (!(ENABLE_SYNC || API_BASE_URL)) return this.getActiveLinksForParent(parentId);
    return apiRequest(`/api/parents/${encodeURIComponent(parentId)}/links/active`, { method: 'GET' }, { cacheTtlMs: 5000 });
  },
};
