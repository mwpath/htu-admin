/* =====================================================================
   HTU 다국어 — 언어 선택 · 페이지 문구 자동 번역 (모든 페이지 공용)
   - 언어 결정: ?lang= → 방문자가 직접 고른 언어 → 첫 방문은 접속 국가(관리자 서버가 판별) → 한국어
   - 관리자 콘텐츠: 각 섹션이 HTU_I18N.ready 이후 ?lang= 으로 번역된 내용을 받아옵니다.
   - 페이지에 직접 쓰인 한국어(회사소개 본문, 버튼 등): 아래 번역기가 자동 번역 · 캐시합니다.
   - 번역에서 빼고 싶은 요소에는 data-no-translate 속성을 붙이세요.
   ===================================================================== */
(function () {
  if (window.HTU_I18N) return;

  // 언어 목록 — 관리자 프로젝트 lib/i18n/langs.js 에서 자동 생성 (직접 수정하지 마세요)
  var LANGS = /*__LANGS__*/{"ko":{"name":"한국어","short":"KO","html":"ko","locale":"ko-KR"},"en":{"name":"English","short":"EN","html":"en","locale":"en-US"}}/*__/LANGS__*/;
  var KEY = 'htu_lang';
  var AUTO_DAYS = 7;   // 자동 선택 결과를 다시 확인하는 주기

  function ls(k, v) {
    try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; }
  }
  function valid(l) {
    var s = String(l || '').toLowerCase().replace('_', '-');
    if (LANGS[s]) return s;
    if (/^zh-(tw|hk|mo|hant)/.test(s) && LANGS['zh-tw']) return 'zh-tw';
    s = s.split('-')[0];
    return LANGS[s] ? s : null;
  }
  function endpoint() { return String(window.HTU_CMS_ENDPOINT || '').replace(/\/+$/, ''); }

  // 1) ?lang=en  2) 방문자가 고른 언어  3) 최근 자동 선택 결과  4) 아직 모름 → 접속 국가 확인
  function detect() {
    var q = null;
    try { q = valid(new URLSearchParams(location.search).get('lang')); } catch (e) { }
    if (q) { ls(KEY, q); ls(KEY + '_user', '1'); return q; }
    var saved = valid(ls(KEY));
    if (saved && ls(KEY + '_user') === '1') return saved;
    var at = +ls(KEY + '_at') || 0;
    if (saved && Date.now() - at < AUTO_DAYS * 864e5) return saved;
    return null;
  }

  var decided = detect();
  var lang = decided || 'ko';
  var I18N = window.HTU_I18N = {
    lang: lang,
    decided: !!decided,
    names: {}, short: {},
    locale: LANGS[lang].locale,
    languages: null,
    country: null,
    // API 주소에 언어 붙이기 (ready 이후에 사용)
    q: function (url) { return I18N.lang === 'ko' ? url : url + (url.indexOf('?') >= 0 ? '&' : '?') + 'lang=' + encodeURIComponent(I18N.lang); },
    setLang: function (l) {
      l = valid(l);
      if (!l) return;
      ls(KEY, l); ls(KEY + '_user', '1');
      try {
        var u = new URL(location.href);
        if (u.searchParams.has('lang')) { u.searchParams.delete('lang'); location.replace(u.toString()); return; }
      } catch (e) { }
      location.reload();
    },
    // 관리자 설정 반영 (언어를 끄거나 자동 선택 방식을 바꾼 경우)
    applySettings: function (st) {
      st = st || {};
      var langs = st.languages || I18N.languages || ['ko'];
      I18N.languages = langs;
      if (st.translate_pages === false) I18N.pagesOff = true;
      var userChosen = ls(KEY + '_user') === '1';
      var bad = langs.indexOf(I18N.lang) < 0 || (!userChosen && st.detect === 'off' && I18N.lang !== 'ko');
      if (!bad) return;
      try { if (sessionStorage.getItem('htu_lang_fix')) return; sessionStorage.setItem('htu_lang_fix', '1'); } catch (e) { }
      ls(KEY, null); ls(KEY + '_user', null); ls(KEY + '_at', null);
      location.reload();
    },
  };
  Object.keys(LANGS).forEach(function (c) { I18N.names[c] = LANGS[c].name; I18N.short[c] = LANGS[c].short; });

  var style = document.createElement('style');
  style.textContent = 'html.htu-tr-wait body{opacity:0!important} html body{transition:opacity .25s ease}';
  document.head.appendChild(style);
  function hide(ms) {
    document.documentElement.classList.add('htu-tr-wait');
    clearTimeout(hide.t);
    hide.t = setTimeout(show, ms);
  }
  function show() { clearTimeout(hide.t); document.documentElement.classList.remove('htu-tr-wait'); }

  function applyLang(l) {
    lang = l;
    I18N.lang = l;
    I18N.locale = LANGS[l].locale;
    document.documentElement.lang = LANGS[l].html;
    document.documentElement.setAttribute('data-htu-lang', l);
  }
  applyLang(lang);

  // 브라우저 언어로 추정 (관리자 서버에 연결할 수 없을 때만)
  function browserGuess() {
    var list = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'ko']);
    for (var i = 0; i < list.length; i++) { var c = valid(list[i]); if (c && LANGS[c]) return c; }
    return 'ko';
  }

  // 첫 방문: 접속 국가로 언어 결정
  I18N.ready = decided ? Promise.resolve(lang) : new Promise(function (resolve) {
    hide(2200);
    var done = false;
    function finish(l, d) {
      if (done) return;
      done = true;
      l = valid(l) || 'ko';
      if (d && d.languages) I18N.languages = d.languages;
      if (d && d.country) I18N.country = d.country;
      applyLang(l);
      I18N.decided = true;
      ls(KEY, l); ls(KEY + '_at', String(Date.now())); ls(KEY + '_user', null);
      if (l === 'ko') show();
      resolve(l);
    }
    var ep = endpoint();
    if (!ep || !window.fetch) return finish(browserGuess());
    setTimeout(function () { finish(browserGuess()); }, 1800);
    fetch(ep + '/api/public/geo', { credentials: 'omit', cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { d && d.lang ? finish(d.lang, d) : finish(browserGuess()); })
      .catch(function () { finish(browserGuess()); });
  });

  I18N.ready.then(function (l) { if (l !== 'ko') pageTranslator(); });

  function pageTranslator() {
  /* ───────── 페이지 문구 자동 번역 ───────── */

  var HANGUL = /[ㄱ-ㆎ가-힣]/;
  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, CODE: 1, PRE: 1, TEMPLATE: 1, IFRAME: 1 };
  var ATTRS = ['placeholder', 'alt', 'title', 'aria-label'];
  var CACHE = 'htu_pt_' + lang;
  var applied = new WeakMap();   // node → 적용한 번역
  var failed = {};               // 번역 불가(관리자 콘텐츠의 번역 대기분 등)
  var pending = {};
  var cache = {};
  try { cache = JSON.parse(ls(CACHE) || '{}') || {}; } catch (e) { cache = {}; }

  var norm = function (s) { return String(s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim(); };
  function saveCache() {
    var keys = Object.keys(cache);
    if (keys.length > 3000) keys.slice(0, keys.length - 3000).forEach(function (k) { delete cache[k]; });
    try { ls(CACHE, JSON.stringify(cache)); } catch (e) { }
  }

  function skipEl(el) {
    for (var p = el; p && p !== document.body; p = p.parentNode) {
      if (p.nodeType !== 1) continue;
      if (SKIP[p.tagName]) return true;
      if (p.hasAttribute('data-no-translate') || p.getAttribute('translate') === 'no') return true;
    }
    return false;
  }

  function collect(root) {
    var jobs = [];
    if (!root) return jobs;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var n;
    while ((n = w.nextNode())) {
      var v = n.nodeValue;
      if (!v || !HANGUL.test(v) || applied.get(n) === v) continue;
      if (skipEl(n.parentNode)) continue;
      jobs.push({ node: n, key: norm(v), raw: v });
    }
    var els = root.querySelectorAll ? root.querySelectorAll('[placeholder],[alt],[title],[aria-label],input[type="submit"],input[type="button"]') : [];
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (skipEl(el)) continue;
      var names = ATTRS.concat(el.tagName === 'INPUT' ? ['value'] : []);
      for (var k = 0; k < names.length; k++) {
        var a = el.getAttribute(names[k]);
        if (a && HANGUL.test(a) && el['__htuA_' + names[k]] !== a) jobs.push({ el: el, attr: names[k], key: norm(a), raw: a });
      }
    }
    return jobs;
  }

  function put(job, val) {
    if (job.node) {
      var m = job.raw.match(/^(\s*)[\s\S]*?(\s*)$/);
      var nv = (m ? m[1] : '') + val + (m ? m[2] : '');
      applied.set(job.node, nv);
      job.node.nodeValue = nv;
    } else {
      job.el['__htuA_' + job.attr] = val;
      job.el.setAttribute(job.attr, val);
    }
  }


  function run(root) {
    if (I18N.pagesOff) return Promise.resolve();
    var jobs = collect(root || document.body);
    var ask = [];
    jobs.forEach(function (j) {
      if (cache[j.key]) put(j, cache[j.key]);
      else if (!failed[j.key] && !pending[j.key]) { pending[j.key] = []; ask.push(j.key); }
      if (pending[j.key]) pending[j.key].push(j);
    });
    if (!ask.length || !endpoint()) return Promise.resolve();
    var batches = [];
    for (var i = 0; i < ask.length; i += 300) batches.push(ask.slice(i, i + 300));
    return Promise.all(batches.map(function (texts) {
      return fetch(endpoint() + '/api/public/translate-page', {
        method: 'POST', headers: { 'Content-Type': 'text/plain' }, credentials: 'omit',
        body: JSON.stringify({ path: location.pathname, lang: lang, texts: texts }),
      }).then(function (r) { return r.ok ? r.json() : { values: [] }; }).catch(function () { return { values: [] }; })
        .then(function (d) {
          texts.forEach(function (t, i) {
            var v = d.values && d.values[i];
            if (v) { cache[t] = v; (pending[t] || []).forEach(function (j) { put(j, v); }); }
            else failed[t] = 1;
            delete pending[t];
          });
          saveCache();
        });
    }));
  }
  I18N.translatePage = run;

  // 첫 방문(캐시 없음)일 때만 잠깐 가렸다가 번역 후 표시
  var firstVisit = !Object.keys(cache).length;
  if (firstVisit) hide(1600);

  function start() {
    run(document.body).then(show, show);
    // 나중에 그려지는 내용(슬라이더 · 팝업 · 게시판)도 번역
    var t = null;
    new MutationObserver(function () {
      clearTimeout(t);
      t = setTimeout(function () { run(document.body); }, 250);
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
  }
})();
