const HEX6 = /^#?([0-9a-fA-F]{6})$/;
const HEX3 = /^#?([0-9a-fA-F]{3})$/;

/** Luminancia relativa WCAG de un color #RRGGBB / #RGB (null si no es válido). */
export function relativeLuminance(hex: string): number | null {
  const short = HEX3.exec(hex.trim());
  const full = short ? short[1]!.replace(/./g, (c) => c + c) : HEX6.exec(hex.trim())?.[1];
  if (!full) return null;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(full.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a) ?? 0;
  const lb = relativeLuminance(b) ?? 0;
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * Color de texto legible (blanco o tinta) sobre un fondo configurable por la tienda.
 * Elige el de mayor contraste para cumplir WCAG AA con cualquier color de marca.
 */
export function readableTextOn(background: string, light = '#ffffff', dark = '#0B1E3F'): string {
  if (relativeLuminance(background) === null) return light;
  return contrastRatio(background, light) >= contrastRatio(background, dark) ? light : dark;
}

function parseHex(hex: string): [number, number, number] | null {
  const short = HEX3.exec(hex.trim());
  const full = short ? short[1]!.replace(/./g, (c) => c + c) : HEX6.exec(hex.trim())?.[1];
  if (!full) return null;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number];
}

/**
 * Oscurece un color hasta lograr el contraste mínimo sobre `background` (por defecto blanco, AA 4.5:1).
 * Sirve para usar el verde lima de la marca como texto o enlace sin perder legibilidad.
 */
export function ensureContrast(color: string, background = '#ffffff', min = 4.5): string {
  const rgb = parseHex(color);
  if (!rgb) return color;
  for (let step = 0; step <= 20; step++) {
    const f = 1 - step * 0.05;
    const hex = '#' + rgb.map((c) => Math.round(c * f).toString(16).padStart(2, '0')).join('').toUpperCase();
    if (contrastRatio(hex, background) >= min) return hex;
  }
  return '#000000';
}
