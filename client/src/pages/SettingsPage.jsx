import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Field from '../components/Field';
import PageIntro from '../components/PageIntro';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function SettingsPage() {
  const { user, refresh, logout } = useAuth();
  const [form, setForm] = useState({ ...user?.profile });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [pin, setPin] = useState({ currentPin: '', newPin: '' });
  const { toast } = useToast();
  const nav = useNavigate();
  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const save = async () => {
    try {
      await api.customer.updateProfile(form);
      await refresh();
      toast('Profile updated.');
    } catch (e) { toast(e.message); }
  };

  const photo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await api.customer.uploadPhoto(file);
      await refresh();
      toast('Photo updated.');
    } catch (err) { toast(err.message); }
  };

  return (
    <>
      <PageIntro title="Profile & settings" text="Keep your personal details and security up to date." />
      <section className="panel">
        <label className="upload">
          <input type="file" accept="image/*" onChange={photo} style={{ display: 'none' }} />
          {user?.profile?.photoPath ? <img src={user.profile.photoPath} alt="" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} /> : 'Upload photo'}
        </label>
        <div className="settings-grid">
          <Field label="First name" name="firstName" value={form.firstName || ''} onChange={update} />
          <Field label="Last name" name="lastName" value={form.lastName || ''} onChange={update} />
          <Field label="Phone" name="phone" value={form.phone || ''} onChange={update} />
          <Field label="City" name="city" value={form.city || ''} onChange={update} />
          <Field label="Address" name="address" value={form.address || ''} onChange={update} />
        </div>
        <Button onClick={save}>Save changes</Button>
      </section>
      <section className="panel">
        <h3>Change password</h3>
        <Field label="Current password" type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
        <Field label="New password" type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
        <Button onClick={async () => { try { await api.auth.changePassword(pw); toast('Password changed.'); } catch (e) { toast(e.message); } }}>Update password</Button>
      </section>
      <section className="panel">
        <h3>Change PIN</h3>
        <Field label="Current PIN" type="password" maxLength={4} value={pin.currentPin} onChange={(e) => setPin({ ...pin, currentPin: e.target.value })} />
        <Field label="New PIN" type="password" maxLength={4} value={pin.newPin} onChange={(e) => setPin({ ...pin, newPin: e.target.value })} />
        <Button onClick={async () => { try { await api.auth.changePin(pin); toast('PIN changed.'); } catch (e) { toast(e.message); } }}>Update PIN</Button>
      </section>
      <section className="panel">
        <Button variant="light" onClick={async () => { await logout(); nav('/'); }}>Log out</Button>
      </section>
    </>
  );
}
