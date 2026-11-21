import { Router, Response } from 'express';
import { z } from 'zod';
import { eq, and, gte, lte, sql, isNull } from 'drizzle-orm';
import { db } from '../db/index.js';
import { budgetLimits, categories, transactions, wallets } from '../db/schema.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

export const budgetsRouter = Router();
budgetsRouter.use(authenticateToken);

const budgetSchema = z.object({
  walletId: z.string().uuid().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  targetAmount: z.coerce.number().positive(),
  type: z.enum(['EXPENSE_LIMIT', 'INCOME_GOAL']),
  period: z.enum(['WEEKLY', 'MONTHLY']),
});

budgetsRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { walletId } = req.query;

    const conditions: any[] = [eq(budgetLimits.userId, userId)];

    if (walletId && typeof walletId === 'string' && walletId !== 'null' && walletId !== 'undefined') {
      conditions.push(eq(budgetLimits.walletId, walletId));
    }

    const list = await db
      .select({
        id: budgetLimits.id,
        userId: budgetLimits.userId,
        walletId: budgetLimits.walletId,
        categoryId: budgetLimits.categoryId,
        targetAmount: budgetLimits.targetAmount,
        type: budgetLimits.type,
        period: budgetLimits.period,
        wallet: {
          id: wallets.id,
          name: wallets.name,
          color: wallets.color,
        },
        category: {
          id: categories.id,
          name: categories.name,
          color: categories.color,
          icon: categories.icon,
        },
      })
      .from(budgetLimits)
      .leftJoin(wallets, eq(budgetLimits.walletId, wallets.id))
      .leftJoin(categories, eq(budgetLimits.categoryId, categories.id))
      .where(and(...conditions));

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const enriched = await Promise.all(
      list.map(async (item) => {
        const periodStart = item.period === 'WEEKLY' ? startOfWeek : startOfMonth;
        const targetType = item.type === 'EXPENSE_LIMIT' ? 'EXPENSE' : 'INCOME';

        const txConditions: any[] = [
          eq(transactions.userId, userId),
          eq(transactions.type, targetType),
          gte(transactions.date, periodStart),
          lte(transactions.date, now),
        ];

        // If budget is tied to specific wallet
        if (item.walletId) {
          txConditions.push(eq(transactions.walletId, item.walletId));
        }

        if (item.categoryId) {
          txConditions.push(eq(transactions.categoryId, item.categoryId));
        }

        const [spending] = await db
          .select({
            total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
          })
          .from(transactions)
          .where(and(...txConditions));

        const currentAmount = parseFloat(spending?.total || '0');
        const target = parseFloat(item.targetAmount);
        const percentage = target > 0 ? Math.min(100, Math.round((currentAmount / target) * 100)) : 0;

        return {
          ...item,
          currentAmount,
          percentage,
          isExceeded: currentAmount > target,
        };
      })
    );

    return res.json(enriched);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Gagal memuat batas anggaran' });
  }
});

budgetsRouter.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parse = budgetSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Data anggaran tidak valid' });
    }

    const userId = req.user!.userId;
    const { walletId, categoryId, targetAmount, type, period } = parse.data;

    const [created] = await db
      .insert(budgetLimits)
      .values({
        userId,
        walletId: walletId || null,
        categoryId: categoryId || null,
        targetAmount: targetAmount.toString(),
        type,
        period,
      })
      .returning();

    return res.status(201).json(created);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Gagal membuat anggaran' });
  }
});

budgetsRouter.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parse = budgetSchema.partial().safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Data anggaran tidak valid' });
    }

    const userId = req.user!.userId;
    const id = req.params.id;
    const data: any = { ...parse.data };

    if (data.targetAmount !== undefined) {
      data.targetAmount = data.targetAmount.toString();
    }

    const [updated] = await db
      .update(budgetLimits)
      .set(data)
      .where(and(eq(budgetLimits.id, id), eq(budgetLimits.userId, userId)))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Batas anggaran tidak ditemukan' });
    }

    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Gagal mengubah anggaran' });
  }
});

budgetsRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id;

    const [deleted] = await db
      .delete(budgetLimits)
      .where(and(eq(budgetLimits.id, id), eq(budgetLimits.userId, userId)))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: 'Batas anggaran tidak ditemukan' });
    }

    return res.json({ message: 'Batas anggaran berhasil dihapus', deleted });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Gagal menghapus anggaran' });
  }
});
