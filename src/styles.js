// ─── Design Tokens ────────────────────────────────────────────────────
export const ds = {
  // Colors
  green: '#7a9b7e',       // primary actions, active states, nav
  greenLight: '#e8f0e8',  // green tinted backgrounds
  greenCheck: '#7fb685',  // checkmarks, success indicators
  greenSage: '#8fae8b',   // tile labels (vitals, symptoms ok)
  // Warning/attention
  amber: '#c9914a',        // warning text, clinic day highlights
  amberLight: 'rgba(212,165,116,0.08)', // subtle amber background tint
  amberGradient: 'linear-gradient(135deg, #d4a574 0%, #c9914a 100%)', // attention banners
  // Text
  text: '#3d3d3d',
  textMuted: '#7a7a7a',
  textLight: '#999',
  textPlaceholder: '#ccc',
  // Surfaces
  bg: '#f7f6f2',
  card: '#fff',
  cardAlt: '#f5f4f0',
  border: '#e0ddd6',
  divider: '#f0eeea',
  // Radius
  radiusLg: 20,    // tiles, cards, gradient boxes
  radiusMd: 16,    // buttons, action containers
  radiusSm: 12,    // inputs, small buttons
  // Shadows
  cardShadow: '0 1px 4px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.02)',
  cardBorder: '1px solid rgba(0,0,0,0.03)',
};

export const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: ds.radiusSm, border: '1px solid ' + ds.border,
  background: ds.card, fontSize: 15, color: ds.text, outline: 'none', fontFamily: "'DM Sans', sans-serif",
};

export const labelStyle = { fontSize: 13, fontWeight: 500, color: ds.textMuted, marginBottom: 4, display: 'block', fontFamily: "'DM Sans', sans-serif" };

export const tile = {
  background: ds.card, borderRadius: ds.radiusLg, padding: '16px 18px',
  boxShadow: ds.cardShadow,
  cursor: 'pointer', transition: 'transform .1s', border: ds.cardBorder,
  position: 'relative', overflow: 'hidden',
};

export const tileLabel = { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: "'DM Sans', sans-serif" };

export const tileValue = { fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600 };
