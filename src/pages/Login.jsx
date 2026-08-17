import { useState } from 'react';
import * as I from 'lucide-react';
import Button from '../components/Button';
import Field from '../components/Field';
import Logo from '../components/Logo';
import AuthShell from './AuthShell';

export default function Login({ go, users, setUser, setAdmin, toast }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const login = () => {
    if (!email || !password) return toast('Please enter your email and password.');
    if (email === 'nexaowner@nexa.com' && password === 'admin') {
      setAdmin(true);
      go('admin');
      return;
    }
    let found = users.find(x => x.email.toLowerCase() === email.toLowerCase());
    if (!found) return toast("We couldn't find an account with that email.");
    if (found.status !== 'ACTIVE') return toast(`Your account is ${found.status.toLowerCase()}. Please wait for an administrator.`);
    setUser(found);
    go('dashboard');
  };

  return (
    <AuthShell title="Welcome back" sub="Sign in to your NEXA banking space.">
      <Field label="Email address" value={email} onChange={e => setEmail(e.target.value)} />
      <Field label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <div className="check">
        <label><input type="checkbox" /> Remember me</label>
        <button type="button">Forgot password?</button>
      </div>
      <Button onClick={login} className="full">Sign in <I.ArrowRight /></Button>
      <p className="form-foot">
        New to NEXA? <button type="button" onClick={() => go('register')}>Open an account</button>
      </p>
    </AuthShell>
  );
}
