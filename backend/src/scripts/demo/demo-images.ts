import sharp from 'sharp';
import type { DemoIcon } from './demo-catalog';

/** Imágenes de demostración generadas localmente (SVG → PNG con sharp). Sin material con derechos de autor. */

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!);

function drawIcon(kind: DemoIcon, cx: number, cy: number, s: number, accent: string): string {
  const w = (n: number) => n * s;
  switch (kind) {
    case 'phone':
      return `<rect x="${cx - w(90)}" y="${cy - w(170)}" width="${w(180)}" height="${w(340)}" rx="${w(28)}" fill="#0b1220"/>
        <rect x="${cx - w(80)}" y="${cy - w(155)}" width="${w(160)}" height="${w(300)}" rx="${w(18)}" fill="url(#screen)"/>
        <rect x="${cx - w(22)}" y="${cy - w(150)}" width="${w(44)}" height="${w(10)}" rx="${w(5)}" fill="#0b1220"/>
        <circle cx="${cx}" cy="${cy}" r="${w(34)}" fill="#fff" fill-opacity=".25"/>`;
    case 'tablet':
      return `<rect x="${cx - w(150)}" y="${cy - w(200)}" width="${w(300)}" height="${w(400)}" rx="${w(26)}" fill="#0b1220"/>
        <rect x="${cx - w(135)}" y="${cy - w(185)}" width="${w(270)}" height="${w(370)}" rx="${w(14)}" fill="url(#screen)"/>`;
    case 'laptop':
      return `<rect x="${cx - w(200)}" y="${cy - w(140)}" width="${w(400)}" height="${w(250)}" rx="${w(16)}" fill="#0b1220"/>
        <rect x="${cx - w(185)}" y="${cy - w(125)}" width="${w(370)}" height="${w(220)}" rx="${w(6)}" fill="url(#screen)"/>
        <path d="M${cx - w(250)} ${cy + w(120)} h${w(500)} l-${w(30)} ${w(36)} h-${w(440)} z" fill="#1f2937"/>`;
    case 'monitor':
      return `<rect x="${cx - w(230)}" y="${cy - w(170)}" width="${w(460)}" height="${w(270)}" rx="${w(14)}" fill="#0b1220"/>
        <rect x="${cx - w(215)}" y="${cy - w(155)}" width="${w(430)}" height="${w(240)}" rx="${w(6)}" fill="url(#screen)"/>
        <rect x="${cx - w(20)}" y="${cy + w(100)}" width="${w(40)}" height="${w(60)}" fill="#1f2937"/>
        <rect x="${cx - w(100)}" y="${cy + w(155)}" width="${w(200)}" height="${w(18)}" rx="${w(9)}" fill="#1f2937"/>`;
    case 'headphones':
      return `<path d="M${cx - w(150)} ${cy + w(40)} v-${w(40)} a${w(150)} ${w(150)} 0 0 1 ${w(300)} 0 v${w(40)}" fill="none" stroke="#0b1220" stroke-width="${w(26)}" stroke-linecap="round"/>
        <rect x="${cx - w(190)}" y="${cy + w(10)}" width="${w(90)}" height="${w(150)}" rx="${w(40)}" fill="#0b1220"/>
        <rect x="${cx + w(100)}" y="${cy + w(10)}" width="${w(90)}" height="${w(150)}" rx="${w(40)}" fill="#0b1220"/>
        <rect x="${cx - w(175)}" y="${cy + w(30)}" width="${w(60)}" height="${w(110)}" rx="${w(28)}" fill="${accent}"/>
        <rect x="${cx + w(115)}" y="${cy + w(30)}" width="${w(60)}" height="${w(110)}" rx="${w(28)}" fill="${accent}"/>`;
    case 'earbuds':
      return `<rect x="${cx - w(150)}" y="${cy - w(10)}" width="${w(300)}" height="${w(170)}" rx="${w(80)}" fill="#f9fafb"/>
        <rect x="${cx - w(150)}" y="${cy - w(10)}" width="${w(300)}" height="${w(70)}" rx="${w(35)}" fill="#e5e7eb"/>
        <circle cx="${cx - w(70)}" cy="${cy - w(90)}" r="${w(55)}" fill="#f9fafb"/><rect x="${cx - w(85)}" y="${cy - w(90)}" width="${w(30)}" height="${w(110)}" rx="${w(15)}" fill="#f9fafb"/>
        <circle cx="${cx + w(70)}" cy="${cy - w(90)}" r="${w(55)}" fill="#f9fafb"/><rect x="${cx + w(55)}" y="${cy - w(90)}" width="${w(30)}" height="${w(110)}" rx="${w(15)}" fill="#f9fafb"/>
        <circle cx="${cx}" cy="${cy + w(110)}" r="${w(8)}" fill="${accent}"/>`;
    case 'speaker':
      return `<rect x="${cx - w(220)}" y="${cy - w(110)}" width="${w(440)}" height="${w(220)}" rx="${w(110)}" fill="#0b1220"/>
        <circle cx="${cx - w(105)}" cy="${cy}" r="${w(75)}" fill="#1f2937"/><circle cx="${cx - w(105)}" cy="${cy}" r="${w(35)}" fill="${accent}"/>
        <circle cx="${cx + w(105)}" cy="${cy}" r="${w(75)}" fill="#1f2937"/><circle cx="${cx + w(105)}" cy="${cy}" r="${w(35)}" fill="${accent}"/>`;
    case 'charger':
      return `<rect x="${cx - w(110)}" y="${cy - w(130)}" width="${w(220)}" height="${w(220)}" rx="${w(40)}" fill="#f9fafb"/>
        <rect x="${cx - w(60)}" y="${cy - w(70)}" width="${w(40)}" height="${w(16)}" rx="${w(8)}" fill="#111827"/>
        <rect x="${cx + w(20)}" y="${cy - w(70)}" width="${w(40)}" height="${w(16)}" rx="${w(8)}" fill="#111827"/>
        <path d="M${cx + w(10)} ${cy - w(30)} l-${w(40)} ${w(60)} h${w(30)} l-${w(10)} ${w(50)} l${w(45)} -${w(65)} h-${w(30)} z" fill="${accent}"/>
        <path d="M${cx} ${cy + w(90)} C ${cx} ${cy + w(180)}, ${cx + w(160)} ${cy + w(120)}, ${cx + w(170)} ${cy + w(200)}" fill="none" stroke="#f9fafb" stroke-width="${w(16)}" stroke-linecap="round"/>`;
    case 'case':
      return `<rect x="${cx - w(100)}" y="${cy - w(180)}" width="${w(200)}" height="${w(360)}" rx="${w(36)}" fill="#ffffff" fill-opacity=".35" stroke="#fff" stroke-width="${w(8)}"/>
        <rect x="${cx - w(70)}" y="${cy - w(155)}" width="${w(80)}" height="${w(80)}" rx="${w(20)}" fill="#0b1220" fill-opacity=".7"/>
        <circle cx="${cx - w(45)}" cy="${cy - w(130)}" r="${w(14)}" fill="${accent}"/><circle cx="${cx - w(15)}" cy="${cy - w(100)}" r="${w(14)}" fill="${accent}"/>`;
    case 'watch':
      return `<rect x="${cx - w(60)}" y="${cy - w(220)}" width="${w(120)}" height="${w(440)}" rx="${w(30)}" fill="#1f2937"/>
        <rect x="${cx - w(110)}" y="${cy - w(130)}" width="${w(220)}" height="${w(260)}" rx="${w(56)}" fill="#0b1220"/>
        <rect x="${cx - w(92)}" y="${cy - w(112)}" width="${w(184)}" height="${w(224)}" rx="${w(42)}" fill="url(#screen)"/>
        <text x="${cx}" y="${cy + w(18)}" font-family="Arial, Helvetica, sans-serif" font-size="${w(56)}" font-weight="700" fill="#fff" text-anchor="middle">10:09</text>`;
    case 'gamepad':
      return `<path d="M${cx - w(150)} ${cy - w(90)} h${w(300)} a${w(110)} ${w(110)} 0 0 1 ${w(100)} ${w(150)} l${w(-20)} ${w(70)} a${w(50)} ${w(50)} 0 0 1 ${w(-90)} ${w(10)} l${w(-40)} ${w(-50)} h${w(-200)} l${w(-40)} ${w(50)} a${w(50)} ${w(50)} 0 0 1 ${w(-90)} ${w(-10)} l${w(-20)} ${w(-70)} a${w(110)} ${w(110)} 0 0 1 ${w(100)} ${w(-150)} z" fill="#0b1220"/>
        <rect x="${cx - w(150)}" y="${cy - w(15)}" width="${w(80)}" height="${w(26)}" rx="${w(6)}" fill="#e5e7eb"/><rect x="${cx - w(123)}" y="${cy - w(42)}" width="${w(26)}" height="${w(80)}" rx="${w(6)}" fill="#e5e7eb"/>
        <circle cx="${cx + w(110)}" cy="${cy - w(25)}" r="${w(16)}" fill="${accent}"/><circle cx="${cx + w(145)}" cy="${cy + w(8)}" r="${w(16)}" fill="#33B1FF"/>
        <circle cx="${cx + w(75)}" cy="${cy + w(8)}" r="${w(16)}" fill="#42BE65"/><circle cx="${cx + w(110)}" cy="${cy + w(40)}" r="${w(16)}" fill="#F1C21B"/>`;
    case 'keyboard': {
      let keys = '';
      for (let r = 0; r < 4; r++) for (let c = 0; c < 10; c++) {
        keys += `<rect x="${cx - w(215) + c * w(43)}" y="${cy - w(75) + r * w(40)}" width="${w(36)}" height="${w(32)}" rx="${w(6)}" fill="${(r + c) % 7 === 0 ? accent : '#374151'}"/>`;
      }
      return `<rect x="${cx - w(235)}" y="${cy - w(95)}" width="${w(470)}" height="${w(190)}" rx="${w(18)}" fill="#0b1220"/>${keys}`;
    }
  }
}

export interface ProductImageInput {
  name: string;
  brand: string;
  icon: DemoIcon;
  colors: [string, string];
  variant?: number;
}

/** Imagen cuadrada 1200×1200 del producto. */
export async function productImage(p: ProductImageInput): Promise<Buffer> {
  const [c1, c2] = p.colors;
  const v = p.variant ?? 0;
  const scale = v === 0 ? 1.15 : v === 1 ? 0.95 : 1.3;
  const angle = [0, 25, -20][v % 3];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${v === 1 ? '#F4F4F4' : c1}"/><stop offset="1" stop-color="${v === 1 ? '#E0E0E0' : c2}"/></linearGradient>
      <linearGradient id="screen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
    </defs>
    <rect width="1200" height="1200" fill="url(#bg)"/>
    <circle cx="980" cy="200" r="260" fill="#fff" fill-opacity=".08"/>
    <circle cx="160" cy="1050" r="320" fill="#000" fill-opacity=".06"/>
    <g transform="rotate(${angle} 600 560)">${drawIcon(p.icon, 600, 560, scale, '#F1C21B')}</g>
    <text x="600" y="1030" font-family="Arial, Helvetica, sans-serif" font-size="58" font-weight="700" fill="${v === 1 ? '#111827' : '#ffffff'}" text-anchor="middle">${esc(p.name.length > 30 ? `${p.name.slice(0, 29)}…` : p.name)}</text>
    <text x="600" y="1100" font-family="Arial, Helvetica, sans-serif" font-size="38" fill="${v === 1 ? '#374151' : '#ffffff'}" fill-opacity=".85" text-anchor="middle">${esc(p.brand)} · TecnoBray demo</text>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/** Banner 1920×800 solo con arte (el título y el texto los pinta el frontend encima). */
export async function bannerImage(_title: string, _text: string, kind: DemoIcon, colors: [string, string]): Promise<Buffer> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="800" viewBox="0 0 1920 800">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${colors[0]}"/><stop offset="1" stop-color="${colors[1]}"/></linearGradient>
      <linearGradient id="screen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".9"/><stop offset="1" stop-color="${colors[0]}"/></linearGradient>
    </defs>
    <rect width="1920" height="800" fill="url(#bg)"/>
    <circle cx="1500" cy="400" r="420" fill="#fff" fill-opacity=".08"/>
    <circle cx="1500" cy="400" r="300" fill="#fff" fill-opacity=".07"/>
    <circle cx="1500" cy="400" r="190" fill="#84C43A" fill-opacity=".18"/>
    <g>${drawIcon(kind, 1500, 400, 1.25, '#84C43A')}</g>
    <circle cx="180" cy="720" r="260" fill="#000" fill-opacity=".08"/>
    <circle cx="760" cy="90" r="140" fill="#fff" fill-opacity=".06"/>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/** Imagen de categoría 800×800. */
export async function categoryImage(_name: string, kind: DemoIcon, colors: [string, string]): Promise<Buffer> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${colors[0]}"/><stop offset="1" stop-color="${colors[1]}"/></linearGradient>
      <linearGradient id="screen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="${colors[1]}"/></linearGradient>
    </defs>
    <rect width="800" height="800" fill="url(#bg)"/>
    <circle cx="660" cy="120" r="200" fill="#fff" fill-opacity=".08"/>
    <g>${drawIcon(kind, 400, 400, 0.95, '#F1C21B')}</g>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/** Logo "TecnoBray" (fondo transparente) 1024×1024 y favicon. */
export async function logoImage(primary: string): Promise<Buffer> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    <rect x="112" y="112" width="800" height="800" rx="200" fill="${primary}"/>
    <path d="M330 330 h364 v96 h-134 v300 h-96 v-300 h-134 z" fill="#fff"/>
    <circle cx="700" cy="690" r="54" fill="#F1C21B"/>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}
