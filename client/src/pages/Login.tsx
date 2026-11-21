import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Lock, Mail, ArrowRight, AlertCircle, ShieldAlert } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Rate Limiting & Throttling Lockout State
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);

  // Countdown timer for 429 lockout
  useEffect(() => {
    if (lockoutSeconds <= 0) return;

    const timer = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setError('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      if (err.status === 429 || err.data?.retryAfter) {
        const seconds = err.data?.retryAfter || 30;
        setLockoutSeconds(seconds);
        setError(
          `AKUN TERKUNCI! 3x gagal berturut-turut. Tunggu ${seconds} detik sebelum mencoba lagi.`
        );
      } else {
        setError(err.message || 'Gagal masuk. Periksa kembali email dan password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{ backgroundColor: 'var(--bg-main)' }}
    >
      <div className="w-full max-w-md retro-box p-4 sm:p-8 shadow-[var(--glow-shadow-lg)]">
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 border-[3px] border-[var(--border-color)] bg-[var(--accent-color)] text-[var(--accent-text)] items-center justify-center shadow-[var(--glow-shadow-sm)] mb-3">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="font-pixel text-sm sm:text-base text-[var(--text-primary)] tracking-tight">
            COINTOMB // DUNGEON
          </h1>
          <p className="font-arcade text-base text-[var(--text-muted)] mt-1 tracking-widest">
            INSERT CREDENTIALS TO ENTER
          </p>
        </div>

        {/* Lockout Banner (HTTP 429 Rate Limit) */}
        {lockoutSeconds > 0 && (
          <div className="mb-5 p-3.5 border-2 border-red-600 bg-red-950/20 text-red-600 font-mono text-xs flex items-start gap-2.5 animate-pulse">
            <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5 text-red-600" />
            <div>
              <p className="font-pixel text-[9px] font-bold text-red-600">
                [ 🔒 SECURITY RATE LIMIT: 3X FAILED ]
              </p>
              <p className="mt-1">
                Akses dikunci sementara selama <span className="font-bold underline text-sm">{lockoutSeconds}</span> detik demi keamanan akun.
              </p>
            </div>
          </div>
        )}

        {/* Standard Error Notice */}
        {error && lockoutSeconds === 0 && (
          <div className="mb-5 p-3 border-2 border-[var(--danger-color)] bg-[var(--bg-card-subtle)] flex items-start gap-2 text-[var(--danger-color)] font-mono text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-pixel text-[9px] text-[var(--text-muted)] mb-1 uppercase">
              Adventurer Email
            </label>
            <div className="flex border-2 border-[var(--border-color)] bg-[var(--bg-card)] shadow-[var(--glow-shadow-sm)]">
              <span className="px-3 py-2 bg-[var(--bg-card-subtle)] border-r-2 border-[var(--border-color)] text-[var(--text-muted)] flex items-center justify-center shrink-0 select-none">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                required
                disabled={lockoutSeconds > 0}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@dungeon.com"
                className="w-full bg-transparent px-3 py-2 font-mono text-xs text-[var(--text-primary)] outline-none disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block font-pixel text-[9px] text-[var(--text-muted)] mb-1 uppercase">
              Secret Passcode
            </label>
            <div className="flex border-2 border-[var(--border-color)] bg-[var(--bg-card)] shadow-[var(--glow-shadow-sm)]">
              <span className="px-3 py-2 bg-[var(--bg-card-subtle)] border-r-2 border-[var(--border-color)] text-[var(--text-muted)] flex items-center justify-center shrink-0 select-none">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                disabled={lockoutSeconds > 0}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent px-3 py-2 font-mono text-xs text-[var(--text-primary)] outline-none disabled:opacity-50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || lockoutSeconds > 0}
            className="retro-btn-accent w-full mt-2 py-3 px-4 text-center justify-center flex items-center gap-2 text-xs disabled:opacity-60"
          >
            {lockoutSeconds > 0
              ? `🔒 TERKUNCI (${lockoutSeconds}s)`
              : loading
              ? 'AUTHENTICATING...'
              : 'ENTER DUNGEON [PRESS START]'}
            {lockoutSeconds === 0 && <ArrowRight className="h-3.5 w-3.5" />}
          </button>
        </form>

        <div className="mt-7 pt-4 border-t-2 border-[var(--border-color)] text-center font-arcade text-base text-[var(--text-muted)]">
          Belum punya akun buku kas?{' '}
          <Link
            to="/register"
            className="font-pixel text-[9px] text-[var(--accent-color)] hover:underline inline-block ml-1"
          >
            FORGE PROFILE
          </Link>
          <p className="font-pixel text-[7px] sm:text-[8px] text-[var(--text-muted)] mt-4 tracking-wider">
            © 2026 dz. All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  );
};
