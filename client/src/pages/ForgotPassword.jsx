import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Field from '../components/Field';
import AuthShell from './AuthShell';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const { toast } = useToast();
  const nav = useNavigate();

  const submit = async () => {
    try {
      const res = await api.auth.forgotPassword(email);
      toast(res.message);
      if (res.resetToken) setToken(res.resetToken);
    } catch (e) {
      toast(e.message);
    }
  };

  return (
    <AuthShell title="Reset your password" sub="Enter your email to receive a reset token.">
      <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Button className="full" onClick={submit}>Send reset instructions</Button>
      {token && (
        <div className="currency-note" style={{ marginTop: 16 }}>
          Reset token (use on the next screen): <strong>{token}</strong>
          <Button className="full" style={{ marginTop: 12 }} onClick={() => nav('/reset-password?token=' + token)}>Continue to reset</Button>
        </div>
      )}
      <p className="form-foot"><button type="button" onClick={() => nav('/login')}>Back to sign in</button></p>
    </AuthShell>
  );
}
