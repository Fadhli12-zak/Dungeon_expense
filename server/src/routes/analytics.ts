import { Router, Response } from "express";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { transactions, categories, wallets } from "../db/schema.js";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth.js";

export const analyticsRouter = Router();
analyticsRouter.use(authenticateToken);

const getDateRanges = () => {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  );
  const endOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  );

  const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
    0,
    0,
    0,
    0,
  );

  return { now, startOfToday, endOfToday, startOfWeek, startOfMonth };
};

const formatLocalYMD = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Summary with Union / Per-Wallet support
analyticsRouter.get(
  "/summary",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const walletId = req.query.walletId as string | undefined;
      const { startOfToday, endOfToday, startOfWeek, startOfMonth, now } =
        getDateRanges();

      const sumQuery = async (
        type: "EXPENSE" | "INCOME",
        fromDate?: Date,
        toDate?: Date,
      ) => {
        const conditions: any[] = [
          eq(transactions.userId, userId),
          eq(transactions.type, type),
        ];
        if (walletId && walletId !== "null" && walletId !== "undefined") {
          conditions.push(eq(transactions.walletId, walletId));
        }
        if (fromDate) conditions.push(gte(transactions.date, fromDate));
        if (toDate) conditions.push(lte(transactions.date, toDate));

        const [result] = await db
          .select({
            total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
          })
          .from(transactions)
          .where(and(...conditions));

        return parseFloat(result?.total || "0");
      };

      const [
        todayExpense,
        todayIncome,
        weekExpense,
        weekIncome,
        monthExpense,
        monthIncome,
        allTimeExpense,
        allTimeIncome,
      ] = await Promise.all([
        sumQuery("EXPENSE", startOfToday, endOfToday),
        sumQuery("INCOME", startOfToday, endOfToday),
        sumQuery("EXPENSE", startOfWeek, endOfToday),
        sumQuery("INCOME", startOfWeek, endOfToday),
        sumQuery("EXPENSE", startOfMonth, endOfToday),
        sumQuery("INCOME", startOfMonth, endOfToday),
        sumQuery("EXPENSE"),
        sumQuery("INCOME"),
      ]);

      // Initial balance calculation (for balance accuracy)
      let initialBalanceTotal = 0;
      if (walletId && walletId !== "null" && walletId !== "undefined") {
        const w = await db.query.wallets.findFirst({
          where: and(eq(wallets.id, walletId), eq(wallets.userId, userId)),
        });
        initialBalanceTotal = parseFloat(w?.initialBalance || "0");
      } else {
        const userWallets = await db
          .select()
          .from(wallets)
          .where(eq(wallets.userId, userId));
        initialBalanceTotal = userWallets.reduce(
          (acc, w) => acc + parseFloat(w.initialBalance || "0"),
          0,
        );
      }

      return res.json({
        today: {
          expense: todayExpense,
          income: todayIncome,
          net: todayIncome - todayExpense,
        },
        week: {
          expense: weekExpense,
          income: weekIncome,
          net: weekIncome - weekExpense,
        },
        month: {
          expense: monthExpense,
          income: monthIncome,
          net: monthIncome - monthExpense,
        },
        balance: initialBalanceTotal + (allTimeIncome - allTimeExpense),
        initialBalance: initialBalanceTotal,
        allTime: { expense: allTimeExpense, income: allTimeIncome },
        mode: walletId && walletId !== "null" ? "PER_WALLET" : "UNION",
      });
    } catch (err: any) {
      return res
        .status(500)
        .json({ error: err.message || "Gagal memuat ringkasan analytics" });
    }
  },
);

// Category Breakdown with Union / Per-Wallet support
analyticsRouter.get(
  "/category-breakdown",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const walletId = req.query.walletId as string | undefined;
      const type = (req.query.type as string) || "EXPENSE";
      const period = (req.query.period as string) || "month";
      const { startOfWeek, startOfMonth, endOfToday } = getDateRanges();

      const conditions: any[] = [
        eq(transactions.userId, userId),
        eq(transactions.type, type),
      ];

      if (walletId && walletId !== "null" && walletId !== "undefined") {
        conditions.push(eq(transactions.walletId, walletId));
      }

      if (period === "week") {
        conditions.push(
          gte(transactions.date, startOfWeek),
          lte(transactions.date, endOfToday),
        );
      } else if (period === "month") {
        conditions.push(
          gte(transactions.date, startOfMonth),
          lte(transactions.date, endOfToday),
        );
      }

      const rows = await db
        .select({
          categoryId: transactions.categoryId,
          categoryName: sql<string>`COALESCE(${categories.name}, 'Lainnya')`,
          color: sql<string>`COALESCE(${categories.color}, '#94a3b8')`,
          icon: sql<string>`COALESCE(${categories.icon}, 'CircleDashed')`,
          totalAmount: sql<string>`SUM(${transactions.amount})`,
          count: sql<number>`COUNT(${transactions.id})`,
        })
        .from(transactions)
        .leftJoin(categories, eq(transactions.categoryId, categories.id))
        .where(and(...conditions))
        .groupBy(
          transactions.categoryId,
          categories.name,
          categories.color,
          categories.icon,
        )
        .orderBy(desc(sql`SUM(${transactions.amount})`));

      const totalSum = rows.reduce(
        (acc, row) => acc + parseFloat(row.totalAmount),
        0,
      );

      const formatted = rows.map((row, index) => {
        const amount = parseFloat(row.totalAmount);
        const percentage =
          totalSum > 0 ? Number(((amount / totalSum) * 100).toFixed(1)) : 0;

        let tier: "top" | "mid" | "low" = "low";
        if (index < 2) tier = "top";
        else if (index < 5) tier = "mid";

        return {
          categoryId: row.categoryId,
          name: row.categoryName,
          color: row.color,
          icon: row.icon,
          amount,
          percentage,
          count: Number(row.count),
          tier,
        };
      });

      return res.json({
        total: totalSum,
        period,
        type,
        breakdown: formatted,
        mode: walletId && walletId !== "null" ? "PER_WALLET" : "UNION",
      });
    } catch (err: any) {
      return res
        .status(500)
        .json({ error: err.message || "Gagal memuat breakdown kategori" });
    }
  },
);

// Daily Trends with Union / Per-Wallet support (Always ending on TODAY)
analyticsRouter.get(
  "/trends",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const walletId = req.query.walletId as string | undefined;
      const days = parseInt((req.query.days as string) || "7", 10);
      const now = new Date();

      const endOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999,
      );
      const startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - (days - 1),
        0,
        0,
        0,
        0,
      );

      const conditions: any[] = [
        eq(transactions.userId, userId),
        gte(transactions.date, startDate),
        lte(transactions.date, endOfToday),
      ];

      if (walletId && walletId !== "null" && walletId !== "undefined") {
        conditions.push(eq(transactions.walletId, walletId));
      }

      const rows = await db
        .select({
          date: sql<string>`TO_CHAR(${transactions.date}, 'YYYY-MM-DD')`,
          type: transactions.type,
          total: sql<string>`SUM(${transactions.amount})`,
        })
        .from(transactions)
        .where(and(...conditions))
        .groupBy(
          sql`TO_CHAR(${transactions.date}, 'YYYY-MM-DD')`,
          transactions.type,
        );

      // Build map for each day from startDate to today inclusive
      const trendMap: Record<
        string,
        { date: string; expense: number; income: number }
      > = {};
      for (let i = 0; i < days; i++) {
        const d = new Date(
          startDate.getFullYear(),
          startDate.getMonth(),
          startDate.getDate() + i,
        );
        const key = formatLocalYMD(d);
        trendMap[key] = { date: key, expense: 0, income: 0 };
      }

      rows.forEach((r) => {
        const key = String(r.date);
        if (trendMap[key]) {
          if (r.type === "EXPENSE") {
            trendMap[key].expense = parseFloat(r.total);
          } else if (r.type === "INCOME") {
            trendMap[key].income = parseFloat(r.total);
          }
        }
      });

      return res.json(Object.values(trendMap));
    } catch (err: any) {
      return res
        .status(500)
        .json({ error: err.message || "Gagal memuat tren pengeluaran" });
    }
  },
);
