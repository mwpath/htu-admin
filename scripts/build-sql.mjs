// supabase/install.sql 생성 — 새로 설치 · 업데이트 모두 이 파일 하나로 (여러 번 실행해도 안전)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'supabase');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const m2 = read('migration-002-intro.sql');
const m2data = m2.slice(m2.indexOf('-- ---------- 인트로 영상 슬라이더 (#nwHero) ----------\ninsert'));
const m6 = read('migration-006-languages.sql');
const m6data = m6.slice(m6.indexOf('update public.site_settings'));
const seed = read('seed.sql');
if (seed.includes('$htu_seed$')) throw new Error('seed tag clash');
const out = `-- =====================================================================
-- HTU CMS · 설치 / 업데이트 (이 파일 하나만 실행하세요)
--   · 새로 설치: 테이블 + 현재 홈페이지 내용이 들어갑니다
--   · 이미 쓰는 중: 빠진 테이블 · 기능만 추가되고 기존 내용은 그대로 둡니다
--   · 여러 번 실행해도 안전합니다
-- 관리자 화면(처음 설정 · 연동 설정)의 '자동 설치' 버튼도 이 파일을 실행합니다.
-- 자동 생성 파일 — scripts/build-sql.mjs
-- =====================================================================

${read('schema.sql')}

-- ===== 초기 데이터 (비어 있는 DB 에만) =====
do $htu_guard$
begin
  if exists (select 1 from public.site_settings where key = 'site') or exists (select 1 from public.family_groups) then
    raise notice '기존 데이터가 있어 초기 데이터는 건너뜁니다.';
    return;
  end if;
  execute $htu_seed$
${seed}
  $htu_seed$;
end $htu_guard$;

-- ===== 예전 버전에서 빠졌을 수 있는 기본값 =====
${m2data}
insert into public.site_settings (key, value) values
('i18n', jsonb_build_object('en', true, 'zh', true, 'ja', true, 'detect', 'geo', 'translate_pages', true, 'glossary', ''))
on conflict (key) do nothing;
${m6data}
notify pgrst, 'reload schema';
`;
fs.writeFileSync(path.join(root, 'install.sql'), out);
// 관리자 '자동 설치' 버튼용 (빌드에 포함)
const gen = path.join(root, '..', 'generated');
fs.mkdirSync(gen, { recursive: true });
fs.writeFileSync(path.join(gen, 'install-sql.js'), `// 자동 생성 — scripts/build-sql.mjs\nexport const SCHEMA_VERSION = 9;\nexport default ${JSON.stringify(out)};\n`);
console.log('[sql] install.sql', out.split('\n').length, 'lines');
