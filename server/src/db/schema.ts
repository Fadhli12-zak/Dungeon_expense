import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  numeric,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const wallets = pgTable("wallets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 30 }).notNull().default("#6366f1"),
  icon: varchar("icon", { length: 50 }).notNull().default("Wallet"),
  initialBalance: numeric("initial_balance", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  walletId: uuid("wallet_id")
    .notNull()
    .references(() => wallets.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // 'EXPENSE' | 'INCOME'
  color: varchar("color", { length: 30 }).notNull().default("#6366f1"),
  icon: varchar("icon", { length: 50 }).notNull().default("Tag"),
});

export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  walletId: uuid("wallet_id")
    .notNull()
    .references(() => wallets.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // 'EXPENSE' | 'INCOME'
  date: timestamp("date", { withTimezone: true }).defaultNow().notNull(),
  note: text("note"),
});

export const budgetLimits = pgTable("budget_limits", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  walletId: uuid("wallet_id").references(() => wallets.id, {
    onDelete: "cascade",
  }), // null = Union (Global)
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "cascade",
  }),
  targetAmount: numeric("target_amount", { precision: 14, scale: 2 }).notNull(),
  type: varchar("type", { length: 30 }).notNull(), // 'EXPENSE_LIMIT' | 'INCOME_GOAL'
  period: varchar("period", { length: 20 }).notNull(), // 'WEEKLY' | 'MONTHLY'
});

export const usersRelations = relations(users, ({ many }) => ({
  wallets: many(wallets),
  categories: many(categories),
  transactions: many(transactions),
  budgetLimits: many(budgetLimits),
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  user: one(users, { fields: [wallets.userId], references: [users.id] }),
  categories: many(categories),
  transactions: many(transactions),
  budgetLimits: many(budgetLimits),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, { fields: [categories.userId], references: [users.id] }),
  wallet: one(wallets, {
    fields: [categories.walletId],
    references: [wallets.id],
  }),
  transactions: many(transactions),
  budgetLimits: many(budgetLimits),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, { fields: [transactions.userId], references: [users.id] }),
  wallet: one(wallets, {
    fields: [transactions.walletId],
    references: [wallets.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));

export const budgetLimitsRelations = relations(budgetLimits, ({ one }) => ({
  user: one(users, { fields: [budgetLimits.userId], references: [users.id] }),
  wallet: one(wallets, {
    fields: [budgetLimits.walletId],
    references: [wallets.id],
  }),
  category: one(categories, {
    fields: [budgetLimits.categoryId],
    references: [categories.id],
  }),
}));
