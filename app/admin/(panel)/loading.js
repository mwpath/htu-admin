// 메뉴를 누르면 즉시 보이는 로딩 화면 (서버 응답을 기다리는 동안)
export default function Loading() {
  return (
    <div className="adm-loading" aria-busy="true" aria-live="polite">
      <div className="adm-skel h" /><div className="adm-skel" /><div className="adm-skel" /><div className="adm-skel short" />
    </div>
  );
}
