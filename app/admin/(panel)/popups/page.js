'use client';
import PageHead from '@/components/admin/PageHead';
import CollectionEditor from '@/components/admin/CollectionEditor';

const period = (r) => {
  const f = (d) => (d ? new Date(d).toLocaleDateString('ko-KR') : '');
  if (!r.starts_at && !r.ends_at) return '기간 제한 없음';
  return `${f(r.starts_at) || '즉시'} ~ ${f(r.ends_at) || '계속'}`;
};

export default function PopupsPage() {
  return (
    <>
      <PageHead title="메인 팝업" desc="홈페이지 접속 시 뜨는 레이어 팝업입니다. 여러 개를 동시에 띄울 수 있고, 방문자는 '오늘 하루 보지 않기'를 선택할 수 있습니다." />
      <section className="adm-card">
        <CollectionEditor
          table="popups"
          defaults={{ active: false, link_new_tab: true, link_label: '자세히 보기' }}
          itemLabel="팝업"
          addLabel="팝업 추가"
          display={{
            title: (r) => r.title,
            sub: period,
            thumb: (r) => r.image_url,
            thumbShape: 'cover',
            badges: (r) => {
              const now = Date.now();
              if (r.ends_at && new Date(r.ends_at).getTime() < now) return [{ text: '기간 종료', tone: 'warn' }];
              if (r.starts_at && new Date(r.starts_at).getTime() > now) return [{ text: '예약', tone: 'blue' }];
              return [];
            },
          }}
          fields={[
            { name: 'title', label: '팝업 제목', type: 'text', required: true },
            { name: 'image_url', label: '팝업 이미지', type: 'image', folder: 'popups', help: '이미지만 있는 팝업도 가능합니다. (가로 800px 권장)' },
            { name: 'body', label: '팝업 문구', type: 'lite', rows: 4 },
            { name: 'link_url', label: '링크 주소', type: 'url', half: true, placeholder: 'https:// 또는 /notice/...' },
            { name: 'link_label', label: '링크 버튼 문구', type: 'text', half: true },
            { name: 'link_new_tab', label: '새 창으로 열기', type: 'checkbox', switchLabel: '새 창', half: true },
            { section: '게시 기간 (비우면 제한 없음)', name: '_s' },
            { name: 'starts_at', label: '시작', type: 'datetime', half: true },
            { name: 'ends_at', label: '종료', type: 'datetime', half: true },
          ]}
        />
      </section>
    </>
  );
}
