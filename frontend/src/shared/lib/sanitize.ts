/**
 * Sanitizador mínimo para HTML de contenido administrado (políticas, descripciones).
 * El backend también sanitiza; esto es defensa en profundidad para el render.
 * Permite etiquetas de formato y elimina scripts, estilos, iframes y atributos on*.
 */
const ALLOWED = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li', 'h2', 'h3', 'h4', 'blockquote', 'a', 'span',
  'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'code', 'pre',
]);

export function sanitizeHtml(input: string): string {
  if (!input) return '';
  let html = input
    .replace(/<\s*(script|style|iframe|object|embed|noscript|template)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*(script|style|iframe|object|embed|link|meta)[^>]*\/?>/gi, '');
  html = html.replace(/<\s*(\/?)\s*([a-zA-Z0-9]+)([^>]*)>/g, (_m, slash: string, tag: string, attrs: string) => {
    const name = tag.toLowerCase();
    if (!ALLOWED.has(name)) return '';
    if (slash) return `</${name}>`;
    if (name === 'a') {
      const href = /href\s*=\s*("([^"]*)"|'([^']*)')/i.exec(attrs);
      const url = (href?.[2] ?? href?.[3] ?? '').trim();
      const safe = /^(https?:|mailto:|tel:|\/|#)/i.test(url) ? url.replace(/"/g, '&quot;') : '';
      return safe ? `<a href="${safe}" rel="noopener noreferrer nofollow" target="_blank">` : '<a>';
    }
    return `<${name}>`;
  });
  return html;
}

/** Si el texto no parece HTML, lo convierte en párrafos simples (escapando caracteres). */
export function textToHtml(text: string): string {
  if (/<[a-z][\s\S]*>/i.test(text)) return sanitizeHtml(text);
  const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return text
    .split(/\n{2,}/)
    .map((block) => `<p>${escape(block).replace(/\n/g, '<br>')}</p>`)
    .join('');
}
