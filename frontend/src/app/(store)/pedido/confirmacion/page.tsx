import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ConfirmationView } from '@/features/checkout/components/ConfirmationView';
import { Container } from '@/shared/ui/Container';

export const metadata: Metadata = { title: 'Pedido confirmado', robots: { index: false } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ConfirmationPage({ searchParams }: Props) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.numero) ? sp.numero[0] : sp.numero;
  const number = raw?.trim().slice(0, 40);
  if (!number) redirect('/');
  return (
    <Container className="py-8 sm:py-12">
      <ConfirmationView number={number} />
    </Container>
  );
}
