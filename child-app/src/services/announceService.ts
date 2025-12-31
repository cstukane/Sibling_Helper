export type Announcement = { text: string };

export function announce(_announcement: Announcement): Promise<void> {
  return Promise.resolve();
}
