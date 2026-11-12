import sanitizeHtml from 'sanitize-html';

// 짧은 문구용: 줄바꿈 → <br>, 굵게/밑줄/기울임만 허용
export function liteHtml(text) {
  if (!text) return '';
  const withBr = String(text).replace(/\r\n?/g, '\n').replace(/\n/g, '<br>');
  return sanitizeHtml(withBr, {
    allowedTags: ['b', 'strong', 'u', 'em', 'i', 'br', 'span', 'small', 'mark'],
    allowedAttributes: {},
  });
}

export function plainText(text) {
  return sanitizeHtml(String(text || '').replace(/\n/g, ' '), { allowedTags: [], allowedAttributes: {} }).trim();
}

// 본문(내부 글/공지)용 — 편집기의 정렬 · 자간 · 행간 · 글자 크기 · 색상 · 표 · 이미지 배치를 유지
const LEN = /^-?\d+(\.\d+)?(px|em|rem|%|pt)$/;
const COLOR = /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%deg]+\)|[a-z]{3,20})$/i;
const STYLES = {
  'text-align': [/^(left|right|center|justify)$/],
  'line-height': [/^\d+(\.\d+)?$/, LEN],
  'letter-spacing': [LEN, /^normal$/],
  'font-size': [LEN, /^(x-small|small|medium|large|x-large|xx-large)$/],
  'font-weight': [/^(normal|bold|[1-9]00)$/],
  'font-style': [/^(normal|italic)$/],
  'text-decoration': [/^(none|underline|line-through|underline line-through)$/],
  'text-decoration-line': [/^(none|underline|line-through|underline line-through)$/],
  color: [COLOR],
  'background-color': [COLOR],
  'margin-left': [LEN], 'padding-left': [LEN],
  width: [LEN, /^auto$/], 'max-width': [LEN],
  float: [/^(left|right|none)$/],
  margin: [/^[\d.\s]+(px|em|rem|%)?(\s+(auto|[\d.]+(px|em|rem|%)?)){0,3}$/, /^0 auto$/, /^[\d.]+px auto$/],
  'vertical-align': [/^(top|middle|bottom|baseline)$/],
  'border-collapse': [/^collapse$/],
};
const STYLED = ['p', 'h1', 'h2', 'h3', 'h4', 'span', 'div', 'li', 'ul', 'ol', 'blockquote', 'td', 'th', 'table', 'img', 'figure', 'figcaption', 'a', 'strong', 'b', 'em', 'i', 'u', 's', 'mark', 'pre', 'code', 'sup', 'sub'];
export function richHtml(html) {
  return sanitizeHtml(html || '', {
    allowedTags: [
      'p', 'br', 'h1', 'h2', 'h3', 'h4', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del', 'blockquote', 'ul', 'ol', 'li',
      'a', 'img', 'hr', 'figure', 'figcaption', 'span', 'div', 'iframe', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
      'colgroup', 'col', 'mark', 'small', 'sup', 'sub', 'code', 'pre', 'font',
    ],
    allowedAttributes: {
      ...Object.fromEntries(STYLED.map((t) => [t, ['style']])),
      a: ['href', 'target', 'rel', 'style'],
      img: ['src', 'alt', 'width', 'height', 'loading', 'style', 'class'],
      iframe: ['src', 'allow', 'allowfullscreen', 'frameborder', 'title'],
      div: ['class', 'style'],
      span: ['class', 'style'],
      td: ['colspan', 'rowspan', 'style'],
      th: ['colspan', 'rowspan', 'style', 'scope'],
      ol: ['start', 'type', 'style'],
      col: ['span', 'style'],
      font: ['color'],
    },
    allowedStyles: { '*': STYLES },
    allowedClasses: { div: ['yt-embed', 'hb-box', 'hb-box-green', 'hb-box-gray'], span: ['hb-emoji'], img: ['is-left', 'is-right', 'is-center'] },
    allowedIframeHostnames: ['www.youtube.com', 'www.youtube-nocookie.com', 'player.vimeo.com'],
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    transformTags: {
      font: (tagName, attribs) => ({ tagName: 'span', attribs: attribs.color ? { style: `color:${attribs.color}` } : {} }),
      strike: 'del',
      a: (tagName, attribs) => ({
        tagName,
        attribs: /^https?:/i.test(attribs.href || '') ? { ...attribs, target: '_blank', rel: 'noopener noreferrer' } : attribs,
      }),
      img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: 'lazy' } }),
    },
  });
}
