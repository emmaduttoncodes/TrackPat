import { ds, inputStyle, labelStyle } from '../styles';

export function SettingsView({ transplantDate, onDateChange, onExport, onImport, fileInputRef, onClose }) {
  return (
    <div className="fixed inset-0 z-50" style={{ background: ds.bg, overflowY: 'auto', overflowX: 'hidden' }}>
      <div style={{ padding: '24px 20px 120px', paddingTop: 'calc(24px + env(safe-area-inset-top))', maxWidth: ds.appMaxWidth, margin: '0 auto' }}>
        {/* Header */}
        <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
          <button
            onClick={onClose}
            className="flex items-center justify-center"
            style={{
              width: 34, height: 34, borderRadius: '50%',
              background: '#e8e6e1', color: ds.textMuted, border: 'none',
              fontSize: 18, cursor: 'pointer', flexShrink: 0,
            }}
          >‹</button>
          <h2 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 22, fontWeight: 600, color: ds.text, margin: 0 }}>
            Settings
          </h2>
        </div>

        {/* Settings */}
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, color: '#a5a5a5', marginBottom: 8, paddingLeft: 4, fontFamily: "'DM Sans', sans-serif" }}>
          Settings
        </div>
        <div style={{
          background: ds.card, borderRadius: ds.radiusLg, marginBottom: 16, overflow: 'hidden',
          boxShadow: ds.cardShadow, border: ds.cardBorder,
        }}>
          <div style={{ padding: '14px 16px' }}>
            <label style={{ ...labelStyle, marginBottom: 6 }}>
              Transplant date
            </label>
            <input
              type="date"
              value={transplantDate}
              onChange={(e) => onDateChange(e.target.value)}
              style={{
                ...inputStyle,
              }}
            />
          </div>
        </div>

        {/* Your data */}
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, color: '#a5a5a5', marginBottom: 8, paddingLeft: 4, fontFamily: "'DM Sans', sans-serif" }}>
          Your data
        </div>
        <div style={{
          background: ds.card, borderRadius: ds.radiusLg, marginBottom: 16, overflow: 'hidden',
          boxShadow: ds.cardShadow, border: ds.cardBorder,
        }}>
          <button onClick={onExport} className="w-full text-left" style={{ padding: '16px', fontSize: 15, color: ds.text, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            Backup data
            <span style={{ float: 'right', color: ds.textPlaceholder }}>›</span>
          </button>
          <div style={{ borderTop: `1px solid ${ds.divider}` }}>
            <button onClick={() => fileInputRef.current?.click()} className="w-full text-left" style={{ padding: '16px', fontSize: 15, color: ds.text, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
              Restore from backup
              <span style={{ float: 'right', color: ds.textPlaceholder }}>›</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={(e) => { if (e.target.files[0]) onImport(e.target.files[0]); e.target.value = ''; }}
            />
          </div>
          <div style={{ padding: '0 16px 14px', fontSize: 12, color: ds.textMuted, lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>
            Your data is stored only on this device — it never leaves your phone and no one else can access it. However, it can be lost if you clear your browser data, delete the app, or switch devices. We recommend a monthly backup.
          </div>
        </div>

        {/* About */}
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, color: '#a5a5a5', marginBottom: 8, paddingLeft: 4, fontFamily: "'DM Sans', sans-serif" }}>
          About
        </div>
        <div style={{
          background: ds.card, borderRadius: ds.radiusLg, padding: '16px 18px', marginBottom: 16,
          boxShadow: ds.cardShadow, border: ds.cardBorder,
        }}>
          <p style={{ fontSize: 13, color: ds.text, lineHeight: 1.6, margin: '0 0 12px', fontFamily: "'DM Sans', sans-serif" }}>
            Renew was made with love to support my partner after his liver transplant. It started as a simple way to keep on top of daily recovery — and grew into something we hope might help others too.
          </p>
          <p style={{ fontSize: 12, color: ds.textMuted, lineHeight: 1.6, margin: '0 0 12px', fontFamily: "'DM Sans', sans-serif" }}>
            This app is designed to support your recovery journey, not to replace medical advice. It is not a diagnostic tool — always follow your transplant team's guidance and contact them with any concerns.
          </p>
          <p style={{ fontSize: 12, color: ds.textMuted, lineHeight: 1.6, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
            We'd love to hear from you — whether it's feedback, suggestions, or just to say hello.
          </p>
          <a
            href="mailto:emma@emmadutton.dev"
            style={{
              display: 'block', marginTop: 12, padding: '12px', borderRadius: ds.radiusSm,
              background: ds.greenLight, color: ds.green, fontSize: 14, fontWeight: 600,
              textAlign: 'center', textDecoration: 'none', fontFamily: "'DM Sans', sans-serif",
            }}
          >Send feedback</a>
        </div>
      </div>
    </div>
  );
}
