/**
 * Converts a local disk path (Windows/Linux) into a streamable ilm-media protocol URL.
 * Bypasses Chromium file restrictions and ensures full HTTP 206 range seeking support.
 */
export function toMediaUrl(filePath: string | null | undefined): string {
  if (!filePath) return '';
  if (filePath.startsWith('ilm-media:') || filePath.startsWith('http:') || filePath.startsWith('https:')) {
    return filePath;
  }
  return `ilm-media://stream?path=${encodeURIComponent(filePath)}`;
}
