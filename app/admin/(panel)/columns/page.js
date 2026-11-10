'use client';
import PageHead from '@/components/admin/PageHead';
import SettingsForm from '@/components/admin/SettingsForm';
import CollectionEditor from '@/components/admin/CollectionEditor';

export default function ColumnsPage() {
  return (
    <>
      <PageHead title="④ 전문가 연재" desc="책장 형태 카드입니다. 6개(3×2)씩 자동으로 슬라이드가 나뉩니다. PDF 링크는 구글 드라이브 공유 링크를 그대로 넣으면 됩니다." />
      <SettingsForm keys={['columns']} compact />
      <section className="adm-card">
        <CollectionEditor
          table="expert_columns"
          itemLabel="연재"
          addLabel="연재 추가"
          display={{
            title: (r) => r.card_title || r.title,
            sub: (r) => (r.subtitle || '').replace(/\n/g, ' '),
            thumb: (r) => r.image_url,
            thumbShape: 'cover',
            badges: (r) => (r.pdf_url ? [{ text: 'PDF', tone: 'green' }] : [{ text: 'PDF 없음', tone: 'warn' }]),
            link: (r) => r.pdf_url,
          }}
          fields={[
            { name: 'image_url', label: '표지 이미지', type: 'image', folder: 'columns', required: true, help: '250:356 비율 (예: 750×1068)' },
            { name: 'card_title', label: '카드에 표시할 이름', type: 'text', required: true, half: true, placeholder: '예) 김경일 교수' },
            { name: 'title', label: '팝업 제목', type: 'text', half: true, placeholder: '비우면 카드 이름 사용' },
            { name: 'subtitle', label: '팝업 부제 (연재 제목)', type: 'textarea', rows: 2 },
            { name: 'pdf_url', label: 'PDF 링크', type: 'url', placeholder: 'https://drive.google.com/file/d/.../view', help: '비우면 팝업의 PDF 버튼이 숨겨집니다.' },
          ]}
        />
      </section>
    </>
  );
}
