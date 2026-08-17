export default function Status({ children }) {
  return <span className={'status ' + String(children).toLowerCase().replace(/ /g, '-')}>{children}</span>;
}
