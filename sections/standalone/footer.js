// ./js/footer.js — HTU 푸터 (HTU CMS 연동판)
// 회사 정보 · 푸터 메뉴 · 패밀리 사이트 · SNS · 정책 링크는 관리자 > 푸터 · 관련 사이트 에서 수정합니다.
(function () {
  const mount = document.getElementById('footer_template');
  if (!mount) return;
  if (document.getElementById('footerElite')) return;

  /* ───────── 기본값 (관리자 연결 실패 시) ───────── */
  const DEFAULT = {
    footer: {
      logo_url: './img/logo-w.png',
      logo_text: 'HTU GLOBAL HOLDINGS',
      slogan: '세계를 더욱 아름답고 건강하게\n만들어가는 뷰티, 헬스 글로벌 플랫폼',
      company: 'HTU GLOBAL HOLDINGS',
      biz_no: '581-81-03408',
      ceo: '이유리',
      address: '강남구 역삼로 114, 현죽빌딩 8층 8016호',
      copyright: 'COPYRIGHT © 2025 HTU GLOBAL HOLDINGS\nALL RIGHTS RESERVED',
      related_label: '패밀리 사이트',
    },
    menus: {
      footer: [
        { label: '회사소개', children: [{ label: '회사소개', url: './introduce.html' }] },
        { label: '대표 인사말', children: [{ label: '대표 인사말', url: './ceo.html' }] },
        { label: '비전 & 철학', children: [{ label: '비전 & 철학', url: './vision.html' }] },
        { label: '산하 독립 연구소', children: [{ label: '비즈니스 혁신 연구소', url: 'https://biznovalab.com', external: true, new_tab: true }] },
        { label: '오시는 길', children: [{ label: '오시는 길', url: './location.html' }] },
      ],
      related: [
        ['건강소비자 연대', 'http://hcn.or.kr/'], ['비즈니스 혁신 연구소', 'https://biznovalab.com'], ['MAXQ', 'https://www.maxq.kr/'],
        ['MD 저널', 'https://www.mdjournal.kr/'], ['ENDO 저널', 'https://endo365.kr/'], ['헬스컨슈머', 'https://www.healthumer.com/'],
        ['한국뷰티헬시에이징국제교류회', 'https://kbhga.com/'], ['한국헬시에이징학회', 'https://khealthyaging.com/'], ['사피엔스 아일랜드', 'https://www.sapiensland.io/'],
      ].map(function (r) { return { label: r[0], url: r[1], external: true, new_tab: true }; }),
      sns: [],
      policy: [],
    },
  };

  mount.innerHTML = `
<section id="footerElite" aria-label="사이트 푸터" style="position:relative;">
  <style>
/*@include css/footer.css*/
    /* ===== HTU CMS 추가 ===== */
    #footerElite .slogan{ white-space:pre-line; }
    #footerElite .copy{ white-space:pre-line; }
    #footerElite .logoText{ color:#fff; font-weight:900; font-size:1.3rem; letter-spacing:-.02em; }
    #footerElite .ext{ font-size:.78em; opacity:.6; margin-left:3px; }
    #footerElite .sns{ display:flex; gap:8px; margin-top:.4rem; }
    #footerElite .sns a{ width:36px; height:36px; border-radius:50%; display:grid; place-items:center; color:#e5e7eb;
      background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); transition:background .2s ease, transform .2s ease; }
    #footerElite .sns a:hover{ background:rgba(255,255,255,.14); transform:translateY(-2px); color:#fff; }
    #footerElite .sns svg{ width:16px; height:16px; display:block; }
    #footerElite .policy{ display:flex; flex-wrap:wrap; gap:.3rem 1rem; margin-top:.7rem; }
    #footerElite .policy a{ color:#d7dde6; font-weight:700; font-size:.82rem; }
    #footerElite .policy a:first-child{ color:#7fd3b8; }
    #footerElite .familyArea[hidden]{ display:none; }
    @media(min-width:901px){
      #footerElite .menuRow{ grid-template-columns:repeat(var(--cols,5),minmax(0,1fr)); }
      #footerElite .menuRow.is-dense{ gap:2rem 1.6rem; }
      #footerElite .menuRow.is-dense h4{ white-space:normal; }
    }
  </style>

  <div class="wrap">
    <div class="navGrid">
      <div class="brandCol">
        <div class="logoRow"></div>
        <p class="slogan"></p>
        <div class="sns"></div>
      </div>
      <div class="menuRow"></div>
    </div>

    <div class="footBar">
      <div class="addr">
        <div class="corpLine"></div>
        <div class="policy"></div>
        <div class="copy"></div>
      </div>

      <div class="familyArea">
        <div class="familyDropdown" id="familyDropdown">
          <button type="button" class="familyBtn" id="familyBtn" aria-expanded="false" aria-controls="familyMenu">
            <span class="familyLabel">패밀리 사이트</span>
            <i class="familyIcon" aria-hidden="true"></i>
          </button>
          <div class="familyMenu" id="familyMenu" role="menu"></div>
        </div>
      </div>
    </div>
  </div>
</section>
`;

  const root = mount.querySelector('#footerElite');

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function linkAttrs(it) {
    var url = String(it.url || '').trim();
    if (!url) return ' href="javascript:void(0);"';
    if (url.charAt(0) === '#' && url.length > 1) url = './index.html' + url;
    var a = ' href="' + esc(url) + '"';
    if (it.new_tab || it.external) a += ' target="_blank" rel="noopener noreferrer"';
    return a;
  }
  var EXT = '<span class="ext" aria-hidden="true">↗</span>';
  var ICON = {
    youtube: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12 31 31 0 0 0 1 16.8a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1c.4-1.6.5-3.2.5-4.8s-.1-3.2-.5-4.8ZM9.8 15.1V8.9L15.6 12l-5.8 3.1Z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
    blog: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 3h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-6l-2 3-2-3H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm3.5 4v6h2.6c1.3 0 2.1-.7 2.1-1.7 0-.7-.4-1.2-1-1.4.5-.2.8-.7.8-1.2C12 7.6 11.3 7 10 7H7.5Zm1.4 1.1h1c.5 0 .8.2.8.6s-.3.6-.8.6h-1V8.1Zm0 2.2h1.1c.6 0 .9.3.9.7s-.3.7-.9.7H8.9v-1.4ZM13.2 7v6h1.4V7h-1.4Zm2.5 2.6v3.4h1.4V9.6h-1.4Zm.7-2.3a.8.8 0 1 0 0 1.6.8.8 0 0 0 0-1.6Z"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-7.5H16l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8v3h2.6V21h2.9Z"/></svg>',
    kakao: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3.5c-5 0-9 3.1-9 7 0 2.5 1.7 4.7 4.2 5.9l-.9 3.4c-.1.3.3.6.6.4l4-2.6h1.1c5 0 9-3.1 9-7s-4-7.1-9-7.1Z"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.8 3h3.1l-6.8 7.7 8 10.3h-6.2l-4.9-6.3L5.4 21H2.3l7.2-8.3L1.8 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.5l11.2 14.5Z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.5h4V21H3V9.5Zm7 0h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.2c0-1.2 0-2.9-1.8-2.9s-2 1.4-2 2.8V21h-4V9.5Z"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 3c.4 2 1.6 3.4 3.6 3.7v3.1a7 7 0 0 1-3.6-1.1v6.6A6.3 6.3 0 1 1 10.3 9v3.2a3.1 3.1 0 1 0 3.1 3.1V3h3.2Z"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>'
  };

  function toState(layout) {
    if (!layout) return DEFAULT;
    var f = (layout.settings && layout.settings.footer) || {};
    var m = layout.menus || {};
    return {
      footer: Object.assign({}, DEFAULT.footer, f),
      menus: {
        footer: (m.footer && m.footer.length) ? m.footer : DEFAULT.menus.footer,
        related: m.related || [],
        sns: m.sns || [],
        policy: m.policy || [],
      },
    };
  }

  function render(state) {
    var f = state.footer, m = state.menus;

    root.querySelector('.logoRow').innerHTML = f.logo_url
      ? '<img src="' + esc(f.logo_url) + '" alt="' + esc((f.logo_text || 'HTU GLOBAL HOLDINGS') + ' 로고') + '" style="width:200px;">'
      : '<span class="logoText">' + esc(f.logo_text || 'HTU GLOBAL HOLDINGS') + '</span>';
    var slogan = root.querySelector('.slogan');
    slogan.textContent = f.slogan || '';
    slogan.style.display = f.slogan ? '' : 'none';

    root.querySelector('.sns').innerHTML = (m.sns || []).filter(function (s) { return s.url; }).map(function (s) {
      return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer" aria-label="' + esc(s.label) + '" title="' + esc(s.label) + '">' + (ICON[s.icon] || ICON.link) + '</a>';
    }).join('');

    var cols = m.footer || [];
    var row = root.querySelector('.menuRow');
    row.style.setProperty('--cols', Math.max(1, Math.min(cols.length, 6)));
    row.classList.toggle('is-dense', cols.length > 5);
    row.innerHTML = cols.map(function (col) {
      var head = col.url ? '<a' + linkAttrs(col) + ' style="color:inherit;font-size:inherit;">' + esc(col.label) + '</a>' : esc(col.label);
      return '<div class="col"><h4>' + head + '</h4><ul>' + (col.children || []).map(function (c) {
        return '<li><a' + linkAttrs(c) + '>' + esc(c.label) + (c.external ? EXT : '') + '</a></li>';
      }).join('') + '</ul></div>';
    }).join('');

    var parts = [];
    if (f.company) parts.push('<span class="corpName">' + esc(f.company) + '</span>');
    [['사업자등록번호', f.biz_no], ['대표', f.ceo], ['주소', f.address], ['TEL', f.tel], ['FAX', f.fax], ['E-mail', f.email]].forEach(function (p) {
      if (p[1]) parts.push('<span class="meta">' + p[0] + ' : <b>' + esc(p[1]) + '</b></span>');
    });
    if (f.extra) parts.push('<span class="meta">' + esc(f.extra) + '</span>');
    root.querySelector('.corpLine').innerHTML = parts.join('<span class="sep">·</span>');

    root.querySelector('.policy').innerHTML = (m.policy || []).map(function (p) { return '<a' + linkAttrs(p) + '>' + esc(p.label) + '</a>'; }).join('');
    root.querySelector('.copy').textContent = f.copyright || '';

    var related = (m.related || []).filter(function (r) { return r.url; });
    var area = root.querySelector('.familyArea');
    area.hidden = !related.length;
    root.querySelector('.familyLabel').textContent = f.related_label || '패밀리 사이트';
    root.querySelector('.familyMenu').innerHTML = related.map(function (r) {
      return '<a' + linkAttrs(r) + ' role="menuitem">' + esc(r.label) + '</a>';
    }).join('');
  }

  /* 패밀리 사이트 드롭다운 (원본 동작) */
  const dropdown = root.querySelector('#familyDropdown');
  const btn = root.querySelector('#familyBtn');
  if (dropdown && btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      const isOpen = dropdown.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        dropdown.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* 1) 지난 방문 데이터(또는 기본값)로 즉시 표시 → 2) 관리자 최신 데이터로 갱신 */
  var lang = (window.HTU_I18N && window.HTU_I18N.decided && window.HTU_I18N.lang) || (function () { try { return localStorage.getItem('htu_lang') || 'ko'; } catch (e) { return 'ko'; } })();
  var CACHE_KEY = 'htu_layout_v1_' + lang;
  var cached = null;
  try { cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch (e) { }
  render(toState(cached));

  var fetcher = window.__htuFetchLayout;
  var p = fetcher ? fetcher()
    : (window.HTU_CMS_ENDPOINT
      ? (window.HTU_I18N ? window.HTU_I18N.ready : Promise.resolve()).then(function () {
          var u = String(window.HTU_CMS_ENDPOINT).replace(/\/+$/, '') + '/api/public/layout';
          return fetch(window.HTU_I18N ? window.HTU_I18N.q(u) : u, { credentials: 'omit' });
        }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })
      : Promise.resolve(null));
  p.then(function (layout) {
    if (!layout || !layout.menus) return;
    var norm = { settings: { header: (layout.settings && layout.settings.header) || {}, footer: (layout.settings && layout.settings.footer) || {}, i18n: (layout.settings && layout.settings.i18n) || {} }, menus: layout.menus };
    if (cached && JSON.stringify(cached) === JSON.stringify(norm)) return;
    render(toState(norm));
  });
})();
