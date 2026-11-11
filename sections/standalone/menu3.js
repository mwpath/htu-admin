// ./menu3.js — HTU 헤더 메뉴 (HTU CMS 연동판)
// 메뉴 · 로고는 관리자 > 헤더 메뉴 에서 수정합니다.
// 관리자에 연결되지 않으면 아래 DEFAULT 메뉴로 표시됩니다.
(function () {
  /* ───────── 기본값 (관리자 연결 실패 시) ───────── */
  const DEFAULT = {
    header: { logo_url: './img/logo-g-htu.png', logo_light_url: './img/logo-w.png', logo_text: 'HTU GLOBAL HOLDINGS' },
    menu: [
      { label: '회사소개', url: './introduce.html', children: [] },
      { label: '대표 인사말', url: './ceo.html', children: [] },
      { label: '비전 & 철학', url: './vision.html', children: [] },
      { label: '산하 독립 연구소', url: '', children: [{ label: '비즈니스 혁신 연구소', url: 'https://biznovalab.com', external: true, new_tab: true }] },
      { label: '소식', url: '', children: [
        { label: 'News & Event', url: './news.html' },
        { label: '이벤트', url: './event.html' },
        { label: '공지사항', url: './notice.html' },
      ] },
      { label: '오시는 길', url: './location.html', children: [] },
    ],
  };
  const CACHE_KEY = 'htu_layout_v1';

  /* ───────── 헤더 템플릿 (원본 디자인 그대로) ───────── */
  const HEADER_TEMPLATE = `
<section id="nbbioHeaderLocal" aria-label="NBBIO Global Navigation">
  <style>
/*@include css/menu3.css*/
    /* ===== HTU CMS 추가 ===== */
    #nbbioHeaderLocal .m-sub-list.open{ max-height:640px; }
    #nbbioHeaderLocal .gnb .ext, #nbbioHeaderLocal .mega .ext, #nbbioHeaderLocal .mlist .ext{ font-size:.78em; opacity:.6; margin-left:3px; }
    #nbbioHeaderLocal .cta{
      display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 16px;border-radius:999px;
      background:var(--brand);color:#fff;text-decoration:none;font-weight:800;font-size:14px;letter-spacing:-.2px;
      transition:filter .2s ease;
    }
    #nbbioHeaderLocal .cta:hover{ filter:brightness(1.08); }
    #nbbioHeaderLocal .logo .logo-text{ font-weight:900;font-size:20px;letter-spacing:-.4px;color:var(--ink);text-decoration:none; }
    #nbbioHeaderLocal.at-top:not(.hovering) .logo .logo-text{ color:#fff; }
    #nbbioHeaderLocal .mlist .m-cta a{ color:var(--brand)!important; }
    @media (max-width:1279.98px){ #nbbioHeaderLocal .actions .cta{ display:none; } }
    /* 언어 선택 */
    #nbbioHeaderLocal .lang-wrap{ position:relative; }
    #nbbioHeaderLocal .globeBtn.is-on{ display:inline-flex; align-items:center; justify-content:center; gap:6px; width:auto; min-width:36px; padding:0 10px; }
    #nbbioHeaderLocal .globeBtn .lang-code{ font-size:12px; font-weight:800; color:var(--ink); letter-spacing:.02em; }
    #nbbioHeaderLocal.at-top:not(.hovering) .globeBtn .lang-code{ color:#fff; }
    #nbbioHeaderLocal.at-top.hovering .globeBtn{ background:var(--white); border-color:var(--line); }
    #nbbioHeaderLocal.at-top.hovering .globeBtn svg circle, #nbbioHeaderLocal.at-top.hovering .globeBtn svg path{ stroke:#0b1220; }
    #nbbioHeaderLocal .lang-menu{ position:absolute; top:calc(100% + 8px); right:0; min-width:150px; padding:6px; background:#fff; border:1px solid var(--line);
      border-radius:12px; box-shadow:0 12px 30px rgba(16,24,40,.14); opacity:0; visibility:hidden; transform:translateY(4px);
      transition:opacity .18s ease, transform .18s ease, visibility .18s; z-index:5; }
    #nbbioHeaderLocal .lang-wrap.open .lang-menu{ opacity:1; visibility:visible; transform:none; }
    #nbbioHeaderLocal .lang-menu.is-many{ display:grid; grid-template-columns:repeat(2, minmax(150px, 1fr)); gap:2px; min-width:330px; max-height:min(70vh, 520px); overflow:auto; }
    #nbbioHeaderLocal .lang-menu button{ display:flex; width:100%; align-items:center; justify-content:space-between; gap:10px; padding:9px 12px; border:0; background:none;
      border-radius:8px; font:inherit; font-size:14px; font-weight:600; color:var(--ink); cursor:pointer; text-align:left; }
    #nbbioHeaderLocal .lang-menu button:hover{ background:#f0faf8; color:var(--brand); }
    #nbbioHeaderLocal .lang-menu button.is-on{ color:var(--brand); font-weight:800; }
    #nbbioHeaderLocal .lang-menu button.is-on::after{ content:'✓'; }
    #nbbioHeaderLocal .m-lang{ display:flex; flex-wrap:wrap; gap:8px; padding:18px 6px 4px; }
    #nbbioHeaderLocal .m-lang:empty{ display:none; }
    #nbbioHeaderLocal .m-lang button{ height:38px; padding:0 14px; border-radius:999px; border:1px solid var(--line); background:#fff; font:inherit; font-size:14px; font-weight:700; color:#333; cursor:pointer; }
    #nbbioHeaderLocal .m-lang button.is-on{ background:var(--brand); border-color:var(--brand); color:#fff; }
    @media (max-width:767.98px){ #nbbioHeaderLocal .lang-wrap{ display:none; } } /* 휴대폰은 메뉴 안 언어 버튼 사용 */
  </style>

  <!-- ====== Header Bar ====== -->
  <div class="bar header">
    <div class="wrap">
      <a class="logo" href="./index.html"><img src="" alt=""></a>

      <nav aria-label="주 메뉴">
        <ul class="gnb" role="menubar"></ul>
      </nav>

      <div class="actions">
        <span class="cta-slot" style="display:contents"></span>
        <div class="lang-wrap" data-no-translate>
          <button class="globeBtn" type="button" aria-label="Language" aria-haspopup="true" aria-expanded="false">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="#0b1220" stroke-width="1.7"/><path d="M3 12h18M12 3c3.5 3.8 3.5 13.2 0 18M12 3c-3.5 3.8-3.5 13.2 0 18" fill="none" stroke="#0b1220" stroke-width="1.2"/></svg>
            <span class="lang-code"></span>
          </button>
          <div class="lang-menu" role="menu"></div>
        </div>
        <button class="menuBtn" type="button" aria-label="전체 메뉴 열기" aria-expanded="false"><i></i></button>
      </div>
    </div>
  </div>

  <!-- ===== 햄버거: 풀스크린 메가메뉴 (PC) ===== -->
  <aside class="mega" aria-hidden="true">
    <div class="scrim" data-close="mega"></div>
    <div class="panel">
      <div class="inner">
        <div class="topline">
          <div class="brand"><img class="brand-dark" src="" alt="" /></div>
          <div class="icons">
            <button class="iconBtn closeMega" type="button" aria-label="닫기">
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="#111" stroke-width="2" stroke-linecap="round"/></svg>
            </button>
          </div>
        </div>
        <hr style="border:none;border-top:1px solid var(--line);margin:10px 0 40px;" />

        <div class="grid" role="menu"></div>

        <div class="watermark" aria-hidden="true">
          <svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg"><path d="M30 30h40a20 20 0 0 1 0 40H30V30zm12 12v16h20a8 8 0 1 0 0-16H42zm64-12h40a20 20 0 0 1 0 40h-40V30zm12 12v16h20a8 8 0 1 0 0-16h-20zM30 78h40a20 20 0 1 1 0 40H30V78zm12 12v16h20a8 8 0 1 0 0-16H42zm64-12h40a20 20 0 1 1 0 40h-40V78zm12 12v16h20a8 8 0 1 0 0-16h-20z" fill="#0b1220"/></svg>
        </div>
      </div>
    </div>
  </aside>

  <!-- ===== MOBILE: Drawer ===== -->
  <div class="overlay" hidden></div>
  <aside class="drawer" aria-hidden="true" aria-label="모바일 전체 메뉴">
    <div class="top">
      <div class="brand"><img class="brand-dark" src="" alt=""></div>
      <div style="display:flex;gap:10px;align-items:center;">
        <button class="iconBtn closeDrawer" type="button" aria-label="닫기" style="width:36px;height:36px;border:1px solid var(--line);border-radius:10px;background:#fff;display:grid;place-items:center;">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="#111" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
      </div>
    </div>

    <nav class="mnav" aria-label="모바일 내비게이션">
      <ul class="mlist"></ul>
      <div class="m-lang" data-no-translate></div>
    </nav>
  </aside>
</section>
`;

  /* ───────── 유틸 ───────── */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // 링크 속성: #섹션 → 홈의 섹션(data-anchor), 외부 → 새 창, 빈 값 → 클릭 없음
  function linkAttrs(it) {
    var url = String(it.url || '').trim();
    if (!url) return ' href="javascript:void(0);"';
    var a = '';
    if (url.charAt(0) === '#' && url.length > 1) {
      a = ' href="./index.html' + esc(url) + '" data-anchor="' + esc(url.slice(1)) + '"';
    } else {
      var m = url.match(/#([\w-]+)$/);
      a = ' href="' + esc(url) + '"' + (m ? ' data-anchor="' + esc(m[1]) + '"' : '');
    }
    if (it.new_tab || it.external) a += ' target="_blank" rel="noopener noreferrer"';
    return a;
  }
  var EXT = '<span class="ext" aria-hidden="true">↗</span>';
  var ARROW = '<span class="m-arrow"><svg viewBox="0 0 20 20" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 8l5 5 5-5" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';

  /* ───────── 레이아웃 데이터 (관리자) ───────── */
  function endpoint() { return String(window.HTU_CMS_ENDPOINT || '').replace(/\/+$/, ''); }
  // 페이지에 연결 설정 · 다국어 스크립트가 없으면 직접 불러옴 (서브 페이지 수정 불필요)
  function loadScript(src) {
    return new Promise(function (resolve) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = resolve;
      document.head.appendChild(s);
    });
  }
  var scriptsP = null;
  function ensureScripts() {
    if (!scriptsP) {
      scriptsP = (endpoint() ? Promise.resolve() : loadScript('./js/htu-cms-config.js'))
        .then(function () { return window.HTU_I18N ? null : loadScript('./js/htu-i18n.js'); })
        .then(function () { return endpoint(); });
    }
    return scriptsP;
  }
  function ensureEndpoint() { return ensureScripts(); }
  // 언어 (다국어 스크립트가 늦게 로드되는 서브 페이지를 위해 저장값으로 먼저 판단)
  var LANG_RE = /^[a-z]{2}(-[a-z]{2})?$/;
  function curLang() {
    if (window.HTU_I18N) return window.HTU_I18N.lang;
    try {
      var q = String(new URLSearchParams(location.search).get('lang') || '').toLowerCase();
      if (LANG_RE.test(q)) return q;
      var v = localStorage.getItem('htu_lang');
      if (LANG_RE.test(v || '')) return v;
    } catch (e) { }
    return 'ko';
  }
  function cacheKey() { return CACHE_KEY + '_' + curLang(); }
  function withLang(url) { return window.HTU_I18N ? window.HTU_I18N.q(url) : url; }
  function fetchLayout() {
    if (window.__htuLayoutP) return window.__htuLayoutP;
    var src = window.__htuCmsP
      ? window.__htuCmsP
      : ensureScripts().then(function (ep) {
          if (!ep) return null;
          return (window.HTU_I18N ? window.HTU_I18N.ready : Promise.resolve()).then(function () {
            return fetch(ep + withLang('/api/public/layout'), { credentials: 'omit' });
          }).then(function (r) { return r.ok ? r.json() : null; });
        });
    window.__htuLayoutP = src.then(function (d) {
      if (!d || !d.menus) return null;
      var layout = {
        settings: { header: (d.settings && d.settings.header) || {}, footer: (d.settings && d.settings.footer) || {}, i18n: (d.settings && d.settings.i18n) || {} },
        menus: d.menus,
      };
      try { localStorage.setItem(cacheKey(), JSON.stringify(layout)); } catch (e) { }
      if (window.HTU_I18N) window.HTU_I18N.applySettings(layout.settings.i18n);
      return layout;
    }).catch(function () { return null; });
    return window.__htuLayoutP;
  }
  function cachedLayout() {
    try { var v = localStorage.getItem(cacheKey()); return v ? JSON.parse(v) : null; } catch (e) { return null; }
  }
  window.__htuFetchLayout = fetchLayout;
  window.__htuCachedLayout = cachedLayout;

  function toState(layout) {
    if (!layout) return { header: DEFAULT.header, menu: DEFAULT.menu, langs: null };
    var h = layout.settings && layout.settings.header || {};
    var menu = (layout.menus && layout.menus.header) || [];
    return {
      header: {
        logo_url: h.logo_url || h.logo_light_url || '',
        logo_light_url: h.logo_light_url || h.logo_url || '',
        logo_text: h.logo_text || 'HTU GLOBAL',
        logo_height: Number(h.logo_height) || 0,
      },
      menu: menu.length ? menu : DEFAULT.menu,
      langs: (layout.settings && layout.settings.i18n && layout.settings.i18n.languages) || null,
    };
  }

  /* ───────── 언어 선택 UI ───────── */
  var LANG_NAMES = { ko: '한국어', en: 'English', ja: '日本語', zh: '简体中文' };
  function langName(l) { return (window.HTU_I18N && window.HTU_I18N.names[l]) || LANG_NAMES[l] || l.toUpperCase(); }
  function langShort(l) { return (window.HTU_I18N && window.HTU_I18N.short[l]) || l.toUpperCase(); }
  function renderLangs(root, langs) {
    // 관리자 설정을 아직 못 받았어도 기본 언어(한국어·영어·중국어·일본어)로 표시 → 설정이 오면 그 목록으로 갱신
    var list = langs || (window.HTU_I18N && window.HTU_I18N.languages) || ['ko', 'en', 'zh', 'ja'];
    var cur = curLang();
    var globe = root.querySelector('.globeBtn');
    var show = list.length > 1;
    globe.classList.toggle('is-on', show);
    globe.querySelector('.lang-code').textContent = langShort(cur);
    root.querySelector('.lang-menu').classList.toggle('is-many', list.length > 8);
    var btns = list.map(function (l) {
      return '<button type="button" data-lang="' + l + '"' + (l === cur ? ' class="is-on"' : '') + ' lang="' + l + '">' + langName(l) + '</button>';
    }).join('');
    root.querySelector('.lang-menu').innerHTML = show ? btns : '';
    root.querySelector('.m-lang').innerHTML = show ? btns : '';
  }
  function pickLang(l) {
    if (l === curLang()) return;
    if (window.HTU_I18N) window.HTU_I18N.setLang(l);
    else { try { localStorage.setItem('htu_lang', l); localStorage.setItem('htu_lang_user', '1'); } catch (e) { } location.reload(); }
  }

  /* ───────── 메뉴 그리기 (데이터가 바뀌면 다시 호출) ───────── */
  var current = { header: DEFAULT.header };
  function renderMenus(root, state) {
    current = state;
    var normal = state.menu.filter(function (m) { return !m.highlight; });
    var ctas = state.menu.filter(function (m) { return m.highlight && m.url; });
    var alt = esc(state.header.logo_text || 'HTU GLOBAL');

    // 로고
    root.querySelectorAll('.brand-dark').forEach(function (img) {
      if (state.header.logo_url) { img.src = state.header.logo_url; img.alt = alt; img.style.display = ''; }
      else img.style.display = 'none';
    });
    var logoA = root.querySelector('.bar .logo');
    if (state.header.logo_url || state.header.logo_light_url) {
      if (!logoA.querySelector('img')) logoA.innerHTML = '<img src="" alt="">';
      var li = logoA.querySelector('img');
      li.alt = alt;
      if (state.header.logo_height) li.style.height = state.header.logo_height + 'px';
    } else {
      logoA.innerHTML = '<span class="logo-text">' + alt + '</span>';
    }

    // PC GNB
    root.querySelector('.gnb').innerHTML = normal.map(function (it) {
      var kids = it.children || [];
      if (kids.length) {
        return '<li role="none" class="has-sub"><a role="menuitem"' + linkAttrs(it) + '>' + esc(it.label) + '</a>' +
          '<div class="sub-menu">' + kids.map(function (c) { return '<a' + linkAttrs(c) + '>' + esc(c.label) + (c.external ? EXT : '') + '</a>'; }).join('') + '</div></li>';
      }
      return '<li role="none"><a role="menuitem"' + linkAttrs(it) + '>' + esc(it.label) + (it.external ? EXT : '') + '</a></li>';
    }).join('');

    // 강조 버튼
    root.querySelector('.cta-slot').innerHTML = ctas.map(function (c) {
      return '<a class="cta"' + linkAttrs(c) + '>' + esc(c.label) + (c.external ? ' ↗' : '') + '</a>';
    }).join('');

    // PC 메가메뉴
    var grid = root.querySelector('.mega .grid');
    grid.style.gridTemplateColumns = 'repeat(' + Math.max(1, Math.min(normal.length, 6)) + ',minmax(140px,1fr))';
    grid.innerHTML = normal.map(function (it) {
      var kids = it.children || [];
      var links = kids.length ? kids : (it.url ? [it] : []);
      return '<div class="col"><h3>' + esc(it.label) + '</h3>' +
        links.map(function (c) { return '<a' + linkAttrs(c) + '>' + esc(c.label) + (c.external ? EXT : '') + '</a>'; }).join('') + '</div>';
    }).join('');

    // 모바일
    root.querySelector('.mlist').innerHTML = normal.map(function (it) {
      var kids = it.children || [];
      if (!kids.length) return '<li><a' + linkAttrs(it) + '>' + esc(it.label) + (it.external ? EXT : '') + '</a></li>';
      var list = (it.url ? [{ label: it.label + ' 바로가기', url: it.url, new_tab: it.new_tab, external: it.external }] : []).concat(kids);
      return '<li><button class="m-acc-btn" type="button" aria-expanded="false"><span>' + esc(it.label) + '</span>' + ARROW + '</button>' +
        '<ul class="m-sub-list">' + list.map(function (c) { return '<li><a' + linkAttrs(c) + '>' + esc(c.label) + (c.external ? EXT : '') + '</a></li>'; }).join('') + '</ul></li>';
    }).join('') + ctas.map(function (c) {
      return '<li class="m-cta"><a' + linkAttrs(c) + '>' + esc(c.label) + (c.external ? EXT : '') + '</a></li>';
    }).join('');

    renderLangs(root, state.langs);
    if (root.__syncLogo) root.__syncLogo();
  }

  /* ───────── 메뉴 동작 (원본 로직 + 데이터 갱신 대응) ───────── */
  function initNbbioMenu(root, solid) {
    if (!root) return;

    const barEl = root.querySelector('.bar');
    const header = barEl ? barEl.parentElement : null;
    const gnb = root.querySelector('.gnb');

    const btnHamburger = root.querySelector('.menuBtn');
    const mega = root.querySelector('.mega');
    const closeMegaBtn = root.querySelector('.closeMega');

    const overlay = root.querySelector('.overlay');
    const drawer = root.querySelector('.drawer');
    const closeDrawer = root.querySelector('.closeDrawer');

    if (!barEl || !header || !btnHamburger || !mega || !overlay || !drawer) return;

    const isDesktop = () => window.matchMedia('(min-width:1280px)').matches;
    const canHover = () => window.matchMedia('(hover:hover)').matches;
    const lockScroll = (on) => { document.documentElement.style.overflow = on ? 'hidden' : ''; };

    if (gnb) {
      gnb.addEventListener('mouseover', () => header.classList.add('act'));
      header.addEventListener('mouseleave', () => header.classList.remove('act'));

      // 메뉴가 다시 그려져도 동작하도록 위임 방식
      gnb.addEventListener('mouseover', (e) => {
        const li = e.target.closest('.gnb > li');
        if (li && isDesktop()) li.classList.add('is-on');
      });
      gnb.addEventListener('mouseout', (e) => {
        const li = e.target.closest('.gnb > li');
        if (li && !li.contains(e.relatedTarget)) li.classList.remove('is-on');
      });
      gnb.addEventListener('focusin', (e) => {
        const li = e.target.closest('.gnb > li');
        if (li && isDesktop()) li.classList.add('is-on');
      });
      gnb.addEventListener('focusout', (e) => {
        const li = e.target.closest('.gnb > li');
        if (li && !li.contains(e.relatedTarget)) li.classList.remove('is-on');
      });
    }

    /* ========= 언어 선택 ========= */
    const langWrap = root.querySelector('.lang-wrap');
    const globe = root.querySelector('.globeBtn');
    globe.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = !langWrap.classList.contains('open');
      langWrap.classList.toggle('open', open);
      globe.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', (e) => { if (!langWrap.contains(e.target)) { langWrap.classList.remove('open'); globe.setAttribute('aria-expanded', 'false'); } });
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-lang]');
      if (b) { e.preventDefault(); pickLang(b.getAttribute('data-lang')); }
    });

    /* ========= 모바일 아코디언 서브메뉴 (위임) ========= */
    root.addEventListener('click', (e) => {
      const btn = e.target.closest('.m-acc-btn');
      if (!btn) return;
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      const subList = btn.nextElementSibling;
      if (!subList) return;
      btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      subList.classList.toggle('open', !expanded);
    });

    /* ========= PC: 햄버거 → 전체 메가메뉴 ========= */
    const openMega = () => {
      mega.classList.add('act');
      btnHamburger.setAttribute('aria-expanded', 'true');
      lockScroll(true);
      root.classList.add('scroll-up');
      root.classList.remove('scroll-down');
      syncLogo();
    };
    const closeMega = () => {
      mega.classList.remove('act');
      btnHamburger.setAttribute('aria-expanded', 'false');
      lockScroll(false);
      syncLogo();
    };

    /* ========= MOBILE: Drawer ========= */
    const openDrawer = () => {
      overlay.hidden = false;
      overlay.classList.add('act');
      drawer.classList.add('act');
      drawer.setAttribute('aria-hidden', 'false');
      lockScroll(true);
      root.classList.add('scroll-up');
      root.classList.remove('scroll-down');
      syncLogo();
    };
    const closeDrawerAll = () => {
      overlay.classList.remove('act');
      overlay.hidden = true;
      drawer.classList.remove('act');
      drawer.setAttribute('aria-hidden', 'true');
      lockScroll(false);
      syncLogo();
    };

    btnHamburger.addEventListener('click', () => {
      if (isDesktop()) openMega();
      else openDrawer();
    });

    const closeAll = () => { closeMega(); closeDrawerAll(); };

    if (closeMegaBtn) closeMegaBtn.addEventListener('click', closeAll);
    const scrim = root.querySelector('[data-close="mega"]');
    if (scrim) scrim.addEventListener('click', closeAll);

    if (closeDrawer) closeDrawer.addEventListener('click', closeDrawerAll);
    overlay.addEventListener('click', closeDrawerAll);

    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(); });

    /* ========= 스무스 스크롤 ========= */
    function smoothScrollToId(id, instant) {
      const el = document.getElementById(id);
      if (!el) return false;
      const headerH = barEl ? barEl.getBoundingClientRect().height : 0;
      const y = window.pageYOffset + el.getBoundingClientRect().top - headerH - 8;
      window.scrollTo({ top: Math.max(0, y), behavior: instant ? 'auto' : 'smooth' });
      return true;
    }

    function onAnchorClick(e) {
      const a = e.target.closest('a[href]');
      if (!a || a.target === '_blank') return;
      const id = (a.getAttribute('data-anchor') || '').trim();

      // 1) 현재 페이지에 해당 섹션이 있으면 → 부드럽게 이동
      if (id && document.getElementById(id)) {
        e.preventDefault();
        smoothScrollToId(id);
        closeAll();
        return;
      }
      // 2) 다른 페이지로 이동: 메뉴가 열려 있으면 닫고 이동
      const menuOpened = mega.classList.contains('act') || drawer.classList.contains('act');
      const href = a.getAttribute('href') || '';
      if (menuOpened && href && href.indexOf('javascript:') !== 0) {
        e.preventDefault();
        closeAll();
        setTimeout(() => { window.location.href = a.href; }, 0);
      }
    }
    root.addEventListener('click', onAnchorClick);

    /* ========= 스크롤/호버 상태에 따른 로고 스왑 ========= */
    let lastY = window.scrollY || 0;
    const delta = 6;
    let ticking = false;

    let mobilePeek = false;
    let mobilePeekTimer = null;

    function setHoveringClass(on) { root.classList.toggle('hovering', !!on); }

    function setMobilePeek(on, ms = 1200) {
      mobilePeek = !!on;
      clearTimeout(mobilePeekTimer);
      setHoveringClass(mobilePeek);
      if (mobilePeek) {
        mobilePeekTimer = setTimeout(() => {
          mobilePeek = false;
          setHoveringClass(false);
          syncLogo();
        }, ms);
      }
    }

    function isMenuHovered() {
      if (canHover()) return (barEl && barEl.matches(':hover')) || (gnb && gnb.matches(':hover'));
      return mobilePeek;
    }

    function setLogo(src) {
      const logoImg = root.querySelector('.bar .logo img');
      if (!logoImg || !src) return;
      if (logoImg.getAttribute('src') !== src) logoImg.setAttribute('src', src);
    }

    function swapLogoByState(y) {
      const dark = current.header.logo_url;
      const light = current.header.logo_light_url;
      const menuOpened = mega.classList.contains('act') || drawer.classList.contains('act');
      if (solid || menuOpened || isMenuHovered()) setLogo(dark);
      else if (y <= 30) setLogo(light);
      else setLogo(dark);
    }

    // 흰 배경 페이지(뉴스·공지·이벤트)는 data-theme="solid" → 항상 흰 헤더
    function applyTopState(y) { (!solid && y <= 30) ? root.classList.add('at-top') : root.classList.remove('at-top'); }

    function handleScrollDirection() {
      const y = window.scrollY || 0;
      const diff = y - lastY;

      applyTopState(y);
      swapLogoByState(y);

      const forceShow = mega.classList.contains('act') || drawer.classList.contains('act');
      if (forceShow) {
        root.classList.add('scroll-up');
        root.classList.remove('scroll-down');
        lastY = y;
        ticking = false;
        return;
      }

      if (Math.abs(diff) > delta) {
        if (diff > 0) { root.classList.add('scroll-down'); root.classList.remove('scroll-up'); }
        else { root.classList.add('scroll-up'); root.classList.remove('scroll-down'); }
        lastY = y;
      }

      if (y <= 0) {
        root.classList.remove('scroll-down');
        root.classList.add('scroll-up');
      }

      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(handleScrollDirection);
        ticking = true;
      }
    }

    function syncLogo() { swapLogoByState(window.scrollY || 0); }
    root.__syncLogo = syncLogo;

    function syncHoveringState() {
      if (!canHover()) return;
      const y = window.scrollY || 0;
      const hovering = (y <= 30) && (barEl && barEl.matches(':hover'));
      setHoveringClass(hovering);
      syncLogo();
    }

    function peekIfTop() {
      if (canHover()) return;
      const y = window.scrollY || 0;
      if (y > 30) return;
      setMobilePeek(true, 1200);
      syncLogo();
    }

    if (barEl) ['mouseenter', 'mouseleave', 'mousemove'].forEach(evt => barEl.addEventListener(evt, syncHoveringState));
    barEl.addEventListener('pointerdown', peekIfTop, { passive: true });
    btnHamburger.addEventListener('pointerdown', peekIfTop, { passive: true });

    window.addEventListener('scroll', () => {
      if (!canHover() && mobilePeek) {
        setMobilePeek(false);
        syncLogo();
      }
    }, { passive: true });

    document.addEventListener('pointerdown', (e) => {
      if (canHover()) return;
      if (!mobilePeek) return;
      if (barEl && barEl.contains(e.target)) return;
      setMobilePeek(false);
      syncLogo();
    }, { passive: true });

    const resetStates = () => {
      if (isDesktop()) {
        closeDrawerAll();
      } else {
        mega.classList.remove('act');
        btnHamburger.setAttribute('aria-expanded', 'false');
        lockScroll(false);
      }
      syncLogo();
    };
    window.addEventListener('resize', resetStates);

    applyTopState(window.scrollY || 0);
    root.classList.add('scroll-up');
    setHoveringClass(false);
    syncLogo();
    window.addEventListener('scroll', onScroll, { passive: true });

    // 다른 페이지에서 index.html#섹션 으로 들어온 경우: 섹션이 그려진 뒤 헤더 높이만큼 보정해서 이동
    if (location.hash.length > 1) {
      const id = decodeURIComponent(location.hash.slice(1));
      [400, 1200].forEach(ms => setTimeout(() => smoothScrollToId(id, true), ms));
    }
  }

  /* ───────── mount ───────── */
  function mountMenu() {
    const mount = document.getElementById('menu_navi');
    if (!mount) return;
    if (mount._nbbioMounted) return;
    mount._nbbioMounted = true;

    mount.innerHTML = HEADER_TEMPLATE;
    const root = mount.querySelector('#nbbioHeaderLocal');
    const solid = mount.getAttribute('data-theme') === 'solid';

    ensureScripts();
    // 1) 지난 방문 때 받아둔 메뉴(또는 기본값)로 즉시 표시 → 2) 관리자 최신 데이터로 갱신
    const cached = cachedLayout();
    renderMenus(root, toState(cached));
    initNbbioMenu(root, solid);

    fetchLayout().then(function (layout) {
      if (!layout) return;
      if (cached && JSON.stringify(cached) === JSON.stringify(layout)) return;
      renderMenus(root, toState(layout));
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountMenu);
  else mountMenu();
})();
