'use client';
import { useState } from 'react';
import PageHead from '@/components/admin/PageHead';
import SettingsForm from '@/components/admin/SettingsForm';
import CollectionEditor from '@/components/admin/CollectionEditor';
import Tabs from '@/components/admin/Tabs';

const ACTIONS = [
  { value: 'popup', label: '팝업으로 소개' },
  { value: 'link', label: '홈페이지로 바로 이동' },
  { value: 'none', label: '클릭 없음' },
];

export default function PartnersPage() {
  const [tab, setTab] = useState('fixed');
  return (
    <>
      <PageHead title="② 파트너 로고" desc="상단 무한 롤링 로고와, 클릭 시 팝업/링크로 연결되는 고정 로고 그리드를 관리합니다." />
      <SettingsForm keys={['partners']} compact />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'fixed', label: '고정 로고 그리드', hint: '팝업 / 링크' },
          { value: 'rolling', label: '무한 롤링 로고', hint: '클릭 없음' },
        ]}
      />
      <section className="adm-card">
        {tab === 'fixed' ? (
          <CollectionEditor
            key="fixed"
            table="partner_logos"
            filter={{ kind: 'fixed' }}
            defaults={{ action: 'popup', headline: '파트너 소개' }}
            itemLabel="고정 로고"
            addLabel="로고 추가"
            display={{
              title: (r) => r.name,
              sub: (r) => r.homepage_url,
              thumb: (r) => r.logo_url,
              thumbShape: 'logo',
              badges: (r) => [
                r.action === 'popup' ? { text: '＋ 팝업', tone: 'green' } : r.action === 'link' ? { text: '↗ 링크', tone: 'blue' } : { text: '클릭 없음' },
              ],
            }}
            fields={[
              { name: 'logo_url', label: '로고 이미지', type: 'image', folder: 'partners', required: true },
              { name: 'name', label: '기관명', type: 'text', required: true, half: true },
              { name: 'alt', label: '대체 텍스트 (alt)', type: 'text', half: true, placeholder: '비우면 기관명 사용' },
              { name: 'action', label: '클릭 동작', type: 'radio', options: ACTIONS, default: 'popup', help: '로고 우측 상단에 팝업(＋) / 링크(↗) 아이콘이 자동 표시됩니다.' },
              { name: 'homepage_url', label: '홈페이지 주소', type: 'url', placeholder: 'https://' },
              { section: '팝업 내용', name: '_s', showIf: (f) => f.action === 'popup' },
              { name: 'hero_url', label: '팝업 상단 이미지', type: 'image', folder: 'partners', showIf: (f) => f.action === 'popup' },
              { name: 'sub', label: '부제', type: 'text', showIf: (f) => f.action === 'popup' },
              { name: 'headline', label: '소개 제목', type: 'text', half: true, showIf: (f) => f.action === 'popup' },
              { name: 'button_label', label: '버튼 문구', type: 'text', half: true, placeholder: '공식 홈페이지 바로가기', showIf: (f) => f.action === 'popup' },
              { name: 'description', label: '소개 문구', type: 'textarea', rows: 6, showIf: (f) => f.action === 'popup' },
            ]}
          />
        ) : (
          <CollectionEditor
            key="rolling"
            table="partner_logos"
            filter={{ kind: 'rolling' }}
            defaults={{ action: 'none' }}
            itemLabel="롤링 로고"
            addLabel="로고 추가"
            display={{ title: (r) => r.name || r.alt, thumb: (r) => r.logo_url, thumbShape: 'logo' }}
            fields={[
              { name: 'logo_url', label: '로고 이미지', type: 'image', folder: 'partners', required: true },
              { name: 'name', label: '기관명 (관리용)', type: 'text', half: true },
              { name: 'alt', label: '대체 텍스트 (alt)', type: 'text', half: true },
            ]}
          />
        )}
      </section>
    </>
  );
}
