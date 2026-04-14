'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { getSessions, saveSession, deleteSession as deleteSessionDB } from '@/lib/db';

interface Session {
  id: string;
  bowName: string;
  bowId: string;
  type: 'Practice' | '3D Shoot' | 'ASA';
  sessionName: string;
  targetType: string;
  date: number;
  totalScore: number;
  totalTargets: number;
  misses: number;
  targets: Target[];
  completed: boolean;
}

const MAX_PER_TARGET: Record<string, number> = {
  'ASA 3D': 12, 'IBO 3D': 11, 'NFAA Field': 5, 'NFAA Indoor': 5, 'Vegas 300': 10,
};
const getMaxPerTarget = (t: string) => MAX_PER_TARGET[t] || 12;

interface Target {
  number: number;
  distance: number | null;
  score: number | null;
  notes: string;
}

export default function ScorePage() {
  const router = useRouter();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/landing'); return; }
      setUserId(session.user.id);
      getSessions(session.user.id).then(data => {
        if (data) {
          const mapped = data.map((s: any) => ({
            id: s.id,
            bowId: s.bow_id,
            bowName: s.bow_name,
            type: s.type,
            sessionName: s.session_name || '',
            targetType: s.target_type || 'ASA 3D',
            date: s.date,
            totalScore: s.total_score,
            totalTargets: s.total_targets,
            misses: s.misses,
            targets: s.targets,
            completed: s.completed,
          }));
          setSessions(mapped);
        }
        setLoading(false);
      }).catch(() => setLoading(false));
    });
  }, []);

  const handleDeleteSession = async (id: string) => {
    if (!confirm('Delete this session? This cannot be undone.')) return;
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    await deleteSessionDB(id).catch(console.error);
  };

  const completedSessions = sessions.filter(s => s.completed).sort((a, b) => b.date - a.date);
  const activeSessions = sessions.filter(s => !s.completed).sort((a, b) => b.date - a.date);

  const typeColor = (type: string) => {
    if (type === 'ASA') return '#ff5e1a';
    if (type === '3D Shoot') return '#34d399';
    return '#60a5fa';
  };

  if (loading) return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ height: 48, background: 'rgba(255,255,255,0.04)', borderRadius: 14, animation: 'pulse 1.5s infinite' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {[1,2,3].map(i => <div key={i} style={{ height: 72, background: 'rgba(255,255,255,0.04)', borderRadius: 14, animation: 'pulse 1.5s infinite' }} />)}
      </div>
      <div style={{ height: 300, background: 'rgba(255,255,255,0.04)', borderRadius: 18, animation: 'pulse 1.5s infinite' }} />
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  );

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

      <div style={{ maxWidth: 680, margin: '0 auto', paddingBottom: 120 }}>

        {/* Hero section */}
        <div style={{ padding: '32px 24px 8px' }}>
          <h2 style={{ fontSize: 36, fontWeight: 900, color: '#fff', letterSpacing: '-1px', lineHeight: 1.05, margin: 0, textTransform: 'uppercase' }}>
            PRECISION <span style={{ color: '#ff5e1a' }}>TRACKING</span>
          </h2>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 8, fontWeight: 600 }}>
            Telemetry Dashboard // v2.0.4
          </p>
        </div>


        <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          <button className="main-btn" onClick={() => router.push('/score/new')}>+ Start New Session</button>

          {/* STATS ROW */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div style={{ background: '#0e0e0e', borderRadius: 14, padding: '14px 16px', borderLeft: '2px solid #ff5e1a' }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Avg Score</div>
              {completedSessions.length > 0 ? (
                <div style={{ fontSize: 22, fontWeight: 900, color: '#ff5e1a' }}>
                  {(completedSessions.reduce((sum, s) => sum + s.totalScore, 0) / completedSessions.length).toFixed(1)}
                </div>
              ) : (
                <div style={{ height: 20, width: '70%', background: 'rgba(255,255,255,0.06)', borderRadius: 4 }} />
              )}
            </div>
            <div style={{ background: '#0e0e0e', borderRadius: 14, padding: '14px 16px', borderLeft: '2px solid rgba(255,255,255,0.15)' }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Total Arrows</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: completedSessions.length > 0 ? '#fff' : 'rgba(255,255,255,0.15)' }}>
                {completedSessions.reduce((sum, s) => sum + s.totalTargets, 0)}
              </div>
            </div>
            <div style={{ background: '#0e0e0e', borderRadius: 14, padding: '14px 16px', borderLeft: '2px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Last Session</div>
              {completedSessions.length > 0 ? (
                <>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{completedSessions[0].totalScore}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>{completedSessions[0].targetType}</div>
                </>
              ) : (
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>None yet</div>
              )}
            </div>
          </div>

          {/* SESSIONS LIST */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sessions.length === 0 ? (
                <div style={{
                  background: 'rgba(28,27,27,1)', borderRadius: 16, padding: 32,
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', minHeight: 300, position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{ position: 'absolute', top: 0, right: 0, width: 120, height: 120, borderRight: '1px solid rgba(255,94,26,0.15)', borderTop: '1px solid rgba(255,94,26,0.15)' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, width: 60, height: 60, borderLeft: '1px solid rgba(255,94,26,0.15)', borderBottom: '1px solid rgba(255,94,26,0.15)' }} />
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'rgba(255,255,255,0.2)' }}>target</span>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8, textAlign: 'center' }}>No sessions yet</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', maxWidth: 240, lineHeight: 1.6, marginBottom: 24 }}>
                    Your kinetic data is waiting. Start your first session.
                  </div>
                  <button className="main-btn" style={{ width: 'auto', padding: '12px 24px' }} onClick={() => router.push('/score/new')}>
                    + Start New Session
                  </button>
                </div>
              ) : (
                <>
                  {activeSessions.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>In Progress</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {activeSessions.map(s => (
                          <div key={s.id} className="session-card" onClick={() => router.push(`/score/${s.id}`)}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: typeColor(s.type), background: `${typeColor(s.type)}18`, padding: '2px 8px', borderRadius: 6 }}>{s.targetType}</span>
                                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{new Date(s.date).toLocaleDateString()}</span>
                                </div>
                                <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{s.sessionName || s.bowName}</div>
                                {s.sessionName && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>{s.bowName}</div>}
                                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                                  {s.targets.filter((t: any) => t.score !== null).length} / {s.totalTargets} targets · Score: {s.totalScore}
                                </div>
                              </div>
                              <div style={{ fontSize: 12, color: '#ff5e1a', fontWeight: 600 }}>Resume →</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {completedSessions.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>Past Sessions</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {completedSessions.map(s => {
                          const maxScore = s.totalTargets * getMaxPerTarget(s.targetType);
                          const pct = maxScore > 0 ? Math.round((s.totalScore / maxScore) * 100) : 0;
                          return (
                          <div key={s.id} className="session-card" onClick={() => router.push(`/score/${s.id}/summary`)}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: typeColor(s.type), background: `${typeColor(s.type)}18`, padding: '2px 8px', borderRadius: 6 }}>{s.targetType}</span>
                                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{new Date(s.date).toLocaleDateString()}</span>
                                </div>
                                <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{s.sessionName || s.bowName}</div>
                                {s.sessionName && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>{s.bowName}</div>}
                                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{s.totalTargets} targets · {s.misses} misses</div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 28, fontWeight: 800, color: '#ff5e1a', letterSpacing: -1 }}>{s.totalScore}</div>
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{pct}% of {maxScore}</div>
                              </div>
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
          </div>
        </div>
      </div>
    </>
  );
}

