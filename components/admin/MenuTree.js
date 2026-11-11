'use client';
import { useState } from 'react';
import CollectionEditor from './CollectionEditor';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { toast, errMsg, revalidateSite } from '@/lib/admin-utils';

// '소식' 묶음 (게시판 3개)
const NEWS_CHILDREN = [
  { label: 'News & Event', url: './news.html' },
  { label: '이벤트', url: './event.html' },
  { label: '공지사항', url: './notice.html' },
];
// 현재 htuglobal.com 메뉴 (헤더: 상위가 바로 링크 / 푸터: 제목 아래 링크)
const SITE_MENU = [
  { label: '회사소개', url: './introduce.html' },
  { label: '대표 인사말', url: './ceo.html' },
  { label: '비전 & 철학', url: './vision.html' },
  { label: '산하 독립 연구소', children: [{ label: '비즈니스 혁신 연구소', url: 'https://biznovalab.com', external: true }] },
  { label: '소식', children: NEWS_CHILDREN },
  { label: '오시는 길', url: './location.html' },
];

async function insertTop(sb, location, item, sort) {
  const footerStyle = location === 'footer';
  const hasKids = !!item.children;
  const top = {
    location, parent_id: null, sort, active: true, label: item.label,
    link_type: hasKids || footerStyle ? 'none' : 'internal', url: hasKids || footerStyle ? null : item.url,
  };
  const { data, error } = await sb.from('menu_items').insert(top).select('id').single();
  if (error) throw error;
  const kids = hasKids ? item.children : footerStyle ? [{ label: item.label, url: item.url }] : [];
  if (kids.length) {
    const { error: e2 } = await sb.from('menu_items').insert(kids.map((c, i) => ({
      location, parent_id: data.id, sort: i, active: true, label: c.label,
      link_type: c.external ? 'external' : 'internal', url: c.url, new_tab: !!c.external,
    })));
    if (e2) throw e2;
  }
}
import Tabs from './Tabs';
import { linkFields, linkSub } from './link-options';

/** 2단 메뉴 편집기: 1단(상위) 목록 + 선택한 상위의 하위 목록 */
export default function MenuTree({ location, topLabel, subLabel, topExtraFields = [], topDefaults = {}, subDefaults = {}, hint }) {
  const [tops, setTops] = useState([]);
  const [sel, setSel] = useState(null);
  const [reload, setReload] = useState(0);
  const [busy, setBusy] = useState(false);
  const current = tops.find((t) => t.id === sel) || tops[0];
  const quick = location === 'header' || location === 'footer';
  const hasNews = tops.some((t) => String(t.label).trim() === '소식');

  // ＋ 소식 메뉴: '오시는 길' 앞(없으면 맨 끝)에 소식 + News & Event · 이벤트 · 공지사항
  const addNews = async () => {
    setBusy(true);
    try {
      const sb = supabaseBrowser();
      const sorted = [...tops].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
      const loc = sorted.find((t) => /오시는\s*길/.test(t.label));
      let sort = sorted.length ? Math.max(...sorted.map((t) => t.sort ?? 0)) + 1 : 0;
      if (loc) {
        sort = loc.sort ?? 0;
        for (const t of sorted.filter((x) => (x.sort ?? 0) >= sort)) {
          const { error } = await sb.from('menu_items').update({ sort: (t.sort ?? 0) + 1 }).eq('id', t.id);
          if (error) throw error;
        }
      }
      await insertTop(sb, location, { label: '소식', children: NEWS_CHILDREN }, sort);
      toast("'소식' 메뉴를 추가했습니다. 약 10초 뒤 사이트에 표시됩니다.");
      setReload((n) => n + 1);
      revalidateSite();
    } catch (e) { toast(errMsg(e), 'err'); }
    setBusy(false);
  };
  // 메뉴가 비어 있을 때: 현재 사이트 메뉴 전체 불러오기
  const loadSite = async () => {
    setBusy(true);
    try {
      const sb = supabaseBrowser();
      for (let i = 0; i < SITE_MENU.length; i++) await insertTop(sb, location, SITE_MENU[i], i);
      toast('현재 사이트 메뉴를 불러왔습니다.');
      setReload((n) => n + 1);
      revalidateSite();
    } catch (e) { toast(errMsg(e), 'err'); }
    setBusy(false);
  };

  return (
    <>
      <section className="adm-card">
        <div className="adm-card-head">
          <h3>{topLabel}</h3>
          {hint ? <p>{hint}</p> : null}
        </div>
        {quick ? (
          <div className="adm-quickmenu">
            {!tops.length ? (
              <>
                <span>메뉴가 비어 있어 사이트에는 기본 메뉴가 표시되고 있습니다. 불러온 뒤 자유롭게 수정하세요.</span>
                <button type="button" className="adm-btn primary" disabled={busy} onClick={loadSite}>현재 사이트 메뉴 불러오기 (소식 포함)</button>
              </>
            ) : !hasNews ? (
              <>
                <span><b>소식</b> 메뉴가 없습니다. News &amp; Event · 이벤트 · 공지사항 게시판으로 가는 메뉴를 한 번에 추가합니다.</span>
                <button type="button" className="adm-btn primary" disabled={busy} onClick={addNews}>＋ 소식 메뉴 추가</button>
              </>
            ) : (
              <span className="adm-muted">✓ 소식 메뉴(News &amp; Event · 이벤트 · 공지사항)가 들어 있습니다. 아래 목록에서 이름 · 순서를 바꿀 수 있습니다.</span>
            )}
          </div>
        ) : null}
        <CollectionEditor
          key={`top-${reload}`}
          table="menu_items"
          filter={{ location, parent_id: null }}
          defaults={{ link_type: 'internal', ...topDefaults }}
          itemLabel={topLabel}
          addLabel={`${topLabel} 추가`}
          onRowsChange={setTops}
          display={{
            title: (r) => r.label,
            sub: linkSub,
            badges: (r) => (r.highlight ? [{ text: '강조 버튼', tone: 'green' }] : []),
          }}
          fields={[{ name: 'label', label: '메뉴 이름', type: 'text', required: true }, ...linkFields(), ...topExtraFields]}
        />
      </section>

      {tops.length ? (
        <section className="adm-card">
          <div className="adm-card-head">
            <h3>{subLabel}</h3>
            <p>상위 메뉴를 선택한 뒤 하위 메뉴를 추가하세요. 하위 메뉴가 없으면 상위 메뉴만 표시됩니다.</p>
          </div>
          <Tabs value={current?.id} onChange={setSel} tabs={tops.map((t) => ({ value: t.id, label: t.label || '(이름 없음)', hint: t.active ? '' : '숨김' }))} />
          {current ? (
            <CollectionEditor
              key={`${current.id}-${reload}`}
              table="menu_items"
              filter={{ location, parent_id: current.id }}
              defaults={{ link_type: 'internal', ...subDefaults }}
              itemLabel={subLabel}
              addLabel={`'${current.label}' 하위 메뉴 추가`}
              emptyText="하위 메뉴가 없습니다."
              display={{ title: (r) => r.label, sub: linkSub }}
              fields={[{ name: 'label', label: '메뉴 이름', type: 'text', required: true }, ...linkFields({ allowNone: false })]}
            />
          ) : null}
        </section>
      ) : null}
    </>
  );
}
