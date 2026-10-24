import { contrastRatio, ensureContrast, readableTextOn, relativeLuminance } from './color';

describe('color', () => {
  it('calcula la luminancia y el contraste WCAG', () => {
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1);
    expect(relativeLuminance('#000')).toBeCloseTo(0);
    expect(relativeLuminance('nope')).toBeNull();
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21);
  });

  it('elige el texto con mejor contraste sobre el color de marca', () => {
    expect(readableTextOn('#F97316')).toBe('#0B1E3F'); // naranja: blanco solo da 2.8:1
    expect(readableTextOn('#84C43A')).toBe('#0B1E3F'); // lima de la marca: texto marino
    expect(readableTextOn('#0F62FE')).toBe('#ffffff');
    expect(readableTextOn('#111827')).toBe('#ffffff');
    expect(readableTextOn('inválido')).toBe('#ffffff');
  });

  it('oscurece el acento hasta cumplir AA como texto sobre blanco', () => {
    const text = ensureContrast('#84C43A');
    expect(contrastRatio(text, '#ffffff')).toBeGreaterThanOrEqual(4.5);
    expect(ensureContrast('#0B1E3F')).toBe('#0B1E3F');
    expect(ensureContrast('nope')).toBe('nope');
  });
});
