'use client';
import PageHead from '@/components/admin/PageHead';
import CollectionEditor from '@/components/admin/CollectionEditor';
import { useSiteBase } from '@/lib/use-site-base';

export default function NoticesPage() {
  const site = useSiteBase();
  return (
    <>
      <PageHead title="공지사항" desc="기존 사이트의 notice.html 페이지에 게시됩니다. '상단 고정'을 켠 글은 목록 맨 위에 표시됩니다.">
        {site ? <a className="adm-btn" href={`${site}/notice.html`} target="_blank" rel="noreferrer">공지사항 페이지 ↗</a> : null}
      </PageHead>
      <section className="adm-card">
        <CollectionEditor
          table="notices"
          wide
          sortable={false}
          defaults={{ attachments: [] }}
          orderBy={[{ col: 'pinned', asc: false }, { col: 'published_at', asc: false }]}
          itemLabel="공지"
          addLabel="공지 작성"
          display={{
            title: (r) => r.title,
            sub: (r) => `${new Date(r.published_at).toLocaleDateString('ko-KR')} · 조회 ${r.view_count || 0}`,
            badges: (r) => (r.pinned ? [{ text: '상단 고정', tone: 'green' }] : []),
            link: (r) => (site ? `${site}/notice.html?id=${r.id}` : null),
          }}
          fields={[
            { name: 'title', label: '제목', type: 'text', required: true },
            { name: 'pinned', label: '상단 고정', type: 'checkbox', switchLabel: '목록 맨 위에 고정', half: true },
            { name: 'published_at', label: '게시일', type: 'datetime', default: () => new Date().toISOString(), half: true },
            { name: 'content_html', label: '내용', type: 'richtext', folder: 'notices' },
            { name: 'attachments', label: '첨부파일', type: 'files', folder: 'notices' },
          ]}
        />
      </section>
    </>
  );
}
