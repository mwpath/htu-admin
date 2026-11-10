'use client';
import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import PageHead from '@/components/admin/PageHead';
import SettingsForm from '@/components/admin/SettingsForm';
import CollectionEditor from '@/components/admin/CollectionEditor';

export default function HeroPage() {
  const [groups, setGroups] = useState([]);
  useEffect(() => {
    supabaseBrowser().from('family_groups').select('key,title').order('sort').then(({ data }) => setGroups(data || []));
  }, []);

  return (
    <>
      <PageHead title="① 메인 슬라이더" desc="스크롤에 따라 배경 이미지가 바뀌는 첫 화면입니다. 슬라이드 수는 자유롭게 늘리거나 줄일 수 있습니다." />
      <SettingsForm keys={['hero']} compact />
      <section className="adm-card">
        <div className="adm-card-head">
          <h3>슬라이드</h3>
          <p>마지막 슬라이드의 이미지가 다음 섹션의 고정 배경으로 이어집니다.</p>
        </div>
        <CollectionEditor
          table="hero_slides"
          itemLabel="슬라이드"
          addLabel="슬라이드 추가"
          display={{
            title: (r) => (r.title || '').split('\n').join(' '),
            sub: (r) => [r.link_label, r.family_key ? `패밀리: ${r.family_key}` : ''].filter(Boolean).join(' · '),
            thumb: (r) => r.image_url,
            thumbShape: 'wide',
          }}
          fields={[
            { name: 'image_url', label: '배경 이미지', type: 'image', folder: 'hero', required: true, help: '가로 1920px 이상 권장' },
            { name: 'title', label: '제목', type: 'lite', rows: 2 },
            { name: 'body', label: '설명', type: 'lite', rows: 5 },
            { section: '버튼 1 · 링크', name: '_s1' },
            { name: 'link_label', label: '링크 버튼 문구', type: 'text', half: true, placeholder: '예) 건강소비자연대' },
            { name: 'link_url', label: '링크 주소', type: 'url', half: true, placeholder: 'https://' },
            { name: 'link_new_tab', label: '새 창으로 열기', type: 'checkbox', switchLabel: '새 창', half: true },
            { section: '버튼 2 · 패밀리사이트 팝업', name: '_s2' },
            {
              name: 'family_key',
              label: '연결할 패밀리사이트 그룹',
              type: 'select',
              nullable: true,
              nullLabel: '— 버튼 숨김 —',
              options: groups.map((g) => ({ value: g.key, label: `${g.title} (${g.key})` })),
              half: true,
            },
            { name: 'family_label', label: '팝업 버튼 문구', type: 'text', default: '패밀리사이트', half: true },
          ]}
        />
      </section>
    </>
  );
}
