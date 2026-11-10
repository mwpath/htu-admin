'use client';
import PageHead from '@/components/admin/PageHead';
import SettingsForm from '@/components/admin/SettingsForm';
import CollectionEditor from '@/components/admin/CollectionEditor';

export default function PublicationsPage() {
  return (
    <>
      <PageHead title="③ 정기 출간물" desc="표지 이미지·이름·링크를 수정합니다. 클릭 동작(링크/팝업)에 맞춰 카드에 고급 인디케이터 아이콘이 자동 표시됩니다." />
      <SettingsForm keys={['publications']} compact />
      <section className="adm-card">
        <CollectionEditor
          table="publications"
          defaults={{ action: 'link', image_border: 'none' }}
          itemLabel="출간물"
          addLabel="출간물 추가"
          display={{
            title: (r) => r.caption,
            sub: (r) => r.link_url,
            thumb: (r) => r.cover_url,
            thumbShape: 'cover',
            badges: (r) => [r.action === 'popup' ? { text: '＋ 팝업', tone: 'green' } : r.action === 'link' ? { text: '↗ 링크', tone: 'blue' } : { text: '클릭 없음' }],
            link: (r) => r.link_url,
          }}
          fields={[
            { name: 'cover_url', label: '표지 / 로고 이미지', type: 'image', folder: 'publications', required: true, help: '세로 3:4 비율 권장 (예: 900×1200)' },
            { name: 'caption', label: '이름 (카드 하단 문구)', type: 'text', required: true, half: true },
            {
              name: 'image_border', label: '이미지 테두리', type: 'select', half: true,
              options: [{ value: 'none', label: '없음' }, { value: 'dark', label: '얇은 어두운 선 (밝은 표지용)' }, { value: 'light', label: '얇은 밝은 선 (어두운 표지용)' }],
            },
            {
              name: 'action', label: '클릭 동작', type: 'radio', default: 'link',
              options: [{ value: 'link', label: '링크로 이동' }, { value: 'popup', label: '팝업으로 소개' }, { value: 'none', label: '클릭 없음' }],
            },
            { name: 'link_url', label: '링크 주소', type: 'url', placeholder: 'https://', help: '팝업 모드에서는 팝업 안 버튼의 링크가 됩니다.' },
            { section: '팝업 내용', name: '_s', showIf: (f) => f.action === 'popup' },
            { name: 'popup_title', label: '팝업 제목', type: 'text', half: true, showIf: (f) => f.action === 'popup' },
            { name: 'button_label', label: '팝업 버튼 문구', type: 'text', half: true, placeholder: '홈페이지 바로가기', showIf: (f) => f.action === 'popup' },
            { name: 'popup_desc', label: '팝업 소개 문구', type: 'textarea', rows: 6, showIf: (f) => f.action === 'popup' },
          ]}
        />
      </section>
    </>
  );
}
