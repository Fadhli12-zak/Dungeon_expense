import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface RegisterFieldErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    const errors: RegisterFieldErrors = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      errors.email = 'Email wajib diisi.';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.email = 'Format email tidak valid. Contoh: nama@domain.com';
    } else if (trimmedEmail.length > 255) {
      errors.email = 'Email terlalu panjang (maksimal 255 karakter).';
    }

    if (!password) {
      errors.password = 'Password wajib diisi.';
    } else if (!password.trim()) {
      errors.password = 'Password tidak boleh hanya berisi spasi.';
    } else if (password.length < 6) {
      errors.password = 'Password minimal 6 karakter.';
    } else if (password.length > 100) {
      errors.password = 'Password maksimal 100 karakter.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Konfirmasi password wajib diisi.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Konfirmasi password tidak cocok dengan password.';
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError(
        errors.email ||
          errors.password ||
          errors.confirmPassword ||
          'Periksa kembali data pendaftaran kamu.'
      );
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    const normalizedEmail = email.trim().toLowerCase();
    setLoading(true);
    try {
      await register(normalizedEmail, password);
      navigate('/login', {
        replace: true,
        state: {
          registered: true,
          email: normalizedEmail,
          message: 'Akun berhasil dibuat! Silakan masuk menggunakan email dan password kamu.',
        },
      });
    } catch (err: any) {
      const code = err?.data?.code;
      const status = err?.status;

      if (status === 409 || code === 'EMAIL_ALREADY_EXISTS') {
        const msg = err.message || 'Email sudah terdaftar. Silakan masuk atau gunakan email lain.';
        setFieldErrors({ email: 'Email sudah terdaftar.' });
        setError(msg);
      } else if (code === 'EMAIL_REQUIRED' || code === 'INVALID_EMAIL') {
        setFieldErrors({ email: err.message });
        setError(err.message);
      } else if (
        code === 'PASSWORD_REQUIRED' ||
        code === 'INVALID_PASSWORD' ||
        code === 'PASSWORD_TOO_SHORT' ||
        code === 'PASSWORD_TOO_LONG'
      ) {
        setFieldErrors({ password: err.message });
        setError(err.message);
      } else if (!status) {
        setError('Tidak dapat terhubung ke server. Periksa koneksi internet kamu lalu coba lagi.');
      } else if (status >= 500) {
        setError('Server sedang mengalami gangguan. Coba beberapa saat lagi.');
      } else {
        setError(err.message || 'Registrasi gagal. Periksa kembali data kamu atau gunakan email lain.');
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
            FORGE ADVENTURER
          </h1>
          <p className="font-arcade text-base text-[var(--text-muted)] mt-1 tracking-widest">
            INITIALIZE NEW LEDGER VAULT
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 border-2 border-[var(--danger-color)] bg-[var(--bg-card-subtle)] flex items-start gap-2 text-[var(--danger-color)] font-mono text-xs">
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
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  if (error) setError('');
                }}
                placeholder="name@dungeon.com"
                className="w-full bg-transparent px-3 py-2 font-mono text-xs text-[var(--text-primary)] outline-none"
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
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  if (error) setError('');
                }}
                placeholder="Min. 6 characters"
                className="w-full bg-transparent px-3 py-2 font-mono text-xs text-[var(--text-primary)] outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
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

          <div>
            <label className="block font-pixel text-[9px] text-[var(--text-muted)] mb-1 uppercase">
              Repeat Passcode
            </label>
            <div
              className={`flex border-2 bg-[var(--bg-card)] shadow-[var(--glow-shadow-sm)] ${
                fieldErrors.confirmPassword ? 'border-[var(--danger-color)]' : 'border-[var(--border-color)]'
              }`}
            >
              <span className="px-3 py-2 bg-[var(--bg-card-subtle)] border-r-2 border-[var(--border-color)] text-[var(--text-muted)] flex items-center justify-center shrink-0 select-none">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword) {
                    setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                  }
                  if (error) setError('');
                }}
                placeholder="Confirm passcode"
                className="w-full bg-transparent px-3 py-2 font-mono text-xs text-[var(--text-primary)] outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="px-2.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center shrink-0"
                title={showConfirmPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p className="mt-1 font-mono text-[11px] text-[var(--danger-color)]">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="retro-btn-accent w-full mt-2 py-3 px-4 text-center justify-center flex items-center gap-2 text-xs disabled:opacity-60"
          >
            {loading ? 'FORGING...' : 'CREATE ACCOUNT [START]'}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>

        <div className="mt-8 pt-4 border-t-2 border-[var(--border-color)] text-center font-arcade text-base text-[var(--text-muted)]">
          Already have credentials?{' '}
          <Link
            to="/login"
            className="font-pixel text-[9px] text-[var(--accent-color)] hover:underline inline-block ml-1"
          >
            ENTER DUNGEON
          </Link>
          <p className="font-pixel text-[7px] sm:text-[8px] text-[var(--text-muted)] mt-4 tracking-wider">
            © 2026 dz. All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  );
};
