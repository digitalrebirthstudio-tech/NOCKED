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

function dotStyle(t: Target, isActive: boolean, colors: Record<number, string>): React.CSSProperties {
  if (isActive) return {
    background: '#ff5e1a', color: '#fff',
    boxShadow: '0 0 12px rgba(255,94,26,0.5)',
  };
  if (t.score === null) return {
    background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)',
  };
  const c = colors[t.score];
  return { background: `${c}33`, color: c };
}

export default function SessionPage() {
  const router = useRouter();
  const params = useParams();
  const [session, setSession] = useState<Session | null>(null);
  const [currentTarget, setCurrentTarget] = useState(0);
  const [localDistance, setLocalDistance] = useState('');
  const [localNotes, setLocalNotes] = useState('');
  const [flashing, setFlashing] = useState(false);
  const touchStartX = useRef(0);
  const dotsRef = useRef<HTMLDivElement>(null);

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
  }, [currentTarget, session]);

  // Scroll active dot into view
  useEffect(() => {
    if (!dotsRef.current) return;
    const dot = dotsRef.current.children[currentTarget] as HTMLElement;
    if (dot) dot.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
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
    <div style={{ background: '#0a0a0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>
      Loading...
    </div>
  );

  const scoreSystem = SCORE_SYSTEMS[session.targetType] || DEFAULT_SYSTEM;
  const { values: SCORE_VALUES, labels: SCORE_LABELS, colors: SCORE_COLORS } = scoreSystem;
  const target = session.targets[currentTarget];
  const scored = session.targets.filter(t => t.score !== null).length;
  const allScored = scored === session.totalTargets;

  const DIST_PRESETS = [10, 15, 20, 25, 30, 35, 40, 45, 50];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; box-sizing: border-box; }
        body { margin: 0; background: #0a0a0f; min-height: 100vh; color: #fff; }
        .score-btn {
          flex: 1; padding: 20px 8px; border-radius: 16px; border: none;
          background: #1c1c1e; cursor: pointer; transition: transform 0.12s;
          font-family: 'Inter', sans-serif;
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px;
        }
        .score-btn:active { transform: scale(0.92); }
        .clean-input {
          width: 100%; background: #1c1c1e; border: none; borderRadius: 14px;
          padding: 12px 16px; fontSize: 15px; color: #fff; outline: none;
          font-family: 'Inter', sans-serif; font-size: 15px;
        }
        .clean-input::placeholder { color: rgba(255,255,255,0.25); }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        ::-webkit-scrollbar { width: 0; height: 0; }
        @keyframes flashOut { 0% { opacity: 1; } 100% { opacity: 0; } }
      `}</style>

      {flashing && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(255,94,26,0.15)',
          pointerEvents: 'none', zIndex: 999,
          animation: 'flashOut 0.5s ease forwards',
        }} />
      )}

      {/* STICKY HEADER */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding: '12px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
            {session.sessionName || session.bowName}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
            {session.targetType}
          </div>
        </div>
        <button onClick={handleFinish} style={{
          background: 'rgba(255,94,26,0.15)', color: '#ff5e1a', border: 'none',
          borderRadius: 10, padding: '7px 14px', fontSize: 13, fontWeight: 600,
          fontFamily: 'Inter, sans-serif', cursor: 'pointer',
        }}>
          Finish
        </button>
      </div>

      <div
        style={{ maxWidth: 680, margin: '0 auto', paddingBottom: 120 }}
        onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={e => {
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          if (dx > 50) goToTarget(Math.max(0, currentTarget - 1));
          else if (dx < -50) goToTarget(Math.min(session.totalTargets - 1, currentTarget + 1));
        }}
      >

        {/* RUNNING SCORE BAR */}
        <div style={{
          background: '#1c1c1e', padding: '16px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Score</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{session.totalScore}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Targets</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{scored} / {session.totalTargets}</div>
          </div>
        </div>

        {/* TARGET DOTS */}
        <div style={{ overflowX: 'auto', padding: '12px 20px' }}>
          <div ref={dotsRef} style={{ display: 'flex', gap: 6, minWidth: 'max-content' }}>
            {session.targets.map((t, i) => {
              const isActive = i === currentTarget;
              const ds = dotStyle(t, isActive, SCORE_COLORS);
              return (
                <div key={i} onClick={() => goToTarget(i)} style={{
                  width: 32, height: 32, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  flexShrink: 0, transition: 'all 0.15s',
                  ...ds,
                }}>
                  {t.score !== null ? t.score : i + 1}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 16px' }}>

          {/* TARGET CARD */}
          <div style={{ background: '#1c1c1e', borderRadius: 24, padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#ff5e1a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              Target
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, lineHeight: 1 }}>
              <span style={{ fontSize: 64, fontWeight: 900, color: '#fff', letterSpacing: -3, lineHeight: 1 }}>{currentTarget + 1}</span>
              <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>of {session.totalTargets}</span>
            </div>
            {target.score !== null && (
              <div style={{ marginTop: 10, fontSize: 13, color: SCORE_COLORS[target.score], fontWeight: 600 }}>
                {SCORE_LABELS[target.score]} · {target.score} pts
              </div>
            )}
          </div>

          {/* DISTANCE */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>
              Distance{session.yardageType === 'unknown' ? <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.3)' }}> (optional)</span> : ''}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              {DIST_PRESETS.map(d => (
                <button key={d} onClick={() => setLocalDistance(String(d))} style={{
                  padding: '8px 14px', borderRadius: 100, border: 'none',
                  background: localDistance === String(d) ? '#ff5e1a' : '#1c1c1e',
                  color: localDistance === String(d) ? '#fff' : 'rgba(255,255,255,0.5)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif', transition: 'all 0.12s',
                }}>{d}</button>
              ))}
            </div>
            <input
              className="clean-input"
              style={{ borderRadius: 14 }}
              type="number"
              placeholder={session.yardageType === 'unknown' ? 'Enter distance if known...' : 'Distance in yards...'}
              value={localDistance}
              onChange={e => setLocalDistance(e.target.value)}
            />
          </div>

          {/* SCORE BUTTONS */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>
              Tap to score
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {SCORE_VALUES.map(score => {
                const c = SCORE_COLORS[score];
                const isSelected = target.score === score;
                return (
                  <button key={score} className="score-btn"
                    style={{
                      background: isSelected ? `${c}33` : '#1c1c1e',
                      outline: isSelected ? `1px solid ${c}66` : 'none',
                    }}
                    onClick={() => handleScore(score)}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: c, lineHeight: 1 }}>{score}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {SCORE_LABELS[score]}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* NOTES */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Notes</div>
            <textarea
              className="clean-input"
              placeholder="Wind from left, misjudged distance..."
              value={localNotes}
              onChange={e => setLocalNotes(e.target.value)}
              onBlur={() => {
                if (!session) return;
                const updatedTargets = session.targets.map((t, i) =>
                  i === currentTarget ? { ...t, notes: localNotes } : t
                );
                saveSessionData({ ...session, targets: updatedTargets });
              }}
              style={{
                resize: 'none', height: 80, display: 'block', borderRadius: 14,
              }}
            />
          </div>

          {/* BOTTOM NAVIGATION */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
            <button
              onClick={() => goToTarget(Math.max(0, currentTarget - 1))}
              disabled={currentTarget === 0}
              style={{
                background: 'none', border: 'none', cursor: currentTarget === 0 ? 'default' : 'pointer',
                fontSize: 13, color: currentTarget === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.3)',
                fontFamily: 'Inter, sans-serif', fontWeight: 500, padding: '8px 0',
              }}
            >
              ← Prev
            </button>
            <button
              onClick={() => goToTarget(Math.min(session.totalTargets - 1, currentTarget + 1))}
              disabled={currentTarget === session.totalTargets - 1}
              style={{
                background: 'none', border: 'none', cursor: currentTarget === session.totalTargets - 1 ? 'default' : 'pointer',
                fontSize: 13, color: currentTarget === session.totalTargets - 1 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.3)',
                fontFamily: 'Inter, sans-serif', fontWeight: 500, padding: '8px 0',
              }}
            >
              Next →
            </button>
          </div>

          {allScored && (
            <button onClick={handleFinish} style={{
              width: '100%', padding: 18, background: '#ff5e1a', color: '#fff',
              border: 'none', borderRadius: 20, fontSize: 16, fontWeight: 700,
              fontFamily: 'Inter, sans-serif', cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(255,94,26,0.25)',
            }}>
              View Summary
            </button>
          )}

          {session.completed && !allScored && (
            <button onClick={() => router.push(`/score/${session.id}/summary`)} style={{
              width: '100%', padding: 16, background: '#1c1c1e', color: 'rgba(255,255,255,0.4)',
              border: 'none', borderRadius: 20, fontSize: 15, fontWeight: 600,
              fontFamily: 'Inter, sans-serif', cursor: 'pointer',
            }}>
              Back to Summary
            </button>
          )}

        </div>
      </div>
    </>
  );
}
