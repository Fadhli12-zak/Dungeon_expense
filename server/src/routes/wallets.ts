import { Router, Response } from 'express';
import { z } from 'zod';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { wallets, transactions, categories } from '../db/schema.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

export const walletsRouter = Router();
walletsRouter.use(authenticateToken);

const walletSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().min(4).max(30).default('#6366f1'),
  icon: z.string().min(1).max(50).default('Wallet'),
  initialBalance: z.coerce.number().min(0).default(0),
});

const DEFAULT_CATEGORIES = [
  { name: 'Makanan & Minuman', type: 'EXPENSE', color: '#f97316', icon: 'Utensils' },
  { name: 'Transportasi', type: 'EXPENSE', color: '#06b6d4', icon: 'Car' },
  { name: 'Belanja & Kebutuhan', type: 'EXPENSE', color: '#ec4899', icon: 'ShoppingBag' },
  { name: 'Tagihan & Utilitas', type: 'EXPENSE', color: '#eab308', icon: 'Receipt' },
  { name: 'Hiburan & Hobi', type: 'EXPENSE', color: '#8b5cf6', icon: 'Gamepad2' },
  { name: 'Kesehatan', type: 'EXPENSE', color: '#10b981', icon: 'HeartPulse' },
  { name: 'Gaji Pokok', type: 'INCOME', color: '#22c55e', icon: 'Briefcase' },
  { name: 'Freelance & Side Job', type: 'INCOME', color: '#3b82f6', icon: 'Laptop' },
  { name: 'Investasi & Bunga', type: 'INCOME', color: '#a855f7', icon: 'TrendingUp' },
];

// GET all wallets with live calculated balance
walletsRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const userWallets = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId))
      .orderBy(wallets.createdAt);

    // Calculate income, expense, and current balance for each wallet
    const enriched = await Promise.all(
      userWallets.map(async (w) => {
        const [inc] = await db
          .select({ total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)` })
          .from(transactions)
          .where(
            and(
              eq(transactions.userId, userId),
              eq(transactions.walletId, w.id),
              eq(transactions.type, 'INCOME')
            )
          );

        const [exp] = await db
          .select({ total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)` })
          .from(transactions)
          .where(
            and(
              eq(transactions.userId, userId),
              eq(transactions.walletId, w.id),
              eq(transactions.type, 'EXPENSE')
            )
          );

        const totalIncome = parseFloat(inc?.total || '0');
        const totalExpense = parseFloat(exp?.total || '0');
        const initial = parseFloat(w.initialBalance || '0');
        const balance = initial + totalIncome - totalExpense;

        return {
          ...w,
          totalIncome,
          totalExpense,
          balance,
        };
      })
    );

    return res.json(enriched);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Gagal memuat wallet' });
  }
});

// POST create wallet
walletsRouter.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parse = walletSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Data wallet tidak valid' });
    }

    const userId = req.user!.userId;
    const { name, color, icon, initialBalance } = parse.data;

    const [created] = await db
      .insert(wallets)
      .values({
        userId,
        name,
        color,
        icon,
        initialBalance: initialBalance.toString(),
      })
      .returning();

    // Auto-seed default categories for this new wallet
    await db.insert(categories).values(
      DEFAULT_CATEGORIES.map((cat) => ({
        userId,
        walletId: created.id,
        name: cat.name,
        type: cat.type,
        color: cat.color,
        icon: cat.icon,
      }))
    );

    return res.status(201).json(created);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Gagal membuat wallet' });
  }
});

// PUT update wallet
walletsRouter.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parse = walletSchema.partial().safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Data wallet tidak valid' });
    }

    const userId = req.user!.userId;
    const id = req.params.id;
    const data: any = { ...parse.data };
    if (data.initialBalance !== undefined) {
      data.initialBalance = data.initialBalance.toString();
    }

    const [updated] = await db
      .update(wallets)
      .set(data)
      .where(and(eq(wallets.id, id), eq(wallets.userId, userId)))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Wallet tidak ditemukan' });
    }

    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Gagal mengubah wallet' });
  }
});

// DELETE wallet (Cascades categories & transactions)
walletsRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id;

    // Check count of user wallets - do not let them delete their last wallet
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(wallets)
      .where(eq(wallets.userId, userId));

    if (Number(countResult[0]?.count || 0) <= 1) {
      return res.status(400).json({ error: 'Anda harus memiliki minimal satu wallet aktif.' });
    }

    const [deleted] = await db
      .delete(wallets)
      .where(and(eq(wallets.id, id), eq(wallets.userId, userId)))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: 'Wallet tidak ditemukan' });
    }

    return res.json({ message: 'Wallet berhasil dihapus', deleted });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Gagal menghapus wallet' });
  }
});
