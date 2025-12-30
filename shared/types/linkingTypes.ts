export type LinkStatus = 'pending_parent' | 'pending_child' | 'active' | 'declined' | 'expired';

export type Link = {
  id: string;
  parentId: string;
  childId: string;
  status: LinkStatus;
  createdAt: string;
  updatedAt: string;
};

export type LinkCodeStatus = 'active' | 'consumed' | 'expired';

export type LinkCode = {
  code: string; // 6-digit numeric string
  issuedBy: 'parent' | 'child';
  parentId?: string;
  childId?: string;
  createdAt: string;
  expiresAt: string; // ISO
  status: LinkCodeStatus;
  usedById?: string | null; // id of the opposite party that entered the code
  consumedAt?: string | null;
};

export type LinkLimits = {
  parentMaxChildren: number;
  childMaxParents: number;
};

