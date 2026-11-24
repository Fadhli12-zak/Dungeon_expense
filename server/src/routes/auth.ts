import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, wallets, categories } from '../db/schema.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

export const authRouter = Router();

// Rate limiting & Login Throttling In-Memory Store
interface ThrottleRecord {
  failures: number;
  lockedUntil: number | null;
}
const throttleStore = new Map<string, ThrottleRecord>();

const getThrottleKey = (req: AuthenticatedRequest, email: string): string => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip';
  return `${ip}:${email.toLowerCase()}`;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateAuthInput = (body: any, isRegister = false) => {
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!email) {
    return { ok: false as const, code: 'EMAIL_REQUIRED', error: 'Email wajib diisi.' };
  }
  if (!emailRegex.test(email) || email.length > 255) {
    return { ok: false as const, code: 'INVALID_EMAIL', error: 'Format email tidak valid. Contoh: nama@domain.com' };
  }
  if (!password) {
    return { ok: false as const, code: 'PASSWORD_REQUIRED', error: 'Password wajib diisi.' };
  }
  if (isRegister && !password.trim()) {
    return { ok: false as const, code: 'INVALID_PASSWORD', error: 'Password tidak boleh hanya berisi spasi.' };
  }
  if (password.length < 6) {
    return { ok: false as const, code: 'PASSWORD_TOO_SHORT', error: 'Password minimal 6 karakter.' };
  }
  if (password.length > 100) {
    return { ok: false as const, code: 'PASSWORD_TOO_LONG', error: 'Password maksimal 100 karakter.' };
  }

  return { ok: true as const, email: email.toLowerCase(), password };
};

const DEFAULT_CATEGORIES = [
  { name: 'Makanan & Minuman', type: 'EXPENSE', color: '#000000', icon: 'PixelBurger' },
  { name: 'Transportasi', type: 'EXPENSE', color: '#222222', icon: 'PixelCar' },
  { name: 'Fashion & Belanja', type: 'EXPENSE', color: '#444444', icon: 'PixelShirt' },
  { name: 'Tagihan & Utilitas', type: 'EXPENSE', color: '#666666', icon: 'PixelFlash' },
  { name: 'Hiburan & Hobi', type: 'EXPENSE', color: '#888888', icon: 'PixelGamepad' },
  { name: 'Kesehatan', type: 'EXPENSE', color: '#555555', icon: 'PixelHeart' },
  { name: 'Gaji Pokok', type: 'INCOME', color: '#111111', icon: 'PixelCoinBag' },
  { name: 'Side Job & Freelance', type: 'INCOME', color: '#333333', icon: 'PixelChest' },
  { name: 'Investasi & Bunga', type: 'INCOME', color: '#555555', icon: 'PixelGem' },
];

authRouter.post('/register', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validated = validateAuthInput(req.body, true);
    if (!validated.ok) {
      return res.status(400).json({ error: validated.error, code: validated.code });
    }

    const { email, password } = validated;

    const existing = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existing) {
      return res.status(409).json({
        error: 'Email sudah terdaftar. Silakan masuk atau gunakan email lain.',
        code: 'EMAIL_ALREADY_EXISTS',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [newUser] = await db.insert(users).values({
      email,
      passwordHash,
    }).returning();

    // 1. Create Default Wallet for User
    const [defaultWallet] = await db.insert(wallets).values({
      userId: newUser.id,
      name: 'Dompet Utama (Cash)',
      color: '#000000',
      icon: 'Wallet',
      initialBalance: '0',
    }).returning();

    // 2. Seed default categories tied to this default wallet
    await db.insert(categories).values(
      DEFAULT_CATEGORIES.map((cat) => ({
        userId: newUser.id,
        walletId: defaultWallet.id,
        name: cat.name,
        type: cat.type,
        color: cat.color,
        icon: cat.icon,
      }))
    );

    return res.status(201).json({
      message: 'Registrasi berhasil. Silakan masuk menggunakan akun kamu.',
      user: {
        id: newUser.id,
        email: newUser.email,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err: any) {
    if (err?.code === '23505') {
      return res.status(409).json({
        error: 'Email sudah terdaftar. Silakan masuk atau gunakan email lain.',
        code: 'EMAIL_ALREADY_EXISTS',
      });
    }
    return res.status(500).json({
      error: 'Terjadi kesalahan pada server saat mendaftar. Coba beberapa saat lagi.',
      code: 'SERVER_ERROR',
    });
  }
});

authRouter.post('/login', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validated = validateAuthInput(req.body, false);
    if (!validated.ok) {
      return res.status(400).json({ error: validated.error, code: validated.code });
    }

    const { email, password } = validated;
    const throttleKey = getThrottleKey(req, email);
    const now = Date.now();

    // Check Throttling Lockout
    const throttle = throttleStore.get(throttleKey);
    if (throttle?.lockedUntil && throttle.lockedUntil > now) {
      const waitSeconds = Math.ceil((throttle.lockedUntil - now) / 1000);
      return res.status(429).json({
        error: `Akun dikunci sementara karena 3x gagal login berturut-turut. Tunggu ${waitSeconds} detik lagi.`,
        code: 'RATE_LIMITED',
        retryAfter: waitSeconds,
      });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      // Record failure
      const current = throttleStore.get(throttleKey) || { failures: 0, lockedUntil: null };
      current.failures += 1;
      if (current.failures >= 3) {
        current.lockedUntil = now + 30 * 1000; // Lock for 30 seconds
        current.failures = 0;
        throttleStore.set(throttleKey, current);
        return res.status(429).json({
          error: 'Gagal login 3 kali berturut-turut. Sistem dikunci selama 30 detik demi keamanan.',
          code: 'RATE_LIMITED',
          retryAfter: 30,
        });
      }
      throttleStore.set(throttleKey, current);
      return res.status(401).json({
        error: `Email tidak terdaftar. Periksa kembali email kamu atau daftar akun baru. (Sisa kesempatan: ${3 - current.failures})`,
        code: 'EMAIL_NOT_FOUND',
        remainingAttempts: 3 - current.failures,
      });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      // Record failure
      const current = throttleStore.get(throttleKey) || { failures: 0, lockedUntil: null };
      current.failures += 1;
      if (current.failures >= 3) {
        current.lockedUntil = now + 30 * 1000; // Lock for 30 seconds
        current.failures = 0;
        throttleStore.set(throttleKey, current);
        return res.status(429).json({
          error: 'Gagal login 3 kali berturut-turut. Sistem dikunci selama 30 detik demi keamanan.',
          code: 'RATE_LIMITED',
          retryAfter: 30,
        });
      }
      throttleStore.set(throttleKey, current);
      return res.status(401).json({
        error: `Password salah. Periksa kembali password kamu. (Sisa kesempatan: ${3 - current.failures})`,
        code: 'WRONG_PASSWORD',
        remainingAttempts: 3 - current.failures,
      });
    }

    // Login Succeeded: Reset throttle record
    throttleStore.delete(throttleKey);

    // Ensure user has at least one wallet (retroactive fallback)
    const existingWallet = await db.query.wallets.findFirst({
      where: eq(wallets.userId, user.id),
    });

    if (!existingWallet) {
      const [newWallet] = await db.insert(wallets).values({
        userId: user.id,
        name: 'Dompet Utama (Cash)',
        color: '#000000',
        icon: 'Wallet',
        initialBalance: '0',
      }).returning();

      await db.insert(categories).values(
        DEFAULT_CATEGORIES.map((cat) => ({
          userId: user.id,
          walletId: newWallet.id,
          name: cat.name,
          type: cat.type,
          color: cat.color,
          icon: cat.icon,
        }))
      );
    }

    const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production';
    const token = jwt.sign({ userId: user.id, email: user.email }, secret, { expiresIn: '7d' });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      error: 'Terjadi kesalahan pada server saat login. Coba beberapa saat lagi.',
      code: 'SERVER_ERROR',
    });
  }
});

authRouter.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.user!.userId),
      columns: {
        id: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    return res.json({ user });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Gagal memuat profil' });
  }
});
