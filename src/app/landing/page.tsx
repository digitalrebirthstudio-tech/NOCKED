'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

export default function LandingPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'landing' | 'login' | 'signup'>('landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleEmailSignup = async () => {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) setError(error.message);
    else setMessage('Check your email to confirm your account!');
    setLoading(false);
  };

  const handleEmailLogin = async () => {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else router.push('/dashboard');
    setLoading(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #141414; min-height: 100vh; color: #fff; }
        .f-input {
          width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px; padding: 13px 16px; font-size: 15px; font-weight: 500;
          font-family: 'Inter', sans-serif; color: #fff; outline: none; transition: all 0.15s;
        }
        .f-input:focus { border-color: #ff5e1a; box-shadow: 0 0 0 3px rgba(255,94,26,0.15); }
        .f-input::placeholder { color: rgba(255,255,255,0.2); font-weight: 400; }
        .main-btn {
          width: 100%; padding: 15px; background: #ff5e1a; color: white; border: none;
          border-radius: 14px; font-size: 15px; font-weight: 700;
          font-family: 'Inter', sans-serif; cursor: pointer;
          box-shadow: 0 4px 24px rgba(255,94,26,0.35); transition: all 0.15s;
        }
        .main-btn:hover { background: #e04d0e; }
        .main-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .ghost-btn {
          width: 100%; padding: 13px; background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.7);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; font-size: 15px;
          font-weight: 600; font-family: 'Inter', sans-serif; cursor: pointer; transition: all 0.15s;
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .ghost-btn:hover { border-color: rgba(255,255,255,0.3); color: #fff; background: rgba(255,255,255,0.07); }
        .link-btn { background: none; border: none; color: #ff5e1a; font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; }
        .link-btn:hover { text-decoration: underline; }
        .divider { display: flex; align-items: center; gap: 12px; }
        .divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.08); }
        .divider-text { font-size: 12px; color: rgba(255,255,255,0.3); font-weight: 500; }
      `}</style>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 24px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

        {mode === 'landing' && (
          <>
            {/* HERO */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '60px 0 40px' }}>
              <Image src="/nocked-logo.png" alt="Nocked" width={80} height={80} style={{ borderRadius: 20, marginBottom: 24, boxShadow: '0 8px 32px rgba(255,94,26,0.4)' }} />
              <h1 style={{ fontSize: 48, fontWeight: 800, color: '#fff', letterSpacing: -2, lineHeight: 1.1, marginBottom: 16 }}>
                Your archery.<br />
                <span style={{ color: '#ff5e1a' }}>Dialed in.</span>
              </h1>
              <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.4)', fontWeight: 500, lineHeight: 1.6, maxWidth: 340, marginBottom: 48 }}>
                Calculate perfect sight marks, track scores, and analyze your performance — all in one place.
              </p>

              {/* FEATURES */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', marginBottom: 48 }}>
                {[
                  { emoji: '🎯', title: 'Sight Mark Calculator', desc: 'Accurate marks for any bow and sight type' },
                  { emoji: '📊', title: 'Score Tracking', desc: 'ASA, 3D, practice — with full round analytics' },
                  { emoji: '📈', title: 'Distance Analysis', desc: 'See exactly where you need to improve' },
                ].map(({ emoji, title, desc }) => (
                  <div key={title} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 16px', textAlign: 'left' }}>
                    <div style={{ fontSize: 24, flexShrink: 0 }}>{emoji}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{title}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                <button className="main-btn" onClick={() => setMode('signup')}>Get Started — It's Free</button>
                <button className="ghost-btn" onClick={() => setMode('login')}>Sign In</button>
              </div>
            </div>
          </>
        )}

        {(mode === 'login' || mode === 'signup') && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 0' }}>

            {/* HEADER */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }}>
              <Image src="/nocked-logo.png" alt="Nocked" width={40} height={40} style={{ borderRadius: 10 }} />
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>
                  {mode === 'login' ? 'Welcome back' : 'Create account'}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>
                  {mode === 'login' ? 'Sign in to your Nocked account' : 'Start tracking your archery today'}
                </div>
              </div>
            </div>

            {/* GOOGLE */}
            <button className="ghost-btn" onClick={handleGoogleLogin} disabled={loading} style={{ marginBottom: 20 }}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="divider" style={{ marginBottom: 20 }}>
              <div className="divider-line" />
              <div className="divider-text">or</div>
              <div className="divider-line" />
            </div>

            {/* FORM */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {mode === 'signup' && (
                <input className="f-input" type="text" placeholder="Full name"
                  value={name} onChange={e => setName(e.target.value)} />
              )}
              <input className="f-input" type="email" placeholder="Email address"
                value={email} onChange={e => setEmail(e.target.value)} />
              <input className="f-input" type="password" placeholder="Password"
                value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleEmailLogin() : handleEmailSignup())} />

              {error && (
                <div style={{ fontSize: 13, color: '#ff3b30', background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.2)', borderRadius: 10, padding: '10px 14px', fontWeight: 500 }}>
                  {error}
                </div>
              )}

              {message && (
                <div style={{ fontSize: 13, color: '#34d399', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 10, padding: '10px 14px', fontWeight: 500 }}>
                  {message}
                </div>
              )}

              <button className="main-btn" disabled={loading}
                onClick={mode === 'login' ? handleEmailLogin : handleEmailSignup}>
                {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button className="link-btn" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setMessage(''); }}>
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button className="link-btn" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }} onClick={() => { setMode('landing'); setError(''); setMessage(''); }}>
                ← Back
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
