'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

const DISTANCES = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 90, 100];

const SIGHT_TYPES = [
  { label: '8 Click / Number — ARC Systeme SX10', resolution: 0.003937 },
  { label: '8 Click / Number — Hogg Mob: Father, Boss, Tommy', resolution: 0.00433 },
  { label: '10 Click / 12.5 Turn — Shibuya Dual Click, DC', resolution: 0.008 },
  { label: '10 Click 24 Turn', resolution: 0.00417 },
  { label: '10 Click 32 Turn', resolution: 0.00313 },
  { label: '20 Click / 2.6 Turn — Sure-Loc Phoenix', resolution: 0.01875 },
  { label: '20 Click 24 Turn — Sure-Loc, Shibuya Ultima, Bowfinger 1', resolution: 0.002 },
  { label: '20 Click 24 Turn D20 — CBE Vertex Elevate', resolution: 0.002 },
  { label: '20 Click 32 Turn — Copper John, TRU Ball, Axcel, Sword', resolution: 0.00156 },
  { label: '30 Click / 4 Turn — CBE Rapid Travel 3D', resolution: 0.00833 },
  { label: '30 Click / 16 Turn — CBE', resolution: 0.00208 },
  { label: 'Black Gold Comp', resolution: 0.00156 },
];

const FIELD_DISTANCES = [15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65];
const HUNTER_DISTANCES = [11, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65];
const ANIMAL_DISTANCES = [10, 15, 20, 25, 30, 35, 40, 45, 50];

type GameMode = 'Field' | 'Hunter' | 'Animal' | 'All';
type Screen = 'dashboard' | 'setup' | 'marks' | 'angle';

interface BowProfile {
  id: string;
  name: string;
  bowType?: 'target' | 'hunting';
  arrowSpeed: number;
  arrowWeight: number;
  peepToPin: number;
  peepToArrow: number;
  sightTypeLabel: string;
  sightResolution: number;
  arrowDiameter: number;
  calibDist1: number;
  calibMark1: string;
  calibDist2: number;
  calibMark2: string;
  lastUsed: number;
  marks?: { distance: number; mark: number; drop: number }[];
  drawWeight?: number;
  arrowLength?: number;
  drawLength?: number;
  broadheadWeight?: number;
  pin1?: number; pin2?: number; pin3?: number; pin4?: number; pin5?: number; pin6?: number;
  ke?: number;
}

function calculateSightMarks({
  calibDist1, calibMark1, calibDist2, calibMark2,
  arrowSpeed, peepToPin, peepToArrow, sightResolution,
}: {
  arrowSpeed: number; arrowWeight: number; peepToPin: number;
  peepToArrow: number; calibDist1: number; calibMark1: number;
  calibDist2: number; calibMark2: number; sightResolution: number;
}) {
  const sightRadius = peepToPin - peepToArrow;
  const a = (0.01275 * sightRadius) / (arrowSpeed * arrowSpeed * sightResolution);
  const d1 = calibDist1, d2 = calibDist2;
  const m1 = calibMark1, m2 = calibMark2;
  const b = (m2 - m1 - a * (d2 * d2 - d1 * d1)) / (d2 - d1);
  const c = m1 - a * d1 * d1 - b * d1;
  return DISTANCES.map((dist) => {
    const mark = parseFloat((a * dist * dist + b * dist + c).toFixed(2));
    return { distance: dist, mark, drop: 0 };
  });
}

function calcAngleCut(distance: number, angleDeg: number) {
  return parseFloat((distance * Math.cos((angleDeg * Math.PI) / 180)).toFixed(1));
}

const defaultBow = (): Omit<BowProfile, 'id' | 'lastUsed'> => ({
  name: '',
  arrowSpeed: 280,
  arrowWeight: 400,
  peepToPin: 28.25,
  peepToArrow: 4,
  sightTypeLabel: '20 Click 24 Turn — Sure-Loc, Shibuya Ultima, Bowfinger 1',
  sightResolution: 0.002,
  arrowDiameter: 0.244,
  calibDist1: 20,
  calibMark1: '',
  calibDist2: 50,
  calibMark2: '',
});

export default function Home() {
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [bows, setBows] = useState<BowProfile[]>([]);
  const [activeBow, setActiveBow] = useState<BowProfile | null>(null);
  const [editingBow, setEditingBow] = useState<Partial<BowProfile>>(defaultBow());
  const [isNewBow, setIsNewBow] = useState(true);
  const [bowType, setBowType] = useState<'target' | 'hunting' | null>(null);
  const [showBowTypeSelect, setShowBowTypeSelect] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>('Field');
  const [unit, setUnit] = useState<'yd' | 'm'>('yd');
  const [direction, setDirection] = useState<'Up' | 'Down'>('Up');
  const [weatherAdj, setWeatherAdj] = useState(0);
  const [fatigueAdj, setFatigueAdj] = useState(0);
  const [angleDist, setAngleDist] = useState(40);
  const [angleDeg, setAngleDeg] = useState(18);
  const [activeTab, setActiveTab] = useState<'marks' | 'angle'>('marks');

  useEffect(() => {
    try {
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error || !session) {
          router.push('/landing');
        } else {
          setAuthChecked(true);
        }
      }).catch(() => {
        router.push('/landing');
      });
    } catch (e) {
      router.push('/landing');
    }
  }, []);

  if (!authChecked) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#141414' }}>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Loading...</div>
    </div>
  );

  const angleCut = calcAngleCut(angleDist, angleDeg);

  // Load bows from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('nocked_bows');
    if (saved) {
      const parsed = JSON.parse(saved) as BowProfile[];
      setBows(parsed);
      if (parsed.length > 0) {
        const last = [...parsed].sort((a, b) => b.lastUsed - a.lastUsed)[0];
        setActiveBow(last);
      }
    }
  }, []);

  // Save bows to localStorage whenever they change
  const saveBows = (updated: BowProfile[]) => {
    setBows(updated);
    localStorage.setItem('nocked_bows', JSON.stringify(updated));
  };

  const handleNewBow = () => {
    setEditingBow(defaultBow());
    setIsNewBow(true);
    setBowType(null);
    setShowBowTypeSelect(true);
    setScreen('setup');
  };

  const handleSaveHuntingBow = () => {
    if (!editingBow.name) {
      alert('Enter a bow name first.');
      return;
    }
    const fps = editingBow.arrowSpeed || 0;
    const grains = editingBow.arrowWeight || 0;
    const ke = grains > 0 && fps > 0
      ? parseFloat(((grains * fps * fps) / 450240).toFixed(1))
      : 0;
    const id = isNewBow ? crypto.randomUUID() : (editingBow.id || crypto.randomUUID());
    const saved: BowProfile = {
      ...(editingBow as BowProfile),
      id,
      bowType: 'hunting',
      lastUsed: Date.now(),
      ke,
      marks: [],
      sightResolution: 0,
      sightTypeLabel: 'Fixed Pins',
      calibDist1: 0,
      calibMark1: '',
      calibDist2: 0,
      calibMark2: '',
    };
    const existing = bows.find(b => b.id === id);
    const updated = existing ? bows.map(b => b.id === id ? saved : b) : [...bows, saved];
    saveBows(updated);
    setActiveBow(saved);
    setScreen('dashboard');
  };

  const handleEditBow = (bow: BowProfile) => {
    setEditingBow({ ...bow });
    setIsNewBow(false);
    setScreen('setup');
  };

  const handleDeleteBow = (id: string) => {
    const updated = bows.filter(b => b.id !== id);
    saveBows(updated);
    if (activeBow?.id === id) {
      setActiveBow(updated.length > 0 ? updated[0] : null);
    }
  };

  const handleCalculate = () => {
    if (!editingBow.calibMark1 || !editingBow.calibMark2) {
      alert('Enter both calibration marks first.');
      return;
    }
    const marks = calculateSightMarks({
      arrowSpeed: editingBow.arrowSpeed!,
      arrowWeight: editingBow.arrowWeight!,
      peepToPin: editingBow.peepToPin!,
      peepToArrow: editingBow.peepToArrow!,
      calibDist1: editingBow.calibDist1!,
      calibMark1: parseFloat(editingBow.calibMark1!),
      calibDist2: editingBow.calibDist2!,
      calibMark2: parseFloat(editingBow.calibMark2!),
      sightResolution: editingBow.sightResolution!,
    });

    const id = isNewBow ? crypto.randomUUID() : (editingBow.id || crypto.randomUUID());
    const saved: BowProfile = {
      ...(editingBow as BowProfile),
      id,
      lastUsed: Date.now(),
      marks,
    };

    const existing = bows.find(b => b.id === id);
    const updated = existing
      ? bows.map(b => b.id === id ? saved : b)
      : [...bows, saved];

    saveBows(updated);
    setActiveBow(saved);
    setActiveTab('marks');
    setScreen('dashboard');
  };

  const handleSelectBow = (bow: BowProfile) => {
    const updated = bows.map(b =>
      b.id === bow.id ? { ...b, lastUsed: Date.now() } : b
    );
    saveBows(updated);
    setActiveBow(bow);
    setActiveTab('marks');
    setScreen('dashboard');
  };

  const modMark = (mark: number) =>
    parseFloat((mark + weatherAdj + fatigueAdj).toFixed(2));
  const hasModifier = weatherAdj !== 0 || fatigueAdj !== 0;

  const filteredMarks = () => {
    if (!activeBow?.marks) return [];
    if (gameMode === 'All') return activeBow.marks;
    const allowed = gameMode === 'Field' ? FIELD_DISTANCES :
      gameMode === 'Hunter' ? HUNTER_DISTANCES : ANIMAL_DISTANCES;
    return activeBow.marks.filter(m => allowed.includes(m.distance));
  };

  const sortedBows = [...bows].sort((a, b) => b.lastUsed - a.lastUsed);
  const heroBow = sortedBows[0];
  const otherBows = sortedBows.slice(1);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        .material-symbols-outlined { font-family: 'Material Symbols Outlined'; font-weight: normal; font-style: normal; font-size: 24px; line-height: 1; letter-spacing: normal; text-transform: none; display: inline-block; white-space: nowrap; word-wrap: normal; direction: ltr; }
        * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; box-sizing: border-box; }
        body { margin: 0; background: #141414; min-height: 100vh; color: #fff; }
        .f-input {
          width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px; padding: 11px 13px; font-size: 14px; font-weight: 500;
          font-family: 'Inter', sans-serif; color: #fff; outline: none; transition: all 0.15s;
        }
        .f-input:focus { border-color: #ff5e1a; box-shadow: 0 0 0 3px rgba(255,94,26,0.15); }
        .f-input::placeholder { color: rgba(255,255,255,0.2); font-weight: 400; }
        select.f-input option { background: #1e1e1e; color: #fff; }
        .glass-card {
          background: rgba(255,255,255,0.04); border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06);
          overflow: hidden; backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
        }
        .seg { display: flex; background: rgba(255,255,255,0.06); border-radius: 12px; padding: 3px; gap: 2px; }
        .seg-btn {
          flex: 1; padding: 8px; border: none; background: transparent; border-radius: 10px;
          font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.4); cursor: pointer;
          font-family: 'Inter', sans-serif; transition: all 0.15s;
        }
        .seg-btn:hover:not(.active) { color: #ff5e1a; }
        .seg-btn.active { background: rgba(255,255,255,0.1); color: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.3); }
        .pill-btn {
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.5); font-weight: 600; font-size: 12px;
          padding: 5px 14px; border-radius: 100px; cursor: pointer; transition: all 0.15s;
          font-family: 'Inter', sans-serif;
        }
        .pill-btn:hover { border-color: #ff5e1a; color: #ff5e1a; }
        .pill-btn.active { background: #ff5e1a; color: #fff; border-color: #ff5e1a; }
        .dir-seg { display: flex; background: rgba(255,255,255,0.06); border-radius: 8px; padding: 2px; }
        .dir-btn {
          padding: 5px 18px; border: none; background: transparent; border-radius: 7px;
          font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.4); cursor: pointer;
          font-family: 'Inter', sans-serif; transition: all 0.15s;
        }
        .dir-btn:hover:not(.active) { color: #ff5e1a; }
        .dir-btn.active { background: rgba(255,255,255,0.1); color: #fff; }
        .edit-btn {
          background: rgba(255,255,255,0.06); border: none; color: rgba(255,255,255,0.4);
          font-size: 10px; font-weight: 700; padding: 4px 9px; border-radius: 6px;
          cursor: pointer; letter-spacing: 0.04em; transition: all 0.15s;
          font-family: 'Inter', sans-serif;
        }
        .edit-btn:hover { background: #ff5e1a; color: #fff; }
        .main-btn {
          width: 100%; padding: 15px; background: #ff5e1a; color: white; border: none;
          border-radius: 14px; font-size: 15px; font-weight: 700;
          font-family: 'Inter', sans-serif; cursor: pointer;
          box-shadow: 0 4px 24px rgba(255,94,26,0.35); transition: all 0.15s;
        }
        .main-btn:hover { background: #e04d0e; }
        .main-btn:active { transform: scale(0.98); }
        .ghost-btn {
          width: 100%; padding: 13px; background: transparent; color: rgba(255,255,255,0.5);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; font-size: 14px;
          font-weight: 600; font-family: 'Inter', sans-serif; cursor: pointer; transition: all 0.15s;
        }
        .ghost-btn:hover { border-color: rgba(255,255,255,0.3); color: #fff; }
        .tbl-row { transition: background 0.15s; }
        .tbl-row:hover { background: rgba(255,255,255,0.03); }
        .b-item { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.3); cursor: pointer; transition: color 0.15s; background: none; border: none; font-family: 'Inter', sans-serif; }
        .b-item:hover { color: rgba(255,255,255,0.7); }
        .b-item.active { color: #ff5e1a; }
        .bow-card {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px; padding: 16px 18px; cursor: pointer; transition: all 0.15s;
        }
        .bow-card:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,94,26,0.3); }
        .bow-card.active { border-color: #ff5e1a; background: rgba(255,94,26,0.06); }
        .hero-card {
          background: linear-gradient(135deg, rgba(255,94,26,0.15) 0%, rgba(255,94,26,0.05) 100%);
          border: 1px solid rgba(255,94,26,0.3); border-radius: 20px; padding: 24px;
          cursor: pointer; transition: all 0.15s; position: relative; overflow: hidden;
        }
        .hero-card::before {
          content: ''; position: absolute; top: -50%; right: -20%;
          width: 200px; height: 200px; background: rgba(255,94,26,0.08);
          border-radius: 50%; pointer-events: none;
        }
        .hero-card:hover { border-color: rgba(255,94,26,0.5); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        .clin-row { display: flex; align-items: center; justify-content: space-between; padding: 13px 18px; border-top: 1px solid rgba(255,255,255,0.06); cursor: pointer; transition: background 0.15s; }
        .clin-row:hover { background: rgba(255,255,255,0.03); }
        .clin-row:hover .clin-label { color: #ff5e1a; }
        .clin-label { font-size: 14px; font-weight: 600; color: #fff; transition: color 0.15s; }
        .delete-btn {
          background: rgba(255,59,48,0.1); border: 1px solid rgba(255,59,48,0.2);
          color: #ff3b30; font-size: 11px; font-weight: 600; padding: 4px 10px;
          border-radius: 6px; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.15s;
        }
        .delete-btn:hover { background: rgba(255,59,48,0.2); }
      `}</style>

      <div style={{ maxWidth: 680, margin: '0 auto', paddingBottom: 120 }}>


        <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* ── DASHBOARD ── */}
          {screen === 'dashboard' && (
            <>
              {bows.length === 0 ? (
                <div className="glass-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🏹</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8 }}>No bows yet</div>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', marginBottom: 24 }}>Add your first bow to get started</div>
                  <button className="main-btn" style={{ width: 'auto', padding: '12px 32px' }} onClick={handleNewBow}>Add Bow</button>
                </div>
              ) : (
                <>
                  {/* HERO BOW */}
                  {heroBow && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>Active Bow</div>
                      <div className="hero-card" onClick={() => { setActiveBow(heroBow); setActiveTab('marks'); }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                          <div>
                            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>{heroBow.name}</div>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>{heroBow.sightTypeLabel.split('—')[0].trim()}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="edit-btn" style={{ fontSize: 11, padding: '6px 12px' }} onClick={(e) => { e.stopPropagation(); handleEditBow(heroBow); }}>EDIT</button>
                            <button className="delete-btn" onClick={(e) => { e.stopPropagation(); handleDeleteBow(heroBow.id); }}>DELETE</button>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                          {[
                            { label: 'Speed', value: `${heroBow.arrowSpeed} fps` },
                            { label: 'Weight', value: `${heroBow.arrowWeight} gr` },
                            { label: 'Sight Radius', value: `${(heroBow.peepToPin - heroBow.peepToArrow).toFixed(2)}"` },
                          ].map(({ label, value }) => (
                            <div key={label} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 12px' }}>
                              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{value}</div>
                            </div>
                          ))}
                        </div>
                        {heroBow.marks && (
                          <div style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Tap to view marks</div>
                            <div style={{ fontSize: 14, color: '#ff5e1a' }}>→</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* OTHER BOWS */}
                  {otherBows.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 10, marginTop: 8 }}>Other Bows</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {otherBows.map(bow => (
                          <div key={bow.id} className="bow-card" onClick={() => handleSelectBow(bow)}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{bow.name}</div>
                                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{bow.arrowSpeed} fps · {bow.arrowWeight} gr · {bow.sightTypeLabel.split('—')[0].trim()}</div>
                              </div>
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <button className="edit-btn" onClick={(e) => { e.stopPropagation(); handleEditBow(bow); }}>EDIT</button>
                                <button className="delete-btn" onClick={(e) => { e.stopPropagation(); handleDeleteBow(bow.id); }}>DEL</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button className="main-btn" onClick={handleNewBow}>+ Add New Bow</button>

                  {/* MARKS / ANGLE TABS for active bow */}
                  {activeBow?.marks && (
                    <div style={{ marginTop: 8 }}>
                      <div className="seg" style={{ marginBottom: 12 }}>
                        <button className={`seg-btn${activeTab === 'marks' ? ' active' : ''}`} onClick={() => setActiveTab('marks')}>Sight Marks</button>
                        <button className={`seg-btn${activeTab === 'angle' ? ' active' : ''}`} onClick={() => setActiveTab('angle')}>Angle Cut</button>
                      </div>

                      {activeTab === 'marks' && (
                        <>
                          <div className="glass-card" style={{ marginBottom: 12 }}>
                            {[{ label: 'Weather Adj.', val: weatherAdj, set: setWeatherAdj }, { label: 'Fatigue Adj.', val: fatigueAdj, set: setFatigueAdj }].map(({ label, val, set }, i) => (
                              <div key={label} style={{ display: 'flex', gap: 10, padding: '12px 16px', borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.06)', alignItems: 'center' }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.4)', flex: 1 }}>{label}</div>
                                <input type="number" step="0.5" value={val} onChange={(e) => set(parseFloat(e.target.value) || 0)}
                                  style={{ width: 70, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', fontSize: 13, fontWeight: 600, color: '#fff', outline: 'none', textAlign: 'center', fontFamily: 'Inter, sans-serif' }} />
                              </div>
                            ))}
                          </div>

                          <div className="glass-card">
                            <div style={{ display: 'flex', gap: 6, padding: '14px 18px 10px', flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.06)', alignItems: 'center' }}>
                              {(['Field', 'Hunter', 'Animal', 'All'] as GameMode[]).map(g => (
                                <button key={g} className={`pill-btn${gameMode === g ? ' active' : ''}`} onClick={() => setGameMode(g)}>{g}</button>
                              ))}
                              <div style={{ marginLeft: 'auto' }} className="dir-seg">
                                {(['yd', 'm'] as const).map(u => (
                                  <button key={u} className={`dir-btn${unit === u ? ' active' : ''}`} onClick={() => setUnit(u)}>{u}</button>
                                ))}
                              </div>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr>
                                  {['Range', 'Mark', 'Mod', '∆ Cut', ''].map(h => (
                                    <th key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', padding: '8px 16px', textAlign: h === 'Range' ? 'left' : 'right', background: 'rgba(255,255,255,0.02)' }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {filteredMarks().map(m => {
                                  const isCalib = m.distance === activeBow.calibDist1 || m.distance === activeBow.calibDist2;
                                  return (
                                    <tr key={m.distance} className="tbl-row" style={{ background: isCalib ? 'rgba(255,94,26,0.04)' : 'transparent', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                                      <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textAlign: 'left' }}>
                                        {m.distance}<small style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>{unit}</small>
                                        {isCalib && <span style={{ display: 'inline-block', width: 5, height: 5, background: '#ff5e1a', borderRadius: '50%', marginLeft: 5, verticalAlign: 'middle' }} />}
                                      </td>
                                      <td style={{ padding: '11px 16px', fontSize: 14, fontWeight: 600, color: '#fff', textAlign: 'right' }}>{m.mark}</td>
                                      <td style={{ padding: '11px 16px', fontSize: 14, fontWeight: 700, color: hasModifier ? '#ff5e1a' : 'rgba(255,255,255,0.15)', textAlign: 'right' }}>
                                        {hasModifier ? modMark(m.mark) : '—'}
                                      </td>
                                      <td style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#60a5fa', textAlign: 'right' }}>—</td>
                                      <td style={{ padding: '11px 16px', textAlign: 'right' }}>
                                        <button className="edit-btn">EDIT</button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontWeight: 500 }}>● = calibration distance</div>
                        </>
                      )}

                      {activeTab === 'angle' && (
                        <>
                          <div className="glass-card">
                            <div style={{ padding: '16px 18px' }}>
                              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ff5e1a', marginBottom: 14 }}>Angle Cut</div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div>
                                  <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>Distance (yd)</div>
                                  <input className="f-input" type="number" value={angleDist} onChange={e => setAngleDist(parseFloat(e.target.value) || 0)} />
                                </div>
                                <div>
                                  <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>Angle (degrees)</div>
                                  <input className="f-input" type="number" value={angleDeg} onChange={e => setAngleDeg(parseFloat(e.target.value) || 0)} />
                                </div>
                              </div>
                              <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>Direction</span>
                                <div className="dir-seg">
                                  {(['Up', 'Down'] as const).map(d => (
                                    <button key={d} className={`dir-btn${direction === d ? ' active' : ''}`} onClick={() => setDirection(d)}>{d}</button>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="clin-row">
                              <div>
                                <div className="clin-label">Use Clinometer</div>
                                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>Auto-measure angle with your phone</div>
                              </div>
                              <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.2)' }}>›</div>
                            </div>
                          </div>

                          <div className="glass-card" style={{ textAlign: 'center', padding: '32px 20px 28px' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', marginBottom: 12 }}>Adjusted Distance</div>
                            <div style={{ fontSize: 80, fontWeight: 800, color: '#ff5e1a', letterSpacing: -4, lineHeight: 1, textShadow: '0 0 40px rgba(255,94,26,0.4)' }}>{angleCut}</div>
                            <div style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>yards — use this mark</div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.3)', marginTop: 10 }}>
                              {angleDist}yd at {angleDeg}° = <strong style={{ color: '#fff' }}>{angleCut}yd</strong> mark
                            </div>
                          </div>

                          <div className="glass-card">
                            <div style={{ padding: '14px 18px 8px' }}>
                              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ff5e1a' }}>Quick Reference — {angleDist}yd</div>
                            </div>
                            {[5, 10, 15, 20, 25, 30].map(deg => (
                              <div key={deg} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.35)' }}>{deg}°</span>
                                <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{calcAngleCut(angleDist, deg)} yd</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* ── BOW SETUP ── */}
          {screen === 'setup' && (
            <>
              {showBowTypeSelect ? (
                /* BOW TYPE SELECTION */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>
                    What type of bow are you adding?
                  </div>

                  {[
                    {
                      type: 'target' as const,
                      emoji: '🎯',
                      title: 'Target / Field Bow',
                      desc: 'Full sight mark calculator with clicks, calibration marks, and angle cut',
                    },
                    {
                      type: 'hunting' as const,
                      emoji: '🦌',
                      title: 'Hunting Bow',
                      desc: 'Fixed pins, kinetic energy, max ethical range, and basic bow stats',
                    },
                  ].map(({ type, emoji, title, desc }) => (
                    <div
                      key={type}
                      onClick={() => { setBowType(type); setShowBowTypeSelect(false); }}
                      style={{
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 18, padding: '24px 20px', cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ fontSize: 36, marginBottom: 12 }}>{emoji}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{title}</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{desc}</div>
                    </div>
                  ))}

                  <button className="ghost-btn" onClick={() => { setShowBowTypeSelect(false); setScreen('dashboard'); }}>
                    Cancel
                  </button>
                </div>
              ) : bowType === 'target' ? (
                /* TARGET BOW SETUP */
                <>
                  <div className="glass-card">
                    <div style={{ padding: '16px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <span style={{ fontSize: 20 }}>🎯</span>
                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ff5e1a' }}>
                          {isNewBow ? 'New Target Bow' : 'Edit Target Bow'}
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div style={{ gridColumn: 'span 2' }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>Bow Name</div>
                          <input className="f-input" type="text" placeholder="e.g. Hoyt Carbon RX-8"
                            value={editingBow.name || ''} onChange={e => setEditingBow({ ...editingBow, name: e.target.value })} />
                        </div>
                        {[
                          { label: 'Arrow Speed (fps)', field: 'arrowSpeed', type: 'number' },
                          { label: 'Arrow Weight (gr)', field: 'arrowWeight', type: 'number' },
                          { label: 'Peep to Pin (in)', field: 'peepToPin', type: 'number' },
                          { label: 'Peep to Arrow (in)', field: 'peepToArrow', type: 'number' },
                          { label: 'Arrow Diameter (in)', field: 'arrowDiameter', type: 'number' },
                        ].map(({ label, field, type }) => (
                          <div key={field}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>{label}</div>
                            <input className="f-input" type={type}
                              value={(editingBow as any)[field] || ''}
                              onChange={e => setEditingBow({ ...editingBow, [field]: parseFloat(e.target.value) || 0 })} />
                          </div>
                        ))}
                        <div style={{ gridColumn: 'span 2' }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>Sight Type</div>
                          <select className="f-input"
                            value={editingBow.sightTypeLabel || ''}
                            onChange={e => {
                              const sight = SIGHT_TYPES.find(s => s.label === e.target.value);
                              setEditingBow({ ...editingBow, sightTypeLabel: e.target.value, sightResolution: sight?.resolution || 0.002 });
                            }}>
                            {SIGHT_TYPES.map(s => (
                              <option key={s.label} value={s.label}>{s.label}</option>
                            ))}
                          </select>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 6 }}>
                            Resolution: {editingBow.sightResolution}" per click
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="glass-card">
                    <div style={{ padding: '16px 18px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ff5e1a', marginBottom: 8 }}>Calibration — Shot-In Marks</div>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: 500, marginBottom: 14, lineHeight: 1.5 }}>
                        Shoot 2 real marks at known distances. Farther apart = more accurate.
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {[
                          { label: 'Distance 1 (yd)', field: 'calibDist1', placeholder: '20', isNum: true },
                          { label: 'Mark at Dist 1', field: 'calibMark1', placeholder: 'e.g. 37.40', isNum: false },
                          { label: 'Distance 2 (yd)', field: 'calibDist2', placeholder: '50', isNum: true },
                          { label: 'Mark at Dist 2', field: 'calibMark2', placeholder: 'e.g. 59.40', isNum: false },
                        ].map(({ label, field, placeholder, isNum }) => (
                          <div key={field}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>{label}</div>
                            <input className="f-input" type="number" placeholder={placeholder}
                              value={(editingBow as any)[field] || ''}
                              onChange={e => setEditingBow({ ...editingBow, [field]: isNum ? parseFloat(e.target.value) || 0 : e.target.value })} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button className="main-btn" onClick={handleCalculate}>
                    {isNewBow ? 'Save & Calculate Marks' : 'Update & Recalculate'}
                  </button>
                  <button className="ghost-btn" onClick={() => setScreen('dashboard')}>Cancel</button>
                </>
              ) : bowType === 'hunting' ? (
                /* HUNTING BOW SETUP */
                <>
                  <div className="glass-card">
                    <div style={{ padding: '16px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <span style={{ fontSize: 20 }}>🦌</span>
                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ff5e1a' }}>
                          {isNewBow ? 'New Hunting Bow' : 'Edit Hunting Bow'}
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div style={{ gridColumn: 'span 2' }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>Bow Name</div>
                          <input className="f-input" type="text" placeholder="e.g. Mathews Phase 4"
                            value={editingBow.name || ''} onChange={e => setEditingBow({ ...editingBow, name: e.target.value })} />
                        </div>
                        {[
                          { label: 'Arrow Speed (fps)', field: 'arrowSpeed', type: 'number', placeholder: 'e.g. 280' },
                          { label: 'Draw Weight (lbs)', field: 'drawWeight', type: 'number', placeholder: 'e.g. 70' },
                          { label: 'Arrow Weight (gr)', field: 'arrowWeight', type: 'number', placeholder: 'e.g. 450' },
                          { label: 'Arrow Length (in)', field: 'arrowLength', type: 'number', placeholder: 'e.g. 29' },
                          { label: 'Draw Length (in)', field: 'drawLength', type: 'number', placeholder: 'e.g. 28.5' },
                          { label: 'Broadhead Weight (gr)', field: 'broadheadWeight', type: 'number', placeholder: 'e.g. 100' },
                        ].map(({ label, field, type, placeholder }) => (
                          <div key={field}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>{label}</div>
                            <input className="f-input" type={type} placeholder={placeholder}
                              value={(editingBow as any)[field] || ''}
                              onChange={e => setEditingBow({ ...editingBow, [field]: parseFloat(e.target.value) || 0 })} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="glass-card">
                    <div style={{ padding: '16px 18px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ff5e1a', marginBottom: 14 }}>Fixed Pin Yardages</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {[
                          { label: 'Pin 1 (yd)', field: 'pin1' },
                          { label: 'Pin 2 (yd)', field: 'pin2' },
                          { label: 'Pin 3 (yd)', field: 'pin3' },
                          { label: 'Pin 4 (yd)', field: 'pin4' },
                          { label: 'Pin 5 (yd)', field: 'pin5' },
                          { label: 'Pin 6 (yd)', field: 'pin6' },
                        ].map(({ label, field }) => (
                          <div key={field}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>{label}</div>
                            <input className="f-input" type="number" placeholder="e.g. 20"
                              value={(editingBow as any)[field] || ''}
                              onChange={e => setEditingBow({ ...editingBow, [field]: parseFloat(e.target.value) || 0 })} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button className="main-btn" onClick={handleSaveHuntingBow}>
                    {isNewBow ? 'Save Hunting Bow' : 'Update Hunting Bow'}
                  </button>
                  <button className="ghost-btn" onClick={() => setScreen('dashboard')}>Cancel</button>
                </>
              ) : null}
            </>
          )}
        </div>
      </div>
    </>
  );
}
