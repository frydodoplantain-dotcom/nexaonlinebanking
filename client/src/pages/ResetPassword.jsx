import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../components/Button';
import Field from '../components/Field';
import AuthShell from './AuthShell';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const [token, setToken] = useState(params.get('token') || '');
  const [password, setPassword] = useState('');
  const { toast } = useToast();
  const nav = useNavigate();

  const submit = async () => {
    try {
      await api.auth.resetPassword({ token, password });
      toast('Password reset successfully.');
      nav('/login');
    } catch (e) {
      toast(e.message);
    }
  };

  return (
    <AuthShell title="Set a new password" sub="Enter your reset token and a new password.">
      <Field label="Reset token" value={token} onChange={(e) => setToken(e.target.value)} />
      <Field label="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <Button className="full" onClick={submit}>Reset password</Button>
    </AuthShell>
  );
}
