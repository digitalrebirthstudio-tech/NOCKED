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
  'ASA 3D':     { bg: 'rgba(255,94,26,0.15)',   color: '#ff8a50' },
  'IBO 3D':     { bg: 'rgba(139,92,246,0.15)',  color: '#a78bfa' },
  'NFAA Field': { bg: 'rgba(52,211,153,0.15)',  color: '#34d399' },
  'NFAA Indoor':{ bg: 'rgba(96,165,250,0.15)',  color: '#60a5fa' },
  'Vegas 300':  { bg: 'rgba(251,191,36,0.15)',  color: '#fbbf24' },
  'AON':        { bg: 'rgba(255,59,48,0.15)',   color: '#ff6b6b' },
};
const getBadge = (t: string) => TYPE_BADGE[t] || { bg: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' };

const CARD: React.CSSProperties = {
  background: '#1c1c1e',
  borderRadius: 20,
  boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
};

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
    <div style={{ background: '#0a0a0f', minHeight: '100vh' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '28px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ height: 72, ...CARD, animation: 'pulse 1.5s infinite' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {[1,2,3].map(i => <div key={i} style={{ height: 88, ...CARD, animation: 'pulse 1.5s infinite' }} />)}
        </div>
        {[1,2,3].map(i => <div key={i} style={{ height: 92, ...CARD, animation: 'pulse 1.5s infinite' }} />)}
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; box-sizing: border-box; }
        body { margin: 0; background: #0a0a0f; min-height: 100vh; color: #fff; }
        .new-btn {
          width: 100%; padding: 18px; background: #ff5e1a; color: #fff; border: none;
          border-radius: 20px; font-size: 16px; font-weight: 700; font-family: 'Inter', sans-serif;
          cursor: pointer; box-shadow: 0 8px 24px rgba(255,94,26,0.3); transition: all 0.15s;
        }
        .new-btn:hover { background: #e04d0e; }
        .session-card {
          background: linear-gradient(135deg, #1c1c1e 0%, #1a1a22 100%);
          border-radius: 20px; cursor: pointer; transition: background 0.15s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        }
        .session-card:hover { background: #252528; }
        .section-label {
          font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.35);
        }
      `}</style>

      <div style={{ background: '#0a0a0f', minHeight: '100vh' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', paddingBottom: 120 }}>

          {/* HERO */}
          <div style={{ padding: '36px 20px 20px' }}>
            <h2 style={{ fontSize: 36, fontWeight: 900, fontStyle: 'italic', letterSpacing: '-1px', textTransform: 'uppercase', margin: 0, lineHeight: 1.1 }}>
              <span style={{ color: '#fff' }}>PRECISION </span>
              <span style={{ color: '#ff5e1a' }}>TRACKING</span>
            </h2>
          </div>

          <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* START BUTTON */}
            <button className="new-btn" onClick={() => router.push('/score/new')}>
              Start New Session
            </button>

            {/* STATS ROW */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>

              <div style={{ ...CARD, padding: 16, background: 'linear-gradient(135deg, #1c1c1e 0%, #1c1c1e 100%)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at top right, rgba(255,94,26,0.15) 0%, transparent 60%)', pointerEvents: 'none' }} />
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 500, marginBottom: 8 }}>Avg Score</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                  {avgScore !== null ? avgScore.toFixed(1) : '—'}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>
                  {completedSessions.length > 0 ? `${completedSessions.length} sessions` : 'no data'}
                </div>
              </div>

              <div style={{ ...CARD, padding: 16, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at top right, rgba(255,255,255,0.05) 0%, transparent 60%)', pointerEvents: 'none' }} />
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 500, marginBottom: 8 }}>Total Arrows</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                  {totalArrows > 0 ? totalArrows : '—'}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>all time</div>
              </div>

              <div style={{ ...CARD, padding: 16, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at top right, rgba(255,94,26,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 500, marginBottom: 8 }}>Last Session</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                  {completedSessions.length > 0 ? completedSessions[0].totalScore : '—'}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>
                  {completedSessions.length > 0 ? completedSessions[0].targetType : 'none yet'}
                </div>
              </div>
            </div>

            {/* SESSIONS LIST */}
            {sessions.length === 0 ? (
              <div style={{ ...CARD, padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 8, textAlign: 'center' }}>No sessions yet</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', textAlign: 'center', maxWidth: 220, lineHeight: 1.6 }}>
                  Start your first session to begin tracking.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                {activeSessions.length > 0 && (
                  <>
                    <div className="section-label" style={{ marginBottom: 2 }}>In Progress</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {activeSessions.map(s => {
                        const done = s.targets.filter((t: any) => t.score !== null).length;
                        const badge = getBadge(s.targetType);
                        return (
                          <div key={s.id} className="session-card" onClick={() => router.push(`/score/${s.id}`)}>
                            <div style={{ padding: '18px 20px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: badge.color, background: badge.bg, padding: '4px 10px', borderRadius: 100 }}>{s.targetType}</span>
                                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{new Date(s.date).toLocaleDateString()}</span>
                              </div>
                              <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginTop: 8 }}>{s.sessionName || s.bowName}</div>
                              {s.sessionName && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{s.bowName}</div>}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10 }}>
                                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
                                  {done} / {s.totalTargets} targets
                                </div>
                                <div style={{ fontSize: 13, color: '#ff5e1a', fontWeight: 600 }}>Resume →</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {completedSessions.length > 0 && (
                  <>
                    {activeSessions.length > 0 && <div style={{ height: 4 }} />}
                    <div className="section-label" style={{ marginBottom: 2 }}>Past Sessions</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {completedSessions.map(s => {
                        const maxScore = s.totalTargets * getMaxPerTarget(s.targetType);
                        const pct = maxScore > 0 ? Math.round((s.totalScore / maxScore) * 100) : 0;
                        const badge = getBadge(s.targetType);
                        return (
                          <div key={s.id} className="session-card" onClick={() => router.push(`/score/${s.id}/summary`)}>
                            <div style={{ padding: '18px 20px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: badge.color, background: badge.bg, padding: '4px 10px', borderRadius: 100 }}>{s.targetType}</span>
                                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{new Date(s.date).toLocaleDateString()}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 }}>
                                <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
                                  <div style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>{s.sessionName || s.bowName}</div>
                                  {s.sessionName && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{s.bowName}</div>}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>{s.totalTargets} targets</span>
                                    {s.misses > 0 && (
                                      <span style={{ fontSize: 13, color: 'rgba(255,59,48,0.8)', fontWeight: 600 }}>
                                        {s.misses} miss{s.misses > 1 ? 'es' : ''}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                  <div style={{ fontSize: 34, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{s.totalScore}</div>
                                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{pct}%</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
