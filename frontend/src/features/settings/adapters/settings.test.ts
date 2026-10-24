import { describe, expect, it } from 'vitest';
import { formToSettingsPayload, toAdminSettings, settingsToForm } from '@/features/admin/settings/adapters/admin-settings.adapter';
import { DEFAULT_SETTINGS, toStoreSettings } from './settings.adapter';

describe('settings adapter', () => {
  it('mapea PublicSettingsView plano', () => {
    const s = toStoreSettings({
      storeName: 'TecnoBray',
      primaryColor: '#0F62FE',
      secondaryColor: '#111827',
      whatsapp: '573001234567',
      shippingInfo: 'Envío gratis en Medellín\nResto del país: 2 a 5 días',
      social: { instagram: 'https://instagram.com/tb' },
      logoUrl: 'http://x/logo.webp',
    });
    expect(s.colors.primary).toBe('#0F62FE');
    expect(s.contact.whatsapp).toBe('573001234567');
    expect(s.shippingText).toBe('Envío gratis en Medellín');
    expect(s.social.instagram).toContain('instagram');
    expect(s.policies.length).toBeGreaterThan(0);
  });

  it('usa accentColor, SEO y barra de anuncio (vacío = por defecto / oculta)', () => {
    const s = toStoreSettings({ accentColor: '#22C55E', seoTitle: 'TecnoBray | Tienda', seoDescription: 'Desc', announcement: '  Envío gratis  ' });
    expect(s.colors.accent).toBe('#22C55E');
    expect(s.seo).toEqual({ title: 'TecnoBray | Tienda', description: 'Desc' });
    expect(s.announcement).toBe('Envío gratis');
    const empty = toStoreSettings({ accentColor: '', seoTitle: '', seoDescription: '', announcement: '' });
    expect(empty.colors.accent).toBe(DEFAULT_SETTINGS.colors.accent);
    expect(empty.seo.title).toBe(DEFAULT_SETTINGS.seo.title);
    expect(empty.announcement).toBeUndefined();
  });

  it('usa valores por defecto con datos inválidos', () => {
    const s = toStoreSettings({ primaryColor: 'rojo' });
    expect(s.colors.primary).toBe(DEFAULT_SETTINGS.colors.primary);
    expect(s.storeName).toBe('TecnoBray');
  });

  it('el payload admin normaliza WhatsApp con indicativo', () => {
    const form = settingsToForm(toAdminSettings({ storeName: 'TB', whatsapp: '', social: {} }));
    const payload = formToSettingsPayload({ ...form, whatsapp: '300 123 4567' });
    expect(payload.whatsapp).toBe('573001234567');
    expect(payload).toMatchObject({ accentColor: '#84C43A', seoTitle: '', seoDescription: '', announcement: '' });
    expect(payload.social).toEqual({ facebook: '', instagram: '', tiktok: '', youtube: '', x: '' });
  });
});
