import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { useWallet } from "../context/WalletContext";
import { useTheme } from "../context/ThemeContext";
import { useAlert } from "../context/AlertContext";
import { useLanguage } from "../context/LanguageContext";
import {
  SummaryData,
  CategoryBreakdownResponse,
  TrendItem,
  BudgetLimit,
  Transaction,
  Category,
} from "../types";
import { formatCurrency, formatDate } from "../utils/export";
import {
  formatNominalInput,
  parseNominalRaw,
  validateBVAAmount,
} from "../utils/numberFormat";
import { RetroIcon } from "../components/RetroIcon";
import {
  Coins,
  TrendingDown,
  TrendingUp,
  Calendar,
  Plus,
  Target,
  PieChart as PieIcon,
  BarChart3,
  Layers,
  ChevronDown,
  Globe,
  Check,
  Wallet,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

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

export const Dashboard: React.FC = () => {
  const {
    activeWalletId,
    activeWallet,
    wallets,
    setActiveWalletId,
    refreshWallets,
  } = useWallet();
  const { chartPalette, updateFinancialMetrics, theme } =
    useTheme();
  const { showAlert } = useAlert();
  const { language, setLanguage, t } = useLanguage();

  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);
  const walletRef = useRef<HTMLDivElement>(null);

  // Close wallet dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        walletRef.current &&
        !walletRef.current.contains(event.target as Node)
      ) {
        setWalletDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [breakdown, setBreakdown] = useState<CategoryBreakdownResponse | null>(
    null,
  );
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [budgets, setBudgets] = useState<BudgetLimit[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    [],
  );
  const [categories, setCategories] = useState<Category[]>([]);

  const [period, setPeriod] = useState<"week" | "month">("month");
  const [expensePeriod, setExpensePeriod] = useState<
    "today" | "week" | "month"
  >("month");
  const [incomePeriod, setIncomePeriod] = useState<"today" | "week" | "month">(
    "month",
  );
  const [, setLoading] = useState(true);

  // Quick transaction modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formWalletId, setFormWalletId] = useState<string>("");
  const [formAmount, setFormAmount] = useState("");
  const [formType, setFormType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formDate, setFormDate] = useState(getQuickDate(0));
  const [formNote, setFormNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const walletParam = activeWalletId ? `&walletId=${activeWalletId}` : "";
      const walletQuery = activeWalletId ? `?walletId=${activeWalletId}` : "";

      const [sumRes, breakRes, trendRes, budRes, txRes, catRes] =
        await Promise.all([
          api.get<SummaryData>(`/analytics/summary${walletQuery}`),
          api.get<CategoryBreakdownResponse>(
            `/analytics/category-breakdown?period=${period}&type=EXPENSE${walletParam}`,
          ),
          api.get<TrendItem[]>(`/analytics/trends?days=7${walletParam}`),
          api.get<BudgetLimit[]>(`/budgets${walletQuery}`),
          api.get<Transaction[]>(`/transactions?limit=5${walletParam}`),
          api.get<Category[]>(`/categories${walletQuery}`),
        ]);

      setSummary(sumRes);
      setBreakdown(breakRes);
      setTrends(trendRes);
      setBudgets(budRes);
      setRecentTransactions(txRes);
      setCategories(catRes);

      // Auto-update theme based on financial health
      const expenseMonth = Number(sumRes.month.expense || 0);
      const incomeMonth = Number(sumRes.month.income || 0);
      const expenseLimitBudget = budRes.find((b) => b.type === "EXPENSE_LIMIT");
      const maxBudget = expenseLimitBudget
        ? Number(expenseLimitBudget.targetAmount)
        : 0;
      updateFinancialMetrics(incomeMonth, expenseMonth, maxBudget);
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeWalletId, period]);

  const handleOpenAddModal = () => {
    const defaultWallet = activeWalletId || (wallets[0]?.id ?? "");
    setFormWalletId(defaultWallet);
    setFormAmount("");
    setFormType("EXPENSE");
    setFormCategoryId("");
    setFormDate(getQuickDate(0));
    setFormNote("");
    setShowAddModal(true);
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
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
      await api.post("/transactions", {
        walletId: formWalletId,
        amount: rawAmount,
        type: formType,
        categoryId: formCategoryId || null,
        note: formNote.trim() || null,
        date: getTransactionISO(formDate),
      });

      if (activeWalletId && activeWalletId !== formWalletId) {
        setActiveWalletId(formWalletId);
      }

      setShowAddModal(false);
      setFormAmount("");
      setFormNote("");

      showAlert({
        title: "BERHASIL DICATAT",
        message: `Transaksi sebesar Rp ${formatNominalInput(rawAmount)} berhasil disimpan!`,
        type: "success",
      });

      // Refresh dashboard analytics & wallet balances in background
      void Promise.all([fetchDashboardData(), refreshWallets()]);
    } catch (err: any) {
      showAlert({
        title: "GAGAL MENAMBAH TRANSAKSI",
        message: err.message || "Gagal menambah transaksi.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCategoriesForModal = categories.filter(
    (c) => c.walletId === formWalletId && c.type === formType,
  );

  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="retro-box p-2 font-mono text-xs shadow-[var(--glow-shadow-sm)]">
          {label && (
            <p className="font-pixel text-[8px] mb-1 text-[var(--text-muted)] uppercase">
              {formatDate(String(label), language)}
            </p>
          )}
          {payload.map((p: any, idx: number) => (
            <p
              key={idx}
              className="font-bold flex items-center justify-between gap-3 text-xs"
              style={{ color: p.color || "var(--text-primary)" }}
            >
              <span>{p.name}:</span>
              <span>{formatCurrency(Number(p.value))}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Top Banner / Mode Indicator - Retro 8-Bit Pixel Themed */}
      <div className="retro-box p-3.5 sm:p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Section 1 (Left): Wallet Icon + Ringkasan & Subtitle */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 sm:h-11 sm:w-11 border-2 border-[var(--border-color)] bg-[var(--bg-card-subtle)] flex items-center justify-center shrink-0 shadow-[var(--glow-shadow-sm)]">
            <Wallet className="h-5 w-5 text-[var(--text-primary)]" />
          </div>
          <div className="min-w-0">
            <h1 className="font-pixel text-xs sm:text-sm text-[var(--text-primary)] uppercase tracking-tight truncate">
              {t("overview")}
            </h1>
            <p className="font-arcade text-xs sm:text-sm text-[var(--text-muted)] tracking-wider mt-1 truncate">
              {activeWalletId === null
                ? t("overview_sub_union")
                : `${t("overview_sub_wallet")} [${activeWallet?.name || ""}]`}
            </p>
          </div>
        </div>

        {/* Vertical Divider 1 */}
        <div className="hidden xl:block h-10 w-0.5 bg-[var(--border-color)] shrink-0" />

        {/* Section 2 (Middle): Dompet Dropdown & Status Kas Badge */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Dompet Control */}
          <div className="relative" ref={walletRef}>
            <span className="block font-pixel text-[8px] sm:text-[9px] uppercase text-[var(--text-muted)] mb-1">
              {t("label_dompet")}
            </span>
            <button
              type="button"
              onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
              className="retro-btn text-[8px] sm:text-[9px] py-1.5 px-2.5 sm:px-3 flex items-center gap-1.5 cursor-pointer shadow-[var(--glow-shadow-sm)] uppercase"
            >
              {activeWalletId === null ? (
                <>
                  <Layers className="h-3 w-3 text-indigo-500 shrink-0" />
                  <span className="font-pixel text-[8px] sm:text-[9px]">
                    {t("union_all")}
                  </span>
                </>
              ) : (
                <>
                  <span
                    className="h-2 w-2 shrink-0 border border-[var(--border-color)]"
                    style={{
                      backgroundColor:
                        activeWallet?.color || "var(--border-color)",
                    }}
                  />
                  <span className="font-pixel text-[8px] sm:text-[9px] max-w-[100px] truncate">
                    {activeWallet?.name}
                  </span>
                </>
              )}
              <ChevronDown className="h-3 w-3 stroke-[2.5]" />
            </button>

            {/* Wallet Dropdown Menu */}
            {walletDropdownOpen && (
              <div className="retro-box absolute left-0 mt-2 w-72 max-w-[calc(100vw-2rem)] border-[3px] border-[var(--border-color)] shadow-[var(--glow-shadow-lg)] py-2 z-50">
                <div className="px-3 py-1 font-pixel text-[8px] text-[var(--text-muted)] border-b-2 border-[var(--border-color)] pb-1 mb-1 uppercase tracking-wider">
                  [ {t("label_dompet")} CONTEXT ]
                </div>

                {/* Option 1: Union Mode */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveWalletId(null);
                    setWalletDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-2 flex items-center justify-between text-left font-mono text-xs transition ${
                    activeWalletId === null
                      ? "bg-[var(--accent-color)] text-[var(--accent-text)] font-bold"
                      : "hover:bg-[var(--bg-card-subtle)] text-[var(--text-primary)]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    <div>
                      <div className="font-pixel text-[9px]">
                        {t("union_all")}
                      </div>
                      <div className="font-arcade text-xs text-[var(--text-muted)]">
                        {t("overview_sub_union")}
                      </div>
                    </div>
                  </div>
                  {activeWalletId === null && (
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  )}
                </button>

                <div className="my-1 border-t border-[var(--border-color)]" />
                <div className="px-3 py-1 font-pixel text-[8px] text-[var(--text-muted)] uppercase">
                  {t("label_dompet")}
                </div>

                <div className="max-h-52 overflow-y-auto">
                  {wallets.map((w) => (
                    <button
                      type="button"
                      key={w.id}
                      onClick={() => {
                        setActiveWalletId(w.id);
                        setWalletDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 flex items-center justify-between text-left transition ${
                        activeWalletId === w.id
                          ? "bg-[var(--accent-color)] text-[var(--accent-text)] font-bold"
                          : "hover:bg-[var(--bg-card-subtle)] text-[var(--text-primary)]"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-2.5 w-2.5 shrink-0 border border-[var(--border-color)]"
                          style={{ backgroundColor: w.color }}
                        />
                        <div className="min-w-0">
                          <div className="font-pixel text-[9px] truncate">
                            {w.name}
                          </div>
                          <div className="font-arcade text-xs text-[var(--text-muted)]">
                            {formatCurrency(w.balance || 0)}
                          </div>
                        </div>
                      </div>
                      {activeWalletId === w.id && (
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="mt-2 pt-2 border-t-2 border-[var(--border-color)] px-2">
                  <Link
                    to="/wallets"
                    onClick={() => setWalletDropdownOpen(false)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-[var(--bg-card-subtle)] hover:bg-[var(--accent-color)] hover:text-[var(--accent-text)] font-pixel text-[8px] transition border border-[var(--border-color)] uppercase"
                  >
                    <Plus className="h-3 w-3" />+ KELOLA DOMPET
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Status Kas Control */}
          <div>
            <span className="block font-pixel text-[8px] sm:text-[9px] uppercase text-[var(--text-muted)] mb-1">
              {t("label_status_kas")}
            </span>
            <div
              className={`retro-badge py-1.5 px-2.5 border-2 border-[var(--border-color)] font-pixel text-[8px] sm:text-[9px] uppercase flex items-center gap-1.5 select-none shadow-[var(--glow-shadow-sm)] ${
                theme === "theme-spooky"
                  ? "bg-red-950/40 text-red-500 border-red-600"
                  : "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 border-green-600"
              }`}
              title="Status Finansial Otomatis (Hemat = Prosper, Boros = Spooky)"
            >
              <span
                className={`h-2 w-2 shrink-0 border border-[var(--border-color)] ${
                  theme === "theme-spooky" ? "bg-red-500" : "bg-green-500"
                }`}
              />
              <span className="whitespace-nowrap">
                {theme === "theme-spooky"
                  ? language === "id"
                    ? "SPOOKY (BOROS)"
                    : "SPOOKY (WASTEFUL)"
                  : language === "id"
                    ? "PROSPER (HEMAT)"
                    : "PROSPER (FRUGAL)"}
              </span>
            </div>
          </div>
        </div>

        {/* Vertical Divider 2 */}
        <div className="hidden xl:block h-10 w-0.5 bg-[var(--border-color)] shrink-0" />

        {/* Section 3 (Right): Language Dropdown, Period Dropdown, and + Catat Button */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Language Switcher Dropdown */}
          <div className="relative flex items-center border-2 border-[var(--border-color)] bg-[var(--bg-card)] shadow-[var(--glow-shadow-sm)]">
            <span className="px-2 py-1.5 bg-[var(--bg-card-subtle)] border-r-2 border-[var(--border-color)] text-[var(--text-primary)] flex items-center justify-center shrink-0 select-none">
              <Globe className="h-3.5 w-3.5" />
            </span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as "id" | "en")}
              className="appearance-none bg-transparent pl-2 pr-8 py-1.5 font-pixel text-[8px] sm:text-[9px] text-[var(--text-primary)] uppercase outline-none cursor-pointer"
            >
              <option
                value="id"
                className="bg-[var(--bg-card)] font-pixel text-[8px]"
              >
                IDN
              </option>
              <option
                value="en"
                className="bg-[var(--bg-card)] font-pixel text-[8px]"
              >
                ENG
              </option>
            </select>
            <span className="absolute right-0 top-0 bottom-0 px-1.5 bg-[var(--bg-card-subtle)] border-l-2 border-[var(--border-color)] text-[var(--text-primary)] flex items-center justify-center pointer-events-none select-none">
              <ChevronDown className="h-3 w-3 stroke-[2.5]" />
            </span>
          </div>

          {/* Period Switcher Dropdown (Pekan / Bulan) */}
          <div className="relative flex items-center border-2 border-[var(--border-color)] bg-[var(--bg-card)] shadow-[var(--glow-shadow-sm)]">
            <span className="px-2 py-1.5 bg-[var(--bg-card-subtle)] border-r-2 border-[var(--border-color)] text-[var(--text-primary)] flex items-center justify-center shrink-0 select-none">
              <Calendar className="h-3.5 w-3.5" />
            </span>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as "week" | "month")}
              className="appearance-none bg-transparent pl-2 pr-8 py-1.5 font-pixel text-[8px] sm:text-[9px] text-[var(--text-primary)] uppercase outline-none cursor-pointer"
            >
              <option
                value="week"
                className="bg-[var(--bg-card)] font-pixel text-[8px]"
              >
                {t("week")}
              </option>
              <option
                value="month"
                className="bg-[var(--bg-card)] font-pixel text-[8px]"
              >
                {t("month")}
              </option>
            </select>
            <span className="absolute right-0 top-0 bottom-0 px-1.5 bg-[var(--bg-card-subtle)] border-l-2 border-[var(--border-color)] text-[var(--text-primary)] flex items-center justify-center pointer-events-none select-none">
              <ChevronDown className="h-3 w-3 stroke-[2.5]" />
            </span>
          </div>

          {/* Record Action Button (+ CATAT) */}
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="retro-btn-accent text-[8px] sm:text-[9px] py-1.5 sm:py-2 px-3 flex items-center gap-1.5 cursor-pointer uppercase shadow-[var(--glow-shadow-sm)]"
          >
            <Plus className="h-3.5 w-3.5 stroke-[3]" />
            <span>{t("btn_record")}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards with Semantic Colors & 8-Bit Dynamic Touches */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Total Saldo */}
        <div className="retro-box p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="font-pixel text-[8px] text-[var(--text-muted)] uppercase">
              {activeWalletId === null ? t("saldo_union") : activeWallet?.name}
            </span>
            <Coins className="h-5 w-5 text-yellow-500 animate-coin-spin" />
          </div>
          <div className="mt-2 sm:mt-3">
            <h2
              className={`font-arcade text-xl sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold tracking-wider truncate ${(summary?.balance || 0) >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {formatCurrency(summary?.balance || 0)}
            </h2>
            <span className="font-mono text-[10px] sm:text-[11px] text-[var(--text-muted)] mt-0.5 block truncate">
              {activeWalletId === null
                ? `${wallets.length} ${t("wallets_active")}`
                : t("wallet_balance")}
            </span>
          </div>
        </div>

        {/* Pengeluaran (Expense) with Dropdown */}
        <div className="retro-box p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <TrendingDown className="h-4 w-4 text-red-600 animate-pulse shrink-0" />
              <span className="font-pixel text-[8px] text-[var(--text-muted)] uppercase truncate">
                {t("expenses")}
              </span>
            </div>

            <div className="relative flex items-center border border-[var(--border-color)] sm:border-2 bg-[var(--bg-card)] shadow-[var(--glow-shadow-sm)] shrink-0">
              <select
                value={expensePeriod}
                onChange={(e) =>
                  setExpensePeriod(e.target.value as "today" | "week" | "month")
                }
                className="appearance-none bg-transparent pl-2 pr-6 py-0.5 font-pixel text-[7px] sm:text-[8px] text-[var(--text-primary)] outline-none cursor-pointer"
              >
                <option value="month">{t("this_month")}</option>
                <option value="week">{t("this_week")}</option>
                <option value="today">{t("today")}</option>
              </select>
              <span className="absolute right-0 top-0 bottom-0 px-1 bg-[var(--bg-card-subtle)] border-l border-[var(--border-color)] text-[var(--text-primary)] flex items-center justify-center pointer-events-none select-none">
                <ChevronDown className="h-2.5 w-2.5 stroke-[2.5]" />
              </span>
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <h2 className="font-arcade text-xl sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold tracking-wider text-red-600 truncate">
              -{formatCurrency(summary?.[expensePeriod]?.expense || 0)}
            </h2>
          </div>
        </div>

        {/* Pemasukan (Income) with Dropdown */}
        <div className="retro-box p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <TrendingUp className="h-4 w-4 text-green-600 animate-pulse shrink-0" />
              <span className="font-pixel text-[8px] text-[var(--text-muted)] uppercase truncate">
                {t("income")}
              </span>
            </div>

            <div className="relative flex items-center border border-[var(--border-color)] sm:border-2 bg-[var(--bg-card)] shadow-[var(--glow-shadow-sm)] shrink-0">
              <select
                value={incomePeriod}
                onChange={(e) =>
                  setIncomePeriod(e.target.value as "today" | "week" | "month")
                }
                className="appearance-none bg-transparent pl-2 pr-6 py-0.5 font-pixel text-[7px] sm:text-[8px] text-[var(--text-primary)] outline-none cursor-pointer"
              >
                <option value="month">{t("this_month")}</option>
                <option value="week">{t("this_week")}</option>
                <option value="today">{t("today")}</option>
              </select>
              <span className="absolute right-0 top-0 bottom-0 px-1 bg-[var(--bg-card-subtle)] border-l border-[var(--border-color)] text-[var(--text-primary)] flex items-center justify-center pointer-events-none select-none">
                <ChevronDown className="h-2.5 w-2.5 stroke-[2.5]" />
              </span>
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <h2 className="font-arcade text-xl sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold tracking-wider text-green-600 truncate">
              +{formatCurrency(summary?.[incomePeriod]?.income || 0)}
            </h2>
          </div>
        </div>
      </div>

      {/* Main Analytics Grid: Donut Chart + Daily Trend Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Donut Chart: Kategori Pengeluaran */}
        <div className="lg:col-span-5 retro-box p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 pb-2 border-b-2 border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <PieIcon className="h-4 w-4 text-[var(--text-primary)]" />
                <h3 className="font-pixel text-[10px] sm:text-xs text-[var(--text-primary)]">
                  {t("category_breakdown")}
                </h3>
              </div>
              <span className="retro-badge text-[7px] bg-[var(--bg-card-subtle)]">
                {period === "week" ? t("week") : t("month")}
              </span>
            </div>

            {breakdown && breakdown.breakdown.length > 0 ? (
              <div className="relative h-60 w-full flex items-center justify-center my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={breakdown.breakdown}
                      dataKey="amount"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={90}
                      stroke="var(--bg-card)"
                      strokeWidth={2}
                      paddingAngle={2}
                    >
                      {breakdown.breakdown.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={chartPalette[index % chartPalette.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="font-pixel text-[7px] text-[var(--text-muted)]">
                    TOTAL
                  </span>
                  <span className="font-arcade text-lg font-bold text-red-600">
                    {formatCurrency(breakdown.total)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center font-pixel text-[10px] text-[var(--text-muted)] border border-dashed border-[var(--border-color)] my-4">
                <PieIcon className="h-6 w-6 mb-2 opacity-40" />
                <span>{t("empty_categories")}</span>
              </div>
            )}
          </div>

          {/* Breakdown List with Tier Badges (Top, Mid, Low) */}
          <div className="mt-3 space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {breakdown?.breakdown.map((item, idx) => (
              <div
                key={item.categoryId || item.name}
                className="flex items-center justify-between p-1.5 sm:p-2 border border-[var(--border-color)] bg-[var(--bg-card-subtle)] font-mono text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2.5 w-2.5 shrink-0 border border-[var(--border-color)]"
                    style={{
                      backgroundColor: chartPalette[idx % chartPalette.length],
                    }}
                  />
                  <span className="font-bold text-[var(--text-primary)] truncate text-xs">
                    {item.name}
                  </span>
                  <span className="font-pixel text-[7px] px-1 py-0.5 border border-[var(--border-color)]">
                    {item.tier.toUpperCase()}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-red-600 block text-xs">
                    {formatCurrency(item.amount)}
                  </span>
                  <span className="font-arcade text-xs text-[var(--text-muted)]">
                    {item.percentage}% ({item.count}x)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart: Daily Trends (7 Days Ending on TODAY) with Semantic Red & Green */}
        <div className="lg:col-span-7 retro-box p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 pb-2 border-b-2 border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[var(--text-primary)]" />
                <h3 className="font-pixel text-[10px] sm:text-xs text-[var(--text-primary)]">
                  {t("daily_cash_flow")}
                </h3>
              </div>
              <span className="font-arcade text-sm text-[var(--text-muted)]">
                {period === "week" ? t("week") : t("month")}
              </span>
            </div>

            <div className="h-60 sm:h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={trends}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="2 2"
                    vertical={false}
                    stroke="var(--border-color)"
                    opacity={0.25}
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => {
                      const dt = new Date(d);
                      const now = new Date();
                      if (
                        dt.getDate() === now.getDate() &&
                        dt.getMonth() === now.getMonth() &&
                        dt.getFullYear() === now.getFullYear()
                      ) {
                        return t("today");
                      }
                      return `${dt.getDate()}/${dt.getMonth() + 1}`;
                    }}
                    tick={{
                      fontSize: 9,
                      fill: "var(--text-muted)",
                      fontFamily: "Space Mono",
                    }}
                    stroke="var(--border-color)"
                  />
                  <YAxis
                    tickFormatter={(v) =>
                      v >= 1000000 ? `${v / 1000000}M` : `${v / 1000}K`
                    }
                    tick={{
                      fontSize: 9,
                      fill: "var(--text-muted)",
                      fontFamily: "Space Mono",
                    }}
                    stroke="var(--border-color)"
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend
                    wrapperStyle={{
                      fontFamily: "Press Start 2P",
                      fontSize: "8px",
                      paddingTop: "8px",
                    }}
                  />
                  {/* Semantic Green for Income */}
                  <Bar
                    dataKey="income"
                    name={t("income")}
                    fill="#16A34A"
                    radius={[0, 0, 0, 0]}
                    stroke="#15803D"
                    strokeWidth={1}
                  />
                  {/* Semantic Red for Expense */}
                  <Bar
                    dataKey="expense"
                    name={t("expenses")}
                    fill="#DC2626"
                    radius={[0, 0, 0, 0]}
                    stroke="#B91C1C"
                    strokeWidth={1}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Budget Limit Progress Bars */}
          <div className="mt-4 pt-3 border-t-2 border-[var(--border-color)]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-[var(--text-primary)]" />
                <h4 className="font-pixel text-[9px] text-[var(--text-primary)]">
                  {t("budget_status")}
                </h4>
              </div>
            </div>

            {budgets.length === 0 ? (
              <p className="font-arcade text-sm text-[var(--text-muted)]">
                {t("empty_budgets")}
              </p>
            ) : (
              <div className="space-y-2.5">
                {budgets.slice(0, 3).map((b) => (
                  <div key={b.id} className="space-y-1">
                    <div className="flex items-center justify-between font-mono text-xs">
                      <span className="flex items-center gap-1 text-[var(--text-primary)] text-[11px]">
                        <span className="retro-badge text-[7px] py-0 px-1">
                          {b.wallet?.name || "GLOBAL"}
                        </span>
                        <span>{b.category?.name || "Semua Pengeluaran"}</span>
                      </span>
                      <span
                        className={`font-bold text-[11px] ${b.isExceeded ? "text-red-600" : "text-[var(--text-primary)]"}`}
                      >
                        {formatCurrency(b.currentAmount)} /{" "}
                        {formatCurrency(b.targetAmount)} ({b.percentage}%)
                      </span>
                    </div>

                    <div className="w-full h-2.5 border border-[var(--border-color)] bg-[var(--bg-card-subtle)] p-0.5">
                      <div
                        className={`h-full transition-all duration-300 ${
                          b.isExceeded
                            ? "bg-red-600"
                            : b.percentage > 80
                              ? "bg-amber-500"
                              : "bg-green-600"
                        }`}
                        style={{ width: `${Math.min(100, b.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="retro-box p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-[var(--border-color)]">
          <h3 className="font-pixel text-[10px] sm:text-xs text-[var(--text-primary)]">
            {t("recent_transactions")}
          </h3>
          <span className="font-arcade text-xs sm:text-sm text-[var(--text-muted)]">
            {activeWalletId === null ? t("all_wallets") : activeWallet?.name}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px] text-left font-mono text-xs">
            <thead>
              <tr className="border-b-2 border-[var(--border-color)] font-pixel text-[8px] sm:text-[9px] text-[var(--text-muted)]">
                <th className="pb-2">{t("col_date")}</th>
                <th className="pb-2">{t("col_wallet")}</th>
                <th className="pb-2">{t("col_category")}</th>
                <th className="pb-2">{t("col_note")}</th>
                <th className="pb-2 text-right">{t("col_amount")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {recentTransactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="hover:bg-[var(--bg-card-subtle)] transition"
                >
                  <td className="py-2 text-[var(--text-muted)] text-[11px] whitespace-nowrap">
                    {formatDate(tx.date, language)}
                  </td>
                  <td className="py-2">
                    <span className="retro-badge text-[7px] py-0.5 px-1 whitespace-nowrap">
                      {tx.wallet?.name || "Wallet"}
                    </span>
                  </td>
                  <td className="py-2">
                    <span className="flex items-center gap-1.5 font-bold text-[var(--text-primary)] text-xs whitespace-nowrap">
                      <RetroIcon
                        categoryName={tx.category?.name}
                        name={tx.category?.icon}
                        type={tx.type}
                        className={`h-3.5 w-3.5 shrink-0 ${tx.type === "EXPENSE" ? "text-red-600" : "text-green-600"}`}
                      />
                      {tx.category?.name || t("no_category")}
                    </span>
                  </td>
                  <td className="py-2 text-[var(--text-muted)] text-xs truncate max-w-[150px]">
                    {tx.note || "-"}
                  </td>
                  <td
                    className={`py-2 text-right font-arcade text-base sm:text-lg font-bold whitespace-nowrap ${tx.type === "EXPENSE" ? "text-red-600" : "text-green-600"}`}
                  >
                    {tx.type === "EXPENSE" ? "-" : "+"}
                    {formatCurrency(tx.amount)}
                  </td>
                </tr>
              ))}
              {recentTransactions.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-6 text-center font-pixel text-[9px] text-[var(--text-muted)]"
                  >
                    {t("empty_transactions")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal with BVA Thousand Dot Separator & Date Presets */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="retro-box max-w-md w-full p-4 sm:p-6 shadow-[var(--glow-shadow-lg)] my-auto max-h-[92vh] overflow-y-auto">
            <h3 className="font-pixel text-xs sm:text-sm text-[var(--text-primary)] mb-3 border-b-2 border-[var(--border-color)] pb-2">
              {t("modal_quick_title")}
            </h3>
            <form onSubmit={handleCreateTransaction} className="space-y-3.5">
              {/* Type Switcher with Semantic Red / Green */}
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

              {/* Date Option with Clean 3 Preset Buttons + Full Date Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-pixel text-[8px] text-[var(--text-muted)] uppercase">
                    {t("field_date")}
                  </label>
                  <span className="font-arcade text-xs text-[var(--text-muted)]">
                    {t("quick_or_manual")}
                  </span>
                </div>

                {/* 3 Prominent Quick Select Buttons: Kemarin, Hari Ini, Besok */}
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

                {/* Full-width manual date picker input */}
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="retro-input w-full font-mono text-xs py-1.5"
                />
              </div>

              {/* Nominal Input with Automatic Indonesian Thousand Dot Separator (BVA & EQP) - NEVER OVERLAPS */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-pixel text-[8px] text-[var(--text-muted)] uppercase">
                    {t("field_amount")}
                  </label>
                  <span className="font-arcade text-xs text-[var(--text-muted)]">
                    {t("amount_format_hint")}
                  </span>
                </div>
                {/* Robust 8-Bit Input Group Addon (No overlap) */}
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
                    placeholder="Contoh: 50.000"
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
                    {filteredCategoriesForModal.map((c) => (
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
                  onClick={() => setShowAddModal(false)}
                  className="retro-btn text-[8px] sm:text-[9px]"
                >
                  {t("btn_cancel")}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="retro-btn-accent px-3 py-1.5 text-[8px] sm:text-[9px] disabled:opacity-60"
                >
                  {submitting ? t("btn_saving") : t("btn_save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
