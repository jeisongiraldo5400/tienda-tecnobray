import { describe, expect, it } from 'vitest';
import { productCardDto } from '@/test/fixtures';
import { flattenCategories, stockState, toBanner, toProduct, toProductSummary } from './catalog.adapter';
import { countActiveFilters, parseCatalogFilters, serializeCatalogFilters, toApiQuery } from './filters';

describe('catalog adapters', () => {
  it('mapea ProductCardView del backend (inStock/maxQuantity, featured, imagen)', () => {
    const p = toProductSummary(productCardDto);
    expect(p).toMatchObject({
      id: productCardDto.id,
      slug: 'sonik-buds-pro',
      price: 459900,
      compareAtPrice: 529900,
      stock: 10,
      inStock: true,
      isFeatured: true,
      brand: { name: 'Sonik', slug: 'sonik' },
      category: { name: 'Audífonos', slug: 'audifonos' },
    });
    expect(p.image?.thumbUrl).toContain('400.webp');
  });

  it('producto agotado cuando inStock=false', () => {
    const p = toProductSummary({ ...productCardDto, inStock: false, maxQuantity: 0 });
    expect(p.inStock).toBe(false);
    expect(p.stock).toBe(0);
  });

  it('mapea el detalle: descriptionHtml, specs, seo y relacionados', () => {
    const p = toProduct({
      ...productCardDto,
      sku: 'TB-1',
      descriptionHtml: '<p>Hola</p>',
      specs: [{ key: 'Batería', value: '30 h' }],
      images: [productCardDto.image],
      seo: { title: 'Sonik | TecnoBray', description: 'Desc' },
      related: [productCardDto],
    });
    expect(p.description).toBe('<p>Hola</p>');
    expect(p.specs).toEqual([{ key: 'Batería', value: '30 h' }]);
    expect(p.seoTitle).toBe('Sonik | TecnoBray');
    expect(p.related).toHaveLength(1);
  });

  it('aplana el árbol de categorías asignando parentId', () => {
    const list = flattenCategories([
      { id: 'c1', name: 'Celulares', slug: 'celulares', productCount: 5, children: [{ id: 'c2', name: 'Android', slug: 'android', children: [] }] },
    ]);
    expect(list.map((c) => [c.slug, c.parentId])).toEqual([
      ['celulares', null],
      ['android', 'c1'],
    ]);
  });

  it('banner usa text como subtítulo', () => {
    expect(toBanner({ id: 'b', title: 'T', text: 'Sub', imageUrl: 'u', sortOrder: 2, active: true })).toMatchObject({ subtitle: 'Sub', position: 2 });
  });

  it('estado de stock', () => {
    expect(stockState(0)).toBe('out_of_stock');
    expect(stockState(3)).toBe('low_stock');
    expect(stockState(10)).toBe('in_stock');
  });
});

describe('filtros del catálogo (URL)', () => {
  it('parsea, normaliza rango invertido y descarta orden inválido', () => {
    const f = parseCatalogFilters(new URLSearchParams('q= audífonos &categoria=audio&min=500000&max=100000&orden=raro&pagina=2'));
    expect(f).toEqual({ q: 'audífonos', categoria: 'audio', marca: undefined, min: 100000, max: 500000, orden: undefined, pagina: 2 });
  });

  it('serializa omitiendo valores por defecto', () => {
    expect(serializeCatalogFilters({ q: 'tv', orden: 'relevance', pagina: 1 })).toBe('?q=tv');
    expect(serializeCatalogFilters({ marca: 'sonik', orden: 'price_asc', pagina: 3 })).toBe('?marca=sonik&orden=price_asc&pagina=3');
  });

  it('traduce a la query del backend', () => {
    expect(toApiQuery({ q: 'x', categoria: 'c', marca: 'm', min: 1, max: 2, orden: 'newest', pagina: 2 }, 24)).toEqual({
      q: 'x',
      category: 'c',
      brand: 'm',
      minPrice: 1,
      maxPrice: 2,
      sort: 'newest',
      page: 2,
      pageSize: 24,
    });
  });

  it('cuenta filtros activos', () => {
    expect(countActiveFilters({ q: 'a', marca: 'b', pagina: 2 })).toBe(2);
  });
});
