import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

const ALLOWED_TAGS = [
  'h2', 'h3', 'h4', 'p', 'br', 'hr', 'strong', 'em', 'b', 'i', 'u', 's', 'blockquote',
  'ul', 'ol', 'li', 'a', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
];

/** Sanitiza HTML con una lista blanca estricta (sin imágenes, scripts, estilos ni iframes). */
export function sanitizeRichHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: { a: ['href', 'title', 'target', 'rel'] },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer nofollow', target: '_blank' }),
      h1: 'h2',
    },
    nestingLimit: 20,
  });
}

/** Markdown → HTML sanitizado. El Markdown original se guarda aparte para editarlo. */
export function markdownToSafeHtml(markdown: string): string {
  if (!markdown?.trim()) return '';
  const html = marked.parse(markdown, { async: false, gfm: true, breaks: true }) as string;
  return sanitizeRichHtml(html);
}
