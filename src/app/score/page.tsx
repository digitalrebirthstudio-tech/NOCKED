'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

interface Session {
  id: string;
  bowName: string;
  bowId: string;
  type: 'Practice' | '3D Shoot' | 'ASA';
  date: number;
  totalScore: number;
  totalTargets: number;
  misses: number;
  targets: Target[];
  completed: boolean;
}

interface Target {
  number: number;
  distance: number | null;
  score: number | null;
  notes: string;
}

export default function ScorePage() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/landing');
    });
  }, []);

  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('nocked_sessions');
    if (saved) setSessions(JSON.parse(saved));
  }, []);

  const deleteSession = (id: string) => {
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    localStorage.setItem('nocked_sessions', JSON.stringify(updated));
  };

  const completedSessions = sessions.filter(s => s.completed).sort((a, b) => b.date - a.date);
  const activeSessions = sessions.filter(s => !s.completed).sort((a, b) => b.date - a.date);

  const typeColor = (type: string) => {
    if (type === 'ASA') return '#ff5e1a';
    if (type === '3D Shoot') return '#34d399';
    return '#60a5fa';
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; box-sizing: border-box; }
        body { margin: 0; background: #141414; min-height: 100vh; color: #fff; }
        .glass-card {
          background: rgba(255,255,255,0.04); border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06);
          overflow: hidden;
        }
        .session-card {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px; padding: 16px 18px; cursor: pointer; transition: all 0.15s;
        }
        .session-card:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,94,26,0.3); }
        .main-btn {
          width: 100%; padding: 15px; background: #ff5e1a; color: white; border: none;
          border-radius: 14px; font-size: 15px; font-weight: 700;
          font-family: 'Inter', sans-serif; cursor: pointer;
          box-shadow: 0 4px 24px rgba(255,94,26,0.35); transition: all 0.15s;
        }
        .main-btn:hover { background: #e04d0e; }
        .delete-btn {
          background: rgba(255,59,48,0.1); border: 1px solid rgba(255,59,48,0.2);
          color: #ff3b30; font-size: 11px; font-weight: 600; padding: 4px 10px;
          border-radius: 6px; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.15s;
        }
        .delete-btn:hover { background: rgba(255,59,48,0.2); }
        .b-item { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.3); cursor: pointer; transition: color 0.15s; background: none; border: none; font-family: 'Inter', sans-serif; }
        .b-item:hover { color: rgba(255,255,255,0.7); }
        .b-item.active { color: #ff5e1a; }
      `}</style>

      <div style={{ maxWidth: 680, margin: '0 auto', paddingBottom: 80 }}>

        {/* HEADER */}
        <div style={{
          padding: '20px 24px 16px', display: 'flex', alignItems: 'center', gap: 12,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(20,20,20,0.85)', backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 10,
        }}>
          <Image src="/nocked-logo.png" alt="Nocked" width={38} height={38} style={{ borderRadius: 10, cursor: 'pointer' }} onClick={() => router.push('/')} />
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>Score</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 500, marginTop: 1 }}>Session Tracker</div>
          </div>
        </div>

        <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          <button className="main-btn" onClick={() => router.push('/score/new')}>+ Start New Session</button>

          {/* ACTIVE SESSIONS */}
          {activeSessions.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>In Progress</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activeSessions.map(s => (
                  <div key={s.id} className="session-card" onClick={() => router.push(`/score/${s.id}`)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: typeColor(s.type), background: `${typeColor(s.type)}18`, padding: '2px 8px', borderRadius: 6, letterSpacing: '0.04em' }}>{s.type}</span>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{new Date(s.date).toLocaleDateString()}</span>
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{s.bowName}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                          {s.targets.filter(t => t.score !== null).length} / {s.totalTargets} targets · Score: {s.totalScore}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div style={{ fontSize: 12, color: '#ff5e1a', fontWeight: 600 }}>Resume →</div>
                        <button className="delete-btn" onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}>DEL</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* COMPLETED SESSIONS */}
          {completedSessions.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 10, marginTop: 4 }}>Past Sessions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {completedSessions.map(s => (
                  <div key={s.id} className="session-card" onClick={() => router.push(`/score/${s.id}/summary`)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: typeColor(s.type), background: `${typeColor(s.type)}18`, padding: '2px 8px', borderRadius: 6 }}>{s.type}</span>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{new Date(s.date).toLocaleDateString()}</span>
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{s.bowName}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{s.totalTargets} targets · {s.misses} misses</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 28, fontWeight: 800, color: '#ff5e1a', letterSpacing: -1 }}>{s.totalScore}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>/ {s.totalTargets * 12}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sessions.length === 0 && (
            <div className="glass-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8 }}>No sessions yet</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>Start a new session to track your scores</div>
            </div>
          )}
        </div>

        {/* BOTTOM NAV */}
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'rgba(20,20,20,0.9)', backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          maxWidth: 680, margin: '0 auto',
        }}>
          <button className="b-item" onClick={() => router.push('/')}>Dashboard</button>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Nocked</div>
          <button className="b-item active">Score</button>
        </div>
      </div>
    </>
  );
}
