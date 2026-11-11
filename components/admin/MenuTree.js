'use client';
import { useState } from 'react';
import CollectionEditor from './CollectionEditor';
import Tabs from './Tabs';
import { linkFields, linkSub } from './link-options';

/** 2단 메뉴 편집기: 1단(상위) 목록 + 선택한 상위의 하위 목록 */
export default function MenuTree({ location, topLabel, subLabel, topExtraFields = [], topDefaults = {}, subDefaults = {}, hint }) {
  const [tops, setTops] = useState([]);
  const [sel, setSel] = useState(null);
  const current = tops.find((t) => t.id === sel) || tops[0];

  return (
    <>
      <section className="adm-card">
        <div className="adm-card-head">
          <h3>{topLabel}</h3>
          {hint ? <p>{hint}</p> : null}
        </div>
        <CollectionEditor
          table="menu_items"
          filter={{ location, parent_id: null }}
          defaults={{ link_type: 'internal', ...topDefaults }}
          itemLabel={topLabel}
          addLabel={`${topLabel} 추가`}
          onRowsChange={setTops}
          display={{
            title: (r) => r.label,
            sub: linkSub,
            badges: (r) => (r.highlight ? [{ text: '강조 버튼', tone: 'green' }] : []),
          }}
          fields={[{ name: 'label', label: '메뉴 이름', type: 'text', required: true }, ...linkFields(), ...topExtraFields]}
        />
      </section>

      {tops.length ? (
        <section className="adm-card">
          <div className="adm-card-head">
            <h3>{subLabel}</h3>
            <p>상위 메뉴를 선택한 뒤 하위 메뉴를 추가하세요. 하위 메뉴가 없으면 상위 메뉴만 표시됩니다.</p>
          </div>
          <Tabs value={current?.id} onChange={setSel} tabs={tops.map((t) => ({ value: t.id, label: t.label || '(이름 없음)', hint: t.active ? '' : '숨김' }))} />
          {current ? (
            <CollectionEditor
              key={current.id}
              table="menu_items"
              filter={{ location, parent_id: current.id }}
              defaults={{ link_type: 'internal', ...subDefaults }}
              itemLabel={subLabel}
              addLabel={`'${current.label}' 하위 메뉴 추가`}
              emptyText="하위 메뉴가 없습니다."
              display={{ title: (r) => r.label, sub: linkSub }}
              fields={[{ name: 'label', label: '메뉴 이름', type: 'text', required: true }, ...linkFields({ allowNone: false })]}
            />
          ) : null}
        </section>
      ) : null}
    </>
  );
}
