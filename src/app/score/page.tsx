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
    if (!confirm('Delete this session? This cannot be undone.')) return;
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
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        .material-symbols-outlined { font-family: 'Material Symbols Outlined'; font-weight: normal; font-style: normal; }
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>

              {/* Main empty state card — spans 2 cols */}
              <div style={{
                gridColumn: 'span 2', background: 'rgba(28,27,27,1)',
                borderRadius: 16, padding: 32, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', minHeight: 400,
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: 120, height: 120, borderRight: '1px solid rgba(255,94,26,0.15)', borderTop: '1px solid rgba(255,94,26,0.15)' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: 60, height: 60, borderLeft: '1px solid rgba(255,94,26,0.15)', borderBottom: '1px solid rgba(255,94,26,0.15)' }} />

                <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'rgba(255,255,255,0.2)' }}>target</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 12, textAlign: 'center' }}>No sessions yet</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', textAlign: 'center', maxWidth: 280, lineHeight: 1.6, marginBottom: 32 }}>
                  Your kinetic data is waiting. Start your first scoring session to calibrate your performance metrics.
                </div>
                <button className="main-btn" style={{ width: 'auto', padding: '14px 28px' }} onClick={() => router.push('/score/new')}>
                  + Start New Session
                </button>
              </div>

              {/* Stats side panel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Avg score */}
                <div style={{ background: '#0e0e0e', borderRadius: 14, padding: 20, borderLeft: '2px solid rgba(255,94,26,0.2)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>Avg. Score</div>
                  <div style={{ height: 28, width: '75%', background: 'rgba(255,255,255,0.06)', borderRadius: 6 }} />
                  <div style={{ marginTop: 12, fontSize: 10, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Awaiting Data</div>
                </div>

                {/* Total arrows */}
                <div style={{ background: '#0e0e0e', borderRadius: 14, padding: 20, borderLeft: '2px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Total Arrows</div>
                  <div style={{ fontSize: 36, fontWeight: 900, color: 'rgba(255,255,255,0.15)' }}>0</div>
                  <div style={{ marginTop: 8, fontSize: 10, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Lifetime Count</div>
                </div>

                {/* Last calibration */}
                <div style={{ background: 'rgba(28,27,27,1)', borderRadius: 14, padding: 20, flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#ff5e1a', marginBottom: 16 }}>Last Calibration</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>No active sight marks</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
