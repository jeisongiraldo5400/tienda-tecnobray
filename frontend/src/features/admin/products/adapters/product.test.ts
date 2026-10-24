import { describe, expect, it } from 'vitest';
import { emptyProductForm, formToProductPayload, productToForm, toAdminProduct } from './product.adapter';
import { productSchema } from './product.schema';

const valid = { ...emptyProductForm, name: 'Celular Nova X', sku: 'TB-CEL-001', price: 1299900, stock: 5 };

describe('productSchema', () => {
  it('acepta un producto válido', async () => {
    await expect(productSchema.validate(valid)).resolves.toBeTruthy();
  });

  it('exige nombre, SKU válido, precio y stock', async () => {
    await expect(productSchema.validate({ ...emptyProductForm, stock: '' }, { abortEarly: false })).rejects.toMatchObject({
      errors: expect.arrayContaining(['El nombre es obligatorio.', 'El SKU es obligatorio.', 'El precio es obligatorio.', 'El stock es obligatorio.']),
    });
    await expect(productSchema.validate({ ...valid, sku: 'con espacios' })).rejects.toThrow(/SKU inválido/);
  });

  it('precio anterior debe ser mayor al precio', async () => {
    await expect(productSchema.validate({ ...valid, compareAtPrice: 1000 })).rejects.toThrow(/mayor que el precio/);
    await expect(productSchema.validate({ ...valid, compareAtPrice: 1500000 })).resolves.toBeTruthy();
  });

  it('valida slug y especificaciones', async () => {
    await expect(productSchema.validate({ ...valid, slug: 'Con Mayúsculas' })).rejects.toThrow(/minúsculas/);
    await expect(productSchema.validate({ ...valid, specs: [{ key: '', value: 'x' }] })).rejects.toThrow('Escribe el nombre.');
  });

  it('valida longitudes SEO', async () => {
    await expect(productSchema.validate({ ...valid, seoTitle: 'x'.repeat(71) })).rejects.toThrow('Máximo 70 caracteres.');
  });
});

describe('formToProductPayload', () => {
  it('convierte al DTO del backend', () => {
    const payload = formToProductPayload({
      ...valid,
      slug: '',
      brandId: '',
      categoryId: 'cat-1',
      compareAtPrice: '',
      specs: [
        { key: ' Pantalla ', value: ' 6,5" ' },
        { key: '', value: '' },
      ],
      seoTitle: '  ',
    });
    expect(payload).toEqual({
      name: 'Celular Nova X',
      sku: 'TB-CEL-001',
      brandId: null,
      categoryId: 'cat-1',
      shortDescription: '',
      description: '',
      price: 1299900,
      compareAtPrice: null,
      stock: 5,
      active: true,
      featured: false,
      specs: [{ key: 'Pantalla', value: '6,5"' }],
      seoTitle: null,
      seoDescription: null,
    });
    expect(payload).not.toHaveProperty('slug');
  });

  it('ida y vuelta desde AdminProductView', () => {
    const p = toAdminProduct({
      id: '1',
      name: 'X',
      slug: 'x',
      sku: 'S-1',
      brandId: null,
      categoryId: 'c',
      category: { id: 'c', name: 'Cat' },
      price: 10,
      compareAtPrice: 20,
      stock: 3,
      active: false,
      featured: true,
      specs: [{ key: 'a', value: 'b' }],
      seoTitle: null,
      images: [
        { id: 'i2', url: 'u2', thumbUrl: 't2', sortOrder: 1, isMain: false },
        { id: 'i1', url: 'u1', thumbUrl: 't1', sortOrder: 0, isMain: true },
      ],
      mainImageThumbUrl: 't1',
    });
    expect(p.images.map((i) => i.id)).toEqual(['i1', 'i2']);
    expect(p.categoryName).toBe('Cat');
    const form = productToForm(p);
    expect(form).toMatchObject({ compareAtPrice: 20, brandId: '', seoTitle: '', active: false, featured: true });
  });
});
