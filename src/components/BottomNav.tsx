'use client';

import { useRouter, usePathname } from 'next/navigation';

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { label: 'Sights', icon: 'adjust', route: '/' },
    { label: 'Scores', icon: 'scoreboard', route: '/score' },
    { label: 'Analysis', icon: 'insights', route: '/analysis' },
    { label: 'Profile', icon: 'person', route: '/profile' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        .material-symbols-outlined {
          font-family: 'Material Symbols Outlined';
          font-weight: normal; font-style: normal;
          font-size: 24px; line-height: 1;
          letter-spacing: normal; text-transform: none;
          display: inline-block; white-space: nowrap;
          word-wrap: normal; direction: ltr;
        }
      `}</style>
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(20,20,20,0.9)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '8px 24px 16px',
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        zIndex: 50,
      }}>
        {tabs.map(({ label, icon, route }) => {
          const isActive = pathname === route || (route !== '/' && pathname.startsWith(route));
          return (
            <button
              key={label}
              onClick={() => router.push(route)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 4, background: 'none', border: 'none', cursor: 'pointer',
                color: isActive ? '#ff5e1a' : 'rgba(255,255,255,0.3)',
                transition: 'all 0.15s', padding: '4px 16px',
                transform: isActive ? 'scale(1.1)' : 'scale(1)',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 24,
                  fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                {icon}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
              }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
