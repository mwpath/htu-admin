'use client';
import PageHead from '@/components/admin/PageHead';
import SettingsForm from '@/components/admin/SettingsForm';
import MenuTree from '@/components/admin/MenuTree';

export default function MenuPage() {
  return (
    <>
      <PageHead
        title="헤더 메뉴"
        desc="사이트 상단 메뉴입니다. 상위 메뉴에 마우스를 올리면 하위 메뉴가 드롭다운으로 열리고, 모바일에서는 햄버거 메뉴로 표시됩니다."
      />
      <SettingsForm keys={['header']} compact />
      <SettingsForm keys={['i18n']} compact only={{ i18n: ['__langs', 'detect'] }} titles={{ i18n: '언어 선택 메뉴 (헤더 🌐)' }} />
      <MenuTree
        location="header"
        topLabel="상위 메뉴"
        subLabel="하위 메뉴"
        hint="'링크 없음'으로 두면 클릭 대신 하위 메뉴만 펼쳐집니다. '강조 버튼'을 켜면 오른쪽 끝에 버튼(예: 문의하기)으로 표시됩니다."
        topExtraFields={[{ name: 'highlight', label: '강조 버튼', type: 'checkbox', switchLabel: '오른쪽 버튼으로 표시', half: true }]}
      />
    </>
  );
}
