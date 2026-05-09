'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getSessions } from '@/lib/db';

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

interface Target {
  number: number;
  distance: number | null;
  score: number | null;
  notes: string;
}

const MAX_PER_TARGET: Record<string, number> = {
  'ASA 3D': 12, 'IBO 3D': 11, 'NFAA Field': 5, 'NFAA Indoor': 5, 'Vegas 300': 10, 'AON': 12,
};
const getMaxPerTarget = (t: string) => MAX_PER_TARGET[t] || 12;

const TYPE_BADGE: Record<string, { bg: string; color: string; border: string }> = {
  'ASA 3D':     { bg: 'rgba(255,94,26,0.12)',   color: '#ff8a50', border: '1px solid rgba(255,94,26,0.2)' },
  'IBO 3D':     { bg: 'rgba(139,92,246,0.12)',  color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' },
  'NFAA Field': { bg: 'rgba(52,211,153,0.12)',  color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' },
  'NFAA Indoor':{ bg: 'rgba(96,165,250,0.12)',  color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)' },
  'Vegas 300':  { bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' },
  'AON':        { bg: 'rgba(255,59,48,0.12)',   color: '#ff6b6b', border: '1px solid rgba(255,59,48,0.2)' },
};
const getBadge = (t: string) => TYPE_BADGE[t] || { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' };

export default function ScorePage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/landing'); return; }
      getSessions(session.user.id).then(data => {
        if (data) {
          setSessions(data.map((s: any) => ({
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
          })));
        }
        setLoading(false);
      }).catch(() => setLoading(false));
    });
  }, []);

  const completedSessions = sessions.filter(s => s.completed).sort((a, b) => b.date - a.date);
  const activeSessions   = sessions.filter(s => !s.completed).sort((a, b) => b.date - a.date);

  const avgScore = completedSessions.length > 0
    ? completedSessions.reduce((sum, s) => sum + s.totalScore, 0) / completedSessions.length
    : null;
  const totalArrows = completedSessions.reduce((sum, s) => sum + s.totalTargets, 0);

  if (loading) return (
    <div style={{ background: '#0f1117', minHeight: '100vh' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ height: 64, background: 'rgba(255,255,255,0.04)', borderRadius: 16, animation: 'pulse 1.5s infinite' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {[1,2,3].map(i => <div key={i} style={{ height: 84, background: 'rgba(255,255,255,0.04)', borderRadius: 16, animation: 'pulse 1.5s infinite' }} />)}
        </div>
        <div style={{ height: 320, background: 'rgba(255,255,255,0.04)', borderRadius: 16, animation: 'pulse 1.5s infinite' }} />
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; box-sizing: border-box; }
        body { margin: 0; background: #0f1117; min-height: 100vh; color: #fff; }
        .main-btn {
          width: 100%; padding: 15px 20px; background: #ff5e1a; color: white; border: none;
          border-radius: 14px; font-size: 15px; font-weight: 700; font-family: 'Inter', sans-serif;
          cursor: pointer; box-shadow: 0 4px 20px rgba(255,94,26,0.25); transition: all 0.15s;
          display: flex; align-items: center; justify-content: space-between;
        }
        .main-btn:hover { background: #e04d0e; box-shadow: 0 6px 24px rgba(255,94,26,0.35); }
        .session-card {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px; cursor: pointer; transition: background 0.15s, border-color 0.15s;
        }
        .session-card:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,94,26,0.25); }
        .stat-card {
          background: rgba(255,255,255,0.04); border-radius: 16px; padding: 16px;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .section-label {
          font-size: 11px; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: rgba(255,255,255,0.25);
        }
      `}</style>

      <div style={{ background: '#0f1117', minHeight: '100vh' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', paddingBottom: 120, position: 'relative' }}>

          {/* AMBIENT GLOW */}
          <div style={{
            position: 'absolute', top: -100, left: -100,
            width: 400, height: 400, pointerEvents: 'none',
            background: 'radial-gradient(circle, rgba(255,94,26,0.08) 0%, transparent 70%)',
          }} />

          {/* HERO */}
          <div style={{ padding: '32px 24px 20px', position: 'relative' }}>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: 500, marginBottom: 6 }}>
              Good session,
            </div>
            <h2 style={{ fontSize: 40, fontWeight: 900, color: '#fff', letterSpacing: '-1.5px', lineHeight: 1.0, margin: 0, textTransform: 'uppercase' }}>
              PRECISION <span style={{ color: '#ff5e1a' }}>TRACKING</span>
            </h2>
          </div>

          <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* START BUTTON */}
            <button className="main-btn" onClick={() => router.push('/score/new')}>
              <span>+ Start New Session</span>
              <span style={{ fontSize: 18, opacity: 0.7 }}>→</span>
            </button>

            {/* STATS ROW */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>

              <div className="stat-card">
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>Avg Score</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                  {avgScore !== null ? avgScore.toFixed(1) : '—'}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>
                  {completedSessions.length > 0 ? `${completedSessions.length} sessions` : 'no data'}
                </div>
              </div>

              <div className="stat-card">
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>Total Arrows</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                  {totalArrows > 0 ? totalArrows : '—'}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>all time</div>
              </div>

              <div className="stat-card">
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>Last Session</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                  {completedSessions.length > 0 ? completedSessions[0].totalScore : '—'}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>
                  {completedSessions.length > 0 ? completedSessions[0].targetType : 'none yet'}
                </div>
              </div>
            </div>

            {/* SESSIONS LIST */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sessions.length === 0 ? (
                <div style={{
                  background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '40px 24px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid rgba(255,255,255,0.06)', minHeight: 200,
                }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 8, textAlign: 'center' }}>No sessions yet</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', textAlign: 'center', maxWidth: 220, lineHeight: 1.6, marginBottom: 24 }}>
                    Start your first session to begin tracking.
                  </div>
                  <button className="main-btn" style={{ width: 'auto', padding: '12px 22px' }} onClick={() => router.push('/score/new')}>
                    <span>+ Start New Session</span>
                    <span style={{ fontSize: 16, opacity: 0.7, marginLeft: 8 }}>→</span>
                  </button>
                </div>
              ) : (
                <>
                  {activeSessions.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div className="section-label" style={{ marginBottom: 4 }}>In Progress</div>
                      {activeSessions.map(s => {
                        const done = s.targets.filter((t: any) => t.score !== null).length;
                        const badge = getBadge(s.targetType);
                        return (
                          <div key={s.id} className="session-card" onClick={() => router.push(`/score/${s.id}`)}>
                            <div style={{ padding: '16px 18px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: badge.color, background: badge.bg, padding: '3px 8px', borderRadius: 6, border: badge.border }}>{s.targetType}</span>
                                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{new Date(s.date).toLocaleDateString()}</span>
                                  </div>
                                  <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginTop: 6 }}>{s.sessionName || s.bowName}</div>
                                  {s.sessionName && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{s.bowName}</div>}
                                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>
                                    {done} / {s.totalTargets} targets · {s.totalScore} pts
                                  </div>
                                </div>
                                <div style={{ flexShrink: 0, paddingTop: 2 }}>
                                  <div style={{ fontSize: 12, color: '#ff5e1a', fontWeight: 700 }}>Resume →</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {completedSessions.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {activeSessions.length > 0 && <div style={{ height: 6 }} />}
                      <div className="section-label" style={{ marginBottom: 4 }}>Past Sessions</div>
                      {completedSessions.map(s => {
                        const maxScore = s.totalTargets * getMaxPerTarget(s.targetType);
                        const pct = maxScore > 0 ? Math.round((s.totalScore / maxScore) * 100) : 0;
                        const badge = getBadge(s.targetType);
                        return (
                          <div key={s.id} className="session-card" onClick={() => router.push(`/score/${s.id}/summary`)}>
                            <div style={{ padding: '16px 18px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: badge.color, background: badge.bg, padding: '3px 8px', borderRadius: 6, border: badge.border }}>{s.targetType}</span>
                                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{new Date(s.date).toLocaleDateString()}</span>
                                  </div>
                                  <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginTop: 6 }}>{s.sessionName || s.bowName}</div>
                                  {s.sessionName && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{s.bowName}</div>}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{s.totalTargets} targets</span>
                                    {s.misses > 0 && (
                                      <span style={{ fontSize: 12, color: 'rgba(255,59,48,0.8)', fontWeight: 600 }}>
                                        {s.misses} miss{s.misses > 1 ? 'es' : ''}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                  <div style={{ fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: -1, lineHeight: 1 }}>{s.totalScore}</div>
                                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{pct}%</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
