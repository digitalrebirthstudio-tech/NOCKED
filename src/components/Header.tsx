'use client';

import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  if (pathname === '/landing') return null;

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
        padding: '16px 24px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(20,20,20,0.85)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => router.push('/')}>
          <Image
            src="/nocked-logo.png"
            alt="Nocked"
            width={36}
            height={36}
            style={{ borderRadius: 9 }}
          />
          <h1 style={{
            fontSize: 22, fontWeight: 900, color: '#ff5e1a',
            fontStyle: 'italic', letterSpacing: '-0.5px',
            textTransform: 'uppercase', margin: 0,
            fontFamily: 'Inter, -apple-system, sans-serif',
          }}>
            NOCKED
          </h1>
        </div>
        <span
          className="material-symbols-outlined"
          style={{ color: 'rgba(255,255,255,0.3)', fontSize: 22, cursor: 'pointer' }}
          onClick={() => router.push('/profile')}
        >
          settings
        </span>
      </div>
    </>
  );
}
