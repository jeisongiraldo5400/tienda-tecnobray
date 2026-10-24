/** Normaliza un teléfono colombiano a formato internacional sin "+" (ej. 573001234567). */
export function normalizeWhatsAppNumber(phone: string | null | undefined): string {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10 && digits.startsWith('3')) return `57${digits}`;
  return digits;
}

export function buildWhatsAppUrl(phone: string | null | undefined, message: string): string {
  const number = normalizeWhatsAppNumber(phone);
  const text = encodeURIComponent(message);
  return number ? `https://wa.me/${number}?text=${text}` : `https://wa.me/?text=${text}`;
}
