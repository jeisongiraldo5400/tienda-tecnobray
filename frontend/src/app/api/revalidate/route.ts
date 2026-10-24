import { revalidatePath, revalidateTag } from 'next/cache';
import { serverEnv } from '@/shared/config/env.server';
import { buildRevalidatePlan, extractSecret, secretMatches } from '@/shared/server/revalidate';

export const dynamic = 'force-dynamic';

/**
 * Revalidación bajo demanda llamada por el backend cuando cambia el contenido.
 * POST /api/revalidate  (cabecera `x-revalidate-secret` o `Authorization: Bearer <secret>`)
 * Body: { tags?: string[], paths?: string[] } o { entity: 'product', slug?: string }.
 */
export async function POST(req: Request): Promise<Response> {
  if (!serverEnv.revalidateSecret) {
    return Response.json({ revalidated: false, message: 'Revalidación no configurada.' }, { status: 503 });
  }
  if (!secretMatches(extractSecret(req), serverEnv.revalidateSecret)) {
    return Response.json({ revalidated: false, message: 'No autorizado.' }, { status: 401 });
  }
  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const plan = buildRevalidatePlan(body);
  if (plan.tags.length === 0 && plan.paths.length === 0) {
    return Response.json({ revalidated: false, message: 'Indica tags, paths o entity.' }, { status: 400 });
  }
  // expire: 0 -> el siguiente visitante ya ve el contenido nuevo (sin servir datos viejos).
  plan.tags.forEach((tag) => revalidateTag(tag, { expire: 0 }));
  plan.paths.forEach((path) => revalidatePath(path));
  return Response.json({ revalidated: true, ...plan, now: Date.now() });
}
