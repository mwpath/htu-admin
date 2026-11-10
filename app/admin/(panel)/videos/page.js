'use client';
import { useState } from 'react';
import PageHead from '@/components/admin/PageHead';
import SettingsForm from '@/components/admin/SettingsForm';
import CollectionEditor from '@/components/admin/CollectionEditor';
import Tabs from '@/components/admin/Tabs';
import { youtubeId } from '@/lib/admin-utils';

const ytThumb = (r) => {
  const id = youtubeId(r.youtube_url);
  return id ? `https://i.ytimg.com/vi/${id}/mqdefault.jpg` : '';
};

export default function VideosPage() {
  const [tab, setTab] = useState('reel');
  return (
    <>
      <PageHead title="⑤ 영상" desc="메인 오토플레이 릴(연속 자동재생)과 유튜브 갤러리(클릭 시 팝업 재생)를 관리합니다." />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'reel', label: '오토플레이 릴', hint: '자동 연속 재생 · 랜덤' },
          { value: 'gallery', label: 'YouTube Video 갤러리', hint: '팝업 재생' },
        ]}
      />
      {tab === 'reel' ? (
        <>
          <SettingsForm key="s-reel" keys={['reel']} compact />
          <section className="adm-card">
            <CollectionEditor
              key="reel"
              table="videos"
              filter={{ placement: 'reel' }}
              itemLabel="영상"
              addLabel="영상 추가"
              display={{ title: (r) => r.title || r.youtube_url, sub: (r) => (r.title ? r.youtube_url : ''), thumb: ytThumb, thumbShape: 'wide', link: (r) => r.youtube_url }}
              fields={[
                { name: 'youtube_url', label: '유튜브 주소', type: 'youtube', required: true },
                { name: 'title', label: '메모 (관리용 제목)', type: 'text' },
              ]}
            />
          </section>
        </>
      ) : (
        <>
          <SettingsForm key="s-gal" keys={['gallery']} compact />
          <section className="adm-card">
            <CollectionEditor
              key="gallery"
              table="videos"
              filter={{ placement: 'gallery' }}
              itemLabel="영상"
              addLabel="영상 추가"
              addPosition="top"
              display={{ title: (r) => r.title || r.youtube_url, sub: (r) => r.youtube_url, thumb: ytThumb, thumbShape: 'wide', link: (r) => r.youtube_url }}
              fields={[
                { name: 'youtube_url', label: '유튜브 주소', type: 'youtube', required: true },
                { name: 'title', label: '영상 제목', type: 'text' },
                { name: 'excerpt', label: '설명', type: 'textarea', rows: 3, help: "기본 설정의 '제목/설명 표시'를 켜면 썸네일 아래 노출됩니다." },
              ]}
            />
          </section>
        </>
      )}
    </>
  );
}
