import { describe, expect, it } from 'vitest';
import { bannerSchema, formToBannerPayload, bannerToForm } from '@/features/admin/banners/adapters/banner.adapter';
import { brandSchema, formToBrandPayload } from '@/features/admin/brands/adapters/brand.adapter';
import { categorySchema, formToCategoryPayload, sortAsTree, toAdminCategories } from '@/features/admin/categories/adapters/category.adapter';
import { settingsSchema, settingsToForm, toAdminSettings } from '@/features/admin/settings/adapters/admin-settings.adapter';
import { createUserSchema, editUserSchema, toUpdateUserPayload } from '@/features/admin/users/adapters/users.schema';
import { validateImageFile } from '@/features/admin/shell/components/ImageInput';

describe('formularios del panel', () => {
  it('categoría: slug opcional, parentId vacío → null', async () => {
    await expect(categorySchema.validate({ name: 'C', slug: '' })).rejects.toThrow('Mínimo 2 caracteres.');
    expect(formToCategoryPayload({ name: ' Celulares ', slug: '', description: '', parentId: '', sortOrder: '', active: true })).toEqual({
      name: 'Celulares',
      description: null,
      parentId: null,
      sortOrder: 0,
      active: true,
    });
  });

  it('categorías ordenadas como árbol (un nivel)', () => {
    const list = toAdminCategories([
      { id: 'h', name: 'Android', parentId: 'p', sortOrder: 0 },
      { id: 'p', name: 'Celulares', parentId: null, sortOrder: 0 },
      { id: 'q', name: 'Audio', parentId: null, sortOrder: 1 },
    ]);
    expect(sortAsTree(list).map((c) => `${c.depth}:${c.name}`)).toEqual(['0:Celulares', '1:Android', '0:Audio']);
  });

  it('marca', async () => {
    await expect(brandSchema.validate({ name: '', slug: '' })).rejects.toThrow();
    expect(formToBrandPayload({ name: 'Nova', slug: 'nova', active: false })).toEqual({ name: 'Nova', slug: 'nova', active: false });
  });

  it('banner: enlace interno o https', async () => {
    const base = bannerToForm();
    await expect(bannerSchema.validate({ ...base, title: 'Promo', linkUrl: '/productos?categoria=audio' })).resolves.toBeTruthy();
    await expect(bannerSchema.validate({ ...base, title: 'Promo', linkUrl: 'javascript:alert(1)' })).rejects.toThrow(/ruta interna/);
    expect(formToBannerPayload({ ...base, title: 'Promo', linkUrl: '' })).toMatchObject({ linkUrl: null, buttonText: null });
  });

  it('configuración: colores hex y redes https', async () => {
    const form = settingsToForm(toAdminSettings({ storeName: 'TecnoBray', primaryColor: '#0F62FE', secondaryColor: '#111827' }));
    await expect(settingsSchema.validate(form)).resolves.toBeTruthy();
    await expect(settingsSchema.validate({ ...form, primaryColor: 'azul' })).rejects.toThrow(/Color inválido/);
    await expect(settingsSchema.validate({ ...form, accentColor: '#12' })).rejects.toThrow(/Color inválido/);
    await expect(settingsSchema.validate({ ...form, seoTitle: 'x'.repeat(71) })).rejects.toThrow('Máximo 70 caracteres.');
    await expect(settingsSchema.validate({ ...form, announcement: 'x'.repeat(201) })).rejects.toThrow('Máximo 200 caracteres.');
    await expect(settingsSchema.validate({ ...form, social: { ...form.social, instagram: 'http://x' } })).rejects.toThrow(/https/);
  });

  it('usuarios: contraseña mínima y edición sin contraseña', async () => {
    await expect(createUserSchema.validate({ email: 'a@b.co', name: 'Ana', role: 'editor', password: 'corta', active: true })).rejects.toThrow(/Mínimo 10/);
    await expect(editUserSchema.validate({ email: '', name: 'Ana', role: 'admin', password: '', active: true })).resolves.toBeTruthy();
    expect(toUpdateUserPayload({ email: '', name: ' Ana ', role: 'admin', password: '', active: false })).toEqual({ name: 'Ana', role: 'admin', active: false });
  });

  it('valida imágenes (tipo y tamaño)', () => {
    expect(validateImageFile(new File(['x'], 'a.png', { type: 'image/png' }))).toBeNull();
    expect(validateImageFile(new File(['x'], 'a.gif', { type: 'image/gif' }))).toMatch(/no es JPG/);
    const big = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'b.jpg', { type: 'image/jpeg' });
    expect(validateImageFile(big)).toMatch(/supera 5 MB/);
  });
});
