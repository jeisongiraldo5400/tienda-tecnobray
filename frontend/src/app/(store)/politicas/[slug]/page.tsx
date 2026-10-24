import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPolicyPage, getStoreSettings } from '@/features/settings/services/settings.server';
import { textToHtml } from '@/shared/lib/sanitize';
import { stripHtml } from '@/shared/seo/structured-data';
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs';
import { Container } from '@/shared/ui/Container';

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 3600;

export async function generateStaticParams() {
  const settings = await getStoreSettings();
  return settings.policies.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPolicyPage(slug);
  if (!page) return { title: 'Página no encontrada' };
  return {
    title: page.title,
    description: stripHtml(page.content).slice(0, 160),
    alternates: { canonical: `/politicas/${slug}` },
  };
}

export default async function PolicyPage({ params }: Props) {
  const { slug } = await params;
  const page = await getPolicyPage(slug);
  if (!page) notFound();
  return (
    <Container className="max-w-3xl space-y-5 py-6 sm:space-y-6 sm:py-10">
      <Breadcrumbs items={[{ label: 'Inicio', href: '/' }, { label: page.title }]} />
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{page.title}</h1>
      <article className="prose-store rounded-2xl border border-slate-200 bg-white p-5 sm:p-8" dangerouslySetInnerHTML={{ __html: textToHtml(page.content) }} />
    </Container>
  );
}
