import { Router, Response } from 'express';
import { z } from 'zod';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { transactions, categories, wallets } from '../db/schema.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

export const transactionsRouter = Router();
transactionsRouter.use(authenticateToken);

const transactionSchema = z.object({
  walletId: z.string().uuid(),
  categoryId: z.string().uuid().optional().nullable(),
  amount: z.coerce.number().positive(),
  type: z.enum(['EXPENSE', 'INCOME']),
  date: z.string().or(z.date()).optional(),
  note: z.string().max(500).optional().nullable(),
});

transactionsRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { walletId, startDate, endDate, type, categoryId, limit = '100', offset = '0' } = req.query;

    const conditions: any[] = [eq(transactions.userId, userId)];

    if (walletId && typeof walletId === 'string' && walletId !== 'null' && walletId !== 'undefined') {
      conditions.push(eq(transactions.walletId, walletId));
    }

    if (type && (type === 'EXPENSE' || type === 'INCOME')) {
      conditions.push(eq(transactions.type, type as string));
    }

    if (categoryId && typeof categoryId === 'string') {
      conditions.push(eq(transactions.categoryId, categoryId));
    }

    if (startDate && typeof startDate === 'string') {
      conditions.push(gte(transactions.date, new Date(startDate)));
    }

    if (endDate && typeof endDate === 'string') {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      conditions.push(lte(transactions.date, end));
    }

    const items = await db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        walletId: transactions.walletId,
        categoryId: transactions.categoryId,
        amount: transactions.amount,
        type: transactions.type,
        date: transactions.date,
        note: transactions.note,
        wallet: {
          id: wallets.id,
          name: wallets.name,
          color: wallets.color,
          icon: wallets.icon,
        },
        category: {
          id: categories.id,
          name: categories.name,
          color: categories.color,
          icon: categories.icon,
        },
      })
      .from(transactions)
      .leftJoin(wallets, eq(transactions.walletId, wallets.id))
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(desc(transactions.date), desc(transactions.id))
      .limit(Number(limit))
      .offset(Number(offset));

    return res.json(items);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Gagal memuat transaksi' });
  }
});

transactionsRouter.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parse = transactionSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Data transaksi tidak valid', details: parse.error.format() });
    }

    const userId = req.user!.userId;
    const { walletId, amount, type, categoryId, date, note } = parse.data;

    // Verify wallet
    const wallet = await db.query.wallets.findFirst({
      where: and(eq(wallets.id, walletId), eq(wallets.userId, userId)),
    });
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet tidak valid' });
    }

    const [created] = await db
      .insert(transactions)
      .values({
        userId,
        walletId,
        categoryId: categoryId || null,
        amount: amount.toString(),
        type,
        date: date ? new Date(date) : new Date(),
        note: note || null,
      })
      .returning();

    return res.status(201).json(created);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Gagal membuat transaksi' });
  }
});

transactionsRouter.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parse = transactionSchema.partial().safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Data transaksi tidak valid' });
    }

    const userId = req.user!.userId;
    const id = req.params.id;
    const data: any = { ...parse.data };

    if (data.amount !== undefined) {
      data.amount = data.amount.toString();
    }
    if (data.date !== undefined) {
      data.date = new Date(data.date);
    }

    const [updated] = await db
      .update(transactions)
      .set(data)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
    }

    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Gagal mengubah transaksi' });
  }
});

transactionsRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id;

    const [deleted] = await db
      .delete(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
    }

    return res.json({ message: 'Transaksi berhasil dihapus', deleted });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Gagal menghapus transaksi' });
  }
});
