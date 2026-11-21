export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string;
  initialBalance: string;
  totalIncome?: number;
  totalExpense?: number;
  balance?: number;
  createdAt: string;
}

export interface Category {
  id: string;
  userId: string;
  walletId: string;
  name: string;
  type: 'EXPENSE' | 'INCOME';
  color: string;
  icon: string;
  wallet?: {
    id: string;
    name: string;
    color: string;
  } | null;
}

export interface Transaction {
  id: string;
  userId: string;
  walletId: string;
  categoryId?: string | null;
  amount: string;
  type: 'EXPENSE' | 'INCOME';
  date: string;
  note?: string | null;
  wallet?: {
    id: string;
    name: string;
    color: string;
    icon: string;
  } | null;
  category?: {
    id: string;
    name: string;
    color: string;
    icon: string;
  } | null;
}

export interface BudgetLimit {
  id: string;
  userId: string;
  walletId?: string | null;
  categoryId?: string | null;
  targetAmount: string;
  type: 'EXPENSE_LIMIT' | 'INCOME_GOAL';
  period: 'WEEKLY' | 'MONTHLY';
  currentAmount: number;
  percentage: number;
  isExceeded: boolean;
  wallet?: {
    id: string;
    name: string;
    color: string;
  } | null;
  category?: {
    id: string;
    name: string;
    color: string;
    icon: string;
  } | null;
}

export interface SummaryData {
  today: { expense: number; income: number; net: number };
  week: { expense: number; income: number; net: number };
  month: { expense: number; income: number; net: number };
  balance: number;
  initialBalance?: number;
  mode?: 'UNION' | 'PER_WALLET';
}

export interface CategoryBreakdownItem {
  categoryId: string | null;
  name: string;
  color: string;
  icon: string;
  amount: number;
  percentage: number;
  count: number;
  tier: 'top' | 'mid' | 'low';
}

export interface CategoryBreakdownResponse {
  total: number;
  period: string;
  type: string;
  breakdown: CategoryBreakdownItem[];
  mode?: 'UNION' | 'PER_WALLET';
}

export interface TrendItem {
  date: string;
  expense: number;
  income: number;
}
