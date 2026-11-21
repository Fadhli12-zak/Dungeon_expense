import { Router, Response } from 'express';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { categories, wallets } from '../db/schema.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

export const categoriesRouter = Router();
categoriesRouter.use(authenticateToken);

const categorySchema = z.object({
  walletId: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: z.enum(['EXPENSE', 'INCOME']),
  color: z.string().min(4).max(30).default('#6366f1'),
  icon: z.string().min(1).max(50).default('Tag'),
});

categoriesRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { type, walletId } = req.query;

    const conditions: any[] = [eq(categories.userId, userId)];

    if (type && (type === 'EXPENSE' || type === 'INCOME')) {
      conditions.push(eq(categories.type, type as string));
    }

    if (walletId && typeof walletId === 'string') {
      conditions.push(eq(categories.walletId, walletId));
    }

    const query = await db
      .select({
        id: categories.id,
        userId: categories.userId,
        walletId: categories.walletId,
        name: categories.name,
        type: categories.type,
        color: categories.color,
        icon: categories.icon,
        wallet: {
          id: wallets.id,
          name: wallets.name,
          color: wallets.color,
        },
      })
      .from(categories)
      .leftJoin(wallets, eq(categories.walletId, wallets.id))
      .where(and(...conditions));

    return res.json(query);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Gagal memuat kategori' });
  }
});

categoriesRouter.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parse = categorySchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Data kategori tidak valid' });
    }

    const userId = req.user!.userId;
    const { walletId, name, type, color, icon } = parse.data;

    // Verify wallet ownership
    const wallet = await db.query.wallets.findFirst({
      where: and(eq(wallets.id, walletId), eq(wallets.userId, userId)),
    });
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet tidak valid' });
    }

    const [created] = await db
      .insert(categories)
      .values({
        userId,
        walletId,
        name,
        type,
        color,
        icon,
      })
      .returning();

    return res.status(201).json(created);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Gagal membuat kategori' });
  }
});

categoriesRouter.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parse = categorySchema.partial().safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Data kategori tidak valid' });
    }

    const userId = req.user!.userId;
    const id = req.params.id;

    const [updated] = await db
      .update(categories)
      .set(parse.data)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Kategori tidak ditemukan' });
    }

    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Gagal mengubah kategori' });
  }
});

categoriesRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id;

    const [deleted] = await db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: 'Kategori tidak ditemukan' });
    }

    return res.json({ message: 'Kategori berhasil dihapus', deleted });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Gagal menghapus kategori' });
  }
});
