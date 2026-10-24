import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import type { Category, StoreSettings } from '@/shared/types/domain';
import { Container } from '@/shared/ui/Container';
import { Logo } from './Logo';
import { SocialIcons } from './SocialIcons';

export function Footer({ settings, categories }: { settings: StoreSettings; categories: Category[] }) {
  const { contact } = settings;
  const year = new Date().getFullYear();
  return (
    <footer className="mt-12 border-t-4 border-accent bg-ink text-slate-300 sm:mt-16">
      <Container className="grid gap-8 py-10 sm:grid-cols-2 sm:gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] lg:py-14">
        <div className="space-y-4">
          <Logo name={settings.storeName} logoUrl={settings.logoUrl} tone="dark" imgClassName="h-9" sizes="163px" />
          {settings.tagline ? <p className="max-w-xs text-sm leading-6">{settings.tagline}</p> : null}
          <SocialIcons social={settings.social} />
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold tracking-wide text-white uppercase">Categorías</p>
          <ul className="space-y-1 text-sm">
            {categories.slice(0, 6).map((c) => (
              <li key={c.id || c.slug}>
                <Link href={`/categoria/${c.slug}`} className="inline-flex min-h-9 items-center hover:text-accent">
                  {c.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/productos" className="inline-flex min-h-9 items-center hover:text-accent">
                Ver todo
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold tracking-wide text-white uppercase">Ayuda</p>
          <ul className="space-y-1 text-sm">
            <li>
              <Link href="/seguimiento" className="inline-flex min-h-9 items-center hover:text-accent">
                Rastrear pedido
              </Link>
            </li>
            {settings.policies.map((p) => (
              <li key={p.slug}>
                <Link href={`/politicas/${p.slug}`} className="inline-flex min-h-9 items-center hover:text-accent">
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold tracking-wide text-white uppercase">Contacto</p>
          <ul className="space-y-2.5 text-sm">
            {contact.whatsapp || contact.phone ? (
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                <a href={`tel:${(contact.phone ?? contact.whatsapp ?? '').replace(/\s/g, '')}`} className="inline-flex min-h-9 items-center hover:text-accent">
                  {contact.phone ?? contact.whatsapp}
                </a>
              </li>
            ) : null}
            {contact.email ? (
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                <a href={`mailto:${contact.email}`} className="break-all hover:text-accent">
                  {contact.email}
                </a>
              </li>
            ) : null}
            {contact.address || contact.city ? (
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                <span>{[contact.address, contact.city].filter(Boolean).join(', ')}</span>
              </li>
            ) : null}
            {contact.schedule ? (
              <li className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                <span>{contact.schedule}</span>
              </li>
            ) : null}
          </ul>
        </div>
      </Container>
      <div className="border-t border-white/10">
        <Container className="flex flex-col items-center justify-between gap-2 pt-5 pb-24 text-center text-xs text-slate-400 sm:flex-row sm:pb-5 sm:pr-64 sm:text-left lg:pr-72">
          <p>
            © {year} {settings.storeName}. Todos los derechos reservados.
          </p>
          <p>Precios en pesos colombianos (COP), IVA incluido.</p>
        </Container>
      </div>
    </footer>
  );
}
