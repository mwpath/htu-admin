export default function PageHead({ title, desc, children }) {
  return (
    <header className="adm-page-head">
      <div>
        <h1>{title}</h1>
        {desc ? <p>{desc}</p> : null}
      </div>
      {children ? <div className="adm-row-gap">{children}</div> : null}
    </header>
  );
}
