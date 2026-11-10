'use client';
import PageHead from '@/components/admin/PageHead';
import SettingsForm from '@/components/admin/SettingsForm';
import CollectionEditor from '@/components/admin/CollectionEditor';

const TYPES = [
  { value: 'vimeo', label: 'Vimeo 영상' },
  { value: 'local-video', label: 'mp4 영상' },
  { value: 'image', label: '이미지만' },
];
const TYPE_LABEL = { vimeo: 'Vimeo', 'local-video': 'mp4', image: '이미지' };

export default function IntroPage() {
  return (
    <>
      <PageHead
        title="⓪ 인트로 영상"
        desc="홈페이지 맨 위 전체화면 영상 슬라이더입니다. 영상은 무음 자동재생되며, 영상이 뜨기 전까지 포스터 이미지가 보입니다."
      />
      <SettingsForm keys={['intro']} compact />
      <section className="adm-card">
        <CollectionEditor
          table="intro_slides"
          defaults={{ media_type: 'vimeo' }}
          itemLabel="인트로 슬라이드"
          addLabel="슬라이드 추가"
          display={{
            title: (r) => (r.title || '').replace(/\n/g, ' '),
            sub: (r) => (r.media_type === 'local-video' ? r.video_url : r.media_type === 'vimeo' ? r.vimeo_url : r.poster_url),
            thumb: (r) => r.poster_url,
            thumbShape: 'wide',
            badges: (r) => [{ text: TYPE_LABEL[r.media_type] || r.media_type, tone: r.media_type === 'image' ? '' : 'green' }],
            link: (r) => (r.media_type === 'vimeo' ? r.vimeo_url : null),
          }}
          fields={[
            { name: 'eyebrow', label: '상단 작은 문구', type: 'text', placeholder: 'HTU GLOBAL HOLDINGS' },
            { name: 'title', label: '큰 제목', type: 'lite', rows: 2, required: true },
            { name: 'media_type', label: '배경 종류', type: 'radio', options: TYPES, default: 'vimeo' },
            {
              name: 'vimeo_url', label: 'Vimeo 주소', type: 'url', required: true,
              placeholder: 'https://vimeo.com/1172820402', help: 'vimeo.com 주소 또는 숫자 ID만 넣어도 됩니다.',
              showIf: (f) => f.media_type === 'vimeo',
            },
            {
              name: 'video_url', label: 'mp4 영상', type: 'video', folder: 'intro', required: true,
              help: '직접 업로드(50MB 이하) 또는 기존 사이트 경로(./video/htu-001.mp4) 입력',
              showIf: (f) => f.media_type === 'local-video',
            },
            {
              name: 'poster_url', label: '포스터 이미지', type: 'image', folder: 'intro',
              help: '영상 로딩 전에 보이는 이미지 (1920×1080 권장). 이미지만 모드에서는 배경이 됩니다.',
            },
          ]}
        />
      </section>
    </>
  );
}
