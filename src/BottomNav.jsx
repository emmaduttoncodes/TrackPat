import { LayoutGrid, Activity, User } from 'lucide-react';
import { ds } from './styles';

export function BottomNav({ page, setPage, activeNudge }) {
  const items = [
    {
      id: 'overview', label: 'Overview',
      icon: <LayoutGrid size={22} />,
    },
    {
      id: 'trends', label: 'Trends',
      icon: <Activity size={22} />,
    },
    {
      id: 'profile', label: 'Profile',
      icon: <User size={22} />,
    },
  ];

  return (
    <div
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
        background: ds.greenLight, borderTop: '1px solid rgba(0,0,0,0.04)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div style={{ display: 'flex', height: 56, maxWidth: ds.appMaxWidth, margin: '0 auto' }}>
        {items.map((item) => {
          const active = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 2, background: 'none', border: 'none', cursor: 'pointer', position: 'relative',
                color: active ? ds.green : '#b5b5b5', fontFamily: "'DM Sans', sans-serif",
                fontSize: 11, fontWeight: active ? 600 : 500,
              }}
            >
              {active && (
                <div style={{
                  position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                  width: 20, height: 3, borderRadius: 2, background: ds.green,
                }} />
              )}
              <div style={{ marginTop: 2, position: 'relative', display: 'inline-flex' }}>
                {item.icon}
                {item.id === 'profile' && activeNudge === 'nudge_clinic' && (
                  <span style={{
                    position: 'absolute', top: -2, right: -4,
                    width: 8, height: 8, borderRadius: '50%', background: '#7b6b9e',
                    animation: 'nudgePulse 2s ease-in-out infinite',
                  }} />
                )}
              </div>
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
