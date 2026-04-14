'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getSessions, deleteSession as deleteSessionDB } from '@/lib/db';

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

const TYPE_BADGE: Record<string, { bg: string; color: string }> = {
  'ASA 3D':     { bg: 'rgba(59,130,246,0.15)',  color: '#60a5fa' },
  'IBO 3D':     { bg: 'rgba(139,92,246,0.15)',  color: '#a78bfa' },
  'NFAA Field': { bg: 'rgba(52,211,153,0.15)',  color: '#34d399' },
  'NFAA Indoor':{ bg: 'rgba(52,211,153,0.1)',   color: '#34d399' },
  'Vegas 300':  { bg: 'rgba(251,191,36,0.15)',  color: '#fbbf24' },
  'AON':        { bg: 'rgba(255,94,26,0.15)',   color: '#ff5e1a' },
};
const getBadge = (t: string) => TYPE_BADGE[t] || { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' };

const scorePctColor = (pct: number) => pct >= 80 ? '#34d399' : pct >= 50 ? '#fbbf24' : '#ff3b30';

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

  // Improvement: last session vs second-to-last
  let improvement: number | null = null;
  if (completedSessions.length >= 2) {
    improvement = completedSessions[0].totalScore - completedSessions[1].totalScore;
  }

  if (loading) return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ height: 56, background: 'rgba(255,255,255,0.04)', borderRadius: 14, animation: 'pulse 1.5s infinite' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {[1,2,3].map(i => <div key={i} style={{ height: 88, background: 'rgba(255,255,255,0.04)', borderRadius: 14, animation: 'pulse 1.5s infinite' }} />)}
      </div>
      <div style={{ height: 300, background: 'rgba(255,255,255,0.04)', borderRadius: 18, animation: 'pulse 1.5s infinite' }} />
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        .material-symbols-outlined { font-family: 'Material Symbols Outlined'; font-weight: normal; font-style: normal; font-size: 18px; line-height: 1; }
        * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; box-sizing: border-box; }
        body { margin: 0; background: #141414; min-height: 100vh; color: #fff; }
        .main-btn {
          width: 100%; padding: 16px 20px; background: #ff5e1a; color: white; border: none;
          border-radius: 14px; font-size: 15px; font-weight: 700; font-family: 'Inter', sans-serif;
          cursor: pointer; box-shadow: 0 4px 24px rgba(255,94,26,0.35); transition: all 0.15s;
          display: flex; align-items: center; justify-content: space-between;
        }
        .main-btn:hover { background: #e04d0e; box-shadow: 0 6px 28px rgba(255,94,26,0.45); }
        .session-card {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px; cursor: pointer; transition: all 0.15s; overflow: hidden;
          position: relative;
        }
        .session-card:hover { background: rgba(255,255,255,0.06); border-color: rgba(255,94,26,0.3); }
        .stat-card {
          background: rgba(255,255,255,0.03); border-radius: 14px; padding: 14px 16px;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .section-label {
          display: flex; align-items: center; gap: 10px;
          font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; color: rgba(255,255,255,0.35);
        }
      `}</style>

      <div style={{ maxWidth: 680, margin: '0 auto', paddingBottom: 120 }}>

        {/* HERO */}
        <div style={{ padding: '32px 24px 8px', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse at top left, rgba(255,94,26,0.12) 0%, transparent 60%)',
          }} />
          <h2 style={{ fontSize: 36, fontWeight: 900, color: '#fff', letterSpacing: '-1px', lineHeight: 1.05, margin: 0, textTransform: 'uppercase', position: 'relative' }}>
            PRECISION <span style={{ color: '#ff5e1a' }}>TRACKING</span>
          </h2>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 8, fontWeight: 600, position: 'relative' }}>
            Telemetry Dashboard // v2.0.4
          </p>
        </div>

        <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* START BUTTON */}
          <button className="main-btn" onClick={() => router.push('/score/new')}>
            <span>+ Start New Session</span>
            <span style={{ fontSize: 20, opacity: 0.8 }}>→</span>
          </button>

          {/* STATS ROW */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>

            {/* Avg Score */}
            <div className="stat-card" style={{ borderTop: '2px solid #ff5e1a' }}>
              <span className="material-symbols-outlined" style={{ color: '#ff5e1a', opacity: 0.7, marginBottom: 6, display: 'block' }}>analytics</span>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Avg Score</div>
              {avgScore !== null ? (
                <>
                  <div style={{ fontSize: 32, fontWeight: 900, color: '#ff5e1a', lineHeight: 1 }}>{avgScore.toFixed(1)}</div>
                  {improvement !== null && (
                    <div style={{ fontSize: 10, color: improvement >= 0 ? '#34d399' : '#ff3b30', fontWeight: 600, marginTop: 5 }}>
                      {improvement >= 0 ? '▲' : '▼'} {Math.abs(improvement)} pts vs prev
                    </div>
                  )}
                </>
              ) : (
                <div style={{ height: 28, width: '70%', background: 'rgba(255,255,255,0.06)', borderRadius: 4, marginTop: 4 }} />
              )}
            </div>

            {/* Total Arrows */}
            <div className="stat-card" style={{ borderTop: '2px solid rgba(255,255,255,0.15)' }}>
              <span className="material-symbols-outlined" style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 6, display: 'block' }}>arrow_forward</span>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Total Arrows</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: totalArrows > 0 ? '#fff' : 'rgba(255,255,255,0.15)', lineHeight: 1 }}>
                {totalArrows}
              </div>
            </div>

            {/* Last Session */}
            <div className="stat-card" style={{ borderTop: '2px solid rgba(255,255,255,0.08)' }}>
              <span className="material-symbols-outlined" style={{ color: 'rgba(255,255,255,0.3)', marginBottom: 6, display: 'block' }}>history</span>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Last Session</div>
              {completedSessions.length > 0 ? (
                <>
                  <div style={{ fontSize: 32, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{completedSessions[0].totalScore}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 5 }}>{completedSessions[0].targetType}</div>
                </>
              ) : (
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>None yet</div>
              )}
            </div>
          </div>

          {/* SESSIONS LIST */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {sessions.length === 0 ? (
              <div style={{
                background: 'rgba(20,20,20,1)', borderRadius: 18, padding: 32,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', minHeight: 280, position: 'relative', overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at center, rgba(255,94,26,0.06) 0%, transparent 70%)' }} />
                <div style={{ position: 'absolute', top: 0, right: 0, width: 120, height: 120, borderRight: '1px solid rgba(255,94,26,0.1)', borderTop: '1px solid rgba(255,94,26,0.1)' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: 60, height: 60, borderLeft: '1px solid rgba(255,94,26,0.1)', borderBottom: '1px solid rgba(255,94,26,0.1)' }} />
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, position: 'relative' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 30, color: 'rgba(255,255,255,0.2)' }}>target</span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8, textAlign: 'center', position: 'relative' }}>No sessions yet</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', maxWidth: 240, lineHeight: 1.6, marginBottom: 24, position: 'relative' }}>
                  Your kinetic data is waiting. Start your first session.
                </div>
                <button className="main-btn" style={{ width: 'auto', padding: '12px 24px', position: 'relative' }} onClick={() => router.push('/score/new')}>
                  <span>+ Start New Session</span>
                  <span style={{ fontSize: 18, opacity: 0.8 }}>→</span>
                </button>
              </div>
            ) : (
              <>
                {activeSessions.length > 0 && (
                  <div>
                    <div className="section-label" style={{ marginBottom: 10 }}>
                      <div style={{ width: 20, height: 2, background: '#ff5e1a', borderRadius: 1, flexShrink: 0 }} />
                      In Progress
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {activeSessions.map(s => {
                        const done = s.targets.filter((t: any) => t.score !== null).length;
                        const progressPct = s.totalTargets > 0 ? (done / s.totalTargets) * 100 : 0;
                        const badge = getBadge(s.targetType);
                        return (
                          <div key={s.id} className="session-card" onClick={() => router.push(`/score/${s.id}`)}>
                            <div style={{ padding: '14px 16px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6, flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: badge.color, background: badge.bg, padding: '2px 8px', borderRadius: 6 }}>{s.targetType}</span>
                                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{new Date(s.date).toLocaleDateString()}</span>
                                  </div>
                                  <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 2 }}>{s.sessionName || s.bowName}</div>
                                  {s.sessionName && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>{s.bowName}</div>}
                                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>
                                    {done} / {s.totalTargets} targets · Score: {s.totalScore}
                                  </div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                                  <div style={{ fontSize: 12, color: '#ff5e1a', fontWeight: 700 }}>Resume →</div>
                                </div>
                              </div>
                            </div>
                            {/* Progress bar */}
                            <div style={{ height: 3, background: 'rgba(255,255,255,0.06)' }}>
                              <div style={{ height: '100%', width: `${progressPct}%`, background: '#ff5e1a', transition: 'width 0.4s' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {completedSessions.length > 0 && (
                  <div>
                    <div className="section-label" style={{ marginBottom: 10 }}>
                      <div style={{ width: 20, height: 2, background: '#ff5e1a', borderRadius: 1, flexShrink: 0 }} />
                      Past Sessions
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {completedSessions.map(s => {
                        const maxScore = s.totalTargets * getMaxPerTarget(s.targetType);
                        const pct = maxScore > 0 ? Math.round((s.totalScore / maxScore) * 100) : 0;
                        const accentColor = scorePctColor(pct);
                        const badge = getBadge(s.targetType);
                        return (
                          <div key={s.id} className="session-card"
                            style={{ borderLeft: `3px solid ${accentColor}` }}
                            onClick={() => router.push(`/score/${s.id}/summary`)}>
                            <div style={{ padding: '14px 16px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6, flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: badge.color, background: badge.bg, padding: '2px 8px', borderRadius: 6 }}>{s.targetType}</span>
                                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{new Date(s.date).toLocaleDateString()}</span>
                                  </div>
                                  <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 2 }}>{s.sessionName || s.bowName}</div>
                                  {s.sessionName && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>{s.bowName}</div>}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{s.totalTargets} targets</span>
                                    {s.misses > 0 && (
                                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#ff3b30', fontWeight: 600 }}>
                                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff3b30', display: 'inline-block', flexShrink: 0 }} />
                                        {s.misses} miss{s.misses > 1 ? 'es' : ''}
                                      </span>
                                    )}
                                    {s.misses === 0 && (
                                      <span style={{ fontSize: 12, color: '#34d399', fontWeight: 600 }}>✓ No misses</span>
                                    )}
                                  </div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                  <div style={{ fontSize: 36, fontWeight: 900, color: accentColor, letterSpacing: -1, lineHeight: 1 }}>{s.totalScore}</div>
                                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>{pct}%</div>
                                </div>
                              </div>
                            </div>
                            {/* Score progress bar */}
                            <div style={{ height: 3, background: 'rgba(255,255,255,0.05)' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: accentColor, opacity: 0.7 }} />
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
