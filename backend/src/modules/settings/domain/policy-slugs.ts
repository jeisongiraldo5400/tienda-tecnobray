export const POLICY_SLUGS = ['envios', 'garantias', 'devoluciones', 'privacidad', 'terminos'] as const;
export type PolicySlug = (typeof POLICY_SLUGS)[number];

export const POLICY_TITLES: Record<PolicySlug, string> = {
  envios: 'Política de envíos',
  garantias: 'Garantías',
  devoluciones: 'Cambios y devoluciones',
  privacidad: 'Política de privacidad',
  terminos: 'Términos y condiciones',
};
