'use client';
import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import PageHead from '@/components/admin/PageHead';
import CollectionEditor from '@/components/admin/CollectionEditor';
import Tabs from '@/components/admin/Tabs';

export default function FamilyPage() {
  const [groups, setGroups] = useState([]);
  const [tab, setTab] = useState('__groups');
  const [ver, setVer] = useState(0);

  useEffect(() => {
    supabaseBrowser().from('family_groups').select('key,title').order('sort').then(({ data }) => setGroups(data || []));
  }, [ver, tab]);

  return (
    <>
      <PageHead title="패밀리사이트 팝업" desc="메인 슬라이더의 '패밀리사이트' 버튼을 누르면 열리는 팝업의 문구와 사이트 목록입니다." />
      <Tabs
        value={tab}
        onChange={(v) => { setTab(v); setVer((x) => x + 1); }}
        tabs={[{ value: '__groups', label: '팝업 그룹 (문구)' }, ...groups.map((g) => ({ value: g.key, label: g.title, hint: g.key }))]}
      />
      <section className="adm-card">
        {tab === '__groups' ? (
          <CollectionEditor
            key="groups"
            table="family_groups"
            itemLabel="팝업 그룹"
            addLabel="그룹 추가"
            display={{ title: (r) => r.title, sub: (r) => `key: ${r.key} · ${r.eyebrow || ''}` }}
            fields={[
              { name: 'key', label: '그룹 키 (영문)', type: 'text', required: true, half: true, help: '슬라이드에서 이 키로 연결합니다. 예) health' },
              { name: 'eyebrow', label: '좌측 상단 라벨', type: 'text', half: true },
              { name: 'title', label: '팝업 제목', type: 'text', required: true },
              { name: 'description', label: '팝업 설명', type: 'textarea', rows: 2 },
              { name: 'meta', label: '좌측 특징 목록', type: 'tags', rows: 3 },
              { name: 'toolbar_title', label: '목록 제목', type: 'text', half: true },
              { name: 'toolbar_desc', label: '목록 설명', type: 'text', half: true },
              { name: 'note', label: '하단 안내 문구', type: 'textarea', rows: 2 },
            ]}
          />
        ) : (
          <CollectionEditor
            key={tab}
            table="family_sites"
            filter={{ group_key: tab }}
            itemLabel="사이트"
            addLabel="사이트 추가"
            display={{
              title: (r) => r.title,
              sub: (r) => r.href,
              badges: (r) => [r.external ? { text: '새 창 ↗', tone: 'green' } : { text: '같은 창' }],
              link: (r) => (r.href && r.href !== '#' ? r.href : null),
            }}
            fields={[
              { name: 'title', label: '사이트명', type: 'text', required: true, half: true },
              { name: 'badge', label: '배지 문구', type: 'text', default: '패밀리 사이트', half: true },
              { name: 'description', label: '소개', type: 'textarea', rows: 3 },
              { name: 'href', label: '링크 주소', type: 'url', half: true, help: "준비 중이면 '#' 입력 (클릭 비활성)" },
              { name: 'url_text', label: '표시 주소 문구', type: 'text', half: true, placeholder: 'example.com / coming soon' },
              { name: 'external', label: '새 창으로 열기', type: 'checkbox', default: true, switchLabel: '새 창 (↗ 아이콘)' },
            ]}
          />
        )}
      </section>
    </>
  );
}
