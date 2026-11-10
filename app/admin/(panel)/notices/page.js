'use client';
import PageHead from '@/components/admin/PageHead';
import CollectionEditor from '@/components/admin/CollectionEditor';

export default function NoticesPage() {
  return (
    <>
      <PageHead title="공지사항" desc="/notice 페이지에 게시됩니다. '상단 고정'을 켠 글은 목록 맨 위에 표시됩니다.">
        <a className="adm-btn" href="/notice" target="_blank" rel="noreferrer">공지사항 페이지 ↗</a>
      </PageHead>
      <section className="adm-card">
        <CollectionEditor
          table="notices"
          wide
          sortable={false}
          orderBy={[{ col: 'pinned', asc: false }, { col: 'published_at', asc: false }]}
          itemLabel="공지"
          addLabel="공지 작성"
          display={{
            title: (r) => r.title,
            sub: (r) => `${new Date(r.published_at).toLocaleDateString('ko-KR')} · 조회 ${r.view_count || 0}`,
            badges: (r) => (r.pinned ? [{ text: '상단 고정', tone: 'green' }] : []),
            link: (r) => `/notice/${r.id}`,
          }}
          fields={[
            { name: 'title', label: '제목', type: 'text', required: true },
            { name: 'pinned', label: '상단 고정', type: 'checkbox', switchLabel: '목록 맨 위에 고정', half: true },
            { name: 'published_at', label: '게시일', type: 'datetime', default: () => new Date().toISOString(), half: true },
            { name: 'content_html', label: '내용', type: 'richtext', folder: 'notices' },
          ]}
        />
      </section>
    </>
  );
}
