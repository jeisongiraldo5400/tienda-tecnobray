export function readBrowserCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const parts = document.cookie ? document.cookie.split('; ') : [];
  for (const part of parts) {
    const idx = part.indexOf('=');
    const key = idx >= 0 ? part.slice(0, idx) : part;
    if (key === name) return decodeURIComponent(part.slice(idx + 1));
  }
  return null;
}
