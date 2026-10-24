/** Deja solo dígitos y quita el indicativo 57 de Colombia para comparar teléfonos. */
export function normalizePhone(phone: string): string {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('57')) return digits.slice(2);
  return digits;
}

/** Número para enlaces wa.me: dígitos con indicativo (57 por defecto si es un celular de 10 dígitos). */
export function toWhatsappNumber(phone: string): string {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (digits.length === 10 && digits.startsWith('3')) return `57${digits}`;
  return digits;
}
