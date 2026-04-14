'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { deleteSession } from '@/lib/db';

interface Target {
  number: number;
  distance: number | null;
  score: number | null;
  notes: string;
}

interface Session {
  id: string;
  bowName: string;
  type: string;
  sessionName: string;
  targetType: string;
  date: number;
  totalScore: number;
  totalTargets: number;
  misses: number;
  targets: Target[];
  completed: boolean;
  weather?: { conditions?: string; windSpeed?: string; windDirection?: string; temperature?: string } | null;
}

const SCORE_COLORS: Record<number, string> = {
  12: '#ff5e1a', 11: '#ff5e1a', 10: '#fbbf24', 9: '#fbbf24', 8: '#34d399',
  7: '#34d399', 5: '#60a5fa', 4: '#60a5fa', 3: '#a78bfa', 2: '#a78bfa', 1: '#a78bfa', 0: '#ff3b30',
};
const SCORE_LABELS: Record<number, string> = {
  12: 'Bull', 11: 'Bull', 10: 'Inner', 9: '9', 8: 'Outer', 7: '7',
  5: 'Hit', 4: 'Inner', 3: 'Outer', 2: '2', 1: 'Edge', 0: 'Miss',
};
const MAX_PER_TARGET: Record<string, number> = {
  'ASA 3D': 12, 'IBO 3D': 11, 'NFAA Field': 5, 'NFAA Indoor': 5, 'Vegas 300': 10, 'AON': 12,
};

export default function SummaryPage() {
  const router = useRouter();
  const params = useParams();
  const [session, setSession] = useState<Session | null>(null);
  const [isPB, setIsPB] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: authSession } }) => {
      if (!authSession) { router.push('/landing'); return; }
      const { data } = await supabase.from('sessions').select('*').eq('id', params.id).single();
      if (data) {
        if (!data.completed) {
          await supabase.from('sessions').update({ completed: true }).eq('id', data.id);
        }
        setSession({
          id: data.id,
          bowName: data.bow_name,
          type: data.type,
          sessionName: data.session_name || '',
          targetType: data.target_type || 'ASA 3D',
          date: data.date,
          totalScore: data.total_score,
          totalTargets: data.total_targets,
          misses: data.misses,
          targets: data.targets,
          completed: true,
          weather: data.weather_conditions || null,
        });

        // Check personal best among same target type
        const { data: prevSessions } = await supabase
          .from('sessions')
          .select('total_score, target_type')
          .eq('user_id', authSession.user.id)
          .eq('completed', true)
          .neq('id', data.id);

        if (prevSessions && prevSessions.length > 0) {
          const sameType = prevSessions.filter((s: any) =>
            (s.target_type || 'ASA 3D') === (data.target_type || 'ASA 3D')
          );
          if (sameType.length > 0) {
            const prevBest = Math.max(...sameType.map((s: any) => s.total_score));
            setIsPB(data.total_score > prevBest);
          }
        }
      }
    });
  }, [params.id]);

  if (!session) return <div style={{ background: '#141414', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Loading...</div>;

  const scored = session.targets.filter(t => t.score !== null);
  const maxPerTarget = MAX_PER_TARGET[session.targetType] || 12;
  const maxPossible = session.totalTargets * maxPerTarget;
  const scorePct = maxPossible > 0 ? session.totalScore / maxPossible : 0;
  const ringColor = scorePct >= 0.8 ? '#34d399' : scorePct >= 0.5 ? '#fbbf24' : '#ff3b30';
  const hitPct = scored.length > 0 ? ((scored.filter(t => t.score! > 0).length / scored.length) * 100).toFixed(0) : '0';
  const avg = scored.length > 0 ? (session.totalScore / scored.length).toFixed(1) : '0';

  // Distance breakdown
  const distGroups: Record<string, { scores: number[]; label: string }> = {
    '0-20': { scores: [], label: '0–20 yd' },
    '21-40': { scores: [], label: '21–40 yd' },
    '41-60': { scores: [], label: '41–60 yd' },
    '61+': { scores: [], label: '61+ yd' },
  };
  scored.forEach(t => {
    if (t.distance === null) return;
    if (t.distance <= 20) distGroups['0-20'].scores.push(t.score!);
    else if (t.distance <= 40) distGroups['21-40'].scores.push(t.score!);
    else if (t.distance <= 60) distGroups['41-60'].scores.push(t.score!);
    else distGroups['61+'].scores.push(t.score!);
  });
  const distStats = Object.entries(distGroups)
    .filter(([, g]) => g.scores.length > 0)
    .map(([key, g]) => ({
      key, label: g.label,
      avg: g.scores.reduce((a, b) => a + b, 0) / g.scores.length,
      count: g.scores.length,
    }))
    .sort((a, b) => a.avg - b.avg);
  const weakest = distStats[0];
  const strongest = distStats[distStats.length - 1];

  // Score distribution (all score values that appear)
  const allScoreValues = [...new Set(scored.map(t => t.score!))].sort((a, b) => b - a);
  const scoreDist = allScoreValues.map(s => ({ score: s, count: scored.filter(t => t.score === s).length }));
  // Also include 0 if it doesn't appear but there are targets
  if (!allScoreValues.includes(0) && scored.length > 0) {
    scoreDist.push({ score: 0, count: 0 });
  }

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
        .main-btn {
          width: 100%; padding: 15px; background: #ff5e1a; color: white; border: none;
          border-radius: 14px; font-size: 15px; font-weight: 700;
          font-family: 'Inter', sans-serif; cursor: pointer;
          box-shadow: 0 4px 24px rgba(255,94,26,0.35); transition: all 0.15s;
        }
        .main-btn:hover { background: #e04d0e; }
        .ghost-btn {
          width: 100%; padding: 13px; background: transparent; color: rgba(255,255,255,0.5);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; font-size: 14px;
          font-weight: 600; font-family: 'Inter', sans-serif; cursor: pointer; transition: all 0.15s;
        }
        .ghost-btn:hover { border-color: rgba(255,255,255,0.3); color: #fff; }
      `}</style>

      <div style={{ maxWidth: 680, margin: '0 auto', paddingBottom: 120 }}>
        <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* HERO SCORE */}
          <div style={{
            background: `linear-gradient(135deg, ${ringColor}18 0%, ${ringColor}08 100%)`,
            border: `1px solid ${ringColor}40`, borderRadius: 20, padding: 24, textAlign: 'center',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: `${ringColor}cc`, background: `${ringColor}18`, padding: '3px 10px', borderRadius: 100, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {session.targetType}
              </span>
              {isPB && (
                <span style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', background: 'rgba(251,191,36,0.15)', padding: '3px 10px', borderRadius: 100, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  🏆 Personal Best
                </span>
              )}
            </div>
            {session.sessionName && (
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{session.sessionName}</div>
            )}
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>
              {session.sessionName ? session.bowName : 'Final Score'}
            </div>
            <div style={{ fontSize: 80, fontWeight: 800, color: ringColor, letterSpacing: -4, lineHeight: 1, textShadow: `0 0 40px ${ringColor}40` }}>{session.totalScore}</div>
            <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>
              out of {maxPossible} — <span style={{ color: ringColor, fontWeight: 700 }}>{Math.round(scorePct * 100)}%</span>
            </div>
          </div>

          {/* WEATHER */}
          {session.weather && (session.weather.conditions || session.weather.windSpeed) && (
            <div className="glass-card" style={{ padding: '16px 18px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ff5e1a', marginBottom: 12 }}>Weather Conditions</div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {session.weather.conditions && (
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
                    {session.weather.conditions === 'Clear' ? '☀️' : session.weather.conditions === 'Cloudy' ? '☁️' : session.weather.conditions === 'Rain' ? '🌧️' : '💨'} {session.weather.conditions}
                  </div>
                )}
                {session.weather.windSpeed && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>💨 {session.weather.windSpeed} mph {session.weather.windDirection}</div>}
                {session.weather.temperature && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>🌡️ {session.weather.temperature}°F</div>}
              </div>
            </div>
          )}

          {/* STAT GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Targets', value: `${scored.length} / ${session.totalTargets}` },
              { label: 'Misses', value: session.misses, color: session.misses > 0 ? '#ff3b30' : '#34d399' },
              { label: 'Hit %', value: `${hitPct}%` },
              { label: 'Avg / Target', value: avg },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: color || '#fff' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* DISTANCE BREAKDOWN */}
          {distStats.length > 0 && (
            <div className="glass-card">
              <div style={{ padding: '16px 18px 8px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ff5e1a', marginBottom: 4 }}>Distance Breakdown</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 14 }}>Average score by distance range</div>
              </div>
              {distStats.map(({ key, label, avg: dAvg, count }) => {
                const isWeakest = weakest && key === weakest.key && distStats.length > 1;
                const isStrongest = strongest && key === strongest.key && distStats.length > 1;
                const pct = (dAvg / maxPerTarget) * 100;
                return (
                  <div key={key} style={{ padding: '12px 18px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{label}</span>
                        {isWeakest && <span style={{ fontSize: 10, fontWeight: 700, color: '#ff3b30', background: 'rgba(255,59,48,0.1)', padding: '2px 7px', borderRadius: 5 }}>WEAKEST</span>}
                        {isStrongest && <span style={{ fontSize: 10, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.1)', padding: '2px 7px', borderRadius: 5 }}>STRONGEST</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{count} targets</span>
                        <span style={{ fontSize: 16, fontWeight: 800, color: isWeakest ? '#ff3b30' : isStrongest ? '#34d399' : '#fff' }}>{dAvg.toFixed(1)}</span>
                      </div>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: isWeakest ? '#ff3b30' : isStrongest ? '#34d399' : '#ff5e1a', borderRadius: 3, transition: 'width 0.5s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* SCORE DISTRIBUTION */}
          <div className="glass-card">
            <div style={{ padding: '16px 18px 8px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ff5e1a', marginBottom: 14 }}>Score Distribution</div>
            </div>
            {scoreDist.map(({ score, count }) => (
              <div key={score} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${SCORE_COLORS[score] || '#888'}20`, border: `1px solid ${SCORE_COLORS[score] || '#888'}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: SCORE_COLORS[score] || '#888', flexShrink: 0 }}>{score}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>{SCORE_LABELS[score] || score}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{count}x</span>
                  </div>
                  <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${scored.length > 0 ? (count / scored.length) * 100 : 0}%`, background: SCORE_COLORS[score] || '#888', borderRadius: 3 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* TARGET SCORECARD */}
          <div className="glass-card">
            <div style={{ padding: '16px 18px 8px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ff5e1a', marginBottom: 4 }}>Full Scorecard</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 60px 60px', padding: '8px 18px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
              {['#', 'Distance', 'Score', ''].map(h => (
                <div key={h} style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</div>
              ))}
            </div>
            {session.targets.map((t, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 60px 60px', padding: '10px 18px', borderTop: '1px solid rgba(255,255,255,0.04)', alignItems: 'start' }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 600, paddingTop: 2 }}>{i + 1}</div>
                <div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{t.distance ? `${t.distance} yd` : '—'}</div>
                  {t.notes && (
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 3, fontStyle: 'italic' }}>{t.notes}</div>
                  )}
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: t.score !== null ? (SCORE_COLORS[t.score] || '#fff') : 'rgba(255,255,255,0.2)', paddingTop: 2 }}>
                  {t.score !== null ? t.score : '—'}
                </div>
                <div style={{ fontSize: 10, color: t.score !== null ? (SCORE_COLORS[t.score] || '#fff') : 'rgba(255,255,255,0.2)', fontWeight: 600, textTransform: 'uppercase', paddingTop: 4 }}>
                  {t.score !== null ? SCORE_LABELS[t.score] || '' : ''}
                </div>
              </div>
            ))}
          </div>

          <button className="main-btn" onClick={() => router.push('/score/new')}>Start New Session</button>
          <button className="ghost-btn" onClick={() => router.push('/score')}>Back to Sessions</button>
          <button
            onClick={() => router.push(`/score/${params.id}`)}
            style={{ width: '100%', padding: '13px', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, fontSize: 14, fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer', transition: 'all 0.15s' }}
          >
            Edit Targets
          </button>
          <button
            onClick={async () => {
              if (!confirm('Delete this session? This cannot be undone.')) return;
              await deleteSession(params.id as string).catch(console.error);
              router.push('/score');
            }}
            style={{ width: '100%', padding: '13px', background: 'rgba(255,59,48,0.08)', color: '#ff3b30', border: '1px solid rgba(255,59,48,0.2)', borderRadius: 14, fontSize: 14, fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer', transition: 'all 0.15s' }}
          >
            Delete Session
          </button>
        </div>
      </div>
    </>
  );
}
