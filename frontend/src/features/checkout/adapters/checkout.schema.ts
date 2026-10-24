import * as Yup from 'yup';

export interface CheckoutValues {
  name: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  notes: string;
  acceptTerms: boolean;
}

export const initialCheckoutValues: CheckoutValues = {
  name: '',
  phone: '',
  email: '',
  city: '',
  address: '',
  notes: '',
  acceptTerms: false,
};

/** Celular colombiano (3XXXXXXXXX) o fijo (60XXXXXXXX), con o sin +57. */
export function normalizeColombianPhone(value: string): string {
  let digits = value.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('57')) digits = digits.slice(2);
  return digits;
}

export function isValidColombianPhone(value: string | undefined): boolean {
  if (!value) return false;
  const digits = normalizeColombianPhone(value);
  return /^3\d{9}$/.test(digits) || /^60\d{8}$/.test(digits);
}

export const checkoutSchema = Yup.object({
  name: Yup.string()
    .trim()
    .min(3, 'Escribe tu nombre completo.')
    .max(120, 'Máximo 120 caracteres.')
    .required('El nombre es obligatorio.'),
  phone: Yup.string()
    .trim()
    .required('El celular es obligatorio.')
    .test('co-phone', 'Ingresa un celular colombiano válido (10 dígitos, ej. 300 123 4567).', isValidColombianPhone),
  email: Yup.string().trim().email('Ingresa un correo válido.').max(160, 'Máximo 160 caracteres.'),
  city: Yup.string().trim().min(2, 'Indica la ciudad.').max(80, 'Máximo 80 caracteres.').required('La ciudad es obligatoria.'),
  address: Yup.string()
    .trim()
    .min(5, 'Escribe la dirección completa (calle, número, barrio).')
    .max(200, 'Máximo 200 caracteres.')
    .required('La dirección es obligatoria.'),
  notes: Yup.string().trim().max(500, 'Máximo 500 caracteres.'),
  acceptTerms: Yup.boolean().oneOf([true], 'Debes aceptar los términos y la política de datos.'),
});

export const COLOMBIAN_CITIES = [
  'Bogotá',
  'Medellín',
  'Cali',
  'Barranquilla',
  'Cartagena',
  'Bucaramanga',
  'Pereira',
  'Manizales',
  'Cúcuta',
  'Ibagué',
  'Santa Marta',
  'Villavicencio',
  'Pasto',
  'Montería',
  'Neiva',
  'Armenia',
  'Popayán',
  'Valledupar',
  'Sincelejo',
  'Tunja',
];
