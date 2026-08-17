import * as I from 'lucide-react';

export default function Field({ label, select, options, ...p }) {
  return (
    <label className="field">
      {label}
      {select ? (
        <select {...p}>
          {Object.entries(options).map(([k, v]) => (
            <option key={k} value={k}>{v.flag} {v.name} — {v.currency}</option>
          ))}
        </select>
      ) : (
        <input {...p} />
      )}
    </label>
  );
}
