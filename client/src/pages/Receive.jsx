import { useEffect, useState } from 'react';
import Button from '../components/Button';
import PageIntro from '../components/PageIntro';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function Receive() {
  const [accounts, setAccounts] = useState([]);
  const { toast } = useToast();
  useEffect(() => { api.customer.accounts().then(setAccounts).catch((e) => toast(e.message)); }, []);
  const copy = (v) => { navigator.clipboard.writeText(v); toast('Copied to clipboard.'); };
  return (
    <>
      <PageIntro title="Receive money" text="Share your NEXA account details to receive internal transfers." />
      {accounts.map((a) => (
        <section className="panel share-box" key={a.id} style={{ marginBottom: 16 }}>
          <p>{a.type}</p>
          <h3>{a.accountNumber}</h3>
          <p>{a.currency}</p>
          <Button onClick={() => copy(a.accountNumber)}>Copy account number</Button>
        </section>
      ))}
    </>
  );
}
