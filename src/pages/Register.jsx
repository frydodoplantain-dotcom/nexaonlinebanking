import { useState } from 'react';
import * as I from 'lucide-react';
import Button from '../components/Button';
import Field from '../components/Field';
import Logo from '../components/Logo';
import AuthShell from './AuthShell';
import { countries } from '../data/config';

export default function Register({ go, setUser, setUsers, toast }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    first: '',
    middle: '',
    last: '',
    dob: '',
    gender: '',
    email: '',
    phone: '',
    country: 'US',
    password: '',
    confirm: '',
    city: '',
    address: '',
    zip: '',
  });
  const [photo, setPhoto] = useState(null);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const c = countries[form.country];

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast('Photo must be under 5MB.');
    const reader = new FileReader();
    reader.onloadend = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  };

  const submit = () => {
    if (!form.first || !form.last || !form.email || form.password.length < 6 || form.password !== form.confirm)
      return toast('Please complete the form and confirm your password.');
    const fullName = `${form.first} ${form.middle ? form.middle + ' ' : ''}${form.last}`;
    const initials = (form.first[0] + (form.last[0] || '')).toUpperCase();
    const n = {
      name: fullName,
      email: form.email,
      country: form.country,
      status: 'PENDING APPROVAL',
      role: 'customer',
      balance: 0,
      available: 0,
      initials,
      phone: form.phone,
      dob: form.dob,
      gender: form.gender,
      address: form.address,
      city: form.city,
      zip: form.zip,
      photo: photo || '',
    };
    setUsers(x => [...x, n]);
    setUser(n);
    toast('Application submitted for review.');
    go('login');
  };

  return (
    <AuthShell title="Open your NEXA account" sub="Create your secure digital banking profile.">
      <div className="steps">
        {['Personal', 'Location', 'Security'].map((x, i) => (
          <span key={i} className={step >= i + 1 ? 'current' : ''}>{i + 1}<b>{x}</b></span>
        ))}
      </div>
      {step === 1 && (
        <>
          <Field label="First name" name="first" value={form.first} onChange={update} />
          <Field label="Middle name (optional)" name="middle" value={form.middle} onChange={update} />
          <Field label="Last name" name="last" value={form.last} onChange={update} />
          <Field label="Date of birth" name="dob" type="date" value={form.dob} onChange={update} />
          <label className="field">Gender
            <select name="gender" value={form.gender} onChange={update}>
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </label>
          <Field label="Email address" type="email" name="email" value={form.email} onChange={update} />
          <Field label="Phone number" name="phone" value={form.phone} onChange={update} />
        </>
      )}
      {step === 2 && (
        <>
          <Field label="Country of residence" name="country" value={form.country} onChange={update} select options={countries} />
          <div className="currency-note">{c.flag} Your primary account currency will be <strong>{c.currency} ({c.symbol})</strong>.</div>
          <Field label="State / Province" name="state" value={form.state || ''} onChange={update} />
          <Field label="City" name="city" value={form.city} onChange={update} />
          <Field label="Address" name="address" value={form.address} onChange={update} />
          <Field label="Postal / ZIP code" name="zip" value={form.zip} onChange={update} />
        </>
      )}
      {step === 3 && (
        <>
          <label className="upload">
            <input type="file" accept="image/*" onChange={handlePhoto} style={{display:'none'}} />
            {photo ? (
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
                <img src={photo} alt="Preview" style={{width:80,height:80,borderRadius:'50%',objectFit:'cover',border:'3px solid var(--blue)'}} />
                <span style={{fontSize:12,color:'var(--muted)'}}>Click to change photo</span>
              </div>
            ) : (
              <>
                <I.Camera /> Upload profile photo <small>Optional · JPG or PNG, up to 5MB</small>
              </>
            )}
          </label>
          <Field label="Create password" type="password" name="password" value={form.password} onChange={update} />
          <Field label="Confirm password" type="password" name="confirm" value={form.confirm} onChange={update} />
        </>
      )}
      <div className="form-actions">
        {step > 1 && <Button variant="light" onClick={() => setStep(step - 1)}>Back</Button>}
        <Button onClick={() => step < 3 ? setStep(step + 1) : submit()}>
          {step === 3 ? 'Submit application' : 'Continue'} <I.ArrowRight />
        </Button>
      </div>
      <p className="form-foot">
        Already have an account? <button type="button" onClick={() => go('login')}>Sign in</button>
      </p>
    </AuthShell>
  );
}
