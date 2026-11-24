import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  ShieldAlert,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface LoginFieldErrors {
  email?: string;
  password?: string;
}

interface LoginLocationState {
  registered?: boolean;
  email?: string;
  message?: string;
}

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state as LoginLocationState | null) || null;

  const [email, setEmail] = useState(locationState?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [successNotice, setSuccessNotice] = useState(
    locationState?.registered
      ? locationState.message || 'Akun berhasil dibuat! Silakan masuk menggunakan email dan password kamu.'
      : ''
  );
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

  const validateForm = (): boolean => {
    const errors: LoginFieldErrors = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      errors.email = 'Email wajib diisi.';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.email = 'Format email tidak valid. Contoh: nama@domain.com';
    }

    if (!password) {
      errors.password = 'Password wajib diisi.';
    } else if (password.length < 6) {
      errors.password = 'Password minimal 6 karakter.';
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError(errors.email || errors.password || 'Periksa kembali data login kamu.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    setError('');
    setSuccessNotice('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      navigate('/');
    } catch (err: any) {
      const code = err?.data?.code;
      const status = err?.status;

      if (status === 429 || code === 'RATE_LIMITED' || err?.data?.retryAfter) {
        const seconds = err?.data?.retryAfter || 30;
        setLockoutSeconds(seconds);
        setFieldErrors({});
        setError(
          `AKUN TERKUNCI! 3x gagal berturut-turut. Tunggu ${seconds} detik sebelum mencoba lagi.`
        );
      } else if (code === 'EMAIL_NOT_FOUND') {
        const msg = err.message || 'Email tidak terdaftar. Periksa kembali email kamu atau daftar akun baru.';
        setFieldErrors({ email: 'Email tidak terdaftar.' });
        setError(msg);
      } else if (code === 'WRONG_PASSWORD') {
        const msg = err.message || 'Password salah. Periksa kembali password kamu.';
        setFieldErrors({ password: 'Password salah.' });
        setError(msg);
      } else if (code === 'EMAIL_REQUIRED' || code === 'INVALID_EMAIL') {
        setFieldErrors({ email: err.message });
        setError(err.message);
      } else if (code === 'PASSWORD_REQUIRED' || code === 'PASSWORD_TOO_SHORT' || code === 'PASSWORD_TOO_LONG') {
        setFieldErrors({ password: err.message });
        setError(err.message);
      } else if (!status) {
        setError('Tidak dapat terhubung ke server. Periksa koneksi internet kamu lalu coba lagi.');
      } else if (status >= 500) {
        setError('Server sedang mengalami gangguan. Coba beberapa saat lagi.');
      } else {
        setError(err.message || 'Gagal masuk. Periksa kembali email dan password kamu.');
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

        {/* Success Notice after Register */}
        {successNotice && (
          <div className="mb-5 p-3 border-2 border-green-600 bg-green-950/15 flex items-start gap-2 text-green-600 font-mono text-xs">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{successNotice}</span>
          </div>
        )}

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

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="block font-pixel text-[9px] text-[var(--text-muted)] mb-1 uppercase">
              Adventurer Email
            </label>
            <div
              className={`flex border-2 bg-[var(--bg-card)] shadow-[var(--glow-shadow-sm)] ${
                fieldErrors.email ? 'border-[var(--danger-color)]' : 'border-[var(--border-color)]'
              }`}
            >
              <span className="px-3 py-2 bg-[var(--bg-card-subtle)] border-r-2 border-[var(--border-color)] text-[var(--text-muted)] flex items-center justify-center shrink-0 select-none">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                disabled={lockoutSeconds > 0}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  if (error) setError('');
                }}
                placeholder="name@dungeon.com"
                className="w-full bg-transparent px-3 py-2 font-mono text-xs text-[var(--text-primary)] outline-none disabled:opacity-50"
              />
            </div>
            {fieldErrors.email && (
              <p className="mt-1 font-mono text-[11px] text-[var(--danger-color)]">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label className="block font-pixel text-[9px] text-[var(--text-muted)] mb-1 uppercase">
              Secret Passcode
            </label>
            <div
              className={`flex border-2 bg-[var(--bg-card)] shadow-[var(--glow-shadow-sm)] ${
                fieldErrors.password ? 'border-[var(--danger-color)]' : 'border-[var(--border-color)]'
              }`}
            >
              <span className="px-3 py-2 bg-[var(--bg-card-subtle)] border-r-2 border-[var(--border-color)] text-[var(--text-muted)] flex items-center justify-center shrink-0 select-none">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                disabled={lockoutSeconds > 0}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  if (error) setError('');
                }}
                placeholder="••••••••"
                className="w-full bg-transparent px-3 py-2 font-mono text-xs text-[var(--text-primary)] outline-none disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={lockoutSeconds > 0}
                className="px-2.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center shrink-0"
                title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="mt-1 font-mono text-[11px] text-[var(--danger-color)]">{fieldErrors.password}</p>
            )}
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
