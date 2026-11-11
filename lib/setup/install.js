// supabase/install.sql 을 DB 에 직접 실행 (Vercel–Supabase 연동이 넣어준 DB 주소 사용)
import pg from 'pg';
import { env } from '../env';
import INSTALL_SQL from '@/generated/install-sql';

function connConfig(raw) {
  const u = new URL(raw);
  const local = /^(localhost|127\.0\.0\.1|::1)$/.test(u.hostname);
  // sslmode 등 주소 뒤 옵션은 제거하고 SSL 은 아래에서 직접 지정 (Supabase 인증서 체인 오류 방지)
  u.search = '';
  return { connectionString: u.toString(), ssl: local ? false : { rejectUnauthorized: false }, statement_timeout: 50_000, connectionTimeoutMillis: 10_000 };
}

export async function runInstall() {
  const dbUrl = env.dbUrl();
  if (!dbUrl) throw new Error('DB_URL_MISSING');
  const client = new pg.Client(connConfig(dbUrl));
  await client.connect();
  try {
    await client.query('begin');
    await client.query(INSTALL_SQL);
    await client.query('commit');
  } catch (e) {
    try { await client.query('rollback'); } catch { /* noop */ }
    throw e;
  } finally {
    await client.end().catch(() => {});
  }
}
