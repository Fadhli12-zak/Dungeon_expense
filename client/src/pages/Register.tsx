import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok');
      return;
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    setLoading(true);
    try {
      await register(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registrasi gagal. Coba gunakan email lain.');
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@dungeon.com"
                className="w-full bg-transparent px-3 py-2 font-mono text-xs text-[var(--text-primary)] outline-none"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full bg-transparent px-3 py-2 font-mono text-xs text-[var(--text-primary)] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-pixel text-[9px] text-[var(--text-muted)] mb-1 uppercase">
              Repeat Passcode
            </label>
            <div className="flex border-2 border-[var(--border-color)] bg-[var(--bg-card)] shadow-[var(--glow-shadow-sm)]">
              <span className="px-3 py-2 bg-[var(--bg-card-subtle)] border-r-2 border-[var(--border-color)] text-[var(--text-muted)] flex items-center justify-center shrink-0 select-none">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm passcode"
                className="w-full bg-transparent px-3 py-2 font-mono text-xs text-[var(--text-primary)] outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="retro-btn-accent w-full mt-2 py-3 px-4 text-center justify-center flex items-center gap-2 text-xs"
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
