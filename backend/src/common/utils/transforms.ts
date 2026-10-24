import { Transform } from 'class-transformer';

/** Recorta espacios en strings. */
export const Trim = () => Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));

/** Convierte '' en null (campos opcionales que se pueden limpiar). */
export const EmptyToNull = () =>
  Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? null : typeof value === 'string' ? value.trim() : value));

/** Query string → boolean ('true'/'1' → true, 'false'/'0' → false). */
export const QueryBool = () =>
  Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    return ['true', '1', 'si', 'sí'].includes(String(value).toLowerCase());
  });
