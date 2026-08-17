import * as I from 'lucide-react';
import Logo from '../components/Logo';

export default function AuthShell({ title, sub, children }) {
  return (
    <main className="auth">
      <aside>
        <Logo />
        <div>
          <p className="eyebrow">NEXA DIGITAL BANKING</p>
          <h1>Banking that moves with <em>you.</em></h1>
          <p>Manage your money with a premium, global perspective.</p>
        </div>
        <small>NEXA Microfinance Bank · Secure digital banking</small>
      </aside>
      <section className="auth-form">
        <Logo />
        <div>
          <h2>{title}</h2>
          <p>{sub}</p>
        </div>
        {children}
      </section>
    </main>
  );
}
