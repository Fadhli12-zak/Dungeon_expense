import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { useAlert } from '../context/AlertContext';
import { useLanguage } from '../context/LanguageContext';
import { Wallet } from '../types';
import { formatCurrency } from '../utils/export';
import { formatNominalInput, formatNominalFromDecimal, parseNominalRaw } from '../utils/numberFormat';
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowRight,
} from 'lucide-react';

const PRESET_COLORS = [
  // Monokrom
  '#000000', '#444444', '#888888', '#FFFFFF',
  // Hangat (Merah, Oranye, Kuning)
  '#DC2626', '#EF4444', '#F97316', '#EA580C',
  '#F59E0B', '#EAB308', '#FACC15', '#92400E',
  // Segar (Hijau, Teal, Cyan)
  '#84CC16', '#22C55E', '#16A34A', '#10B981',
  '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6',
  // Dingin & Cerah (Biru, Ungu, Pink)
  '#2563EB', '#4F46E5', '#8B5CF6', '#A855F7',
  '#D946EF', '#EC4899', '#F43F5E', '#BE123C',
];

const isLightColor = (hex: string): boolean => {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return false;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
};

export const Wallets: React.FC = () => {
  const {
    wallets,
    activeWalletId,
    setActiveWalletId,
    createWallet,
    updateWallet,
    deleteWallet,
  } = useWallet();
  const { showAlert, showConfirm } = useAlert();
  const { t } = useLanguage();

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formColor, setFormColor] = useState('#000000');
  const [formInitialBalance, setFormInitialBalance] = useState('0');
  const [submitting, setSubmitting] = useState(false);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormName('');
    setFormColor('#000000');
    setFormInitialBalance('0');
    setModalOpen(true);
  };

  const handleOpenEdit = (w: Wallet) => {
    setEditingId(w.id);
    setFormName(w.name);
    setFormColor(w.color);
    setFormInitialBalance(formatNominalFromDecimal(w.initialBalance || '0'));
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showAlert('Nama wallet wajib diisi.');
      return;
    }

    const rawBalance = parseNominalRaw(formInitialBalance);
    if (rawBalance > 10_000_000_000) {
      showAlert({
        title: 'VALIDASI SALDO (BVA)',
        message: 'Batas saldo awal maksimum adalah Rp 10.000.000.000',
        type: 'error',
      });
      return;
    }

    try {
      setSubmitting(true);
      if (editingId) {
        await updateWallet(editingId, {
          name: formName.trim(),
          color: formColor,
          initialBalance: rawBalance,
        });
        showAlert({
          title: 'WALLET DIPERBARUI',
          message: `Wallet "${formName}" berhasil diperbarui.`,
          type: 'success',
        });
      } else {
        await createWallet({
          name: formName.trim(),
          color: formColor,
          icon: 'Wallet',
          initialBalance: rawBalance,
        });
        showAlert({
          title: 'WALLET DIBUAT',
          message: `Wallet baru "${formName}" berhasil dibuat.`,
          type: 'success',
        });
      }
      setModalOpen(false);
    } catch (err: any) {
      showAlert({
        title: 'GAGAL MENYIMPAN',
        message: err.message || 'Gagal menyimpan wallet.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (w: Wallet) => {
    if (wallets.length <= 1) {
      showAlert('Kamu harus memiliki minimal satu wallet aktif.');
      return;
    }

    showConfirm({
      title: 'HAPUS WALLET',
      message: `PERINGATAN: Menghapus wallet "${w.name}" akan menghapus seluruh kategori dan transaksi di dalamnya. Lanjutkan?`,
      confirmLabel: 'HAPUS SEMUA',
      cancelLabel: 'BATAL',
      onConfirm: async () => {
        try {
          await deleteWallet(w.id);
          showAlert({
            title: 'WALLET DIHAPUS',
            message: `Wallet "${w.name}" telah dihapus.`,
            type: 'success',
          });
        } catch (err: any) {
          showAlert({
            title: 'GAGAL MENGHAPUS',
            message: err.message || 'Gagal menghapus wallet.',
            type: 'error',
          });
        }
      },
    });
  };

  const totalAllWalletsBalance = wallets.reduce((acc, w) => acc + (w.balance || 0), 0);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 retro-box">
        <div>
          <h1 className="font-pixel text-xs sm:text-base text-[var(--text-primary)]">
            {t("wallets_title")}
          </h1>
          <p className="font-arcade text-sm sm:text-base text-[var(--text-muted)] mt-0.5">
            {t("wallets_sub")}
          </p>
        </div>

        <button onClick={handleOpenAdd} className="retro-btn text-[9px] py-1.5 px-3">
          <Plus className="h-3.5 w-3.5" />
          {t("btn_add_wallet")}
        </button>
      </div>

      {/* Union Mode Card Banner */}
      <div
        onClick={() => setActiveWalletId(null)}
        className={`p-4 sm:p-5 border-[3px] border-[var(--border-color)] transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[var(--glow-shadow)] ${
          activeWalletId === null
            ? 'bg-[var(--accent-color)] text-[var(--accent-text)]'
            : 'bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-card-subtle)]'
        }`}
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="h-10 w-10 sm:h-11 sm:w-11 border-2 border-[var(--border-color)] flex items-center justify-center shrink-0 bg-[var(--bg-card-subtle)] text-[var(--text-primary)]">
            <Layers className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-pixel text-xs sm:text-sm">{t("union_all")}</h2>
              {activeWalletId === null && (
                <span className="font-pixel text-[7px] sm:text-[8px] px-1.5 py-0.5 border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)]">
                  {t("wallet_active_badge")}
                </span>
              )}
            </div>
            <p className="font-arcade text-xs sm:text-sm mt-0.5 opacity-80">
              {t("overview_sub_union")}
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right min-w-0">
          <span className="font-pixel text-[8px] uppercase block opacity-80 truncate">
            {t("saldo_union")}
          </span>
          <span className={`font-arcade text-2xl sm:text-3xl font-bold tracking-wider truncate block ${totalAllWalletsBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(totalAllWalletsBalance)}
          </span>
        </div>
      </div>

      {/* Wallet Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {wallets.map((w) => {
          const isActive = activeWalletId === w.id;
          return (
            <div
              key={w.id}
              className={`retro-box p-4 sm:p-5 flex flex-col justify-between transition ${
                isActive ? 'border-[var(--accent-color)] ring-2 ring-[var(--accent-color)]' : ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-2.5 border-b-2 border-[var(--border-color)]">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-3 w-3 shrink-0 border border-[var(--border-color)]"
                      style={{ backgroundColor: w.color }}
                    />
                    <span className="font-pixel text-[11px] sm:text-xs text-[var(--text-primary)] truncate max-w-[150px]">
                      {w.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(w)}
                      className="p-1 border border-[var(--border-color)] hover:bg-[var(--accent-color)] hover:text-[var(--accent-text)] transition"
                      title="Edit"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(w)}
                      className="p-1 border border-[var(--border-color)] hover:bg-[var(--accent-color)] hover:text-[var(--accent-text)] transition"
                      title="Hapus"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <span className="font-pixel text-[8px] text-[var(--text-muted)] block uppercase">
                    {t("wallet_balance")}
                  </span>
                  <div className={`font-arcade text-xl sm:text-2xl lg:text-3xl font-bold tracking-wider mt-0.5 truncate ${(w.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(w.balance || 0)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t-2 border-[var(--border-color)] font-mono text-xs">
                  <div className="min-w-0">
                    <span className="font-pixel text-[7px] text-[var(--text-muted)] block">{t("income")}</span>
                    <span className="font-bold flex items-center gap-1 mt-0.5 text-xs text-green-600 truncate">
                      <TrendingUp className="h-3 w-3 shrink-0" />
                      <span className="truncate">+{formatCurrency(w.totalIncome || 0)}</span>
                    </span>
                  </div>
                  <div className="min-w-0">
                    <span className="font-pixel text-[7px] text-[var(--text-muted)] block">{t("expenses")}</span>
                    <span className="font-bold flex items-center gap-1 mt-0.5 text-xs text-red-600 truncate">
                      <TrendingDown className="h-3 w-3 shrink-0" />
                      <span className="truncate">-{formatCurrency(w.totalExpense || 0)}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t-2 border-[var(--border-color)]">
                <button
                  onClick={() => setActiveWalletId(w.id)}
                  className={`w-full py-1.5 font-pixel text-[8px] sm:text-[9px] transition flex items-center justify-center gap-1.5 border border-[var(--border-color)] ${
                    isActive
                      ? 'bg-[var(--accent-color)] text-[var(--accent-text)]'
                      : 'bg-[var(--bg-card-subtle)] text-[var(--text-primary)] hover:bg-[var(--accent-color)] hover:text-[var(--accent-text)]'
                  }`}
                >
                  {isActive ? (
                    <>
                      <Check className="h-3 w-3 stroke-[3]" />
                      {t("wallet_active_badge")}
                    </>
                  ) : (
                    <>
                      {t("wallet_set_active")}
                      <ArrowRight className="h-3 w-3" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit Wallet */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="retro-box max-w-md w-full p-4 sm:p-6 shadow-[var(--glow-shadow-lg)] my-auto max-h-[92vh] overflow-y-auto">
            <h3 className="font-pixel text-xs sm:text-sm text-[var(--text-primary)] mb-3 border-b-2 border-[var(--border-color)] pb-2">
              {editingId ? t("modal_edit_wallet") : t("modal_add_wallet")}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block font-pixel text-[8px] text-[var(--text-muted)] mb-1 uppercase">
                  {t("field_wallet_name")}
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={t("wallet_name_placeholder")}
                  className="retro-input w-full font-mono text-xs"
                />
              </div>

              {/* Saldo Awal with Thousand Dot Separator (BVA & EQP) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-pixel text-[8px] text-[var(--text-muted)] uppercase">
                    {t("field_initial_balance")}
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
                    value={formInitialBalance}
                    onChange={(e) => setFormInitialBalance(formatNominalInput(e.target.value))}
                    placeholder="0"
                    className="w-full bg-transparent px-3 py-2 font-mono text-xs font-bold text-[var(--text-primary)] outline-none"
                  />
                </div>
              </div>

              {/* Color Presets */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-pixel text-[8px] text-[var(--text-muted)] uppercase">
                    {t("field_wallet_color")}
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-mono text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                    <span>CUSTOM:</span>
                    <input
                      type="color"
                      value={formColor}
                      onChange={(e) => setFormColor(e.target.value.toUpperCase())}
                      className="h-5 w-7 cursor-pointer border-2 border-[var(--border-color)] bg-transparent p-0"
                    />
                    <span className="uppercase">{formColor}</span>
                  </label>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COLORS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setFormColor(col)}
                      title={col}
                      className={`h-6 w-6 border-2 flex items-center justify-center transition ${
                        formColor.toUpperCase() === col
                          ? 'border-[var(--text-primary)] scale-110 shadow-[var(--glow-shadow-sm)]'
                          : 'border-[var(--border-color)] hover:scale-105'
                      }`}
                      style={{ backgroundColor: col }}
                    >
                      {formColor.toUpperCase() === col && (
                        <Check className={`h-3 w-3 ${isLightColor(col) ? 'text-black' : 'text-white'} stroke-[3]`} />
                      )}
                    </button>
                  ))}
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
                  {submitting ? t("btn_saving") : editingId ? t("btn_update_wallet") : t("btn_save_wallet")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
