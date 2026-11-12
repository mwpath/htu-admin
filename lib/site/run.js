// 사이트 파일 전체 배포 (자동 업데이트 · 관리자 주소 변경 공용)
import { pagesTargets, deployBranch } from './deploy';
import { publishPosts } from './posts';
import { supabaseService } from '../supabase/service';
import { getPublicContent, siteOrigin } from '../content';
import { SITE_VERSION } from '@/generated/site-files';
import { probeEndpoint } from './endpoint';

export async function runFullDeploy({ cfg, endpoint, reqUrl, force }) {
  // 방문자가 쓸 수 없는 관리자 주소를 사이트에 넣으면 홈이 비어 버리므로 먼저 확인
  const probe = await probeEndpoint(endpoint);
  if (!probe.ok && !force) {
    const e = new Error(`관리자 주소 ${endpoint} 를 방문자가 쓸 수 없어 사이트를 바꾸지 않았습니다 (${probe.reason}). 아래 "사이트가 부를 관리자 주소"에서 올바른 주소를 지정하세요.`);
    e.code = 'BAD_ENDPOINT';
    throw e;
  }
  let snapshot = null;
  try {
    const c = await getPublicContent(siteOrigin(reqUrl));
    if (c && !c.error) snapshot = c;
  } catch { /* 백업 없이 진행 */ }
  const { targets, how } = await pagesTargets(cfg);
  const results = [];
  for (const t of targets) results.push(await deployBranch(cfg, t, endpoint, snapshot));
  let seo = null;
  try { const sb = supabaseService(); if (sb) seo = await publishPosts({ sb, cfg, targets, endpoint, snapshot }); } catch (e) { seo = { error: String(e.message || e) }; }
  return { ok: true, version: SITE_VERSION, endpoint, how, results, seo };
}
