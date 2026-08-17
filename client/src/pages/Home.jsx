import { useNavigate } from 'react-router-dom';
import * as I from 'lucide-react';
import Button from '../components/Button';
import Logo from '../components/Logo';

export default function Home() {
  const nav = useNavigate();
  return (
    <>
      <header className="public-header">
        <Logo />
        <nav>
          <a href="#features">Features</a>
          <a href="#security">Security</a>
          <Button variant="ghost" onClick={() => nav('/login')}>Sign in</Button>
          <Button onClick={() => nav('/register')}>Open an account</Button>
        </nav>
      </header>
      <main className="home">
        <section className="hero">
          <div>
            <p className="eyebrow">GLOBAL BANKING, REIMAGINED</p>
            <h1>Banking made <em>simpler.</em></h1>
            <p className="lead">A clearer way to manage money, grow savings, and move confidently across borders — all in one secure platform.</p>
            <div className="actions">
              <Button onClick={() => nav('/register')}>Open an account <I.ArrowRight /></Button>
              <Button variant="light" onClick={() => nav('/login')}>Sign in</Button>
            </div>
            <p className="sandbox">NEXA Microfinance Bank — secure digital banking</p>
          </div>
          <div className="hero-card">
            <div className="mini-top"><Logo /><I.Bell /></div>
            <p>Available balance</p>
            <h2>Your NEXA account</h2>
            <small>Open an account to get started</small>
            <div className="mini-graph"></div>
            <div className="mini-actions">
              <span><I.Send />Send</span>
              <span><I.Download />Receive</span>
              <span><I.CreditCard />Cards</span>
            </div>
          </div>
        </section>
        <section id="features" className="feature-section">
          <p className="eyebrow blue">DESIGNED FOR EVERYDAY CONFIDENCE</p>
          <h2>Everything you need, thoughtfully connected.</h2>
          <div className="feature-grid">
            {[
              [I.Globe2, 'Multi-country banking', 'Local currency formatting and country-aware account details.'],
              [I.ArrowLeftRight, 'Simple transfers', 'Move money inside the NEXA platform with transparent reviews.'],
              [I.ShieldCheck, 'Security by design', 'Role-aware access, account review, and traceable activity.'],
              [I.ChartNoAxesCombined, 'Markets at a glance', 'Track crypto markets with a clean, focused dashboard.'],
            ].map(([Icon, t, d]) => (
              <article key={t}><Icon /><h3>{t}</h3><p>{d}</p></article>
            ))}
          </div>
        </section>
        <section id="security" className="security">
          <I.LockKeyhole />
          <div>
            <p className="eyebrow">YOUR PEACE OF MIND</p>
            <h2>Built around clarity, control, and trust.</h2>
            <p>NEXA's platform is designed with security and clarity in mind, providing modern digital banking workflows in a controlled environment.</p>
          </div>
        </section>
      </main>
      <footer>© 2026 NEXA Microfinance Bank <span>•</span> About <span>•</span> Security <span>•</span> Support <span>•</span> Privacy</footer>
    </>
  );
}
