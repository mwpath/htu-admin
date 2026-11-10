'use client';
import { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { previewUrl, uploadFile, youtubeId, toast, errMsg, toLocalInput, fromLocalInput } from '@/lib/admin-utils';

const RichEditor = dynamic(() => import('./RichEditor'), { ssr: false });

function ImageField({ value, onChange, folder }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);

  const upload = async (file) => {
    if (!file) return;
    if (!/^image\//.test(file.type)) return toast('이미지 파일만 업로드할 수 있습니다.', 'err');
    setBusy(true);
    try {
      onChange(await uploadFile(file, folder));
      toast('이미지를 업로드했습니다.');
    } catch (e) {
      toast(errMsg(e), 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={`adm-image ${drag ? 'is-drag' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        upload(e.dataTransfer.files?.[0]);
      }}
    >
      <div className="adm-image-preview" onClick={() => ref.current?.click()}>
        {value ? <img src={previewUrl(value)} alt="" /> : <span>클릭 또는 드래그하여<br />이미지 업로드</span>}
        {busy ? <div className="adm-image-busy">업로드 중…</div> : null}
      </div>
      <div className="adm-image-side">
        <input className="adm-input" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="이미지 URL 직접 입력 가능" />
        <div className="adm-row-gap">
          <button type="button" className="adm-btn sm" onClick={() => ref.current?.click()} disabled={busy}>
            파일 선택
          </button>
          {value ? (
            <button type="button" className="adm-btn sm ghost" onClick={() => onChange('')}>
              비우기
            </button>
          ) : null}
        </div>
      </div>
      <input ref={ref} type="file" accept="image/*" hidden onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />
    </div>
  );
}

function YoutubeField({ value, onChange }) {
  const id = youtubeId(value);
  return (
    <div className="adm-yt">
      <input className="adm-input" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="https://youtu.be/... 또는 watch?v=... / shorts 모두 가능" />
      {value ? (
        id ? (
          <img className="adm-yt-thumb" src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" />
        ) : (
          <p className="adm-help err">유튜브 주소를 인식하지 못했습니다.</p>
        )
      ) : null}
    </div>
  );
}

function Switch({ checked, onChange, label }) {
  return (
    <label className="adm-switch">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="adm-switch-ui" />
      {label ? <span className="adm-switch-label">{label}</span> : null}
    </label>
  );
}
export { Switch };

export default function Field({ field, value, onChange, form }) {
  const f = field;
  let input;
  switch (f.type) {
    case 'textarea':
    case 'lite':
      input = (
        <textarea className="adm-input" rows={f.rows || 4} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={f.placeholder} />
      );
      break;
    case 'number':
      input = (
        <input className="adm-input" type="number" value={value ?? ''} step={f.step} min={f.min}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} placeholder={f.placeholder} />
      );
      break;
    case 'checkbox':
      input = <Switch checked={value} onChange={onChange} label={f.switchLabel} />;
      break;
    case 'select': {
      const opts = typeof f.options === 'function' ? f.options(form) : f.options || [];
      input = (
        <select className="adm-input" value={value ?? ''} onChange={(e) => onChange(e.target.value === '' && f.nullable ? null : e.target.value)}>
          {f.nullable ? <option value="">{f.nullLabel || '— 선택 안 함 —'}</option> : null}
          {opts.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      );
      break;
    }
    case 'radio': {
      const opts = f.options || [];
      input = (
        <div className="adm-seg">
          {opts.map((o) => (
            <button key={o.value} type="button" className={value === o.value ? 'is-on' : ''} onClick={() => onChange(o.value)}>
              {o.label}
            </button>
          ))}
        </div>
      );
      break;
    }
    case 'image':
      input = <ImageField value={value} onChange={onChange} folder={f.folder} />;
      break;
    case 'youtube':
      input = <YoutubeField value={value} onChange={onChange} />;
      break;
    case 'tags':
      input = (
        <textarea className="adm-input" rows={f.rows || 3} value={(value || []).join('\n')}
          onChange={(e) => onChange(e.target.value.split('\n'))} placeholder="한 줄에 하나씩 입력" />
      );
      break;
    case 'datetime':
      input = <input className="adm-input" type="datetime-local" value={toLocalInput(value)} onChange={(e) => onChange(fromLocalInput(e.target.value))} />;
      break;
    case 'richtext':
      input = <RichEditor value={value} onChange={onChange} folder={f.folder} />;
      break;
    default:
      input = (
        <input className="adm-input" type={f.type === 'url' ? 'url' : 'text'} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={f.placeholder} />
      );
  }

  return (
    <div className={`adm-field ${f.half ? 'half' : ''} ${f.type === 'richtext' ? 'full' : ''}`}>
      {f.label ? <label className="adm-label">{f.label}{f.required ? <em>*</em> : null}</label> : null}
      {input}
      {f.type === 'lite' && !f.help ? <p className="adm-help">줄바꿈은 그대로 반영됩니다. &lt;b&gt;굵게&lt;/b&gt;, &lt;u&gt;밑줄&lt;/u&gt; 태그 사용 가능</p> : null}
      {f.help ? <p className="adm-help">{f.help}</p> : null}
    </div>
  );
}

// 저장 직전 값 정리
export function cleanValue(field, v) {
  if (field.type === 'tags') return (v || []).map((s) => String(s).trim()).filter(Boolean);
  if (field.type === 'number') return v === '' || v == null ? null : Number(v);
  if (field.type === 'checkbox') return !!v;
  if (typeof v === 'string' && field.type !== 'richtext' && field.type !== 'lite' && field.type !== 'textarea') return v.trim();
  return v ?? null;
}
