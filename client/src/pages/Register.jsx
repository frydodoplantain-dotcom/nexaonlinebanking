import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as I from 'lucide-react';
import Button from '../components/Button';
import Field from '../components/Field';
import AuthShell from './AuthShell';
import { countries } from '../data/config';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    firstName: '', middleName: '', lastName: '', dateOfBirth: '', gender: '',
    email: '', phone: '', country: 'US', state: '', city: '', address: '', zip: '',
    accountType: 'CHECKING', password: '', confirm: '', pin: '', confirmPin: '',
    idType: 'Passport', idNumber: '',
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [idDocFile, setIdDocFile] = useState(null);

  const { toast } = useToast();
  const nav = useNavigate();
  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const c = countries[form.country];

  const submit = async () => {
    if (!form.firstName || !form.lastName || !form.email) return toast('Please complete your personal details.');
    if (form.password.length < 6 || form.password !== form.confirm) return toast('Passwords must match and be at least 6 characters.');
    if (!/^\d{4}$/.test(form.pin) || form.pin !== form.confirmPin) return toast('PIN must be 4 digits and match.');
    if (!idDocFile) return toast('Please upload your government-issued identification document.');

    try {
      const fd = new FormData();
      Object.keys(form).forEach((key) => {
        if (form[key]) fd.append(key, form[key]);
      });
      if (photoFile) fd.append('photo', photoFile);
      if (idDocFile) fd.append('idDocument', idDocFile);

      await api.auth.register(fd);
      toast('Application submitted with KYC documents. You will be notified once reviewed.');
      nav('/login');
    } catch (e) {
      toast(e.message);
    }
  };

  return (
    <AuthShell title="Open your NEXA account" sub="Create your secure digital banking profile.">
      <div className="steps">
        {['Personal', 'Location', 'Security', 'KYC & Photo'].map((x, i) => (
          <span key={x} className={step >= i + 1 ? 'current' : ''}><b>{i + 1}</b>{x}</span>
        ))}
      </div>
      {step === 1 && (
        <>
          <Field label="First name" name="firstName" value={form.firstName} onChange={update} />
          <Field label="Middle name (optional)" name="middleName" value={form.middleName} onChange={update} />
          <Field label="Last name" name="lastName" value={form.lastName} onChange={update} />
          <Field label="Date of birth" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={update} />
          <Field label="Gender" name="gender" value={form.gender} onChange={update} select>
            <option value="">Select gender</option>
            <option>Male</option><option>Female</option><option>Other</option><option>Prefer not to say</option>
          </Field>
          <Field label="Email address" type="email" name="email" value={form.email} onChange={update} />
          <Field label="Phone number" name="phone" value={form.phone} onChange={update} />
        </>
      )}
      {step === 2 && (
        <>
          <Field label="Country of residence" name="country" value={form.country} onChange={update} select options={countries} />
          <div className="currency-note">{c.flag} Your primary account currency will be <strong>{c.currency} ({c.symbol})</strong>.</div>
          <Field label="Account type" name="accountType" value={form.accountType} onChange={update} select>
            <option value="CHECKING">Checking</option>
            <option value="SAVINGS">Savings</option>
            <option value="FIXED_DEPOSIT">Fixed deposit</option>
          </Field>
          <Field label="State / Province" name="state" value={form.state} onChange={update} />
          <Field label="City" name="city" value={form.city} onChange={update} />
          <Field label="Address" name="address" value={form.address} onChange={update} />
          <Field label="Postal / ZIP code" name="zip" value={form.zip} onChange={update} />
        </>
      )}
      {step === 3 && (
        <>
          <Field label="Create password" type="password" name="password" value={form.password} onChange={update} />
          <Field label="Confirm password" type="password" name="confirm" value={form.confirm} onChange={update} />
          <Field label="4-digit transaction PIN" type="password" name="pin" value={form.pin} onChange={update} maxLength={4} />
          <Field label="Confirm PIN" type="password" name="confirmPin" value={form.confirmPin} onChange={update} maxLength={4} />
        </>
      )}
      {step === 4 && (
        <>
          <div style={{ background: '#132247', padding: 12, borderRadius: 8, marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4, fontWeight: 600 }}>Profile Photograph / Selfie</label>
            <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files[0])} />
            {photoFile && <small style={{ color: 'var(--gold)', display: 'block', marginTop: 4 }}>📷 {photoFile.name}</small>}
          </div>

          <Field label="Identification Document Type" name="idType" value={form.idType} onChange={update} select>
            <option value="Passport">International Passport</option>
            <option value="National ID">National / Government ID Card</option>
            <option value="Driver License">Driver's License</option>
            <option value="Residence Permit">Residence Permit</option>
          </Field>

          <Field label="Document ID Number" name="idNumber" value={form.idNumber} onChange={update} placeholder="e.g. A12345678" />

          <div style={{ background: '#132247', padding: 12, borderRadius: 8, marginTop: 12 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4, fontWeight: 600 }}>Upload ID Document (JPG, PNG, PDF)</label>
            <input type="file" accept="image/*,application/pdf" onChange={(e) => setIdDocFile(e.target.files[0])} />
            {idDocFile && <small style={{ color: 'var(--gold)', display: 'block', marginTop: 4 }}>📄 {idDocFile.name}</small>}
          </div>
        </>
      )}
      <div className="form-actions">
        {step > 1 && <Button variant="light" onClick={() => setStep(step - 1)}>Back</Button>}
        <Button onClick={() => (step < 4 ? setStep(step + 1) : submit())}>
          {step === 4 ? 'Submit application' : 'Continue'} <I.ArrowRight />
        </Button>
      </div>
      <p className="form-foot">Already have an account? <button type="button" onClick={() => nav('/login')}>Sign in</button></p>
    </AuthShell>
  );
}
