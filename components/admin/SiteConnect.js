'use client';
import { useEffect, useState } from 'react';
import { useSiteBase } from '@/lib/use-site-base';

const FILES = [
  { name: 'htu-cms-config.js', path: 'js/htu-cms-config.js', desc: '연결 설정 (관리자 주소 자동 입력) — 꼭 필요' },
  { name: 'htu-i18n.js', path: 'js/htu-i18n.js', desc: '다국어 (언어 선택 · 페이지 문구 자동 번역) — 꼭 필요' },
  { name: 'menu3.js', path: 'menu3.js', desc: '헤더 메뉴 + 언어 선택 (관리자 연동판, 기존 파일 교체)' },
  { name: 'footer.js', path: 'js/footer.js', desc: '푸터 (관리자 연동판, 기존 파일 교체)' },
  { name: 'index.html', path: 'index.html', desc: '홈페이지 (기존 파일 교체)' },
  { name: 'news.html', path: 'news.html', desc: 'News & Event 목록 · 내부 작성 글' },
  { name: 'notice.html', path: 'notice.html', desc: '공지사항 목록 · 상세' },
  { name: 'event.html', path: 'event.html', desc: '이벤트 목록 · 상세' },
];

export default function SiteConnect() {
  const site = useSiteBase();
  const [api, setApi] = useState({ state: 'checking' });

  useEffect(() => {
    fetch('/api/public/content')
      .then((r) => r.json())
      .then((d) => setApi(d.error ? { state: 'err', msg: d.error } : { state: 'ok', n: (d.heroSlides || []).length + (d.news || []).length }))
      .catch(() => setApi({ state: 'err', msg: 'API 응답 없음' }));
  }, []);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <section className="adm-card adm-connect">
      <div className="adm-card-head">
        <h3>기존 사이트 연결</h3>
        <p>아래 파일을 받아 표시된 위치에 올리면 연결이 끝납니다. 연결 주소는 htu-cms-config.js 에 자동으로 들어가 있습니다.</p>
      </div>

      <div className="adm-connect-status">
        <div>
          <span className="adm-muted">관리자(API) 주소</span>
          <code>{origin}</code>
        </div>
        <div>
          <span className="adm-muted">데이터 연결</span>
          {api.state === 'checking' ? <b>확인 중…</b> : api.state === 'ok' ? <b className="ok">● 정상</b> : <b className="err">● 오류 ({api.msg})</b>}
        </div>
        <div>
          <span className="adm-muted">기존 사이트</span>
          {site ? <a href={site} target="_blank" rel="noreferrer">{site} ↗</a> : <a href="/admin/settings">주소 설정하기 →</a>}
        </div>
      </div>

      <div className="adm-files">
        {FILES.map((f) => (
          <div key={f.name} className="adm-file">
            <div>
              <strong>{f.path}</strong>
              <small>{f.desc}</small>
            </div>
            <div className="adm-row-gap">
              <a className="adm-btn sm ghost" href={`/admin/files/${f.name}?view=1`} target="_blank" rel="noreferrer">코드 보기</a>
              <a className="adm-btn sm primary" href={`/admin/files/${f.name}`}>다운로드</a>
            </div>
          </div>
        ))}
      </div>

      <ol className="adm-guide">
        <li><b>js/htu-cms-config.js</b> 를 사이트의 js 폴더에 올립니다. 모든 페이지가 이 파일로 관리자에 연결됩니다.</li>
        <li><b>menu3.js</b>(루트) · <b>js/footer.js</b> 를 교체하면 회사소개·대표 인사말 등 <b>모든 페이지</b>의 메뉴와 푸터가 관리자 내용으로 바뀝니다. 서브 페이지 HTML 은 수정할 필요가 없습니다.</li>
        <li><b>index.html</b> 은 백업 후 교체하고, <b>news.html · notice.html · event.html</b> 은 같은 폴더에 추가합니다. img · video · css 폴더는 그대로 둡니다.</li>
        <li>이후 내용 수정은 이 관리자에서만 하면 됩니다. 저장 후 약 30초 안에 사이트에 반영됩니다.</li>
      </ol>
    </section>
  );
}
