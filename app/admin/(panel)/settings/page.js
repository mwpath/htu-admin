import PageHead from '@/components/admin/PageHead';
import SettingsForm from '@/components/admin/SettingsForm';

export default function SettingsPage() {
  return (
    <>
      <PageHead title="기본 설정 · 섹션 문구" desc="사이트 로고, 각 섹션 제목과 버튼 문구, 자동 넘김/랜덤 재생 옵션을 한 곳에서 수정합니다." />
      <SettingsForm />
    </>
  );
}
