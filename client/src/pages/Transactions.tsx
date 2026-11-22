import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { useWallet } from "../context/WalletContext";
import { useAlert } from "../context/AlertContext";
import { useLanguage } from "../context/LanguageContext";
import { Transaction, Category } from "../types";
import {
  formatCurrency,
  formatDate,
  exportToExcel,
  exportToCSV,
  exportToPDF,
} from "../utils/export";
import {
  formatNominalInput,
  formatNominalFromDecimal,
  parseNominalRaw,
  validateBVAAmount,
} from "../utils/numberFormat";
import { RetroIcon } from "../components/RetroIcon";
import {
  Plus,
  FileSpreadsheet,
  FileText,
  Trash2,
  Edit2,
  Search,
  Download,
  ChevronDown,
} from "lucide-react";

const getQuickDate = (offset: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTransactionISO = (dateStr: string): string => {
  const now = new Date();
  const [y, m, d] = dateStr.split("-").map(Number);
  const txDate = new Date(
    y,
    m - 1,
    d,
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
    now.getMilliseconds(),
  );
  return txDate.toISOString();
};

export const Transactions: React.FC = () => {
  const { wallets, activeWalletId, refreshWallets } = useWallet();
  const { showAlert, showConfirm } = useAlert();
  const { t, language } = useLanguage();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [walletFilter, setWalletFilter] = useState<string>(
    activeWalletId || "",
  );
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Sync wallet filter when global activeWalletId changes
  useEffect(() => {
    setWalletFilter(activeWalletId || "");
  }, [activeWalletId]);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formWalletId, setFormWalletId] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formType, setFormType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formDate, setFormDate] = useState(getQuickDate(0));
  const [formNote, setFormNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (walletFilter) params.append("walletId", walletFilter);
      if (typeFilter) params.append("type", typeFilter);
      if (categoryFilter) params.append("categoryId", categoryFilter);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const catWalletQuery = walletFilter ? `?walletId=${walletFilter}` : "";

      const [txRes, catRes] = await Promise.all([
        api.get<Transaction[]>(`/transactions?${params.toString()}`),
        api.get<Category[]>(`/categories${catWalletQuery}`),
      ]);

      setTransactions(txRes);
      setCategories(catRes);
    } catch (err: any) {
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [walletFilter, typeFilter, categoryFilter, startDate, endDate]);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormWalletId(walletFilter || wallets[0]?.id || "");
    setFormAmount("");
    setFormType("EXPENSE");
    setFormCategoryId("");
    setFormDate(getQuickDate(0));
    setFormNote("");
    setModalOpen(true);
  };

  const handleOpenEditModal = (t: Transaction) => {
    setEditingId(t.id);
    setFormWalletId(t.walletId);
    setFormAmount(formatNominalFromDecimal(t.amount));
    setFormType(t.type);
    setFormCategoryId(t.categoryId || "");

    // Parse local date safely without UTC offset shift
    const txDate = new Date(t.date);
    const year = txDate.getFullYear();
    const month = String(txDate.getMonth() + 1).padStart(2, "0");
    const day = String(txDate.getDate()).padStart(2, "0");
    setFormDate(`${year}-${month}-${day}`);

    setFormNote(t.note || "");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawAmount = parseNominalRaw(formAmount);
    const bva = validateBVAAmount(rawAmount);
    if (!bva.valid) {
      showAlert({
        title: "VALIDASI NOMINAL (BVA)",
        message: bva.message || "Nominal tidak valid.",
        type: "error",
      });
      return;
    }

    if (!formWalletId) {
      showAlert("Pilih wallet tujuan transaksi.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        walletId: formWalletId,
        amount: rawAmount,
        type: formType,
        categoryId: formCategoryId || null,
        date: getTransactionISO(formDate),
        note: formNote.trim() || null,
      };

      if (editingId) {
        await api.put(`/transactions/${editingId}`, payload);
      } else {
        await api.post("/transactions", payload);
      }

      if (walletFilter && walletFilter !== formWalletId) {
        setWalletFilter(formWalletId);
      }

      setModalOpen(false);

      await Promise.all([
        fetchTransactions(),
        refreshWallets(),
      ]);

      showAlert({
        title: editingId ? "TRANSAKSI DIUPDATE" : "TRANSAKSI DICATAT",
        message: `Transaksi sebesar Rp ${formatNominalInput(rawAmount)} berhasil disimpan!`,
        type: "success",
      });
    } catch (err: any) {
      showAlert({
        title: "GAGAL MENYIMPAN TRANSAKSI",
        message: err.message || "Gagal menyimpan transaksi.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string, amount: string | number, type: string) => {
    showConfirm({
      title: "HAPUS TRANSAKSI",
      message: `Hapus transaksi ${type === "EXPENSE" ? "pengeluaran" : "pemasukan"} sebesar ${formatCurrency(amount)}?`,
      confirmLabel: "HAPUS",
      cancelLabel: "BATAL",
      onConfirm: async () => {
        try {
          await api.delete(`/transactions/${id}`);
          await Promise.all([
            fetchTransactions(),
            refreshWallets(),
          ]);
          showAlert({
            title: "TRANSAKSI DIHAPUS",
            message: "Transaksi telah berhasil dihapus dari catatan.",
            type: "success",
          });
        } catch (err: any) {
          showAlert({
            title: "GAGAL MENGHAPUS",
            message: err.message || "Gagal menghapus transaksi.",
            type: "error",
          });
        }
      },
    });
  };

  const filteredTransactions = transactions.filter((t) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const catName = t.category?.name?.toLowerCase() || "";
    const walletName = t.wallet?.name?.toLowerCase() || "";
    const note = t.note?.toLowerCase() || "";
    return (
      catName.includes(query) ||
      note.includes(query) ||
      walletName.includes(query)
    );
  });

  const totalFilteredIncome = filteredTransactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalFilteredExpense = filteredTransactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const netFilteredTotal = totalFilteredIncome - totalFilteredExpense;

  const availableCategoriesForForm = categories.filter(
    (c) => c.walletId === formWalletId && c.type === formType,
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 retro-box">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-pixel text-xs sm:text-base text-[var(--text-primary)]">
              {t("transactions_title")}
            </h1>
            <span className="retro-badge text-[7px] bg-[var(--bg-card-subtle)]">
              {filteredTransactions.length} LOGS
            </span>
          </div>
          <p className="font-arcade text-sm sm:text-base text-[var(--text-muted)] mt-0.5">
            {t("transactions_sub")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export Buttons */}
          <div className="inline-flex border-2 border-[var(--border-color)] bg-[var(--bg-card-subtle)] p-0.5">
            <button
              onClick={() => exportToExcel(filteredTransactions)}
              className="px-2 py-1 font-pixel text-[8px] hover:bg-[var(--accent-color)] hover:text-[var(--accent-text)] transition flex items-center gap-1 text-[var(--text-primary)]"
              title="Download Excel (.xlsx)"
            >
              <FileSpreadsheet className="h-3 w-3 text-emerald-600" />
              <span>[XLSX]</span>
            </button>
            <button
              onClick={() => exportToCSV(filteredTransactions)}
              className="px-2 py-1 font-pixel text-[8px] hover:bg-[var(--accent-color)] hover:text-[var(--accent-text)] transition flex items-center gap-1 text-[var(--text-primary)] border-l border-r border-[var(--border-color)]"
              title="Download CSV"
            >
              <Download className="h-3 w-3 text-sky-600" />
              <span>[CSV]</span>
            </button>
            <button
              onClick={() => exportToPDF(filteredTransactions)}
              className="px-2 py-1 font-pixel text-[8px] hover:bg-[var(--accent-color)] hover:text-[var(--accent-text)] transition flex items-center gap-1 text-[var(--text-primary)]"
              title="Download PDF"
            >
              <FileText className="h-3 w-3 text-red-600" />
              <span>[PDF]</span>
            </button>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="retro-btn text-[9px] py-1.5 px-3"
          >
            <Plus className="h-3.5 w-3.5" />{t("btn_new_transaction")}
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="retro-box p-3.5 flex flex-wrap items-center gap-2.5">
        {/* Search Input */}
        <div className="flex flex-1 min-w-[170px] w-full sm:w-auto border-2 border-[var(--border-color)] bg-[var(--bg-card)] shadow-[var(--glow-shadow-sm)]">
          <span className="px-2.5 py-1.5 bg-[var(--bg-card-subtle)] border-r-2 border-[var(--border-color)] text-[var(--text-muted)] flex items-center justify-center shrink-0 select-none">
            <Search className="h-3.5 w-3.5" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("filter_search_placeholder")}
            className="w-full bg-transparent px-2.5 py-1.5 font-mono text-xs text-[var(--text-primary)] outline-none"
          />
        </div>

        {/* Wallet Filter */}
        <div className="relative flex items-center border-2 border-[var(--border-color)] bg-[var(--bg-card)] shadow-[var(--glow-shadow-sm)] w-full sm:w-auto">
          <select
            value={walletFilter}
            onChange={(e) => {
              setWalletFilter(e.target.value);
              setCategoryFilter("");
            }}
            className="w-full sm:w-auto appearance-none bg-transparent pl-3 pr-8 py-1.5 font-mono text-xs text-[var(--text-primary)] outline-none cursor-pointer"
          >
            <option value="">{t("all_wallets")}</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
          <span className="absolute right-0 top-0 bottom-0 px-2 bg-[var(--bg-card-subtle)] border-l-2 border-[var(--border-color)] text-[var(--text-primary)] flex items-center justify-center pointer-events-none select-none">
            <ChevronDown className="h-3.5 w-3.5 stroke-[2.5]" />
          </span>
        </div>

        {/* Type Filter */}
        <div className="relative flex items-center border-2 border-[var(--border-color)] bg-[var(--bg-card)] shadow-[var(--glow-shadow-sm)] w-full sm:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full sm:w-auto appearance-none bg-transparent pl-3 pr-8 py-1.5 font-mono text-xs text-[var(--text-primary)] outline-none cursor-pointer"
          >
            <option value="">{t("filter_all_types")}</option>
            <option value="EXPENSE">{t("opt_expense")}</option>
            <option value="INCOME">{t("opt_income")}</option>
          </select>
          <span className="absolute right-0 top-0 bottom-0 px-2 bg-[var(--bg-card-subtle)] border-l-2 border-[var(--border-color)] text-[var(--text-primary)] flex items-center justify-center pointer-events-none select-none">
            <ChevronDown className="h-3.5 w-3.5 stroke-[2.5]" />
          </span>
        </div>

        {/* Category Filter */}
        <div className="relative flex items-center border-2 border-[var(--border-color)] bg-[var(--bg-card)] shadow-[var(--glow-shadow-sm)] w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-auto appearance-none bg-transparent pl-3 pr-8 py-1.5 font-mono text-xs text-[var(--text-primary)] outline-none cursor-pointer"
          >
            <option value="">{t("filter_all_categories")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <span className="absolute right-0 top-0 bottom-0 px-2 bg-[var(--bg-card-subtle)] border-l-2 border-[var(--border-color)] text-[var(--text-primary)] flex items-center justify-center pointer-events-none select-none">
            <ChevronDown className="h-3.5 w-3.5 stroke-[2.5]" />
          </span>
        </div>

        {/* Date Ranges */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 font-mono text-xs w-full sm:w-auto">
          <div className="flex-1 sm:flex-initial flex items-center border-2 border-[var(--border-color)] bg-[var(--bg-card)] shadow-[var(--glow-shadow-sm)]">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-transparent py-1.5 px-2 text-xs font-mono text-[var(--text-primary)] outline-none"
            />
          </div>
          <span className="text-[var(--text-muted)] font-pixel text-[7px] shrink-0">
            S/D
          </span>
          <div className="flex-1 sm:flex-initial flex items-center border-2 border-[var(--border-color)] bg-[var(--bg-card)] shadow-[var(--glow-shadow-sm)]">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-transparent py-1.5 px-2 text-xs font-mono text-[var(--text-primary)] outline-none"
            />
          </div>
        </div>

        {(walletFilter ||
          typeFilter ||
          categoryFilter ||
          startDate ||
          endDate ||
          searchQuery) && (
          <button
            onClick={() => {
              setWalletFilter("");
              setTypeFilter("");
              setCategoryFilter("");
              setStartDate("");
              setEndDate("");
              setSearchQuery("");
            }}
            className="font-pixel text-[8px] text-[var(--text-muted)] hover:underline px-1.5 py-1"
          >
            [RESET]
          </button>
        )}
      </div>

      {/* Transactions Table */}
      <div className="retro-box overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left font-mono text-xs">
            <thead className="border-b-2 border-[var(--border-color)] bg-[var(--bg-card-subtle)] font-pixel text-[8px] text-[var(--text-muted)]">
              <tr>
                <th className="px-3 py-2.5">{t("col_date")}</th>
                <th className="px-3 py-2.5">{t("col_wallet")}</th>
                <th className="px-3 py-2.5">{t("field_category_type")}</th>
                <th className="px-3 py-2.5">{t("col_category")}</th>
                <th className="px-3 py-2.5">{t("col_note")}</th>
                <th className="px-3 py-2.5 text-right">{t("col_amount")}</th>
                <th className="px-3 py-2.5 text-right">{t("col_actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {filteredTransactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="hover:bg-[var(--bg-card-subtle)] transition"
                >
                  <td className="px-3 py-2.5 text-[var(--text-muted)] whitespace-nowrap">
                    {formatDate(tx.date, language)}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="retro-badge text-[7px] py-0.5 px-1.5">
                      {tx.wallet?.name || "Wallet"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span
                      className={`font-pixel text-[7px] px-1 py-0.5 border ${
                        tx.type === "EXPENSE"
                          ? "border-red-600 text-red-600 bg-red-950/20 font-bold"
                          : "border-green-600 text-green-600 bg-green-950/20 font-bold"
                      }`}
                    >
                      {tx.type === "EXPENSE" ? "KELUAR" : "MASUK"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="flex items-center gap-1.5 font-bold text-[var(--text-primary)]">
                      <RetroIcon
                        categoryName={tx.category?.name}
                        name={tx.category?.icon}
                        type={tx.type}
                        className={`h-3.5 w-3.5 ${tx.type === "EXPENSE" ? "text-red-600" : "text-green-600"}`}
                      />
                      {tx.category?.name || "Tanpa Kategori"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[var(--text-muted)] max-w-xs truncate">
                    {tx.note || "-"}
                  </td>
                  <td
                    className={`px-3 py-2.5 text-right font-arcade text-base sm:text-lg font-bold whitespace-nowrap ${
                      tx.type === "EXPENSE" ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {tx.type === "EXPENSE" ? "-" : "+"}
                    {formatCurrency(tx.amount)}
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenEditModal(tx)}
                        className="p-1 border border-[var(--border-color)] hover:bg-[var(--accent-color)] hover:text-[var(--accent-text)] transition"
                        title="Edit"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(tx.id, tx.amount, tx.type)}
                        className="p-1 border border-[var(--border-color)] hover:bg-[var(--accent-color)] hover:text-[var(--accent-text)] transition"
                        title="Hapus"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredTransactions.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center font-pixel text-[9px] text-[var(--text-muted)]"
                  >
                    {t("empty_transactions")}
                  </td>
                </tr>
              )}
            </tbody>

            {/* Highlighted Footer Summary Row (Total by active filters) */}
            {filteredTransactions.length > 0 && (
              <tfoot className="border-t-[3px] border-[var(--border-color)] bg-[var(--bg-card-subtle)] font-mono text-xs">
                <tr>
                  <td colSpan={5} className="px-3 py-3 align-middle">
                    <div className="flex items-center gap-2">
                      <span className="retro-badge bg-[var(--accent-color)] text-[var(--accent-text)] text-[8px] py-1 px-2 font-pixel shadow-[var(--glow-shadow-sm)]">
                        TOTAL
                      </span>
                      <span className="font-pixel text-[8px] sm:text-[9px] text-[var(--text-primary)]">
                        {filteredTransactions.length} LOGS
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right whitespace-nowrap">
                    <div className="flex flex-col items-end gap-1 font-mono">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-pixel text-[8px] text-[var(--text-muted)]">
                          {t("label_in")}
                        </span>
                        <span className="font-arcade text-base sm:text-lg font-bold text-green-600">
                          +{formatCurrency(totalFilteredIncome)}
                        </span>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-pixel text-[8px] text-[var(--text-muted)]">
                          {t("label_out")}
                        </span>
                        <span className="font-arcade text-base sm:text-lg font-bold text-red-600">
                          -{formatCurrency(totalFilteredExpense)}
                        </span>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-[var(--border-color)]">
                        <span className="font-pixel text-[8px] text-[var(--text-primary)] font-bold">
                          NET :
                        </span>
                        <span
                          className={`font-arcade text-base sm:text-lg font-bold ${
                            netFilteredTotal >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {netFilteredTotal >= 0 ? "+" : "-"}
                          {formatCurrency(Math.abs(netFilteredTotal))}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Mobile / Horizontal-Scroll Friendly Highlighted Summary Bar */}
        {filteredTransactions.length > 0 && (
          <div className="p-3 bg-[var(--bg-card-subtle)] border-t-[3px] border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3 font-mono text-xs sm:hidden">
            <div className="flex items-center gap-2">
              <span className="retro-badge bg-[var(--accent-color)] text-[var(--accent-text)] text-[7px] py-1 px-1.5 font-pixel">
                TOTAL
              </span>
              <span className="font-pixel text-[8px] text-[var(--text-primary)]">
                {filteredTransactions.length} LOGS
              </span>
            </div>

            <div className="flex flex-col items-end gap-1 font-mono">
              <div className="flex items-center gap-2">
                <span className="font-pixel text-[7px] text-[var(--text-muted)]">
                  {t("label_in")}
                </span>
                <span className="font-arcade text-sm font-bold text-green-600">
                  +{formatCurrency(totalFilteredIncome)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-pixel text-[7px] text-[var(--text-muted)]">
                  {t("label_out")}
                </span>
                <span className="font-arcade text-sm font-bold text-red-600">
                  -{formatCurrency(totalFilteredExpense)}
                </span>
              </div>
              <div className="flex items-center gap-2 pt-0.5 border-t border-[var(--border-color)]">
                <span className="font-pixel text-[7px] text-[var(--text-primary)] font-bold">
                  NET :
                </span>
                <span
                  className={`font-arcade text-sm font-bold ${netFilteredTotal >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {netFilteredTotal >= 0 ? "+" : "-"}
                  {formatCurrency(Math.abs(netFilteredTotal))}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Add / Edit Transaction */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="retro-box max-w-md w-full p-4 sm:p-6 shadow-[var(--glow-shadow-lg)] my-auto max-h-[92vh] overflow-y-auto">
            <h3 className="font-pixel text-xs sm:text-sm text-[var(--text-primary)] mb-3 border-b-2 border-[var(--border-color)] pb-2">
              {editingId ? t("modal_edit_transaction") : t("modal_add_transaction")}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 border-2 border-[var(--border-color)] bg-[var(--bg-card-subtle)]">
                <button
                  type="button"
                  onClick={() => {
                    setFormType("EXPENSE");
                    setFormCategoryId("");
                  }}
                  className={`py-1.5 font-pixel text-[8px] sm:text-[9px] transition ${
                    formType === "EXPENSE"
                      ? "bg-red-600 text-white font-bold shadow-[var(--glow-shadow-sm)]"
                      : "text-[var(--text-muted)]"
                  }`}
                >
                  {t("opt_expense")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormType("INCOME");
                    setFormCategoryId("");
                  }}
                  className={`py-1.5 font-pixel text-[8px] sm:text-[9px] transition ${
                    formType === "INCOME"
                      ? "bg-green-600 text-white font-bold shadow-[var(--glow-shadow-sm)]"
                      : "text-[var(--text-muted)]"
                  }`}
                >
                  {t("opt_income")}
                </button>
              </div>

              {/* Wallet Select */}
              <div>
                <label className="block font-pixel text-[8px] text-[var(--text-muted)] mb-1 uppercase">
                  {t("field_wallet")}
                </label>
                <div className="relative flex items-center border-2 border-[var(--border-color)] bg-[var(--bg-card)] shadow-[var(--glow-shadow-sm)]">
                  <select
                    required
                    value={formWalletId}
                    onChange={(e) => {
                      setFormWalletId(e.target.value);
                      setFormCategoryId("");
                    }}
                    className="w-full appearance-none bg-transparent pl-3 pr-8 py-2 font-mono text-xs text-[var(--text-primary)] outline-none cursor-pointer"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} (Saldo: {formatCurrency(w.balance || 0)})
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-0 top-0 bottom-0 px-2.5 bg-[var(--bg-card-subtle)] border-l-2 border-[var(--border-color)] text-[var(--text-primary)] flex items-center justify-center pointer-events-none select-none">
                    <ChevronDown className="h-3.5 w-3.5 stroke-[2.5]" />
                  </span>
                </div>
              </div>

              {/* Tanggal Transaksi */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-pixel text-[8px] text-[var(--text-muted)] uppercase">
                    {t("field_date")}
                  </label>
                  <span className="font-arcade text-xs text-[var(--text-muted)]">
                    {t("quick_or_manual")}
                  </span>
                </div>

                {/* 3 Prominent Quick Select Buttons */}
                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  <button
                    type="button"
                    onClick={() => setFormDate(getQuickDate(-1))}
                    className={`py-1.5 px-2 font-pixel text-[8px] border-2 border-[var(--border-color)] transition flex items-center justify-center gap-1 ${
                      formDate === getQuickDate(-1)
                        ? "bg-[var(--accent-color)] text-[var(--accent-text)] font-bold shadow-[var(--glow-shadow-sm)]"
                        : "bg-[var(--bg-card-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-card)]"
                    }`}
                  >
                    <span>{t("yesterday")}</span>
                    <span className="font-arcade text-xs opacity-75">(-1)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormDate(getQuickDate(0))}
                    className={`py-1.5 px-2 font-pixel text-[8px] border-2 border-[var(--border-color)] transition flex items-center justify-center gap-1 ${
                      formDate === getQuickDate(0)
                        ? "bg-[var(--accent-color)] text-[var(--accent-text)] font-bold shadow-[var(--glow-shadow-sm)]"
                        : "bg-[var(--bg-card-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-card)]"
                    }`}
                  >
                    <span>{t("today")}</span>
                    <span className="font-arcade text-xs opacity-75">(0)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormDate(getQuickDate(1))}
                    className={`py-1.5 px-2 font-pixel text-[8px] border-2 border-[var(--border-color)] transition flex items-center justify-center gap-1 ${
                      formDate === getQuickDate(1)
                        ? "bg-[var(--accent-color)] text-[var(--accent-text)] font-bold shadow-[var(--glow-shadow-sm)]"
                        : "bg-[var(--bg-card-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-card)]"
                    }`}
                  >
                    <span>{t("tomorrow")}</span>
                    <span className="font-arcade text-xs opacity-75">(+1)</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="retro-input w-full font-mono text-xs py-1.5"
                  />
                </div>
              </div>

              {/* Nominal */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-pixel text-[8px] text-[var(--text-muted)] uppercase">
                    {t("field_amount")}
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
                    onChange={(e) =>
                      setFormAmount(formatNominalInput(e.target.value))
                    }
                    placeholder="Contoh: 100.000"
                    className="w-full bg-transparent px-3 py-2 font-mono text-xs font-bold text-[var(--text-primary)] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-pixel text-[8px] text-[var(--text-muted)] mb-1 uppercase">
                  {t("field_category")}
                </label>
                <div className="relative flex items-center border-2 border-[var(--border-color)] bg-[var(--bg-card)] shadow-[var(--glow-shadow-sm)]">
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full appearance-none bg-transparent pl-3 pr-8 py-2 font-mono text-xs text-[var(--text-primary)] outline-none cursor-pointer"
                  >
                    <option value="">{t("no_category")}</option>
                    {availableCategoriesForForm.map((c) => (
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

              <div>
                <label className="block font-pixel text-[8px] text-[var(--text-muted)] mb-1 uppercase">
                  {t("field_note")}
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder={t("note_placeholder")}
                  className="retro-input w-full font-mono text-xs"
                />
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
                  {submitting
                    ? t("btn_saving")
                    : editingId
                    ? t("btn_update_transaction")
                    : t("btn_save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
