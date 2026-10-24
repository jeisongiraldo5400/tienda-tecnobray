import { markdownToSafeHtml, sanitizeRichHtml } from './markdown';
import { normalizePhone, toWhatsappNumber } from './phone';
import { slugify } from './slug';

describe('utils', () => {
  it('slugify quita tildes y símbolos', () => {
    expect(slugify('Audífonos Bluetooth Ñandú 5G!')).toBe('audifonos-bluetooth-nandu-5g');
    expect(slugify('  --Hola   Mundo-- ')).toBe('hola-mundo');
  });

  it('normaliza teléfonos colombianos', () => {
    expect(normalizePhone('+57 300 123 4567')).toBe('3001234567');
    expect(normalizePhone('300-123-4567')).toBe('3001234567');
    expect(toWhatsappNumber('300 123 4567')).toBe('573001234567');
    expect(toWhatsappNumber('573001234567')).toBe('573001234567');
  });

  it('convierte markdown y elimina HTML peligroso', () => {
    const html = markdownToSafeHtml('# Título\n\n**negrita** <script>alert(1)</script> <img src=x onerror=alert(1)> [link](javascript:alert(1))');
    expect(html).toContain('<h2>Título</h2>');
    expect(html).toContain('<strong>negrita</strong>');
    expect(html).not.toMatch(/script|onerror|<img|javascript:/i);
  });

  it('agrega rel seguro a los enlaces', () => {
    expect(sanitizeRichHtml('<a href="https://x.co">x</a>')).toContain('rel="noopener noreferrer nofollow"');
  });

  it('devuelve vacío para markdown vacío', () => {
    expect(markdownToSafeHtml('   ')).toBe('');
  });
});
