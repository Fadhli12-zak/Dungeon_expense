import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { Wallet } from '../types';
import { useAuth } from './AuthContext';

interface WalletContextType {
  wallets: Wallet[];
  activeWalletId: string | null; // null = Union Mode (Semua Wallet)
  activeWallet: Wallet | null;
  isLoadingWallets: boolean;
  setActiveWalletId: (id: string | null) => void;
  refreshWallets: () => Promise<void>;
  createWallet: (data: { name: string; color: string; icon: string; initialBalance: number }) => Promise<Wallet>;
  updateWallet: (id: string, data: Partial<{ name: string; color: string; icon: string; initialBalance: number }>) => Promise<Wallet>;
  deleteWallet: (id: string) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [activeWalletId, setActiveWalletIdState] = useState<string | null>(() => {
    return localStorage.getItem('activeWalletId') || null;
  });
  const [isLoadingWallets, setIsLoadingWallets] = useState(false);

  const refreshWallets = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoadingWallets(true);
      const data = await api.get<Wallet[]>('/wallets');
      setWallets(data);

      // Validate activeWalletId still exists in wallets
      if (activeWalletId && !data.some((w) => w.id === activeWalletId)) {
        setActiveWalletIdState(null);
        localStorage.removeItem('activeWalletId');
      }
    } catch (err) {
      console.error('Failed to fetch wallets:', err);
    } finally {
      setIsLoadingWallets(false);
    }
  }, [user, activeWalletId]);

  useEffect(() => {
    if (user) {
      refreshWallets();
    } else {
      setWallets([]);
      setActiveWalletIdState(null);
    }
  }, [user]);

  const setActiveWalletId = (id: string | null) => {
    setActiveWalletIdState(id);
    if (id) {
      localStorage.setItem('activeWalletId', id);
    } else {
      localStorage.removeItem('activeWalletId');
    }
  };

  const createWallet = async (data: { name: string; color: string; icon: string; initialBalance: number }) => {
    const res = await api.post<Wallet>('/wallets', data);
    const createdWallet: Wallet = {
      ...res,
      totalIncome: res.totalIncome ?? 0,
      totalExpense: res.totalExpense ?? 0,
      balance: res.balance ?? parseFloat(res.initialBalance || '0'),
    };
    setWallets((prev) => [...prev, createdWallet]);
    return createdWallet;
  };

  const updateWallet = async (
    id: string,
    data: Partial<{ name: string; color: string; icon: string; initialBalance: number }>
  ) => {
    const res = await api.put<Wallet>(`/wallets/${id}`, data);
    setWallets((prev) =>
      prev.map((w) => {
        if (w.id !== id) return w;
        const initial = parseFloat(res.initialBalance || '0');
        const totalIncome = w.totalIncome || 0;
        const totalExpense = w.totalExpense || 0;
        return {
          ...w,
          ...res,
          balance: initial + totalIncome - totalExpense,
        };
      })
    );
    return res;
  };

  const deleteWallet = async (id: string) => {
    await api.delete(`/wallets/${id}`);
    setWallets((prev) => prev.filter((w) => w.id !== id));
    if (activeWalletId === id) {
      setActiveWalletId(null);
    }
  };

  const activeWallet = wallets.find((w) => w.id === activeWalletId) || null;

  return (
    <WalletContext.Provider
      value={{
        wallets,
        activeWalletId,
        activeWallet,
        isLoadingWallets,
        setActiveWalletId,
        refreshWallets,
        createWallet,
        updateWallet,
        deleteWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
