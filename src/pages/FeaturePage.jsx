import { useState } from 'react';
import * as I from 'lucide-react';
import Button from '../components/Button';
import SectionTitle from '../components/SectionTitle';
import PageIntro from '../components/PageIntro';
import Status from '../components/Status';

const featureData = {
  Transactions: ['Your transaction history', 'Review incoming and outgoing transaction records.'],
  Beneficiaries: ['Beneficiaries', 'Manage saved recipients for faster transfers.'],
  Cards: ['Your NEXA cards', 'Manage your debit and virtual cards.'],
  Loans: ['Loans', 'Explore loan products and track repayment progress.'],
  Savings: ['Savings goals', 'Build better habits with flexible savings plans.'],
  Bills: ['Bill payments', 'Manage bills inside the NEXA platform.'],
  Settings: ['Profile & settings', 'Keep your personal details and preferences up to date.'],
};

export default function FeaturePage({ title, user, toast }) {
  const [data] = useState(() => featureData[title] || [title, 'This area is ready for your banking workflow.']);

  return (
    <>
      <PageIntro title={data[0]} text={data[1]} />
      <section className="panel empty">
        <div className="empty-icon">
          {title === 'Loans' ? <I.Landmark /> : title === 'Cards' ? <I.CreditCard /> : <I.Inbox />}
        </div>
        <h3>{title === 'Transactions' ? 'No transactions yet' : `Your ${title.toLowerCase()} space is ready`}</h3>
        <p>
          {title === 'Transactions'
            ? 'Completed transfers and account activity will appear here.'
            : 'Use the controls above to begin in this area.'}
        </p>
        <Button onClick={() => toast('This feature is available in the NEXA platform.')}>Get started</Button>
      </section>
    </>
  );
}
