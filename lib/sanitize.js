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

// 본문(내부 글/공지)용
export function richHtml(html) {
  return sanitizeHtml(html || '', {
    allowedTags: [
      'p', 'br', 'h1', 'h2', 'h3', 'h4', 'strong', 'b', 'em', 'i', 'u', 's', 'blockquote', 'ul', 'ol', 'li',
      'a', 'img', 'hr', 'figure', 'figcaption', 'span', 'div', 'iframe', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'mark', 'small',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height', 'loading'],
      iframe: ['src', 'allow', 'allowfullscreen', 'frameborder', 'title'],
      div: ['class'],
      span: ['class'],
      p: ['style'],
      h2: ['style'],
      h3: ['style'],
    },
    allowedStyles: { '*': { 'text-align': [/^(left|right|center|justify)$/] } },
    allowedIframeHostnames: ['www.youtube.com', 'www.youtube-nocookie.com', 'player.vimeo.com'],
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: /^https?:/i.test(attribs.href || '') ? { ...attribs, target: '_blank', rel: 'noopener noreferrer' } : attribs,
      }),
      img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: 'lazy' } }),
    },
  });
}
