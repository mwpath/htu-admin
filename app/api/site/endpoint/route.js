import { requireAdmin } from '@/lib/admin-auth';
import { stableEndpoint } from '@/lib/site/endpoint';
export const dynamic = 'force-dynamic';
export async function GET(request) {
  if (!(await requireAdmin())) return Response.json({ error: 'unauthorized' }, { status: 401 });
  return Response.json({ endpoint: stableEndpoint(request.url) });
}
