'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';

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
  date: number;
  totalScore: number;
  totalTargets: number;
  misses: number;
  targets: Target[];
  completed: boolean;
}

const SCORE_COLORS: Record<number, string> = {
  12: '#ff5e1a', 10: '#fbbf24', 8: '#34d399', 5: '#60a5fa', 0: '#ff3b30',
};
const SCORE_LABELS: Record<number, string> = {
  12: 'Bull', 10: 'Inner', 8: 'Outer', 5: 'Hit', 0: 'Miss',
};

export default function SummaryPage() {
  const router = useRouter();
  const params = useParams();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('nocked_sessions');
    if (saved) {
      const sessions: Session[] = JSON.parse(saved);
      const found = sessions.find(s => s.id === params.id);
      if (found) {
        // Mark as completed
        if (!found.completed) {
          const updated = { ...found, completed: true };
          const newSessions = sessions.map(s => s.id === updated.id ? updated : s);
          localStorage.setItem('nocked_sessions', JSON.stringify(newSessions));
          setSession(updated);
        } else {
          setSession(found);
        }
      }
    }
  }, [params.id]);

  if (!session) return <div style={{ background: '#141414', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Loading...</div>;

  const scored = session.targets.filter(t => t.score !== null);
  const maxPossible = session.totalTargets * 12;
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

  // Score distribution
  const scoreDist = [12, 10, 8, 5, 0].map(s => ({
    score: s,
    count: scored.filter(t => t.score === s).length,
  }));

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

      <div style={{ maxWidth: 680, margin: '0 auto', paddingBottom: 40 }}>

        {/* HEADER */}
        <div style={{
          padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(20,20,20,0.85)', backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 10,
        }}>
          <Image src="/nocked-logo.png" alt="Nocked" width={38} height={38} style={{ borderRadius: 10, cursor: 'pointer' }} onClick={() => router.push('/score')} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Round Summary</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>{session.bowName} · {session.type} · {new Date(session.date).toLocaleDateString()}</div>
          </div>
        </div>

        <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* HERO SCORE */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,94,26,0.15) 0%, rgba(255,94,26,0.05) 100%)',
            border: '1px solid rgba(255,94,26,0.3)', borderRadius: 20, padding: 24, textAlign: 'center',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>Final Score</div>
            <div style={{ fontSize: 80, fontWeight: 800, color: '#ff5e1a', letterSpacing: -4, lineHeight: 1, textShadow: '0 0 40px rgba(255,94,26,0.4)' }}>{session.totalScore}</div>
            <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>out of {maxPossible}</div>
          </div>

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
                const pct = (dAvg / 12) * 100;
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
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${SCORE_COLORS[score]}20`, border: `1px solid ${SCORE_COLORS[score]}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: SCORE_COLORS[score], flexShrink: 0 }}>{score}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>{SCORE_LABELS[score]}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{count}x</span>
                  </div>
                  <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${scored.length > 0 ? (count / scored.length) * 100 : 0}%`, background: SCORE_COLORS[score], borderRadius: 3 }} />
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
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 60px 60px', padding: '10px 18px', borderTop: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{i + 1}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{t.distance ? `${t.distance} yd` : '—'}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: t.score !== null ? SCORE_COLORS[t.score] : 'rgba(255,255,255,0.2)' }}>
                  {t.score !== null ? t.score : '—'}
                </div>
                <div style={{ fontSize: 10, color: t.score !== null ? SCORE_COLORS[t.score] : 'rgba(255,255,255,0.2)', fontWeight: 600, textTransform: 'uppercase' }}>
                  {t.score !== null ? SCORE_LABELS[t.score] : ''}
                </div>
              </div>
            ))}
          </div>

          <button className="main-btn" onClick={() => router.push('/score/new')}>Start New Session</button>
          <button className="ghost-btn" onClick={() => router.push('/score')}>Back to Sessions</button>
          <button
            onClick={() => {
              if (!confirm('Delete this session? This cannot be undone.')) return;
              const saved = localStorage.getItem('nocked_sessions');
              const sessions = saved ? JSON.parse(saved) : [];
              const updated = sessions.filter((s: any) => s.id !== params.id);
              localStorage.setItem('nocked_sessions', JSON.stringify(updated));
              router.push('/score');
            }}
            style={{
              width: '100%', padding: '13px', background: 'rgba(255,59,48,0.08)',
              color: '#ff3b30', border: '1px solid rgba(255,59,48,0.2)',
              borderRadius: 14, fontSize: 14, fontWeight: 600,
              fontFamily: 'Inter, sans-serif', cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            🗑 Delete Session
          </button>
        </div>
      </div>
    </>
  );
}
