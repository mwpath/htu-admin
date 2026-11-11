'use client';
import { useEffect, useState } from 'react';
import { useSiteBase } from '@/lib/use-site-base';

const FILES = [
  { name: 'index.html', desc: '홈페이지 (기존 index.html 교체)' },
  { name: 'news.html', desc: 'News & Event 목록 · 내부 작성 글' },
  { name: 'notice.html', desc: '공지사항 목록 · 상세' },
  { name: 'event.html', desc: '이벤트 목록 · 상세' },
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
        <p>아래 4개 파일을 받아 기존 사이트 서버(index.html 이 있는 폴더)에 올리면 연결이 끝납니다. 연결 주소는 자동으로 들어가 있습니다.</p>
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
              <strong>{f.name}</strong>
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
        <li>기존 index.html 은 백업해 두고, 받은 <b>index.html</b> 로 교체합니다. <b>news.html</b>, <b>notice.html</b>, <b>event.html</b> 은 같은 폴더에 추가합니다.</li>
        <li>img · video · css · js 폴더는 그대로 둡니다. 메뉴·푸터는 이제 관리자(헤더 메뉴 · 푸터)에서 관리하므로 menu3.js · footer.js 는 더 이상 쓰지 않습니다.</li>
        <li>이후 내용 수정은 이 관리자에서만 하면 됩니다. 저장 후 약 30초 안에 사이트에 반영됩니다.</li>
        <li>다른 페이지에 섹션만 넣고 싶다면 <a href="/admin/files/sections.html">sections.html</a> 을 받아 원하는 위치에 붙여넣으세요.</li>
      </ol>
    </section>
  );
}
