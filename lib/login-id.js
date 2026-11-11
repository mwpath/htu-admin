// 아이디 로그인 — Supabase 로그인은 이메일 형식이 필요해서, 아이디마다 내부 로그인 주소를 정해 둡니다.
// (메일이 발송되지 않는 내부 전용 주소입니다. 직원은 아이디와 비밀번호만 알면 됩니다.)
export const LOGIN_DOMAIN = 'htuglobal.com';
export const ID_RULE = '영문 소문자 · 숫자 · . _ - 3~30자 (첫 글자는 영문/숫자)';
export const ID_RE = /^[a-z0-9][a-z0-9._-]{2,29}$/;
export const normId = (v) => String(v || '').trim().toLowerCase();
export const isValidId = (v) => ID_RE.test(normId(v));
export const idToEmail = (id) => `${normId(id)}@${LOGIN_DOMAIN}`;
