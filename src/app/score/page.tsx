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

const TYPE_BADGE: Record<string, { bg: string; color: string }> = {
  'ASA 3D':     { bg: 'rgba(59,130,246,0.15)',  color: '#60a5fa' },
  'IBO 3D':     { bg: 'rgba(139,92,246,0.15)',  color: '#a78bfa' },
  'NFAA Field': { bg: 'rgba(52,211,153,0.15)',  color: '#34d399' },
  'NFAA Indoor':{ bg: 'rgba(52,211,153,0.1)',   color: '#34d399' },
  'Vegas 300':  { bg: 'rgba(251,191,36,0.15)',  color: '#fbbf24' },
  'AON':        { bg: 'rgba(255,94,26,0.15)',   color: '#ff5e1a' },
};
const getBadge = (t: string) => TYPE_BADGE[t] || { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' };

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
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ height: 56, background: 'rgba(255,255,255,0.04)', borderRadius: 14, animation: 'pulse 1.5s infinite' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {[1,2,3].map(i => <div key={i} style={{ height: 76, background: 'rgba(255,255,255,0.04)', borderRadius: 14, animation: 'pulse 1.5s infinite' }} />)}
      </div>
      <div style={{ height: 300, background: 'rgba(255,255,255,0.04)', borderRadius: 18, animation: 'pulse 1.5s infinite' }} />
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
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
          border-radius: 14px; cursor: pointer; transition: border-color 0.15s;
        }
        .session-card:hover { border-color: rgba(255,94,26,0.4); }
        .stat-card {
          background: rgba(255,255,255,0.04); border-radius: 14px; padding: 14px 16px;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .section-label {
          font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; color: rgba(255,255,255,0.3);
        }
      `}</style>

      <div style={{ maxWidth: 680, margin: '0 auto', paddingBottom: 120 }}>

        {/* HERO */}
        <div style={{ padding: '32px 24px 8px' }}>
          <h2 style={{ fontSize: 36, fontWeight: 900, color: '#fff', letterSpacing: '-1px', lineHeight: 1.05, margin: 0, textTransform: 'uppercase' }}>
            PRECISION <span style={{ color: '#ff5e1a' }}>TRACKING</span>
          </h2>
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
            <div className="stat-card">
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Avg Score</div>
              {avgScore !== null ? (
                <>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{avgScore.toFixed(1)}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 5 }}>{completedSessions.length} sessions</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 28, fontWeight: 900, color: 'rgba(255,255,255,0.15)', lineHeight: 1 }}>—</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 5 }}>no data</div>
                </>
              )}
            </div>

            {/* Total Arrows */}
            <div className="stat-card">
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Total Arrows</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: totalArrows > 0 ? '#fff' : 'rgba(255,255,255,0.15)', lineHeight: 1 }}>
                {totalArrows || '—'}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 5 }}>all time</div>
            </div>

            {/* Last Session */}
            <div className="stat-card">
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Last Session</div>
              {completedSessions.length > 0 ? (
                <>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{completedSessions[0].totalScore}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 5 }}>{completedSessions[0].targetType}</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 28, fontWeight: 900, color: 'rgba(255,255,255,0.15)', lineHeight: 1 }}>—</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 5 }}>none yet</div>
                </>
              )}
            </div>
          </div>

          {/* SESSIONS LIST */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sessions.length === 0 ? (
              <div style={{
                background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 32,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', minHeight: 200,
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8, textAlign: 'center' }}>No sessions yet</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', maxWidth: 240, lineHeight: 1.6, marginBottom: 24 }}>
                  Start your first session to begin tracking.
                </div>
                <button className="main-btn" style={{ width: 'auto', padding: '12px 24px' }} onClick={() => router.push('/score/new')}>
                  <span>+ Start New Session</span>
                  <span style={{ fontSize: 18, opacity: 0.8 }}>→</span>
                </button>
              </div>
            ) : (
              <>
                {activeSessions.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="section-label" style={{ marginBottom: 2 }}>In Progress</div>
                    {activeSessions.map(s => {
                      const done = s.targets.filter((t: any) => t.score !== null).length;
                      const badge = getBadge(s.targetType);
                      return (
                        <div key={s.id} className="session-card" onClick={() => router.push(`/score/${s.id}`)}>
                          <div style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6, flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: 10, fontWeight: 700, color: badge.color, background: badge.bg, padding: '2px 8px', borderRadius: 6 }}>{s.targetType}</span>
                                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{new Date(s.date).toLocaleDateString()}</span>
                                </div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{s.sessionName || s.bowName}</div>
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
                        </div>
                      );
                    })}
                  </div>
                )}

                {completedSessions.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {activeSessions.length > 0 && <div style={{ height: 4 }} />}
                    <div className="section-label" style={{ marginBottom: 2 }}>Past Sessions</div>
                    {completedSessions.map(s => {
                      const maxScore = s.totalTargets * getMaxPerTarget(s.targetType);
                      const pct = maxScore > 0 ? Math.round((s.totalScore / maxScore) * 100) : 0;
                      const badge = getBadge(s.targetType);
                      return (
                        <div key={s.id} className="session-card"
                          onClick={() => router.push(`/score/${s.id}/summary`)}>
                          <div style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6, flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: 10, fontWeight: 700, color: badge.color, background: badge.bg, padding: '2px 8px', borderRadius: 6 }}>{s.targetType}</span>
                                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{new Date(s.date).toLocaleDateString()}</span>
                                </div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{s.sessionName || s.bowName}</div>
                                {s.sessionName && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>{s.bowName}</div>}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{s.totalTargets} targets</span>
                                  {s.misses > 0 && (
                                    <span style={{ fontSize: 12, color: '#ff3b30', fontWeight: 600 }}>
                                      {s.misses} miss{s.misses > 1 ? 'es' : ''}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: -1, lineHeight: 1 }}>{s.totalScore}</div>
                                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>{pct}%</div>
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
    </>
  );
}
