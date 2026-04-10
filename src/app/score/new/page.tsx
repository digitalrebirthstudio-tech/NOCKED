'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { saveSession, getBows } from '@/lib/db';

interface BowProfile {
  id: string;
  name: string;
}

type SessionType = 'Practice' | '3D Shoot' | 'ASA';

export default function NewSessionPage() {
  const router = useRouter();
  const [bows, setBows] = useState<BowProfile[]>([]);
  const [selectedBowId, setSelectedBowId] = useState('');
  const [sessionType, setSessionType] = useState<SessionType>('Practice');
  const [targetCount, setTargetCount] = useState(20);
  const [yardageType, setYardageType] = useState<'known' | 'unknown'>('known');
  const [weather, setWeather] = useState({
    windSpeed: '',
    windDirection: '',
    temperature: '',
    conditions: 'Clear' as 'Clear' | 'Cloudy' | 'Rain' | 'Windy',
  });

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/landing'); return; }
      const data = await getBows(session.user.id).catch(() => []);
      if (data && data.length > 0) {
        const mapped = data.map((b: any) => ({
          id: b.id,
          name: b.name,
        }));
        setBows(mapped);
        setSelectedBowId(mapped[0].id);
      }
    });
  }, []);

  const SESSION_TYPES: { type: SessionType; emoji: string; desc: string; defaultTargets: number }[] = [
    { type: 'Practice', emoji: '🏠', desc: 'Home or range practice — manual distances', defaultTargets: 10 },
    { type: '3D Shoot', emoji: '🦌', desc: '3D course — manual distances per target', defaultTargets: 20 },
    { type: 'ASA', emoji: '🏆', desc: 'ASA style — 20 targets, manual distances', defaultTargets: 20 },
  ];

  const handleStart = async () => {
    const bow = bows.find(b => b.id === selectedBowId);
    const targets = Array.from({ length: targetCount }, (_, i) => ({
      number: i + 1, distance: null, score: null, notes: '',
    }));
    const session = {
      id: crypto.randomUUID(),
      bowId: bow?.id || '',
      bowName: bow?.name || 'No Bow',
      type: sessionType,
      yardageType: yardageType,
      date: Date.now(),
      totalScore: 0,
      totalTargets: targetCount,
      misses: 0,
      targets,
      completed: false,
      weather: weather,
    };
    const { data: { session: authSession } } = await supabase.auth.getSession();
    if (authSession) {
      await saveSession(authSession.user.id, session).catch(console.error);
    }
    router.push(`/score/${session.id}`);
  };

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
        .type-card {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px; padding: 16px; cursor: pointer; transition: all 0.15s;
        }
        .type-card:hover { background: rgba(255,255,255,0.07); }
        .type-card.active { border-color: #ff5e1a; background: rgba(255,94,26,0.08); }
        .f-input {
          width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px; padding: 11px 13px; font-size: 14px; font-weight: 500;
          font-family: 'Inter', sans-serif; color: #fff; outline: none; transition: all 0.15s;
        }
        .f-input:focus { border-color: #ff5e1a; }
        select.f-input option { background: #1e1e1e; }
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


        <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* SESSION TYPE */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>Session Type</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SESSION_TYPES.map(({ type, emoji, desc, defaultTargets }) => (
                <div key={type} className={`type-card${sessionType === type ? ' active' : ''}`}
                  onClick={() => { setSessionType(type); setTargetCount(defaultTargets); }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: 24 }}>{emoji}</div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{type}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{desc}</div>
                    </div>
                    {sessionType === type && (
                      <div style={{ marginLeft: 'auto', width: 20, height: 20, background: '#ff5e1a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'white', fontWeight: 800 }}>✓</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* YARDAGE TYPE */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>Yardage Type</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { type: 'known' as const, emoji: '📏', title: 'Known Yardage', desc: 'You know the exact distance to each target' },
                { type: 'unknown' as const, emoji: '🎯', title: 'Unknown Yardage', desc: 'Distances are not marked — common in 3D shoots' },
              ].map(({ type, emoji, title, desc }) => (
                <div
                  key={type}
                  onClick={() => setYardageType(type)}
                  style={{
                    background: yardageType === type ? 'rgba(255,94,26,0.08)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${yardageType === type ? '#ff5e1a' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 14, padding: '16px 20px', cursor: 'pointer', transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', gap: 14,
                  }}
                >
                  <div style={{ fontSize: 28 }}>{emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{title}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{desc}</div>
                  </div>
                  {yardageType === type && (
                    <div style={{ width: 20, height: 20, background: '#ff5e1a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'white', fontWeight: 800, flexShrink: 0 }}>✓</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* WEATHER */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>Weather Conditions (optional)</div>
            <div className="glass-card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                {(['Clear', 'Cloudy', 'Rain', 'Windy'] as const).map(c => (
                  <button key={c} onClick={() => setWeather(w => ({ ...w, conditions: c }))}
                    style={{
                      padding: '6px 14px', borderRadius: 100, border: '1px solid',
                      borderColor: weather.conditions === c ? '#ff5e1a' : 'rgba(255,255,255,0.08)',
                      background: weather.conditions === c ? 'rgba(255,94,26,0.15)' : 'rgba(255,255,255,0.04)',
                      color: weather.conditions === c ? '#ff5e1a' : 'rgba(255,255,255,0.5)',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
                    }}>
                    {c === 'Clear' ? '☀️' : c === 'Cloudy' ? '☁️' : c === 'Rain' ? '🌧️' : '💨'} {c}
                  </button>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', marginBottom: 5 }}>Wind Speed (mph)</div>
                  <input className="f-input" type="number" placeholder="e.g. 10"
                    value={weather.windSpeed}
                    onChange={e => setWeather(w => ({ ...w, windSpeed: e.target.value }))} />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', marginBottom: 5 }}>Wind Direction</div>
                  <input className="f-input" type="text" placeholder="e.g. NW"
                    value={weather.windDirection}
                    onChange={e => setWeather(w => ({ ...w, windDirection: e.target.value }))} />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', marginBottom: 5 }}>Temperature (°F)</div>
                  <input className="f-input" type="number" placeholder="e.g. 65"
                    value={weather.temperature}
                    onChange={e => setWeather(w => ({ ...w, temperature: e.target.value }))} />
                </div>
              </div>
            </div>
          </div>

          {/* BOW SELECT */}
          <div className="glass-card">
            <div style={{ padding: '16px 18px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ff5e1a', marginBottom: 12 }}>Select Bow</div>
              {bows.length === 0 ? (
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', padding: '10px 0' }}>
                  No bows saved — session will continue without a linked bow.
                </div>
              ) : (
                <select className="f-input" value={selectedBowId} onChange={e => setSelectedBowId(e.target.value)}>
                  <option value="">No bow selected</option>
                  {bows.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              )}
            </div>
          </div>

          {/* TARGET COUNT */}
          <div className="glass-card">
            <div style={{ padding: '16px 18px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ff5e1a', marginBottom: 12 }}>Number of Targets</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[10, 15, 20, 25, 30, 40].map(n => (
                  <button key={n} onClick={() => setTargetCount(n)}
                    style={{
                      padding: '8px 16px', borderRadius: 10, border: '1px solid',
                      borderColor: targetCount === n ? '#ff5e1a' : 'rgba(255,255,255,0.08)',
                      background: targetCount === n ? 'rgba(255,94,26,0.15)' : 'rgba(255,255,255,0.04)',
                      color: targetCount === n ? '#ff5e1a' : 'rgba(255,255,255,0.5)',
                      fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                      transition: 'all 0.15s',
                    }}>{n}</button>
                ))}
                <input type="number" placeholder="Custom"
                  style={{
                    width: 90, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10, padding: '8px 12px', fontSize: 14, fontWeight: 600,
                    color: '#fff', outline: 'none', fontFamily: 'Inter, sans-serif',
                  }}
                  onChange={e => setTargetCount(parseInt(e.target.value) || 20)} />
              </div>
            </div>
          </div>

          <button className="main-btn" onClick={handleStart}>Start Session →</button>
          <button className="ghost-btn" onClick={() => router.push('/score')}>Cancel</button>
        </div>
      </div>
    </>
  );
}
