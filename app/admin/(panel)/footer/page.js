'use client';
import { useState } from 'react';
import PageHead from '@/components/admin/PageHead';
import SettingsForm from '@/components/admin/SettingsForm';
import CollectionEditor from '@/components/admin/CollectionEditor';
import MenuTree from '@/components/admin/MenuTree';
import Tabs from '@/components/admin/Tabs';
import { linkFields, linkSub } from '@/components/admin/link-options';

const SNS = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'blog', label: '네이버 블로그' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'kakao', label: '카카오톡 채널' },
  { value: 'x', label: 'X (Twitter)' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'link', label: '기타 링크' },
];
const SNS_LABEL = Object.fromEntries(SNS.map((s) => [s.value, s.label]));

export default function FooterPage() {
  const [tab, setTab] = useState('info');
  return (
    <>
      <PageHead title="푸터" desc="사이트 맨 아래 영역입니다. 회사 정보, 메뉴, 관련 사이트(패밀리 사이트), SNS, 하단 정책 링크를 관리합니다." />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'info', label: '회사 정보', hint: '로고 · 주소 · 연락처' },
          { value: 'menu', label: '푸터 메뉴', hint: '컬럼 · 링크' },
          { value: 'related', label: '관련 사이트', hint: '외부 링크 드롭다운' },
          { value: 'sns', label: 'SNS' },
          { value: 'policy', label: '정책 링크', hint: '개인정보처리방침 등' },
        ]}
      />

      {tab === 'info' ? <SettingsForm keys={['footer']} /> : null}

      {tab === 'menu' ? (
        <MenuTree
          location="footer"
          topLabel="메뉴 컬럼"
          subLabel="컬럼 안 링크"
          topDefaults={{ link_type: 'none' }}
          hint="컬럼 제목(예: 회사소개, 고객지원)을 만들고, 아래에서 컬럼별 링크를 추가하세요."
        />
      ) : null}

      {tab === 'related' ? (
        <section className="adm-card">
          <div className="adm-card-head">
            <h3>관련 사이트</h3>
            <p>푸터 오른쪽 &lsquo;FAMILY SITE&rsquo; 드롭다운에 표시됩니다. 버튼 문구는 회사 정보 탭에서 바꿀 수 있습니다.</p>
          </div>
          <CollectionEditor
            key="related"
            table="menu_items"
            filter={{ location: 'related', parent_id: null }}
            defaults={{ link_type: 'external', new_tab: true }}
            itemLabel="관련 사이트"
            addLabel="관련 사이트 추가"
            display={{ title: (r) => r.label, sub: linkSub, link: (r) => (r.link_type === 'external' ? r.url : null) }}
            fields={[{ name: 'label', label: '사이트 이름', type: 'text', required: true }, ...linkFields({ allowNone: false })]}
          />
        </section>
      ) : null}

      {tab === 'sns' ? (
        <section className="adm-card">
          <div className="adm-card-head"><h3>SNS</h3><p>아이콘 버튼으로 표시되며 항상 새 창으로 열립니다.</p></div>
          <CollectionEditor
            key="sns"
            table="menu_items"
            filter={{ location: 'sns', parent_id: null }}
            defaults={{ link_type: 'external', new_tab: true, icon: 'youtube' }}
            itemLabel="SNS"
            addLabel="SNS 추가"
            display={{ title: (r) => r.label, sub: (r) => r.url, badges: (r) => [{ text: SNS_LABEL[r.icon] || r.icon, tone: 'green' }], link: (r) => r.url }}
            fields={[
              { name: 'icon', label: '아이콘', type: 'select', options: SNS, default: 'youtube', half: true },
              { name: 'label', label: '이름 (마우스 오버 시 표시)', type: 'text', required: true, half: true, placeholder: 'HTU 유튜브' },
              { name: 'url', label: '주소', type: 'url', required: true, placeholder: 'https://' },
            ]}
          />
        </section>
      ) : null}

      {tab === 'policy' ? (
        <section className="adm-card">
          <div className="adm-card-head"><h3>정책 링크</h3><p>푸터 맨 아래 줄에 표시됩니다. 첫 번째 항목은 강조 색상으로 표시됩니다 (개인정보처리방침 권장).</p></div>
          <CollectionEditor
            key="policy"
            table="menu_items"
            filter={{ location: 'policy', parent_id: null }}
            defaults={{ link_type: 'internal' }}
            itemLabel="정책 링크"
            addLabel="링크 추가"
            display={{ title: (r) => r.label, sub: linkSub }}
            fields={[{ name: 'label', label: '이름', type: 'text', required: true }, ...linkFields({ allowNone: false })]}
          />
        </section>
      ) : null}
    </>
  );
}
