-- migration-006: 사이트 언어 확장 (최대 20개 언어) + 접속 국가 기준 자동 언어 선택
-- 이미 migration-005 를 실행한 경우에만 실행하세요. (새로 설치는 schema.sql 에 포함)

alter table public.translations drop constraint if exists translations_lang_check;
alter table public.translations add constraint translations_lang_check check (lang ~ '^[a-z]{2}(-[a-z]{2})?$' and lang <> 'ko');

alter table public.text_memory drop constraint if exists text_memory_lang_check;
alter table public.text_memory add constraint text_memory_lang_check check (lang ~ '^[a-z]{2}(-[a-z]{2})?$' and lang <> 'ko');

-- 자동 선택 방식: 접속 국가 기준(geo) — 기존 '브라우저 언어 자동 선택'이 꺼져 있었다면 그대로 끔
update public.site_settings
set value = value || jsonb_build_object('detect', case when value->>'auto_detect' = 'false' then 'off' else 'geo' end)
where key = 'i18n' and not (value ? 'detect');
