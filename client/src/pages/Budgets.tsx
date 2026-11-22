import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useWallet } from '../context/WalletContext';
import { useAlert } from '../context/AlertContext';
import { useLanguage } from '../context/LanguageContext';
import { BudgetLimit, Category } from '../types';
import { formatCurrency } from '../utils/export';
import { formatNominalInput, formatNominalFromDecimal, parseNominalRaw, validateBVAAmount } from '../utils/numberFormat';
import { Plus, Trash2, Edit2, AlertTriangle, CheckCircle2, Layers, ChevronDown } from 'lucide-react';

export const Budgets: React.FC = () => {
  const { wallets, activeWalletId } = useWallet();
  const { showAlert, showConfirm } = useAlert();
  const { t } = useLanguage();
  const [budgets, setBudgets] = useState<BudgetLimit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter
  const [walletFilter, setWalletFilter] = useState<string>(activeWalletId || '');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formWalletId, setFormWalletId] = useState<string>('');
  const [formAmount, setFormAmount] = useState('');
  const [formType, setFormType] = useState<'EXPENSE_LIMIT' | 'INCOME_GOAL'>('EXPENSE_LIMIT');
  const [formPeriod, setFormPeriod] = useState<'WEEKLY' | 'MONTHLY'>('MONTHLY');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setWalletFilter(activeWalletId || '');
  }, [activeWalletId]);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const queryParam = walletFilter ? `?walletId=${walletFilter}` : '';
      const [budRes, catRes] = await Promise.all([
        api.get<BudgetLimit[]>(`/budgets${queryParam}`),
        api.get<Category[]>('/categories'),
      ]);
      setBudgets(budRes);
      setCategories(catRes);
    } catch (err: any) {
      console.error('Error fetching budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [walletFilter]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormWalletId(walletFilter || '');
    setFormAmount('');
    setFormType('EXPENSE_LIMIT');
    setFormPeriod('MONTHLY');
    setFormCategoryId('');
    setModalOpen(true);
  };

  const handleOpenEdit = (b: BudgetLimit) => {
    setEditingId(b.id);
    setFormWalletId(b.walletId || '');
    setFormAmount(formatNominalFromDecimal(b.targetAmount));
    setFormType(b.type);
    setFormPeriod(b.period);
    setFormCategoryId(b.categoryId || '');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawAmount = parseNominalRaw(formAmount);
    const bva = validateBVAAmount(rawAmount);
    if (!bva.valid) {
      showAlert({
        title: 'VALIDASI TARGET (BVA)',
        message: bva.message || 'Nominal tidak valid.',
        type: 'error',
      });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        walletId: formWalletId ? formWalletId : null,
        targetAmount: rawAmount,
        type: formType,
        period: formPeriod,
        categoryId: formCategoryId || null,
      };

      if (editingId) {
        await api.put(`/budgets/${editingId}`, payload);
        showAlert({
          title: 'TARGET DIPERBARUI',
          message: 'Batas anggaran berhasil diperbarui.',
          type: 'success',
        });
      } else {
        await api.post('/budgets', payload);
        showAlert({
          title: 'TARGET DIBUAT',
          message: 'Batas anggaran baru berhasil dipasang.',
          type: 'success',
        });
      }

      setModalOpen(false);
      void fetchBudgets();
    } catch (err: any) {
      showAlert({
        title: 'GAGAL MENYIMPAN',
        message: err.message || 'Gagal menyimpan batas anggaran.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    showConfirm({
      title: t("confirm_delete_budget_title"),
      message: t("confirm_delete_budget_msg"),
      confirmLabel: t("col_actions"),
      cancelLabel: t("btn_cancel"),
      onConfirm: async () => {
        try {
          await api.delete(`/budgets/${id}`);
          setBudgets((prev) => prev.filter((b) => b.id !== id));
          showAlert({
            title: 'TARGET DIHAPUS',
            message: 'Batas anggaran telah berhasil dihapus.',
            type: 'success',
          });
        } catch (err: any) {
          showAlert({
            title: 'GAGAL MENGHAPUS',
            message: err.message || 'Gagal menghapus anggaran.',
            type: 'error',
          });
        }
      },
    });
  };

  const availableCategories = categories.filter((c) => {
    const matchesWallet = formWalletId ? c.walletId === formWalletId : true;
    const matchesType = formType === 'EXPENSE_LIMIT' ? c.type === 'EXPENSE' : c.type === 'INCOME';
    return matchesWallet && matchesType;
  });

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 retro-box">
        <div>
          <h1 className="font-pixel text-xs sm:text-base text-[var(--text-primary)]">
            {t("budgets_title")}
          </h1>
          <p className="font-arcade text-sm sm:text-base text-[var(--text-muted)] mt-0.5">
            {t("budgets_sub")}
          </p>
        </div>

        <button onClick={handleOpenAdd} className="retro-btn text-[9px] py-1.5 px-3">
          <Plus className="h-3.5 w-3.5" />
          {t("btn_add_budget")}
        </button>
      </div>

      {/* Filter by Wallet Scope */}
      <div className="retro-box p-3 flex items-center gap-2.5 overflow-x-auto">
        <span className="font-pixel text-[8px] text-[var(--text-muted)] uppercase shrink-0">
          {t("scope_filter_label")}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setWalletFilter('')}
            className={`flex items-center gap-1.5 px-2.5 py-1 font-pixel text-[8px] transition shrink-0 border border-[var(--border-color)] ${
              walletFilter === ''
                ? 'bg-[var(--accent-color)] text-[var(--accent-text)]'
                : 'bg-[var(--bg-card-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
            }`}
          >
            <Layers className="h-3 w-3" />
            <span>{t("scope_all")}</span>
          </button>
          {wallets.map((w) => {
            const isSelected = walletFilter === w.id;
            return (
              <button
                key={w.id}
                onClick={() => setWalletFilter(w.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 font-pixel text-[8px] transition shrink-0 border border-[var(--border-color)] ${
                  isSelected
                    ? 'bg-[var(--accent-color)] text-[var(--accent-text)]'
                    : 'bg-[var(--bg-card-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
                }`}
              >
                <span className="h-2 w-2 shrink-0 border border-[var(--border-color)]" style={{ backgroundColor: w.color }} />
                <span>{w.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.map((b) => (
          <div
            key={b.id}
            className={`retro-box p-4 sm:p-5 flex flex-col justify-between transition ${
              b.isExceeded ? 'border-red-600 ring-2 ring-red-600' : ''
            }`}
          >
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b-2 border-[var(--border-color)]">
                <div className="flex items-center gap-1.5">
                  <span className="retro-badge text-[7px] py-0.5 px-1.5">
                    {b.period === 'WEEKLY' ? t("budget_period_weekly") : t("budget_period_monthly")}
                  </span>
                  {b.wallet ? (
                    <span className="retro-badge text-[7px] py-0.5 px-1.5 border-[var(--border-color)]">
                      {b.wallet.name}
                    </span>
                  ) : (
                    <span className="retro-badge text-[7px] py-0.5 px-1.5">
                      {t("union_all")}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(b)}
                    className="p-1 border border-[var(--border-color)] hover:bg-[var(--accent-color)] hover:text-[var(--accent-text)] transition"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="p-1 border border-[var(--border-color)] hover:bg-[var(--accent-color)] hover:text-[var(--accent-text)] transition"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <div className="mt-3">
                <h3 className="font-pixel text-xs text-[var(--text-primary)]">
                  {b.category?.name || t("all_expenses")}
                </h3>
                <span className={`font-arcade text-sm mt-0.5 block ${b.type === 'EXPENSE_LIMIT' ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}`}>
                  {b.type === 'EXPENSE_LIMIT' ? `>> ${t("budget_type_expense")}` : `>> ${t("budget_type_income")}`}
                </span>
              </div>

              <div className="mt-3 flex items-baseline justify-between font-mono gap-1">
                <span className={`font-arcade text-xl sm:text-2xl font-bold truncate ${b.isExceeded ? 'text-red-600' : 'text-[var(--text-primary)]'}`}>
                  {formatCurrency(b.currentAmount)}
                </span>
                <span className="text-xs text-[var(--text-muted)] truncate shrink-0">
                  / {formatCurrency(b.targetAmount)}
                </span>
              </div>

              {/* Visual 8-Bit Gauge Bar with Semantic Red & Green */}
              <div className="mt-2 w-full h-3 border-2 border-[var(--border-color)] bg-[var(--bg-card-subtle)] p-0.5">
                <div
                  className={`h-full transition-all duration-300 ${
                    b.isExceeded ? 'bg-red-600' : b.percentage > 80 ? 'bg-amber-500' : 'bg-green-600'
                  }`}
                  style={{ width: `${Math.min(100, b.percentage)}%` }}
                />
              </div>
            </div>

            <div className="mt-4 pt-2.5 border-t-2 border-[var(--border-color)] flex items-center justify-between font-pixel text-[8px]">
              <span className="text-[var(--text-muted)]">{b.percentage}% {t("budget_used")}</span>
              {b.isExceeded ? (
                <span className="flex items-center gap-1 text-red-600 font-bold">
                  <AlertTriangle className="h-3 w-3 text-red-600" />
                  {t("budget_exceeded")}
                </span>
              ) : b.percentage > 80 ? (
                <span className="flex items-center gap-1 text-amber-500 font-bold">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                  {t("budget_near_limit")}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-green-600 font-bold">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  {t("budget_safe")}
                </span>
              )}
            </div>
          </div>
        ))}

        {budgets.length === 0 && !loading && (
          <div className="col-span-full py-10 text-center font-pixel text-[9px] text-[var(--text-muted)] retro-box border-dashed">
            {t("empty_budgets_list")}
          </div>
        )}
      </div>

      {/* Modal Add / Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="retro-box max-w-md w-full p-4 sm:p-6 shadow-[var(--glow-shadow-lg)] my-auto max-h-[92vh] overflow-y-auto">
            <h3 className="font-pixel text-xs sm:text-sm text-[var(--text-primary)] mb-3 border-b-2 border-[var(--border-color)] pb-2">
              {editingId ? t("modal_edit_budget") : t("modal_add_budget")}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2 p-1 border-2 border-[var(--border-color)] bg-[var(--bg-card-subtle)]">
                <button
                  type="button"
                  onClick={() => {
                    setFormType('EXPENSE_LIMIT');
                    setFormCategoryId('');
                  }}
                  className={`py-1.5 font-pixel text-[8px] sm:text-[9px] transition ${
                    formType === 'EXPENSE_LIMIT'
                      ? 'bg-red-600 text-white font-bold'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  {t("budget_type_expense")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormType('INCOME_GOAL');
                    setFormCategoryId('');
                  }}
                  className={`py-1.5 font-pixel text-[8px] sm:text-[9px] transition ${
                    formType === 'INCOME_GOAL'
                      ? 'bg-green-600 text-white font-bold'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  {t("budget_type_income")}
                </button>
              </div>

              {/* Wallet Scope selection */}
              <div>
                <label className="block font-pixel text-[8px] text-[var(--text-muted)] mb-1 uppercase">
                  {t("field_wallet_scope")}
                </label>
                <div className="relative flex items-center border-2 border-[var(--border-color)] bg-[var(--bg-card)] shadow-[var(--glow-shadow-sm)]">
                  <select
                    value={formWalletId}
                    onChange={(e) => {
                      setFormWalletId(e.target.value);
                      setFormCategoryId('');
                    }}
                    className="w-full appearance-none bg-transparent pl-3 pr-8 py-2 font-mono text-xs text-[var(--text-primary)] outline-none cursor-pointer"
                  >
                    <option value="">{t("global_union_scope")}</option>
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-0 top-0 bottom-0 px-2.5 bg-[var(--bg-card-subtle)] border-l-2 border-[var(--border-color)] text-[var(--text-primary)] flex items-center justify-center pointer-events-none select-none">
                    <ChevronDown className="h-3.5 w-3.5 stroke-[2.5]" />
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-pixel text-[8px] text-[var(--text-muted)] mb-1 uppercase">
                  {t("field_budget_period")}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormPeriod('MONTHLY')}
                    className={`py-1.5 font-pixel text-[8px] sm:text-[9px] border-2 transition ${
                      formPeriod === 'MONTHLY'
                        ? 'border-[var(--accent-color)] bg-[var(--accent-color)] text-[var(--accent-text)]'
                        : 'border-[var(--border-color)] text-[var(--text-muted)] bg-[var(--bg-card-subtle)]'
                    }`}
                  >
                    {t("budget_period_monthly")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormPeriod('WEEKLY')}
                    className={`py-1.5 font-pixel text-[8px] sm:text-[9px] border-2 transition ${
                      formPeriod === 'WEEKLY'
                        ? 'border-[var(--accent-color)] bg-[var(--accent-color)] text-[var(--accent-text)]'
                        : 'border-[var(--border-color)] text-[var(--text-muted)] bg-[var(--bg-card-subtle)]'
                    }`}
                  >
                    {t("budget_period_weekly")}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-pixel text-[8px] text-[var(--text-muted)] mb-1 uppercase">
                  {t("field_budget_category")}
                </label>
                <div className="relative flex items-center border-2 border-[var(--border-color)] bg-[var(--bg-card)] shadow-[var(--glow-shadow-sm)]">
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full appearance-none bg-transparent pl-3 pr-8 py-2 font-mono text-xs text-[var(--text-primary)] outline-none cursor-pointer"
                  >
                    <option value="">{t("all_categories_opt")}</option>
                    {availableCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-0 top-0 bottom-0 px-2.5 bg-[var(--bg-card-subtle)] border-l-2 border-[var(--border-color)] text-[var(--text-primary)] flex items-center justify-center pointer-events-none select-none">
                    <ChevronDown className="h-3.5 w-3.5 stroke-[2.5]" />
                  </span>
                </div>
              </div>

              {/* Target Nominal with Thousand Dot Separator (BVA & EQP) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-pixel text-[8px] text-[var(--text-muted)] uppercase">
                    {t("target_nominal_label")}
                  </label>
                  <span className="font-arcade text-xs text-[var(--text-muted)]">
                    {t("amount_format_hint")}
                  </span>
                </div>
                <div className="flex border-2 border-[var(--border-color)] bg-[var(--bg-card)] shadow-[var(--glow-shadow-sm)]">
                  <span className="px-3 py-2 bg-[var(--bg-card-subtle)] border-r-2 border-[var(--border-color)] font-mono text-xs font-bold text-[var(--text-primary)] select-none flex items-center shrink-0">
                    Rp
                  </span>
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    value={formAmount}
                    onChange={(e) => setFormAmount(formatNominalInput(e.target.value))}
                    placeholder="Contoh: 3.000.000"
                    className="w-full bg-transparent px-3 py-2 font-mono text-xs font-bold text-[var(--text-primary)] outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="retro-btn text-[8px] sm:text-[9px]"
                >
                  {t("btn_cancel")}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="retro-btn-accent px-3 py-1.5 text-[8px] sm:text-[9px] disabled:opacity-60"
                >
                  {submitting ? t("btn_saving") : editingId ? t("btn_update_budget") : t("btn_save_budget")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
