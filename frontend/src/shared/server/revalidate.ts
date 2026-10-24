import { timingSafeEqual } from 'node:crypto';
import { tagsForEntity } from '@/shared/api/cache-tags';

export function secretMatches(provided: string | null | undefined, expected: string): boolean {
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function extractSecret(req: Request): string | null {
  const header = req.headers.get('x-revalidate-secret');
  if (header) return header;
  const auth = req.headers.get('authorization');
  if (auth?.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  return null;
}

export interface RevalidatePlan {
  tags: string[];
  paths: string[];
}

const TAG_RE = /^[A-Za-z0-9:_\-.]{1,200}$/;

/** Acepta {tags: string[], paths: string[]} y/o {entity, slug} / {entities: [...]}. */
export function buildRevalidatePlan(body: unknown): RevalidatePlan {
  const r = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const tags = new Set<string>();
  const paths = new Set<string>();
  const pushTags = (list: unknown) => {
    if (Array.isArray(list)) list.forEach((t) => typeof t === 'string' && TAG_RE.test(t) && tags.add(t));
  };
  pushTags(r.tags);
  if (typeof r.tag === 'string') pushTags([r.tag]);
  if (typeof r.entity === 'string') {
    pushTags(tagsForEntity(r.entity, typeof r.slug === 'string' ? r.slug : undefined));
  }
  if (Array.isArray(r.entities)) {
    for (const e of r.entities) {
      const er = (e && typeof e === 'object' ? e : {}) as Record<string, unknown>;
      if (typeof e === 'string') pushTags(tagsForEntity(e));
      else if (typeof er.entity === 'string') {
        pushTags(tagsForEntity(er.entity, typeof er.slug === 'string' ? er.slug : undefined));
      }
    }
  }
  const rawPaths = Array.isArray(r.paths) ? r.paths : typeof r.path === 'string' ? [r.path] : [];
  for (const p of rawPaths) {
    if (typeof p === 'string' && /^\/(?!\/)/.test(p) && !p.includes('..') && p.length < 300) paths.add(p);
  }
  return { tags: [...tags].slice(0, 50), paths: [...paths].slice(0, 20) };
}
