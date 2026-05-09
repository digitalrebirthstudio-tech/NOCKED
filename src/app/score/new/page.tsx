'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { saveSession, getBows } from '@/lib/db';

interface BowProfile {
  id: string;
  name: string;
  arrowSpeed?: number;
}

type SessionType = 'Practice' | '3D Shoot' | 'ASA';

const CARD: React.CSSProperties = {
  background: '#1c1c1e',
  borderRadius: 20,
  overflow: 'hidden',
};

const LABEL: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: 'rgba(255,255,255,0.5)',
  marginBottom: 12,
};

const INPUT: React.CSSProperties = {
  width: '100%',
  background: '#1c1c1e',
  border: 'none',
  borderRadius: 14,
  padding: '14px 16px',
  fontSize: 15,
  fontWeight: 500,
  color: '#fff',
  outline: 'none',
  fontFamily: 'Inter, -apple-system, sans-serif',
  boxSizing: 'border-box',
};

const DOT: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: '#ff5e1a',
  flexShrink: 0,
};

export default function NewSessionPage() {
  const router = useRouter();
  const [bows, setBows] = useState<BowProfile[]>([]);
  const [selectedBowId, setSelectedBowId] = useState('');
  const [sessionType, setSessionType] = useState<SessionType>('Practice');
  const [targetCount, setTargetCount] = useState(20);
  const [yardageType, setYardageType] = useState<'known' | 'unknown'>('known');
  const [sessionName, setSessionName] = useState('');
  const [localSessionName, setLocalSessionName] = useState('');
  const [targetType, setTargetType] = useState('ASA 3D');
  const [customTargets, setCustomTargets] = useState('');
  const [weather, setWeather] = useState({
    windSpeed: '',
    windDirection: '',
    temperature: '',
    conditions: 'Clear' as 'Clear' | 'Cloudy' | 'Rain' | 'Windy',
  });
  const [weatherLoaded, setWeatherLoaded] = useState(false);
  const [weatherError, setWeatherError] = useState(false);

  const fetchWeather = async () => {
    setWeatherError(false);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject)
      );
      const { latitude, longitude } = pos.coords;
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m,wind_direction_10m,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph`
      );
      const data = await res.json();
      const current = data.current;
      const code = current.weather_code;
      const conditions = code === 0 ? 'Clear' : code <= 3 ? 'Cloudy' : code <= 67 ? 'Rain' : 'Windy';
      const dirs = ['N','NE','E','SE','S','SW','W','NW'];
      const windDir = dirs[Math.round(current.wind_direction_10m / 45) % 8];
      setWeather({
        windSpeed: Math.round(current.wind_speed_10m).toString(),
        windDirection: windDir,
        temperature: Math.round(current.temperature_2m).toString(),
        conditions,
      });
      setWeatherLoaded(true);
    } catch {
      setWeatherError(true);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/landing'); return; }
      const data = await getBows(session.user.id).catch(() => []);
      if (data && data.length > 0) {
        const mapped = data.map((b: any) => ({
          id: b.id,
          name: b.name,
          arrowSpeed: b.arrow_speed,
        }));
        setBows(mapped);
        setSelectedBowId(mapped[0].id);
      }
    });
    fetchWeather();
  }, []);

  const SESSION_TYPES: { type: SessionType; emoji: string; desc: string; defaultTargets: number }[] = [
    { type: 'Practice', emoji: '🏠', desc: 'Home or range practice', defaultTargets: 10 },
    { type: '3D Shoot', emoji: '🦌', desc: '3D course, distances per target', defaultTargets: 20 },
    { type: 'ASA', emoji: '🏆', desc: 'ASA style, 20 targets', defaultTargets: 20 },
  ];

  const SCORE_HINTS: Record<string, string> = {
    'ASA 3D': '12 · 10 · 8 · 5 · 0',
    'IBO 3D': '11 · 10 · 8 · 5 · 0',
    'NFAA Field': '5 · 4 · 3 · 0',
    'NFAA Indoor': '5 · 4 · 3 · 2 · 1',
    'Vegas 300': '10 · 9 · 8 · 7 · 0',
    'AON': '12 · 5 only',
  };

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
      sessionName: localSessionName.trim() || sessionName,
      targetType,
      yardageType,
      date: Date.now(),
      totalScore: 0,
      totalTargets: targetCount,
      misses: 0,
      targets,
      completed: false,
      weather,
    };
    const { data: { session: authSession } } = await supabase.auth.getSession();
    if (authSession) {
      await saveSession(authSession.user.id, session).catch(console.error);
    }
    router.push(`/score/${session.id}`);
  };

  const TARGET_PRESETS = [10, 15, 20, 25, 30, 40];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; box-sizing: border-box; }
        body { margin: 0; background: #0a0a0f; min-height: 100vh; color: #fff; }
        input::placeholder { color: rgba(255,255,255,0.25); }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        .row-item { transition: background 0.12s; }
        .row-item:hover { background: rgba(255,255,255,0.04); }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ background: '#0a0a0f', minHeight: '100vh' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', paddingBottom: 120 }}>
          <div style={{ padding: '36px 20px 0' }}>

            {/* HEADER */}
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.1 }}>New Session</h2>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>Configure your round</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* SESSION NAME */}
              <div>
                <div style={LABEL}>Session Name <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.3)' }}>(optional)</span></div>
                <input
                  style={INPUT}
                  type="text"
                  placeholder="e.g. Morning Practice, State Championship..."
                  value={localSessionName}
                  onChange={e => setLocalSessionName(e.target.value)}
                  onBlur={() => setSessionName(localSessionName.trim())}
                />
              </div>

              {/* SCORING SYSTEM */}
              <div>
                <div style={LABEL}>Scoring System</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(['ASA 3D', 'IBO 3D', 'NFAA Field', 'NFAA Indoor', 'Vegas 300', 'AON'] as const).map(t => (
                    <button key={t} onClick={() => setTargetType(t)} style={{
                      padding: '8px 16px', borderRadius: 100, border: 'none',
                      background: targetType === t ? '#ff5e1a' : '#1c1c1e',
                      color: targetType === t ? '#fff' : 'rgba(255,255,255,0.5)',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
                    }}>{t}</button>
                  ))}
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                  {SCORE_HINTS[targetType]}
                </div>
              </div>

              {/* SESSION TYPE */}
              <div>
                <div style={LABEL}>Session Type</div>
                <div style={CARD}>
                  {SESSION_TYPES.map(({ type, emoji, desc, defaultTargets }, i) => {
                    const active = sessionType === type;
                    return (
                      <div key={type} className="row-item" onClick={() => { setSessionType(type); setTargetCount(defaultTargets); }}
                        style={{
                          padding: '16px 20px',
                          display: 'flex', alignItems: 'center', gap: 14,
                          background: active ? 'rgba(255,94,26,0.08)' : 'transparent',
                          borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                          cursor: 'pointer',
                        }}>
                        <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.06)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                          {emoji}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{type}</div>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{desc}</div>
                        </div>
                        {active && <div style={DOT} />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* YARDAGE TYPE */}
              <div>
                <div style={LABEL}>Yardage</div>
                <div style={CARD}>
                  {([
                    { type: 'known' as const, emoji: '📏', title: 'Known Yardage', desc: 'You know the distance to each target' },
                    { type: 'unknown' as const, emoji: '🎯', title: 'Unknown Yardage', desc: 'Distances not marked — common in 3D shoots' },
                  ]).map(({ type, emoji, title, desc }, i) => {
                    const active = yardageType === type;
                    return (
                      <div key={type} className="row-item" onClick={() => setYardageType(type)}
                        style={{
                          padding: '16px 20px',
                          display: 'flex', alignItems: 'center', gap: 14,
                          background: active ? 'rgba(255,94,26,0.08)' : 'transparent',
                          borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                          cursor: 'pointer',
                        }}>
                        <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.06)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                          {emoji}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{title}</div>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{desc}</div>
                        </div>
                        {active && <div style={DOT} />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* BOW */}
              <div>
                <div style={LABEL}>Bow</div>
                {bows.length === 0 ? (
                  <div style={{ ...CARD, padding: '16px 20px' }}>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
                      No bows saved — session will continue without a linked bow.
                    </div>
                  </div>
                ) : (
                  <div style={CARD}>
                    {bows.map((bow, i) => {
                      const active = selectedBowId === bow.id;
                      return (
                        <div key={bow.id} className="row-item" onClick={() => setSelectedBowId(bow.id)}
                          style={{
                            padding: '16px 20px',
                            display: 'flex', alignItems: 'center', gap: 14,
                            background: active ? 'rgba(255,94,26,0.08)' : 'transparent',
                            borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                            cursor: 'pointer',
                          }}>
                          <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.06)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                            🎯
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{bow.name}</div>
                            {bow.arrowSpeed && (
                              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{bow.arrowSpeed} fps</div>
                            )}
                          </div>
                          {active && <div style={DOT} />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* TARGET COUNT */}
              <div>
                <div style={LABEL}>Targets</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {TARGET_PRESETS.map(n => (
                    <button key={n} onClick={() => { setTargetCount(n); setCustomTargets(''); }}
                      style={{
                        padding: 14, borderRadius: 14, border: 'none',
                        background: targetCount === n && !customTargets ? '#ff5e1a' : '#1c1c1e',
                        color: targetCount === n && !customTargets ? '#fff' : 'rgba(255,255,255,0.5)',
                        fontSize: 16, fontWeight: 700, cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
                      }}>{n}</button>
                  ))}
                </div>
                <div style={{ marginTop: 8 }}>
                  <input
                    style={{ ...INPUT, background: customTargets ? '#ff5e1a' : '#1c1c1e', color: customTargets ? '#fff' : undefined }}
                    type="number"
                    placeholder="Custom number..."
                    value={customTargets}
                    onChange={e => {
                      setCustomTargets(e.target.value);
                      const n = parseInt(e.target.value);
                      if (n > 0) setTargetCount(n);
                    }}
                  />
                </div>
              </div>

              {/* WEATHER */}
              <div>
                <div style={LABEL}>Weather</div>
                <div style={{ ...CARD, padding: 20 }}>
                  {!weatherLoaded && !weatherError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
                      <div style={{ width: 16, height: 16, border: '2px solid #ff5e1a', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                      Fetching current weather...
                    </div>
                  )}
                  {weatherError && (
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
                      Could not get location.{' '}
                      <button onClick={fetchWeather} style={{ background: 'none', border: 'none', color: '#ff5e1a', cursor: 'pointer', fontSize: 13, fontFamily: 'Inter, sans-serif', fontWeight: 600, padding: 0 }}>
                        Retry
                      </button>
                    </div>
                  )}
                  {weatherLoaded && (
                    <>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                        {(['Clear', 'Cloudy', 'Rain', 'Windy'] as const).map(c => (
                          <button key={c} onClick={() => setWeather(w => ({ ...w, conditions: c }))}
                            style={{
                              padding: '8px 16px', borderRadius: 100, border: 'none',
                              background: weather.conditions === c ? '#ff5e1a' : 'rgba(255,255,255,0.08)',
                              color: weather.conditions === c ? '#fff' : 'rgba(255,255,255,0.5)',
                              fontSize: 13, fontWeight: 600, cursor: 'pointer',
                              fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
                            }}>
                            {c === 'Clear' ? '☀️' : c === 'Cloudy' ? '☁️' : c === 'Rain' ? '🌧️' : '💨'} {c}
                          </button>
                        ))}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                        {[
                          { label: 'Wind (mph)', key: 'windSpeed' as const, type: 'number' },
                          { label: 'Direction', key: 'windDirection' as const, type: 'text' },
                          { label: 'Temp (°F)', key: 'temperature' as const, type: 'number' },
                        ].map(({ label, key, type }) => (
                          <div key={key}>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 500, marginBottom: 6 }}>{label}</div>
                            <input
                              style={{ ...INPUT, background: 'rgba(255,255,255,0.06)', padding: '10px 12px', fontSize: 14 }}
                              type={type}
                              value={weather[key]}
                              onChange={e => setWeather(w => ({ ...w, [key]: e.target.value }))}
                            />
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: 12, fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
                        Auto-detected · tap to edit
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* ACTIONS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                <button onClick={handleStart} style={{
                  width: '100%', padding: 18, background: '#ff5e1a', color: '#fff',
                  border: 'none', borderRadius: 20, fontSize: 16, fontWeight: 700,
                  fontFamily: 'Inter, sans-serif', cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(255,94,26,0.25)', transition: 'all 0.15s',
                }}>
                  Start Session
                </button>
                <button onClick={() => router.push('/score')} style={{
                  width: '100%', padding: 16, background: '#1c1c1e', color: 'rgba(255,255,255,0.4)',
                  border: 'none', borderRadius: 20, fontSize: 15, fontWeight: 600,
                  fontFamily: 'Inter, sans-serif', cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  Cancel
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
