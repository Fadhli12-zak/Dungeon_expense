import React, { createContext, useContext, useState, useEffect } from 'react';

export type FinancialTheme = 'theme-prosper' | 'theme-spooky';

interface ThemeContextType {
  theme: FinancialTheme;
  updateFinancialMetrics: (income: number, expense: number, budgetLimit: number) => void;
  chartPalette: string[];
  themeLabel: string;
}

const THEME_PALETTES: Record<FinancialTheme, string[]> = {
  'theme-prosper': ['#16A34A', '#22C55E', '#10B981', '#059669'],
  'theme-spooky': ['#DC2626', '#EF4444', '#B91C1C', '#991B1B'],
};

const THEME_LABELS: Record<FinancialTheme, string> = {
  'theme-prosper': '⚪ PROSPER (HEMAT)',
  'theme-spooky': '💀 SPOOKY (BOROS)',
};

export function getFinancialTheme(income: number, expense: number, budgetLimit: number): FinancialTheme {
  const isBudgetExceeded = budgetLimit > 0 && expense > (budgetLimit * 0.85);
  const isDeficit = expense > income;

  if (isDeficit || isBudgetExceeded) {
    return 'theme-spooky';
  }

  return 'theme-prosper';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<FinancialTheme>('theme-prosper');

  const updateFinancialMetrics = (income: number, expense: number, budgetLimit: number) => {
    const computed = getFinancialTheme(income, expense, budgetLimit);
    setTheme(computed);
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-prosper', 'theme-spooky');
    root.classList.add(theme);
    root.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        updateFinancialMetrics,
        chartPalette: THEME_PALETTES[theme],
        themeLabel: THEME_LABELS[theme],
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
