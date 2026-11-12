// 사이트가 부를 "고정" 관리자 주소.
// Vercel 배포별 주소(…-abc123xyz-팀.vercel.app)나 미리보기 주소는 Vercel 로그인 보호가 걸려 있어
// 방문자가 접근하면 401 → 사이트가 데이터를 못 받습니다. 그래서 항상 운영(Production) 주소를 씁니다.
export function stableEndpoint(reqUrl) {
  const env = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/+$/, '');
  if (env) return env;
  let u; try { u = new URL(reqUrl); } catch { return ''; }
  const prod = (process.env.VERCEL_PROJECT_PRODUCTION_URL || '').replace(/^https?:\/\//, '').replace(/\/+$/, '');
  if (prod && u.hostname.endsWith('.vercel.app')) return `https://${prod}`;
  return u.origin;
}
export function isDeploymentUrl(url) {
  try {
    const h = new URL(url).hostname;
    const vu = (process.env.VERCEL_URL || '').toLowerCase();
    return (vu && h === vu) || /-[a-z0-9]{9}-[a-z0-9-]+\.vercel\.app$/.test(h) || /-git-[a-z0-9-]+\.vercel\.app$/.test(h);
  } catch { return false; }
}
