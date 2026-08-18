import React from 'react';
import * as I from 'lucide-react';
import Logo from './Logo';
import { money } from '../utils/money';

export default function TransactionReceipt({ transaction, onClose }) {
  if (!transaction) return null;

  const t = transaction;
  const isCredit = ['DEPOSIT', 'REFUND', 'INTEREST', 'LOAN_DISBURSEMENT', 'INCOMING_EXTERNAL'].includes(t.type);
  const statusColors = {
    COMPLETED: 'status-green',
    APPROVED: 'status-green',
    PENDING: 'status-yellow',
    UNDER_REVIEW: 'status-yellow',
    PROCESSING: 'status-blue',
    FAILED: 'status-red',
    REJECTED: 'status-red',
    SUSPENDED: 'status-orange',
    REVERSED: 'status-purple',
    CANCELLED: 'status-red',
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `NEXA Receipt - ${t.reference}`,
          text: `Transaction Receipt for ${t.currency || 'USD'} ${t.amount?.toFixed(2)} (${t.reference})`,
          url: window.location.href,
        });
      } catch (err) {
        // Fallback copy
        navigator.clipboard?.writeText(t.reference);
        alert('Transaction reference copied to clipboard');
      }
    } else {
      navigator.clipboard?.writeText(t.reference);
      alert('Transaction reference copied to clipboard');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="receipt-modal modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="receipt-actions-top no-print">
          <button className="icon-btn" onClick={handleShare} title="Share / Copy Ref">
            <I.Share2 size={18} />
          </button>
          <button className="icon-btn" onClick={handlePrint} title="Print Receipt">
            <I.Printer size={18} />
          </button>
          <button className="icon-btn close-btn" onClick={onClose}>
            <I.X size={20} />
          </button>
        </div>

        <div className="receipt-content printable-area">
          <div className="receipt-header">
            <Logo />
            <div className="receipt-title-badge">OFFICIAL TRANSACTION RECEIPT</div>
          </div>

          <div className="receipt-amount-box">
            <p className="receipt-label">Amount</p>
            <h1 className={`receipt-amount ${isCredit ? 'credit' : 'debit'}`}>
              {isCredit ? '+' : '-'}{t.currency || 'USD'} {Number(t.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h1>
            <div className={`badge ${statusColors[t.status] || 'status-yellow'}`}>
              {t.status?.replace('_', ' ')}
            </div>
          </div>

          <div className="receipt-details-grid">
            <div className="receipt-row">
              <span>Transaction Type</span>
              <strong>{t.type?.replace('_', ' ')}</strong>
            </div>

            <div className="receipt-row">
              <span>Reference Number</span>
              <strong className="mono">{t.reference}</strong>
            </div>

            <div className="receipt-row">
              <span>Date & Time</span>
              <strong>{t.createdAt || t.date ? new Date(t.createdAt || t.date).toLocaleString() : 'N/A'}</strong>
            </div>

            {t.senderName && (
              <div className="receipt-row">
                <span>Sender Name</span>
                <strong>{t.senderName}</strong>
              </div>
            )}

            {t.senderBank && (
              <div className="receipt-row">
                <span>Sender Bank</span>
                <strong>{t.senderBank}</strong>
              </div>
            )}

            {t.senderAccount && (
              <div className="receipt-row">
                <span>Sender Account</span>
                <strong className="mono">{t.senderAccount}</strong>
              </div>
            )}

            {t.recipientName && (
              <div className="receipt-row">
                <span>Recipient Name</span>
                <strong>{t.recipientName}</strong>
              </div>
            )}

            {(t.recipientBank || t.externalBankName) && (
              <div className="receipt-row">
                <span>Destination Bank</span>
                <strong>{t.recipientBank || t.externalBankName}</strong>
              </div>
            )}

            {(t.recipientAccount || t.externalAccountNum) && (
              <div className="receipt-row">
                <span>Recipient Account</span>
                <strong className="mono">{t.recipientAccount || t.externalAccountNum}</strong>
              </div>
            )}

            {t.fee > 0 && (
              <div className="receipt-row">
                <span>Service Fee</span>
                <strong>{t.currency || 'USD'} {Number(t.fee).toFixed(2)}</strong>
              </div>
            )}

            {t.description && (
              <div className="receipt-row">
                <span>Description / Purpose</span>
                <strong>{t.description}</strong>
              </div>
            )}

            {(t.adminNotes || t.reason) && (
              <div className="receipt-row admin-note-row">
                <span>Status Note / Reason</span>
                <strong className="text-warning">{t.adminNotes || t.reason}</strong>
              </div>
            )}
          </div>

          <div className="receipt-footer">
            <p>Thank you for banking with <strong>NEXA Microfinance Bank</strong>.</p>
            <small>This is a computer-generated transaction receipt and does not require a physical signature.</small>
          </div>
        </div>

        <div className="receipt-actions-bottom no-print">
          <button className="btn outline" onClick={handlePrint}>
            <I.Printer size={16} /> Print / Save
          </button>
          <button className="btn primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
