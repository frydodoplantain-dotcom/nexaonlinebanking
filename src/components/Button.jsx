export default function Button({ children, variant = '', ...p }) {
  return <button className={'btn ' + variant} {...p}>{children}</button>;
}
