export default function Button({ children, variant = '', className = '', ...p }) {
  return <button className={'btn ' + variant + (className ? ' ' + className : '')} {...p}>{children}</button>;
}
