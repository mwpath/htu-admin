// install.sql 내려받기 (자동 설치를 쓸 수 없을 때 Supabase SQL Editor 에 붙여넣는 용도)
import INSTALL_SQL from '@/generated/install-sql';
export async function GET() {
  return new Response(INSTALL_SQL, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Content-Disposition': 'attachment; filename="install.sql"' },
  });
}
