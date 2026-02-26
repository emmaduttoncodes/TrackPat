import { useState, useEffect, useRef } from 'react';
import { ds, inputStyle, labelStyle } from './styles';

// ─── Toast ────────────────────────────────────────────────────────────
export function Toast({ message }) {
  if (!message) return null;
  return (
    <div style={{
      position: 'fixed', top: 'calc(16px + env(safe-area-inset-top))', left: '50%', transform: 'translateX(-50%)',
      background: ds.card, color: ds.text, padding: '10px 20px', borderRadius: ds.radiusSm,
      boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 60, fontSize: 14, fontWeight: 500,
      fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap',
    }}>{message}</div>
  );
}

// ─── Bottom Sheet ──────────────────────────────────────────────────────
export function BottomSheet({ open, onClose, title, children }) {
  const sheetRef = useRef(null);
  const previousFocus = useRef(null);
  const titleId = useRef(`sheet-title-${Math.random().toString(36).slice(2, 7)}`).current;

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      previousFocus.current = document.activeElement;
      setTimeout(() => {
        const close = sheetRef.current?.querySelector('[data-sheet-close]');
        if (close) close.focus();
      }, 50);
    } else {
      document.body.style.overflow = '';
      if (previousFocus.current) previousFocus.current.focus();
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Focus trap
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key !== 'Tab' || !sheetRef.current) return;
      const focusable = sheetRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.25)' }} />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-t-2xl px-5 pb-8 pt-3"
        style={{ background: '#faf9f6', maxHeight: '85vh', overflowY: 'auto', animation: 'slideUp .25s ease-out' }}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full" style={{ background: '#d4d0c8' }} />
        <div className="flex items-center justify-between mb-4">
          <h3 id={titleId} className="text-lg font-semibold" style={{ color: ds.text, fontFamily: "'Source Serif 4', Georgia, serif" }}>{title}</h3>
          <button data-sheet-close onClick={onClose} className="text-sm px-3 py-1 rounded-full" style={{ background: '#e8e6e1', color: ds.textMuted }}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Input Components ──────────────────────────────────────────────────
export function Field({ label, children }) {
  return <div className="mb-3"><label style={labelStyle}>{label}</label>{children}</div>;
}

export function Input({ label, value, onChange, type = 'text', placeholder = '', min, max }) {
  const [error, setError] = useState('');
  const handleBlur = () => {
    if (min != null && max != null && value !== '') {
      const n = Number(value);
      if (isNaN(n) || n < min || n > max) {
        setError(`Must be between ${min}–${max}`);
        return;
      }
    }
    setError('');
  };
  const handleChange = (v) => {
    if (error) setError('');
    onChange(v);
  };
  return (
    <Field label={label}>
      <input type={type} inputMode={type === 'number' ? 'decimal' : undefined} value={value} onChange={(e) => handleChange(e.target.value)} onBlur={handleBlur} placeholder={placeholder} style={{ ...inputStyle, borderColor: error ? '#d4a574' : ds.border }} />
      {error && <div style={{ fontSize: 12, color: '#c97070', marginTop: 4 }}>{error}</div>}
    </Field>
  );
}

export function TextArea({ label, value, onChange, placeholder = '' }) {
  return (
    <Field label={label}>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
    </Field>
  );
}

export function ThumbPicker({ value, onChange }) {
  const btn = (v, emoji) => (
    <button
      onClick={() => onChange(value === v ? null : v)}
      className="text-2xl rounded-xl px-4 py-2 transition-all"
      style={{
        background: value === v ? '#e8f5e9' : ds.divider,
        opacity: value === v ? 1 : 0.45,
        border: value === v ? '2px solid #a5c9a8' : '2px solid transparent',
      }}
    >{emoji}</button>
  );
  return <div className="flex gap-3">{btn('up', '👍')}{btn('down', '👎')}</div>;
}
