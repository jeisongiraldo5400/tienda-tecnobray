import { describe, expect, it } from 'vitest';
import { discountPercent, formatCOP, slugify } from './format';
import { textToHtml, sanitizeHtml } from './sanitize';
import { buildWhatsAppUrl, normalizeWhatsAppNumber } from './whatsapp';
import { parseImageHosts } from '@/shared/config/image-hosts';

describe('formato COP', () => {
  it('usa separador de miles con punto y sin decimales', () => {
    expect(formatCOP(1299900)).toBe('$ 1.299.900');
    expect(formatCOP(0)).toBe('$ 0');
    expect(formatCOP(1234.6)).toBe('$ 1.235');
  });

  it('porcentaje de descuento', () => {
    expect(discountPercent(80, 100)).toBe(20);
    expect(discountPercent(100, 90)).toBe(0);
    expect(discountPercent(100, null)).toBe(0);
  });

  it('slugify quita tildes', () => {
    expect(slugify('Audífonos Bluetooth ñandú')).toBe('audifonos-bluetooth-nandu');
  });
});

describe('WhatsApp', () => {
  it('agrega el indicativo 57 a celulares de 10 dígitos', () => {
    expect(normalizeWhatsAppNumber('300 123 4567')).toBe('573001234567');
    expect(buildWhatsAppUrl('573001234567', 'Hola mundo')).toBe('https://wa.me/573001234567?text=Hola%20mundo');
  });
});

describe('sanitizeHtml', () => {
  it('elimina scripts, atributos on* y enlaces javascript:', () => {
    const html = sanitizeHtml('<p onclick="x()">Hola<script>alert(1)</script></p><a href="javascript:alert(1)">x</a><img src=x onerror=y>');
    expect(html).toBe('<p>Hola</p><a>x</a>');
  });

  it('convierte texto plano en párrafos escapados', () => {
    expect(textToHtml('Línea 1\nLínea 2\n\nPrecio < 5 & más')).toBe('<p>Línea 1<br>Línea 2</p><p>Precio &lt; 5 &amp; más</p>');
  });
});

describe('parseImageHosts', () => {
  it('genera remotePatterns con protocolo, puerto y ruta', () => {
    expect(parseImageHosts('http://localhost:4001/api/media, *.cloudfront.net')).toEqual([
      { protocol: 'http', hostname: 'localhost', port: '4001', pathname: '/api/media/**' },
      { protocol: 'https', hostname: '*.cloudfront.net', pathname: '/**' },
    ]);
  });
});
