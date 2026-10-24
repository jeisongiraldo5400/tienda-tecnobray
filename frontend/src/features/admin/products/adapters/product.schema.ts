import * as Yup from 'yup';

export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const SKU_REGEX = /^[A-Za-z0-9._-]{2,64}$/;

const money = (label: string) =>
  Yup.number()
    .transform((v, orig) => (orig === '' || orig === null ? undefined : v))
    .typeError(`${label} debe ser un número.`)
    .integer(`${label} debe ser un valor entero en pesos.`)
    .min(0, `${label} no puede ser negativo.`)
    .max(1_000_000_000, `${label} es demasiado alto.`);

export const productSchema = Yup.object({
  name: Yup.string().trim().min(2, 'Mínimo 2 caracteres.').max(200, 'Máximo 200 caracteres.').required('El nombre es obligatorio.'),
  slug: Yup.string().trim().max(220, 'Máximo 220 caracteres.').matches(SLUG_REGEX, {
    message: 'Solo minúsculas, números y guiones (ej. celular-nova-x).',
    excludeEmptyString: true,
  }),
  sku: Yup.string().trim().matches(SKU_REGEX, 'SKU inválido: 2 a 64 letras, números, punto o guion.').required('El SKU es obligatorio.'),
  brandId: Yup.string(),
  categoryId: Yup.string(),
  shortDescription: Yup.string().max(500, 'Máximo 500 caracteres.'),
  description: Yup.string().max(20000, 'Máximo 20.000 caracteres.'),
  price: money('El precio').required('El precio es obligatorio.'),
  compareAtPrice: money('El precio anterior')
    .optional()
    .test('gt-price', 'El precio anterior debe ser mayor que el precio de venta.', function (value) {
      if (value === undefined || value === null) return true;
      const price = Number(this.parent.price);
      return !Number.isFinite(price) || value > price;
    }),
  stock: Yup.number()
    .transform((v, orig) => (orig === '' ? undefined : v))
    .typeError('El stock debe ser un número.')
    .integer('El stock debe ser entero.')
    .min(0, 'El stock no puede ser negativo.')
    .max(1_000_000, 'Stock demasiado alto.')
    .required('El stock es obligatorio.'),
  active: Yup.boolean(),
  featured: Yup.boolean(),
  specs: Yup.array()
    .of(
      Yup.object({
        key: Yup.string().trim().max(60, 'Máximo 60 caracteres.').required('Escribe el nombre.'),
        value: Yup.string().trim().max(200, 'Máximo 200 caracteres.').required('Escribe el valor.'),
      }),
    )
    .max(40, 'Máximo 40 especificaciones.'),
  seoTitle: Yup.string().max(70, 'Máximo 70 caracteres.'),
  seoDescription: Yup.string().max(170, 'Máximo 170 caracteres.'),
});
