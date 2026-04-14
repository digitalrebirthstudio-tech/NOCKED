'use client';

import { useState, useEffect, useRef } from 'react';
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
  sessionName: string;
  targetType: string;
  yardageType?: 'known' | 'unknown';
  date: number;
  totalScore: number;
  totalTargets: number;
  misses: number;
  targets: Target[];
  completed: boolean;
}

const SCORE_SYSTEMS: Record<string, { values: number[]; labels: Record<number, string>; colors: Record<number, string> }> = {
  'ASA 3D': {
    values: [12, 10, 8, 5, 0],
    labels: { 12: 'Bull', 10: 'Inner', 8: 'Outer', 5: 'Hit', 0: 'Miss' },
    colors: { 12: '#ff5e1a', 10: '#fbbf24', 8: '#34d399', 5: '#60a5fa', 0: '#ff3b30' },
  },
  'IBO 3D': {
    values: [11, 10, 8, 5, 0],
    labels: { 11: 'Bull', 10: 'Inner', 8: 'Outer', 5: 'Hit', 0: 'Miss' },
    colors: { 11: '#ff5e1a', 10: '#fbbf24', 8: '#34d399', 5: '#60a5fa', 0: '#ff3b30' },
  },
  'NFAA Field': {
    values: [5, 4, 3, 0],
    labels: { 5: 'Bull', 4: 'Inner', 3: 'Outer', 0: 'Miss' },
    colors: { 5: '#ff5e1a', 4: '#fbbf24', 3: '#34d399', 0: '#ff3b30' },
  },
  'NFAA Indoor': {
    values: [5, 4, 3, 2, 1],
    labels: { 5: 'Bull', 4: '4', 3: '3', 2: '2', 1: 'Edge' },
    colors: { 5: '#ff5e1a', 4: '#fbbf24', 3: '#34d399', 2: '#60a5fa', 1: '#a78bfa' },
  },
  'Vegas 300': {
    values: [10, 9, 8, 7, 0],
    labels: { 10: 'X/10', 9: '9', 8: '8', 7: '7', 0: 'Miss' },
    colors: { 10: '#ff5e1a', 9: '#fbbf24', 8: '#34d399', 7: '#60a5fa', 0: '#ff3b30' },
  },
  'AON': {
    values: [12, 5],
    labels: { 12: 'Kill', 5: 'Hit' },
    colors: { 12: '#ff5e1a', 5: '#ff3b30' },
  },
};
const DEFAULT_SYSTEM = SCORE_SYSTEMS['ASA 3D'];

export default function SessionPage() {
  const router = useRouter();
  const params = useParams();
  const [session, setSession] = useState<Session | null>(null);
  const [currentTarget, setCurrentTarget] = useState(0);
  const [localDistance, setLocalDistance] = useState('');
  const [localNotes, setLocalNotes] = useState('');
  const [flashing, setFlashing] = useState(false);
  const touchStartX = useRef(0);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: authSession } }) => {
      if (!authSession) { router.push('/landing'); return; }
      const { data } = await supabase.from('sessions').select('*').eq('id', params.id).single();
      if (data) {
        const mapped: Session = {
          id: data.id,
          bowName: data.bow_name,
          bowId: data.bow_id,
          type: data.type,
          sessionName: data.session_name || '',
          targetType: data.target_type || 'ASA 3D',
          yardageType: data.yardage_type || 'known',
          date: data.date,
          totalScore: data.total_score,
          totalTargets: data.total_targets,
          misses: data.misses,
          targets: data.targets,
          completed: data.completed,
        };
        setSession(mapped);
        const firstIncomplete = mapped.targets.findIndex((t: any) => t.score === null);
        const startIdx = firstIncomplete >= 0 ? firstIncomplete : 0;
        setCurrentTarget(startIdx);
        const startTarget = mapped.targets[startIdx];
        setLocalDistance(startTarget?.distance ? String(startTarget.distance) : '');
        setLocalNotes(startTarget?.notes || '');
      }
    });
  }, [params.id]);

  useEffect(() => {
    if (!session) return;
    setLocalDistance(session.targets[currentTarget]?.distance ? String(session.targets[currentTarget].distance) : '');
    setLocalNotes(session.targets[currentTarget]?.notes || '');
  }, [currentTarget]);

  const saveSessionData = async (updated: Session) => {
    const { data: { session: authSession } } = await supabase.auth.getSession();
    if (authSession) {
      await saveSession(authSession.user.id, updated).catch(console.error);
    }
    setSession(updated);
  };

  const handleScore = (score: number) => {
    if (!session || flashing) return;
    const dist = parseFloat(localDistance) || null;
    const updatedTargets = session.targets.map((t, i) =>
      i === currentTarget ? { ...t, score, distance: dist } : t
    );
    const totalScore = updatedTargets.reduce((sum, t) => sum + (t.score ?? 0), 0);
    const misses = updatedTargets.filter(t => t.score === 0).length;
    const updated = { ...session, targets: updatedTargets, totalScore, misses };
    saveSessionData(updated);

    setFlashing(true);
    setTimeout(() => {
      setFlashing(false);
      if (currentTarget < session.totalTargets - 1) {
        setCurrentTarget(prev => prev + 1);
      }
    }, 500);
  };

  const handleFinish = () => {
    if (!session) return;
    saveSessionData({ ...session, completed: true });
    router.push(`/score/${session.id}/summary`);
  };

  const goToTarget = (idx: number) => {
    if (!session) return;
    setCurrentTarget(idx);
  };

  if (!session) return (
    <div style={{ background: '#141414', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Loading...</div>
  );

  const scoreSystem = SCORE_SYSTEMS[session.targetType] || DEFAULT_SYSTEM;
  const { values: SCORE_VALUES, labels: SCORE_LABELS, colors: SCORE_COLORS } = scoreSystem;
  const target = session.targets[currentTarget];
  const scored = session.targets.filter(t => t.score !== null).length;
  const allScored = scored === session.totalTargets;
  const progress = (scored / session.totalTargets) * 100;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; box-sizing: border-box; }
        body { margin: 0; background: #141414; min-height: 100vh; color: #fff; }
        .score-btn {
          flex: 1; min-height: 76px; border-radius: 16px;
          cursor: pointer; transition: all 0.12s; font-family: 'Inter', sans-serif;
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4;
          border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04);
        }
        .score-btn:active { transform: scale(0.93); }
        .target-dot {
          width: 36px; height: 36px; border-radius: 50%; display: flex;
          align-items: center; justify-content: center; font-size: 11px;
          font-weight: 700; cursor: pointer; transition: all 0.15s;
          flex-shrink: 0; border: 1px solid transparent;
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
        @keyframes flashOut { 0% { opacity: 0.8; } 100% { opacity: 0; } }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>

      {flashing && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(255,94,26,0.18)',
          pointerEvents: 'none', zIndex: 999,
          animation: 'flashOut 0.5s ease forwards',
        }} />
      )}

      <div
        style={{ maxWidth: 680, margin: '0 auto', paddingBottom: 120 }}
        onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={e => {
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          if (dx > 50) goToTarget(Math.max(0, currentTarget - 1));
          else if (dx < -50) goToTarget(Math.min(session.totalTargets - 1, currentTarget + 1));
        }}
      >
        {/* PROGRESS BAR */}
        <div style={{ height: 3, background: 'rgba(255,255,255,0.06)' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: '#ff5e1a', transition: 'width 0.3s' }} />
        </div>

        <div style={{ padding: '12px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* SESSION HEADER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>
                {session.sessionName || session.bowName}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                {session.sessionName ? `${session.bowName} · ` : ''}{session.targetType || 'ASA 3D'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => goToTarget(Math.max(0, currentTarget - 1))}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', width: 36, height: 36, borderRadius: 10, cursor: 'pointer', fontSize: 16, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
              <button onClick={() => goToTarget(Math.min(session.totalTargets - 1, currentTarget + 1))}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', width: 36, height: 36, borderRadius: 10, cursor: 'pointer', fontSize: 16, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>→</button>
            </div>
          </div>

          {/* TARGET DOTS */}
          <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
            <div style={{ display: 'flex', gap: 6, minWidth: 'max-content' }}>
              {session.targets.map((t, i) => {
                const isActive = i === currentTarget;
                const hasScore = t.score !== null;
                const dotColor = hasScore ? SCORE_COLORS[t.score!] : isActive ? '#ff5e1a' : 'rgba(255,255,255,0.2)';
                const bg = hasScore ? `${SCORE_COLORS[t.score!]}25` : isActive ? 'rgba(255,94,26,0.2)' : 'rgba(255,255,255,0.04)';
                return (
                  <div key={i} className="target-dot"
                    style={{ background: bg, borderColor: dotColor, color: dotColor }}
                    onClick={() => goToTarget(i)}>
                    {hasScore ? t.score : i + 1}
                  </div>
                );
              })}
            </div>
          </div>

          {/* TARGET HEADER + RUNNING SCORE */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', borderRadius: 18,
            border: '1px solid rgba(255,255,255,0.07)',
            padding: '20px 24px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#ff5e1a', marginBottom: 2 }}>Target</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <div style={{ fontSize: 72, fontWeight: 900, color: '#fff', letterSpacing: -4, lineHeight: 1 }}>{currentTarget + 1}</div>
                <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>/ {session.totalTargets}</div>
              </div>
              {target.score !== null && (
                <div style={{ fontSize: 12, color: SCORE_COLORS[target.score], fontWeight: 600, marginTop: 4 }}>
                  {SCORE_LABELS[target.score]} — {target.score} pts
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>Score</div>
              <div style={{ fontSize: 48, fontWeight: 900, color: '#fff', letterSpacing: -2, lineHeight: 1 }}>{session.totalScore}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{scored} / {session.totalTargets} scored</div>
            </div>
          </div>

          {/* DISTANCE INPUT */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>
              Distance (yards){session.yardageType === 'unknown' ? <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 500 }}> — optional</span> : ''}
            </div>
            <input className="f-input" type="number"
              placeholder={session.yardageType === 'unknown' ? 'Unknown yardage — enter if known' : 'Enter distance e.g. 35'}
              value={localDistance} onChange={e => setLocalDistance(e.target.value)} />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              {[10, 15, 20, 25, 30, 35, 40, 45, 50].map(d => (
                <button key={d} onClick={() => setLocalDistance(String(d))}
                  style={{
                    padding: '4px 10px', borderRadius: 100,
                    background: localDistance === String(d) ? 'rgba(255,94,26,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${localDistance === String(d) ? '#ff5e1a' : 'rgba(255,255,255,0.08)'}`,
                    color: localDistance === String(d) ? '#ff5e1a' : 'rgba(255,255,255,0.4)',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif', transition: 'all 0.12s',
                  }}>{d}</button>
              ))}
            </div>
          </div>

          {/* SCORE BUTTONS */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>Tap to Score</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {SCORE_VALUES.map(score => (
                <button key={score} className="score-btn"
                  style={{
                    borderColor: target.score === score ? SCORE_COLORS[score] : 'rgba(255,255,255,0.08)',
                    background: target.score === score ? `${SCORE_COLORS[score]}20` : 'rgba(255,255,255,0.04)',
                  }}
                  onClick={() => handleScore(score)}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: SCORE_COLORS[score] }}>{score}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{SCORE_LABELS[score]}</div>
                </button>
              ))}
            </div>
          </div>

          {/* NOTES */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>Notes (optional)</div>
            <textarea
              placeholder="e.g. wind from left, misjudged distance..."
              value={localNotes}
              onChange={e => setLocalNotes(e.target.value)}
              onBlur={e => {
                e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                if (!session) return;
                const updatedTargets = session.targets.map((t, i) =>
                  i === currentTarget ? { ...t, notes: localNotes } : t
                );
                saveSessionData({ ...session, targets: updatedTargets });
              }}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12, padding: '10px 13px', fontSize: 13,
                fontFamily: 'Inter, sans-serif', color: '#fff',
                outline: 'none', resize: 'none', height: 72, transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = '#ff5e1a'}
            />
          </div>

          {allScored && (
            <button className="main-btn" onClick={handleFinish}>View Summary →</button>
          )}
          {session.completed && (
            <button
              style={{ width: '100%', padding: '13px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, fontSize: 14, fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer' }}
              onClick={() => router.push(`/score/${session.id}/summary`)}>
              Back to Summary
            </button>
          )}
        </div>
      </div>
    </>
  );
}
