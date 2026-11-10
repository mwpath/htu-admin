'use client';
import PageHead from '@/components/admin/PageHead';
import SettingsForm from '@/components/admin/SettingsForm';
import CollectionEditor from '@/components/admin/CollectionEditor';

const isInternal = (f) => f.type === 'internal';

export default function NewsPage() {
  return (
    <>
      <PageHead
        title="⑥ News & Event"
        desc="외부 기사 링크로 바로 연결하거나, 이곳에서 직접 글을 작성(내부 글)할 수 있습니다. 내부 글은 /news/글번호 페이지로 열립니다."
      />
      <SettingsForm keys={['news']} compact />
      <section className="adm-card">
        <CollectionEditor
          table="news"
          wide
          addPosition="top"
          defaults={{ type: 'internal' }}
          itemLabel="게시물"
          addLabel="게시물 추가"
          display={{
            title: (r) => r.title,
            sub: (r) => `${new Date(r.published_at).toLocaleDateString('ko-KR')} · ${r.type === 'internal' ? `조회 ${r.view_count || 0}` : r.external_url || ''}`,
            thumb: (r) => r.thumbnail_url,
            thumbShape: 'wide',
            badges: (r) => [r.type === 'internal' ? { text: '내부 글', tone: 'green' } : { text: '외부 링크 ↗', tone: 'blue' }],
            link: (r) => (r.type === 'internal' ? `/news/${r.id}` : r.external_url),
          }}
          fields={[
            {
              name: 'type', label: '게시 방식', type: 'radio', default: 'internal',
              options: [{ value: 'internal', label: '✎ 직접 작성 (내부 글)' }, { value: 'external', label: '↗ 외부 링크로 연결' }],
            },
            { name: 'title', label: '제목', type: 'text', required: true },
            { name: 'excerpt', label: '요약 (카드에 3줄 표시)', type: 'textarea', rows: 3 },
            { name: 'thumbnail_url', label: '썸네일 이미지', type: 'image', folder: 'news', help: '16:9 비율 권장. 내부 글에서는 본문 상단 대표 이미지로도 사용됩니다.' },
            { name: 'external_url', label: '외부 기사 주소', type: 'url', required: true, placeholder: 'https://', showIf: (f) => f.type === 'external' },
            { name: 'content_html', label: '본문', type: 'richtext', folder: 'news', showIf: isInternal },
            { name: 'published_at', label: '게시일', type: 'datetime', default: () => new Date().toISOString(), half: true },
          ]}
        />
      </section>
    </>
  );
}
