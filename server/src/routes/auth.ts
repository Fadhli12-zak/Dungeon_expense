import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
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

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

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
    const parse = authSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Format email tidak valid atau password minimal 6 karakter' });
    }

    const { email, password } = parse.data;

    const existing = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (existing) {
      return res.status(400).json({ error: 'Email sudah terdaftar' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [newUser] = await db.insert(users).values({
      email: email.toLowerCase(),
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

    const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production';
    const token = jwt.sign({ userId: newUser.id, email: newUser.email }, secret, { expiresIn: '7d' });

    return res.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Registrasi gagal' });
  }
});

authRouter.post('/login', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parse = authSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Email atau password tidak valid' });
    }

    const { email, password } = parse.data;
    const throttleKey = getThrottleKey(req, email);
    const now = Date.now();

    // Check Throttling Lockout
    const throttle = throttleStore.get(throttleKey);
    if (throttle?.lockedUntil && throttle.lockedUntil > now) {
      const waitSeconds = Math.ceil((throttle.lockedUntil - now) / 1000);
      return res.status(429).json({
        error: `Akun dikunci sementara karena 3x gagal login berturut-turut. Tunggu ${waitSeconds} detik lagi.`,
        retryAfter: waitSeconds,
      });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
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
          retryAfter: 30,
        });
      }
      throttleStore.set(throttleKey, current);
      return res.status(401).json({
        error: `Email atau password salah. Sisa kesempatan: ${3 - current.failures}`,
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
          retryAfter: 30,
        });
      }
      throttleStore.set(throttleKey, current);
      return res.status(401).json({
        error: `Email atau password salah. Sisa kesempatan: ${3 - current.failures}`,
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
    return res.status(500).json({ error: err.message || 'Login gagal' });
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
