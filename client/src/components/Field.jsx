export default function Field({ label, select, options, children, ...p }) {
  return (
    <label className="field">
      {label}
      {select ? (
        <select {...p}>
          {options
            ? Object.entries(options).map(([k, v]) => (
                <option key={k} value={k}>{v.flag ? `${v.flag} ${v.name}` : v}</option>
              ))
            : children}
        </select>
      ) : children ? children : (
        <input {...p} />
      )}
    </label>
  );
}
