import { proxyToBackend } from '@/shared/server/bff';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ path: string[] }> };

async function handler(req: Request, ctx: Ctx): Promise<Response> {
  const { path } = await ctx.params;
  return proxyToBackend(req, path);
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
