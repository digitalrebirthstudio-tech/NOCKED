'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

interface BowProfile {
  id: string;
  name: string;
  bowType?: string;
  arrowSpeed?: number;
  arrowWeight?: number;
}

interface Session {
  id: string;
  totalScore: number;
  totalTargets: number;
  type: string;
  date: number;
  completed: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [bows, setBows] = useState<BowProfile[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('nocked_theme') as 'dark' | 'light') || 'dark';
    }
    return 'dark';
  });

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('nocked_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    document.body.style.background = newTheme === 'light' ? '#f5f5f5' : '#141414';
    document.body.style.color = newTheme === 'light' ? '#111' : '#fff';
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/landing'); return; }
      setUser(session.user);

      // Load bows from Supabase
      const { data: bowsData } = await supabase
        .from('bows')
        .select('*')
        .eq('user_id', session.user.id);
      if (bowsData) setBows(bowsData.map((b: any) => ({
        id: b.id,
        name: b.name,
        bowType: b.bow_type,
        arrowSpeed: b.arrow_speed,
        arrowWeight: b.arrow_weight,
      })));

      // Load sessions from Supabase
      const { data: sessionsData } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('completed', true);
      if (sessionsData) setSessions(sessionsData.map((s: any) => ({
        id: s.id,
        totalScore: s.total_score,
        totalTargets: s.total_targets,
        type: s.type,
        date: s.date,
        completed: s.completed,
      })));

      setLoading(false);
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/landing');
  };

  const completedSessions = sessions.filter(s => s.completed);
  const totalArrows = completedSessions.reduce((sum, s) => sum + s.totalTargets, 0);
  const avgScore = completedSessions.length > 0
    ? (completedSessions.reduce((sum, s) => sum + s.totalScore, 0) / completedSessions.length).toFixed(1)
    : '—';
  const bestScore = completedSessions.length > 0
    ? Math.max(...completedSessions.map(s => s.totalScore))
    : '—';

  if (loading) return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ height: 120, background: 'rgba(255,255,255,0.04)', borderRadius: 18, animation: 'pulse 1.5s infinite' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {[1,2,3,4,5,6].map(i => <div key={i} style={{ height: 80, background: 'rgba(255,255,255,0.04)', borderRadius: 14, animation: 'pulse 1.5s infinite' }} />)}
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Inter', -apple-system, sans-serif; box-sizing: border-box; }
        body { margin: 0; background: #141414; color: #fff; }
        .glass-card {
          background: rgba(255,255,255,0.04); border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06);
          overflow: hidden;
        }
        .sign-out-btn {
          width: 100%; padding: 14px; background: rgba(255,59,48,0.08);
          color: #ff3b30; border: 1px solid rgba(255,59,48,0.2);
          border-radius: 14px; font-size: 15px; font-weight: 700;
          font-family: 'Inter', sans-serif; cursor: pointer; transition: all 0.15s;
        }
        .sign-out-btn:hover { background: rgba(255,59,48,0.15); }
        .stat-card {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px; padding: 16px;
        }
        .bow-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 18px; border-top: 1px solid rgba(255,255,255,0.06);
        }
      `}</style>

      <div style={{ maxWidth: 680, margin: '0 auto', paddingBottom: 120 }}>
        <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* PROFILE CARD */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'linear-gradient(135deg, #ff5e1a, #cc4a12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, fontWeight: 800, color: '#fff',
                boxShadow: '0 4px 16px rgba(255,94,26,0.3)',
              }}>
                {user?.user_metadata?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>
                  {user?.user_metadata?.full_name || 'Archer'}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                  {user?.email}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontWeight: 500, letterSpacing: '0.06em' }}>
              Member since {new Date(user?.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
          </div>

          {/* STATS */}
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
            Lifetime Stats
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[
              { label: 'Total Sessions', value: completedSessions.length },
              { label: 'Total Arrows', value: totalArrows },
              { label: 'Avg Score', value: avgScore },
              { label: 'Best Score', value: bestScore },
              { label: 'Total Bows', value: bows.length },
              { label: 'Rounds Shot', value: completedSessions.length },
            ].map(({ label, value }) => (
              <div key={label} className="stat-card">
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* BOWS */}
          {bows.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>
                My Bows
              </div>
              <div className="glass-card">
                {bows.map((bow, i) => (
                  <div key={bow.id} className="bow-row" style={{ borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ fontSize: 20 }}>{bow.bowType === 'hunting' ? '🦌' : '🎯'}</div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{bow.name}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                          {bow.bowType === 'hunting' ? 'Hunting Bow' : 'Target Bow'} · {bow.arrowSpeed} fps · {bow.arrowWeight} gr
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.2)' }}>›</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* SETTINGS */}
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>
            Account
          </div>
          <div className="glass-card">
            {[
              { label: 'Notifications', icon: '🔔' },
              { label: 'Privacy Policy', icon: '🔒' },
              { label: 'Terms of Service', icon: '📄' },
            ].map((item, i) => (
              <div key={item.label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 18px', borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.06)',
                cursor: 'pointer',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>{item.label}</span>
                </div>
                <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.2)' }}>›</span>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }} onClick={toggleTheme}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 18 }}>{theme === 'dark' ? '🌙' : '☀️'}</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
              </div>
              <div style={{
                width: 44, height: 26, borderRadius: 13,
                background: theme === 'dark' ? '#ff5e1a' : 'rgba(255,255,255,0.2)',
                position: 'relative', transition: 'background 0.2s', cursor: 'pointer',
              }}>
                <div style={{
                  position: 'absolute', top: 3, left: theme === 'dark' ? 21 : 3,
                  width: 20, height: 20, borderRadius: '50%', background: '#fff',
                  transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                }} />
              </div>
            </div>
          </div>

          {/* APP INFO */}
          <div className="glass-card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <Image src="/nocked-logo.png" alt="Nocked" width={32} height={32} style={{ borderRadius: 8 }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Nocked</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Version 1.0.0</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', lineHeight: 1.5 }}>
              Field Archery Calculator — Built for serious archers.
            </div>
          </div>

          <button className="sign-out-btn" onClick={handleSignOut}>
            Sign Out
          </button>

        </div>
      </div>
    </>
  );
}
