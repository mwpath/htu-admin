'use client';
import PageHead from '@/components/admin/PageHead';
import CollectionEditor from '@/components/admin/CollectionEditor';
import { useSiteBase } from '@/lib/use-site-base';

function statusOf(r) {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const d = (v) => (v ? new Date(v + 'T00:00:00') : null);
  const s0 = d(r.start_date), s1 = d(r.end_date) || s0;
  if (s0 && t < s0) return { text: '예정', tone: 'blue' };
  if (s1 && t > s1) return { text: '종료', tone: 'warn' };
  return { text: '진행중', tone: 'green' };
}

export default function EventsPage() {
  const site = useSiteBase();
  return (
    <>
      <PageHead title="이벤트" desc="기존 사이트의 event.html 에 게시됩니다. 기간에 따라 진행중·예정·종료가 자동 표시되고, 종료된 이벤트는 신청 버튼이 자동으로 마감 처리됩니다.">
        {site ? <a className="adm-btn" href={`${site}/event.html`} target="_blank" rel="noreferrer">이벤트 페이지 ↗</a> : null}
      </PageHead>
      <section className="adm-card">
        <CollectionEditor
          table="events"
          wide
          addPosition="top"
          defaults={{ link_type: 'internal', apply_label: '신청하기', attachments: [] }}
          itemLabel="이벤트"
          addLabel="이벤트 등록"
          display={{
            title: (r) => r.title,
            sub: (r) => [r.start_date && `${r.start_date}${r.end_date && r.end_date !== r.start_date ? ' ~ ' + r.end_date : ''}`, r.location, `조회 ${r.view_count || 0}`].filter(Boolean).join(' · '),
            thumb: (r) => r.thumbnail_url,
            thumbShape: 'wide',
            badges: (r) => [statusOf(r), ...(r.link_type === 'external' ? [{ text: '외부 링크 ↗' }] : []), ...(r.seo_path ? [{ text: '검색 페이지 ✓', tone: 'blue' }] : [])],
            link: (r) => (r.link_type === 'external' ? r.external_url : site ? (r.seo_path ? `${site}/${r.seo_path}` : `${site}/event.html?id=${r.id}`) : null),
          }}
          fields={[
            {
              name: 'link_type', label: '게시 방식', type: 'radio', default: 'internal',
              options: [{ value: 'internal', label: '✎ 직접 작성' }, { value: 'external', label: '↗ 외부 페이지로 연결' }],
            },
            { name: 'title', label: '이벤트명', type: 'text', required: true },
            { name: 'summary', label: '요약 (목록 카드)', type: 'textarea', rows: 2 },
            { name: 'thumbnail_url', label: '썸네일 이미지', type: 'image', folder: 'events', help: '목록 카드 · 메인 · 검색 결과 · SNS 공유 미리보기에 쓰입니다. 16:10 (예: 1600×1000) 권장' },
            { name: 'start_date', label: '시작일', type: 'date', half: true },
            { name: 'end_date', label: '종료일', type: 'date', half: true, help: '하루 행사면 비워두세요.' },
            { name: 'location', label: '장소', type: 'text', placeholder: '예) 서울 코엑스 컨퍼런스룸 / 온라인' },
            { name: 'external_url', label: '외부 페이지 주소', type: 'url', required: true, placeholder: 'https://', showIf: (f) => f.link_type === 'external' },
            { section: '신청 버튼 (선택)', name: '_s1', showIf: (f) => f.link_type !== 'external' },
            { name: 'apply_url', label: '신청 링크', type: 'url', half: true, placeholder: 'https://forms.gle/...', showIf: (f) => f.link_type !== 'external' },
            { name: 'apply_label', label: '버튼 문구', type: 'text', half: true, showIf: (f) => f.link_type !== 'external' },
            { name: 'content_html', label: '상세 내용', type: 'richtext', folder: 'events', showIf: (f) => f.link_type !== 'external' },
            { name: 'attachments', label: '첨부파일', type: 'files', folder: 'events', showIf: (f) => f.link_type !== 'external' },
            { section: '🔎 검색엔진 노출 (구글 · 네이버)', name: '_s_seo', showIf: (f) => f.link_type !== 'external' },
            { name: '_seo', type: 'seo', kind: 'event', virtual: true, showIf: (f) => f.link_type !== 'external' },
          ]}
        />
      </section>
    </>
  );
}
