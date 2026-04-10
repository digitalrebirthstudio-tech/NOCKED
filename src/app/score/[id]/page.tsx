'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { saveSession } from '@/lib/db';

interface Target {
  number: number;
  distance: number | null;
  score: number | null;
  notes: string;
}

interface Session {
  id: string;
  bowName: string;
  bowId: string;
  type: string;
  date: number;
  totalScore: number;
  totalTargets: number;
  misses: number;
  targets: Target[];
  completed: boolean;
}

const SCORE_VALUES = [12, 10, 8, 5, 0];
const SCORE_LABELS: Record<number, string> = {
  12: 'Bull', 10: 'Inner', 8: 'Outer', 5: 'Hit', 0: 'Miss',
};
const SCORE_COLORS: Record<number, string> = {
  12: '#ff5e1a', 10: '#fbbf24', 8: '#34d399', 5: '#60a5fa', 0: '#ff3b30',
};

export default function SessionPage() {
  const router = useRouter();
  const params = useParams();
  const [session, setSession] = useState<Session | null>(null);
  const [currentTarget, setCurrentTarget] = useState(0);
  const [distanceInput, setDistanceInput] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: authSession } }) => {
      if (!authSession) { router.push('/landing'); return; }
      const { data } = await supabase.from('sessions').select('*').eq('id', params.id).single();
      if (data) {
        const mapped = {
          id: data.id,
          bowName: data.bow_name,
          bowId: data.bow_id,
          type: data.type,
          date: data.date,
          totalScore: data.total_score,
          totalTargets: data.total_targets,
          misses: data.misses,
          targets: data.targets,
          completed: data.completed,
        };
        setSession(mapped);
        const firstIncomplete = mapped.targets.findIndex((t: any) => t.score === null);
        setCurrentTarget(firstIncomplete >= 0 ? firstIncomplete : 0);
      }
    });
  }, [params.id]);

  const saveSessionData = async (updated: Session) => {
    const { data: { session: authSession } } = await supabase.auth.getSession();
    if (authSession) {
      await saveSession(authSession.user.id, updated).catch(console.error);
    }
    setSession(updated);
  };

  const handleScore = (score: number) => {
    if (!session) return;
    const dist = parseFloat(distanceInput) || null;
    const updatedTargets = session.targets.map((t, i) =>
      i === currentTarget ? { ...t, score, distance: dist } : t
    );
    const totalScore = updatedTargets.reduce((sum, t) => sum + (t.score ?? 0), 0);
    const misses = updatedTargets.filter(t => t.score === 0).length;
    const updated = { ...session, targets: updatedTargets, totalScore, misses };
    saveSessionData(updated);

    // Move to next target or finish
    if (currentTarget < session.totalTargets - 1) {
      setCurrentTarget(currentTarget + 1);
      setDistanceInput('');
    }
  };

  const handleFinish = () => {
    if (!session) return;
    const updated = { ...session, completed: true };
    saveSessionData(updated);
    router.push(`/score/${session.id}/summary`);
  };

  const goToTarget = (idx: number) => {
    if (!session) return;
    setCurrentTarget(idx);
    setDistanceInput(session.targets[idx].distance ? String(session.targets[idx].distance) : '');
  };

  if (!session) return <div style={{ background: '#141414', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Loading...</div>;

  const target = session.targets[currentTarget];
  const scored = session.targets.filter(t => t.score !== null).length;
  const progress = (scored / session.totalTargets) * 100;

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
        .score-btn {
          flex: 1; padding: 16px 8px; border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px; background: rgba(255,255,255,0.04);
          cursor: pointer; transition: all 0.15s; font-family: 'Inter', sans-serif;
          display: flex; flex-direction: column; align-items: center; gap: 4;
        }
        .score-btn:hover { transform: translateY(-2px); }
        .score-btn:active { transform: scale(0.96); }
        .target-dot {
          width: 28px; height: 28px; border-radius: 50%; display: flex;
          align-items: center; justify-content: center; font-size: 10px;
          font-weight: 700; cursor: pointer; transition: all 0.15s; border: 1px solid transparent;
          flex-shrink: 0;
        }
        .f-input {
          width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px; padding: 11px 13px; font-size: 14px; font-weight: 500;
          font-family: 'Inter', sans-serif; color: #fff; outline: none; transition: all 0.15s;
        }
        .f-input:focus { border-color: #ff5e1a; }
        .main-btn {
          width: 100%; padding: 15px; background: #ff5e1a; color: white; border: none;
          border-radius: 14px; font-size: 15px; font-weight: 700;
          font-family: 'Inter', sans-serif; cursor: pointer;
          box-shadow: 0 4px 24px rgba(255,94,26,0.35); transition: all 0.15s;
        }
        .main-btn:hover { background: #e04d0e; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>

      <div style={{ maxWidth: 680, margin: '0 auto', paddingBottom: 120 }}>


        {/* PROGRESS BAR */}
        <div style={{ height: 3, background: 'rgba(255,255,255,0.06)' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: '#ff5e1a', transition: 'width 0.3s' }} />
        </div>

        <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* TARGET DOTS */}
          <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
            <div style={{ display: 'flex', gap: 6, minWidth: 'max-content' }}>
              {session.targets.map((t, i) => {
                const isActive = i === currentTarget;
                const hasScore = t.score !== null;
                const bg = hasScore ? (SCORE_COLORS[t.score!] + '30') : isActive ? 'rgba(255,94,26,0.2)' : 'rgba(255,255,255,0.06)';
                const border = isActive ? '#ff5e1a' : hasScore ? SCORE_COLORS[t.score!] : 'rgba(255,255,255,0.1)';
                const color = hasScore ? SCORE_COLORS[t.score!] : isActive ? '#ff5e1a' : 'rgba(255,255,255,0.3)';
                return (
                  <div key={i} className="target-dot" style={{ background: bg, borderColor: border, color }}
                    onClick={() => goToTarget(i)}>
                    {hasScore ? t.score : i + 1}
                  </div>
                );
              })}
            </div>
          </div>

          {/* CURRENT TARGET */}
          <div className="glass-card">
            <div style={{ padding: '20px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ff5e1a' }}>Target {currentTarget + 1}</div>
                  {target.score !== null && (
                    <div style={{ fontSize: 13, color: SCORE_COLORS[target.score], fontWeight: 600, marginTop: 2 }}>
                      Scored: {target.score} — {SCORE_LABELS[target.score]}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => goToTarget(Math.max(0, currentTarget - 1))}
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>←</button>
                  <button onClick={() => goToTarget(Math.min(session.totalTargets - 1, currentTarget + 1))}
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>→</button>
                </div>
              </div>

              {/* DISTANCE INPUT */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>Distance (yards)</div>
                <input className="f-input" type="number" placeholder="Enter distance e.g. 35"
                  value={distanceInput} onChange={e => setDistanceInput(e.target.value)} />
              </div>

              {/* SCORE BUTTONS */}
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', marginBottom: 10 }}>Tap to Score</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {SCORE_VALUES.map(score => (
                  <button key={score} className="score-btn"
                    style={{ borderColor: target.score === score ? SCORE_COLORS[score] : 'rgba(255,255,255,0.08)', background: target.score === score ? `${SCORE_COLORS[score]}20` : 'rgba(255,255,255,0.04)' }}
                    onClick={() => handleScore(score)}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: SCORE_COLORS[score] }}>{score}</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{SCORE_LABELS[score]}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RUNNING STATS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[
              { label: 'Score', value: session.totalScore },
              { label: 'Misses', value: session.misses },
              { label: 'Avg/Target', value: scored > 0 ? (session.totalScore / scored).toFixed(1) : '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{value}</div>
              </div>
            ))}
          </div>

          {scored === session.totalTargets && (
            <button className="main-btn" onClick={handleFinish}>View Summary →</button>
          )}
        </div>
      </div>
    </>
  );
}
