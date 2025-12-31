export type Announcement = { text: string };

export function announce(announcement: Announcement): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { text } = announcement;
  return Promise.resolve();
}
