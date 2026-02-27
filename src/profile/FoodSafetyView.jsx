import { useState } from 'react';
import { isWithinSixMonths } from '../helpers';
import { FOOD_RESTRICTIONS } from '../constants';
import { ds, tileLabel } from '../styles';
import { track } from '../analytics';

export function FoodSafetyView({ transplantDate, onClose }) {
  const [waiterMode, setWaiterMode] = useState(false);
  const showTemporary = isWithinSixMonths(transplantDate);

  if (waiterMode) {
    return (
      <div className="fixed inset-0 z-50" style={{ background: ds.card, overflowY: 'auto', overflowX: 'hidden' }}>
        <div style={{ padding: '48px 24px 120px', maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 28, fontWeight: 700, color: ds.text, marginBottom: 8 }}>
            I cannot eat these foods
          </h1>
          <p style={{ fontSize: 14, color: ds.textMuted, marginBottom: 32 }}>
            Due to a medical condition and medication, please ensure my meal does not contain any of the following.
          </p>

          <div style={{ textAlign: 'left' }}>
            <div style={{ ...tileLabel, color: '#c97070', marginBottom: 12 }}>Always avoid</div>
            {FOOD_RESTRICTIONS.lifetime.map((item, i) => (
              <div key={i} style={{
                padding: '14px 0', fontSize: 18, color: ds.text,
                borderBottom: i < FOOD_RESTRICTIONS.lifetime.length - 1 ? `1px solid ${ds.divider}` : 'none',
                fontFamily: "'DM Sans', sans-serif",
              }}>
                <span style={{ marginRight: 10 }}>{item.icon}</span>{item.name}
              </div>
            ))}

            {showTemporary && (
              <>
                <div style={{ ...tileLabel, color: '#d4a574', marginTop: 28, marginBottom: 12 }}>Also avoiding temporarily</div>
                {FOOD_RESTRICTIONS.temporary.map((item, i) => (
                  <div key={i} style={{
                    padding: '14px 0', fontSize: 18, color: ds.text,
                    borderBottom: i < FOOD_RESTRICTIONS.temporary.length - 1 ? `1px solid ${ds.divider}` : 'none',
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    <span style={{ marginRight: 10 }}>{item.icon}</span>{item.name}
                  </div>
                ))}
              </>
            )}
          </div>

          <p style={{ fontSize: 11, color: ds.textLight, marginTop: 32, lineHeight: 1.5 }}>
            This list reflects post-transplant dietary guidelines. Please ask if unsure about any ingredient.
          </p>
        </div>

        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 20px',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
          background: 'linear-gradient(transparent, white 20%)',
        }}>
          <button
            onClick={() => setWaiterMode(false)}
            style={{
              width: '100%', padding: '16px', borderRadius: ds.radiusMd, border: 'none',
              background: ds.green, color: '#fff', fontSize: 16, fontWeight: 600,
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}
          >Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50" style={{ background: ds.bg, overflowY: 'auto', overflowX: 'hidden' }}>
      <div style={{ padding: '24px 20px 120px', paddingTop: 'calc(24px + env(safe-area-inset-top))' }}>
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
            Food safety
          </h2>
        </div>

        {/* Status banner */}
        <div style={{
          background: showTemporary
            ? ds.amberGradient
            : 'linear-gradient(135deg, #8fae8b 0%, #a3c4a0 40%, #90c5b0 100%)',
          borderRadius: ds.radiusLg, padding: '16px 20px', marginBottom: 20,
        }}>
          <div style={{ color: '#fff', fontSize: 15, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
            {showTemporary ? 'Extra precautions apply' : 'Temporary restrictions relaxed'}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>
            {showTemporary
              ? 'You are within 6 months of transplant. Additional food restrictions apply.'
              : 'You are past the 6-month mark. Some temporary restrictions no longer apply.'}
          </div>
        </div>

        {/* Lifetime restrictions */}
        <div style={{
          background: ds.card, borderRadius: ds.radiusLg, padding: '16px 18px',
          boxShadow: ds.cardShadow, border: ds.cardBorder, marginBottom: 16,
        }}>
          <div style={{ ...tileLabel, color: '#c97070', marginBottom: 12 }}>Lifetime restrictions</div>
          {FOOD_RESTRICTIONS.lifetime.map((item, i) => (
            <div key={i} style={{
              padding: '10px 0',
              borderBottom: i < FOOD_RESTRICTIONS.lifetime.length - 1 ? `1px solid ${ds.divider}` : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: ds.text, fontFamily: "'DM Sans', sans-serif" }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: ds.textMuted, marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>{item.reason}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Temporary restrictions */}
        <div style={{
          background: ds.card, borderRadius: ds.radiusLg, padding: '16px 18px',
          boxShadow: ds.cardShadow, border: ds.cardBorder, marginBottom: 16,
        }}>
          <div style={{ ...tileLabel, color: '#d4a574', marginBottom: 12 }}>First 6 months</div>
          {!showTemporary && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
              background: 'rgba(143,174,139,0.1)', borderRadius: ds.radiusSm, marginBottom: 12,
            }}>
              <span style={{ color: ds.greenSage, fontSize: 16 }}>✓</span>
              <span style={{ fontSize: 13, color: ds.greenSage, fontFamily: "'DM Sans', sans-serif" }}>
                You are past 6 months — these temporary restrictions no longer apply.
              </span>
            </div>
          )}
          {FOOD_RESTRICTIONS.temporary.map((item, i) => (
            <div key={i} style={{
              padding: '10px 0',
              borderBottom: i < FOOD_RESTRICTIONS.temporary.length - 1 ? `1px solid ${ds.divider}` : 'none',
              opacity: showTemporary ? 1 : 0.5,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: ds.text, fontFamily: "'DM Sans', sans-serif" }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: ds.textMuted, marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>{item.reason}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div style={{
          background: ds.cardAlt, borderRadius: ds.radiusSm, padding: '12px 14px', marginBottom: 20,
        }}>
          <p style={{ fontSize: 12, color: ds.textMuted, lineHeight: 1.5, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
            This list is based on general post-liver-transplant dietary guidelines. Always follow your transplant team's specific advice. When in doubt, ask your coordinator or dietitian.
          </p>
        </div>
      </div>

      {/* Show to waiter button */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 20px',
        paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
        background: `linear-gradient(transparent, ${ds.bg} 20%)`,
      }}>
        <button
          onClick={() => { setWaiterMode(true); track('waiter_mode_opened'); }}
          style={{
            width: '100%', padding: '16px', borderRadius: ds.radiusMd, border: 'none',
            background: ds.green, color: '#fff', fontSize: 16, fontWeight: 600,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}
        >Show to waiter</button>
      </div>
    </div>
  );
}
