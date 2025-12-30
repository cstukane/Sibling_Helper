export type Announcement = { text: string };

export function announce(_a: Announcement): Promise<void> {
  return Promise.resolve();
}
