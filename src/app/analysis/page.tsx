'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getSessions } from '@/lib/db';

interface Session {
  id: string;
  bowName: string;
  type: string;
  date: number;
  totalScore: number;
  totalTargets: number;
  misses: number;
  targets: any[];
  completed: boolean;
}

type Range = '7d' | '30d' | 'all';

export default function AnalysisPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [range, setRange] = useState<Range>('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/landing'); return; }
      const data = await getSessions(session.user.id).catch(() => []);
      if (data) {
        const mapped = data.map((s: any) => ({
          id: s.id,
          bowName: s.bow_name,
          type: s.type,
          date: s.date,
          totalScore: s.total_score,
          totalTargets: s.total_targets,
          misses: s.misses,
          targets: s.targets || [],
          completed: s.completed,
        })).filter((s: Session) => s.completed);
        setSessions(mapped);
      }
      setLoading(false);
    });
  }, []);

  const now = Date.now();
  const filtered = sessions.filter(s => {
    if (range === '7d') return now - s.date < 7 * 24 * 60 * 60 * 1000;
    if (range === '30d') return now - s.date < 30 * 24 * 60 * 60 * 1000;
    return true;
  }).sort((a, b) => a.date - b.date);

  const totalArrows = filtered.reduce((sum, s) => sum + s.totalTargets, 0);
  const totalMisses = filtered.reduce((sum, s) => sum + s.misses, 0);
  const avgScore = filtered.length > 0
    ? (filtered.reduce((sum, s) => sum + s.totalScore, 0) / filtered.length).toFixed(1)
    : '—';
  const bestScore = filtered.length > 0 ? Math.max(...filtered.map(s => s.totalScore)) : '—';
  const hitPct = totalArrows > 0 ? (((totalArrows - totalMisses) / totalArrows) * 100).toFixed(0) : '—';

  // Distance breakdown across all sessions
  const distGroups: Record<string, { scores: number[]; label: string }> = {
    '0-20': { scores: [], label: '0–20 yd' },
    '21-40': { scores: [], label: '21–40 yd' },
    '41-60': { scores: [], label: '41–60 yd' },
    '61+': { scores: [], label: '61+ yd' },
  };
  filtered.forEach(s => {
    s.targets.forEach((t: any) => {
      if (t.score === null || t.distance === null) return;
      if (t.distance <= 20) distGroups['0-20'].scores.push(t.score);
      else if (t.distance <= 40) distGroups['21-40'].scores.push(t.score);
      else if (t.distance <= 60) distGroups['41-60'].scores.push(t.score);
      else distGroups['61+'].scores.push(t.score);
    });
  });
  const distStats = Object.entries(distGroups)
    .filter(([, g]) => g.scores.length > 0)
    .map(([key, g]) => ({
      key, label: g.label,
      avg: parseFloat((g.scores.reduce((a, b) => a + b, 0) / g.scores.length).toFixed(1)),
      count: g.scores.length,
    })).sort((a, b) => a.avg - b.avg);

  // Line chart
  const chartW = 600, chartH = 160, padL = 40, padR = 16, padT = 16, padB = 32;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;
  const scores = filtered.map(s => s.totalScore);
  const maxScore = scores.length > 0 ? Math.max(...scores, 1) : 1;
  const minScore = scores.length > 0 ? Math.min(...scores) : 0;
  const scoreRange = maxScore - minScore || 1;

  const points = filtered.map((s, i) => {
    const x = padL + (filtered.length > 1 ? (i / (filtered.length - 1)) * innerW : innerW / 2);
    const y = padT + innerH - ((s.totalScore - minScore) / scoreRange) * innerH;
    return { x, y, score: s.totalScore, date: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), session: s };
  });

  const polyline = points.map(p => `${p.x},${p.y}`).join(' ');
  const areaPath = points.length > 0
    ? `M ${points[0].x},${padT + innerH} ` +
      points.map(p => `L ${p.x},${p.y}`).join(' ') +
      ` L ${points[points.length - 1].x},${padT + innerH} Z`
    : '';

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#141414' }}>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Loading...</div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', -apple-system, sans-serif; box-sizing: border-box; }
        body { margin: 0; background: #141414; color: #fff; }
        .glass-card {
          background: rgba(255,255,255,0.04); border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06);
          overflow: hidden;
        }
        .stat-card {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px; padding: 16px;
        }
        .range-btn {
          padding: 6px 16px; border-radius: 8px; border: none;
          font-size: 12px; font-weight: 700; cursor: pointer;
          font-family: 'Inter', sans-serif; transition: all 0.15s;
          letter-spacing: 0.04em; text-transform: uppercase;
        }
      `}</style>

      <div style={{ maxWidth: 680, margin: '0 auto', paddingBottom: 120 }}>
        <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* HERO */}
          <div>
            <h2 style={{ fontSize: 36, fontWeight: 900, color: '#fff', letterSpacing: '-1px', margin: 0, textTransform: 'uppercase' }}>
              PERFORMANCE <span style={{ color: '#ff5e1a' }}>ANALYSIS</span>
            </h2>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 6, fontWeight: 600 }}>
              {filtered.length} sessions analyzed
            </p>
          </div>

          {/* RANGE TOGGLE */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 3, gap: 2, width: 'fit-content' }}>
            {(['7d', '30d', 'all'] as Range[]).map(r => (
              <button key={r} className="range-btn"
                onClick={() => setRange(r)}
                style={{
                  background: range === r ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: range === r ? '#fff' : 'rgba(255,255,255,0.4)',
                  boxShadow: range === r ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
                }}>
                {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : 'All Time'}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="glass-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8 }}>No data yet</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>Complete sessions to see your analysis</div>
            </div>
          ) : (
            <>
              {/* STAT GRID */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Avg Score', value: avgScore, accent: true },
                  { label: 'Best Score', value: bestScore },
                  { label: 'Hit %', value: `${hitPct}%` },
                  { label: 'Sessions', value: filtered.length },
                  { label: 'Total Arrows', value: totalArrows },
                  { label: 'Total Misses', value: totalMisses, danger: totalMisses > 0 },
                ].map(({ label, value, accent, danger }) => (
                  <div key={label} className="stat-card">
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{label}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: accent ? '#ff5e1a' : danger ? '#ff3b30' : '#fff' }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* LINE CHART */}
              <div className="glass-card" style={{ padding: '18px 18px 10px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ff5e1a', marginBottom: 14 }}>Score Trend</div>
                {points.length < 2 ? (
                  <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Need at least 2 sessions to show trend</div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <svg width="100%" viewBox={`0 0 ${chartW} ${chartH}`} style={{ display: 'block' }}>
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ff5e1a" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#ff5e1a" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      {/* Grid lines */}
                      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
                        <g key={i}>
                          <line
                            x1={padL} y1={padT + innerH * t}
                            x2={padL + innerW} y2={padT + innerH * t}
                            stroke="rgba(255,255,255,0.05)" strokeWidth="1"
                          />
                          <text x={padL - 6} y={padT + innerH * t + 4} fill="rgba(255,255,255,0.2)" fontSize="9" textAnchor="end">
                            {Math.round(maxScore - (maxScore - minScore) * t)}
                          </text>
                        </g>
                      ))}

                      {/* Area fill */}
                      <path d={areaPath} fill="url(#areaGrad)" />

                      {/* Line */}
                      <polyline points={polyline} fill="none" stroke="#ff5e1a" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

                      {/* Points */}
                      {points.map((p, i) => (
                        <g key={i}>
                          <circle cx={p.x} cy={p.y} r="4" fill="#ff5e1a" />
                          <circle cx={p.x} cy={p.y} r="7" fill="rgba(255,94,26,0.2)" />
                        </g>
                      ))}

                      {/* X axis labels */}
                      {points.map((p, i) => (
                        i % Math.max(1, Math.floor(points.length / 5)) === 0 && (
                          <text key={i} x={p.x} y={chartH - 4} fill="rgba(255,255,255,0.2)" fontSize="8" textAnchor="middle">{p.date}</text>
                        )
                      ))}
                    </svg>
                  </div>
                )}
              </div>

              {/* DISTANCE BREAKDOWN */}
              {distStats.length > 0 && (
                <div className="glass-card">
                  <div style={{ padding: '16px 18px 8px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ff5e1a', marginBottom: 4 }}>Distance Breakdown</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 14 }}>Average score by distance range</div>
                  </div>
                  {distStats.map(({ key, label, avg, count }, i) => {
                    const isWeakest = i === 0 && distStats.length > 1;
                    const isStrongest = i === distStats.length - 1 && distStats.length > 1;
                    const pct = (avg / 12) * 100;
                    return (
                      <div key={key} style={{ padding: '12px 18px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{label}</span>
                            {isWeakest && <span style={{ fontSize: 10, fontWeight: 700, color: '#ff3b30', background: 'rgba(255,59,48,0.1)', padding: '2px 7px', borderRadius: 5 }}>WEAKEST</span>}
                            {isStrongest && <span style={{ fontSize: 10, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.1)', padding: '2px 7px', borderRadius: 5 }}>STRONGEST</span>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{count} arrows</span>
                            <span style={{ fontSize: 16, fontWeight: 800, color: isWeakest ? '#ff3b30' : isStrongest ? '#34d399' : '#fff' }}>{avg}</span>
                          </div>
                        </div>
                        <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: isWeakest ? '#ff3b30' : isStrongest ? '#34d399' : '#ff5e1a', borderRadius: 3 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* SESSION LIST */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>Session History</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[...filtered].reverse().map(s => (
                    <div key={s.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#ff5e1a', background: 'rgba(255,94,26,0.1)', padding: '2px 8px', borderRadius: 6 }}>{s.type}</span>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{new Date(s.date).toLocaleDateString()}</span>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{s.bowName}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{s.totalTargets} targets · {s.misses} misses</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 28, fontWeight: 800, color: '#ff5e1a', letterSpacing: -1 }}>{s.totalScore}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>/ {s.totalTargets * 12}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
