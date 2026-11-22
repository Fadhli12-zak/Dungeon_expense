import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useWallet } from '../context/WalletContext';
import { Category } from '../types';
import { RetroIcon } from '../components/RetroIcon';
import { PixelIconSelector } from '../components/PixelIconSelector';
import { useAlert } from '../context/AlertContext';
import { useLanguage } from '../context/LanguageContext';
import { Plus, Edit2, Trash2, Check } from 'lucide-react';

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

export const Categories: React.FC = () => {
  const { wallets, activeWalletId } = useWallet();
  const { showAlert, showConfirm } = useAlert();
  const { t } = useLanguage();
  const [selectedWalletId, setSelectedWalletId] = useState<string>(
    activeWalletId || (wallets[0]?.id ?? '')
  );

  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [loading, setLoading] = useState(true);

  // Sync selected wallet if wallets load or activeWalletId changes
  useEffect(() => {
    if (activeWalletId) {
      setSelectedWalletId(activeWalletId);
    } else if (wallets.length > 0 && !selectedWalletId) {
      setSelectedWalletId(wallets[0].id);
    }
  }, [activeWalletId, wallets]);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [formColor, setFormColor] = useState('#000000');
  const [formIcon, setFormIcon] = useState('PixelShirt');
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = async () => {
    if (!selectedWalletId) return;
    try {
      setLoading(true);
      const res = await api.get<Category[]>(`/categories?walletId=${selectedWalletId}`);
      setCategories(res);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [selectedWalletId]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormName('');
    setFormType(activeTab);
    setFormColor('#000000');
    setFormIcon(activeTab === 'EXPENSE' ? 'PixelShirt' : 'PixelCoinBag');
    setModalOpen(true);
  };

  const handleOpenEdit = (c: Category) => {
    setEditingId(c.id);
    setFormName(c.name);
    setFormType(c.type);
    setFormColor(c.color);
    setFormIcon(c.icon);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showAlert('Nama kategori wajib diisi.');
      return;
    }
    if (!selectedWalletId) {
      showAlert('Pilih wallet terlebih dahulu.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        walletId: selectedWalletId,
        name: formName.trim(),
        type: formType,
        color: formColor,
        icon: formIcon,
      };

      if (editingId) {
        const updated = await api.put<Category>(`/categories/${editingId}`, payload);
        setCategories((prev) =>
          prev.map((c) => (c.id === editingId ? { ...c, ...updated } : c))
        );
      } else {
        const created = await api.post<Category>('/categories', payload);
        setCategories((prev) => [...prev, created]);
      }

      setModalOpen(false);
    } catch (err: any) {
      showAlert({
        title: 'GAGAL MENYIMPAN',
        message: err.message || 'Gagal menyimpan kategori.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    showConfirm({
      title: t("confirm_delete_cat_title"),
      message: `${name}: ${t("confirm_delete_cat_msg")}`,
      confirmLabel: t("col_actions"),
      cancelLabel: t("btn_cancel"),
      onConfirm: async () => {
        try {
          await api.delete(`/categories/${id}`);
          setCategories((prev) => prev.filter((c) => c.id !== id));
        } catch (err: any) {
          showAlert({
            title: 'GAGAL MENGHAPUS',
            message: err.message || 'Gagal menghapus kategori.',
            type: 'error',
          });
        }
      },
    });
  };

  const filtered = categories.filter((c) => c.type === activeTab);
  const currentWallet = wallets.find((w) => w.id === selectedWalletId);

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 retro-box">
        <div>
          <h1 className="font-pixel text-xs sm:text-base text-[var(--text-primary)]">
            {t("categories_title")}
          </h1>
          <p className="font-arcade text-sm sm:text-base text-[var(--text-muted)] mt-0.5">
            {t("categories_sub")}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          disabled={!selectedWalletId}
          className="retro-btn text-[9px] py-1.5 px-3 disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          {t("btn_add_category")}
        </button>
      </div>

      {/* Wallet Selector Pills */}
      <div className="retro-box p-3 flex items-center gap-2.5 overflow-x-auto">
        <span className="font-pixel text-[8px] text-[var(--text-muted)] uppercase shrink-0">
          {t("label_dompet")}:
        </span>
        <div className="flex items-center gap-1.5">
          {wallets.map((w) => {
            const isSelected = selectedWalletId === w.id;
            return (
              <button
                key={w.id}
                onClick={() => setSelectedWalletId(w.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 font-pixel text-[8px] transition shrink-0 border border-[var(--border-color)] ${
                  isSelected
                    ? 'bg-[var(--accent-color)] text-[var(--accent-text)]'
                    : 'bg-[var(--bg-card-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
                }`}
              >
                <span
                  className="h-2 w-2 shrink-0 border border-[var(--border-color)]"
                  style={{ backgroundColor: w.color }}
                />
                <span>{w.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabs with Semantic Colors */}
      <div className="flex border-b-2 border-[var(--border-color)] gap-2">
        <button
          onClick={() => setActiveTab('EXPENSE')}
          className={`px-3 sm:px-4 py-2 font-pixel text-[8px] sm:text-[9px] border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'EXPENSE'
              ? 'border-red-600 text-red-600 bg-[var(--bg-card-subtle)] font-bold'
              : 'border-transparent text-[var(--text-muted)] hover:text-red-500'
          }`}
        >
          <span>{t("tab_expense")}</span>
          <span className="retro-badge text-[7px] border-red-600 text-red-600">
            {categories.filter((c) => c.type === 'EXPENSE').length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('INCOME')}
          className={`px-3 sm:px-4 py-2 font-pixel text-[8px] sm:text-[9px] border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'INCOME'
              ? 'border-green-600 text-green-600 bg-[var(--bg-card-subtle)] font-bold'
              : 'border-transparent text-[var(--text-muted)] hover:text-green-500'
          }`}
        >
          <span>{t("tab_income")}</span>
          <span className="retro-badge text-[7px] border-green-600 text-green-600">
            {categories.filter((c) => c.type === 'INCOME').length}
          </span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {filtered.map((cat) => (
          <div
            key={cat.id}
            className="retro-box p-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="h-8 w-8 border-2 border-[var(--border-color)] flex items-center justify-center shrink-0 bg-[var(--bg-card-subtle)]"
              >
                <RetroIcon
                  categoryName={cat.name}
                  name={cat.icon}
                  type={cat.type}
                  className={`h-4 w-4 ${cat.type === 'EXPENSE' ? 'text-red-600' : 'text-green-600'}`}
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 shrink-0 border border-[var(--border-color)]"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="font-pixel text-[10px] text-[var(--text-primary)] truncate block">
                    {cat.name}
                  </span>
                </div>
                <span className="font-arcade text-xs text-[var(--text-muted)] uppercase tracking-wider block">
                  {currentWallet?.name}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handleOpenEdit(cat)}
                className="p-1 border border-[var(--border-color)] hover:bg-[var(--accent-color)] hover:text-[var(--accent-text)] transition"
                title="Edit"
              >
                <Edit2 className="h-3 w-3" />
              </button>
              <button
                onClick={() => handleDelete(cat.id, cat.name)}
                className="p-1 border border-[var(--border-color)] hover:bg-[var(--accent-color)] hover:text-[var(--accent-text)] transition"
                title="Hapus"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && !loading && (
          <div className="col-span-full py-8 text-center font-pixel text-[9px] text-[var(--text-muted)] retro-box border-dashed">
            {t("empty_categories_list")}
          </div>
        )}
      </div>

      {/* Modal Add / Edit Category */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="retro-box max-w-md w-full p-4 sm:p-6 shadow-[var(--glow-shadow-lg)] my-auto max-h-[90vh] overflow-y-auto">
            <h3 className="font-pixel text-xs sm:text-sm text-[var(--text-primary)] mb-1 border-b-2 border-[var(--border-color)] pb-2">
              {editingId ? t("modal_edit_category") : t("modal_add_category")}
            </h3>
            <p className="font-arcade text-sm text-[var(--text-muted)] mb-3">
              {t("label_dompet")}: <span className="font-bold text-[var(--text-primary)]">{currentWallet?.name}</span>
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2 p-1 border-2 border-[var(--border-color)] bg-[var(--bg-card-subtle)]">
                <button
                  type="button"
                  onClick={() => {
                    setFormType('EXPENSE');
                    setFormIcon('PixelShirt');
                  }}
                  className={`py-1.5 font-pixel text-[8px] sm:text-[9px] transition ${
                    formType === 'EXPENSE'
                      ? 'bg-red-600 text-white font-bold'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  {t("tab_expense")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormType('INCOME');
                    setFormIcon('PixelCoinBag');
                  }}
                  className={`py-1.5 font-pixel text-[8px] sm:text-[9px] transition ${
                    formType === 'INCOME'
                      ? 'bg-green-600 text-white font-bold'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  {t("tab_income")}
                </button>
              </div>

              <div>
                <label className="block font-pixel text-[8px] text-[var(--text-muted)] mb-1 uppercase">
                  {t("field_category_name")}
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={t("category_name_placeholder")}
                  className="retro-input w-full font-mono text-xs"
                />
              </div>

              {/* Pixel Icon Selector */}
              <div>
                <label className="block font-pixel text-[8px] text-[var(--text-muted)] mb-1 uppercase">
                  {t("select_pixel_icon")}
                </label>
                <PixelIconSelector
                  selectedIcon={formIcon}
                  onSelect={(iconId) => setFormIcon(iconId)}
                />
              </div>

              {/* Color Presets */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-pixel text-[8px] text-[var(--text-muted)] uppercase">
                    {t("field_indicator_color")}
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
                  {submitting ? t("btn_saving") : editingId ? t("btn_update_category") : t("btn_save_category")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
