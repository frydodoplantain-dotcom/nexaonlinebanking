import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as I from 'lucide-react';
import Button from '../components/Button';
import Field from '../components/Field';
import AuthShell from './AuthShell';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const { toast } = useToast();
  const nav = useNavigate();

  const submit = async () => {
    if (!email || !password) return toast('Please enter your email and password.');
    try {
      const user = await login(email, password);
      nav(user.role === 'ADMIN' ? '/admin' : '/app/dashboard');
    } catch (e) {
      toast(e.message);
    }
  };

  return (
    <AuthShell title="Welcome back" sub="Sign in to your NEXA banking space.">
      <Field label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Field label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <div className="check">
        <label><input type="checkbox" /> Remember me</label>
        <button type="button" onClick={() => nav('/forgot-password')}>Forgot password?</button>
      </div>
      <Button onClick={submit} className="full">Sign in <I.ArrowRight /></Button>
      <p className="form-foot">
        New to NEXA? <button type="button" onClick={() => nav('/register')}>Open an account</button>
      </p>
    </AuthShell>
  );
}
