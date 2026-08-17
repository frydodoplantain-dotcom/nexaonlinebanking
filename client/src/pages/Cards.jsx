import { useEffect, useState } from 'react';
import Button from '../components/Button';
import Field from '../components/Field';
import PageIntro from '../components/PageIntro';
import Status from '../components/Status';
import Logo from '../components/Logo';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function Cards() {
  const [data, setData] = useState({ cards: [], requests: [] });
  const [fees, setFees] = useState({ virtualFee: 0, physicalFee: 0 });
  const [type, setType] = useState('VIRTUAL');
  const { toast } = useToast();
  const load = () => api.cards.list().then(setData).catch((e) => toast(e.message));
  useEffect(() => { load(); api.cards.fees().then(setFees).catch(() => {}); }, []);

  const request = async () => {
    try {
      await api.cards.request({ cardType: type });
      toast('Card request submitted.');
      load();
    } catch (e) { toast(e.message); }
  };

  return (
    <>
      <PageIntro title="Cards" text="Request and manage your NEXA cards." />
      <section className="panel">
        <Field label="Card type" value={type} onChange={(e) => setType(e.target.value)} select>
          <option value="VIRTUAL">Virtual — fee {fees.virtualFee}</option>
          <option value="PHYSICAL">Physical — fee {fees.physicalFee}</option>
        </Field>
        <Button onClick={request}>Request card</Button>
      </section>
      <section className="panel">
        {data.cards.length === 0 && data.requests.length === 0 ? <p className="muted">No cards yet.</p> : null}
        {data.cards.map((card) => (
          <div key={card.id} className="card-item">
            <div className="fake-card">
              <Logo />
              <strong>{card.maskedNumber}</strong>
              <small>{card.cardholder}  {String(card.expiryMonth).padStart(2, '0')}/{String(card.expiryYear).slice(-2)}</small>
            </div>
            <div className="card-actions" style={{ marginTop: 12 }}>
              <Status>{card.status}</Status>
              {card.status !== 'CANCELLED' && (
                <Button variant="light" onClick={async () => { await api.cards.freeze(card.id); load(); }}>
                  {card.status === 'ACTIVE' ? 'Freeze' : 'Unfreeze'}
                </Button>
              )}
            </div>
          </div>
        ))}
        {data.requests.filter((r) => r.status === 'PENDING').map((r) => (
          <div key={r.id} className="card-item"><strong>{r.cardType} request</strong> <Status>{r.status}</Status></div>
        ))}
      </section>
    </>
  );
}
