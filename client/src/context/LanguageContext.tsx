import React, { createContext, useContext, useState } from 'react';

export type Language = 'id' | 'en';

export const translations = {
  id: {
    // Header & Banner
    overview: 'RINGKASAN',
    union_all: 'UNION (SEMUA)',
    overview_sub_union: 'Akumulasi total saldo & transaksi semua dompet',
    overview_sub_wallet: 'Arus kas khusus dompet',
    label_dompet: 'DOMPET',
    label_status_kas: 'STATUS KAS',
    week: 'PEKAN',
    month: 'BULAN',
    btn_record: 'CATAT',

    // Summary Cards
    saldo_union: 'SALDO (UNION)',
    wallets_active: 'wallet aktif',
    wallet_balance: 'Saldo dompet',
    expenses: 'PENGELUARAN',
    income: 'PEMASUKAN',
    this_month: 'BULAN INI',
    this_week: 'MINGGU INI',
    today: 'HARI INI',
    yesterday: 'KEMARIN',
    tomorrow: 'BESOK',
    label_in: 'Masuk:',
    label_out: 'Keluar:',

    // Analytics Sections
    category_breakdown: 'BREAKDOWN KATEGORI',
    daily_cash_flow: 'TREN ARUS KAS HARIAN',
    budget_status: 'STATUS TARGET ANGGARAN',
    recent_transactions: 'TRANSAKSI TERBARU',
    all_wallets: 'Semua Wallet',
    empty_transactions: 'BELUM ADA TRANSAKSI TERCATAT.',
    empty_categories: 'BELUM ADA DATA PENGELUARAN PADA PERIODE INI.',
    empty_budgets: 'BELUM ADA TARGET ANGGARAN.',

    // Table Headers
    col_date: 'TANGGAL',
    col_wallet: 'WALLET',
    col_category: 'KATEGORI',
    col_note: 'CATATAN',
    col_amount: 'NOMINAL',
    col_actions: 'AKSI',

    // Modal Quick Record
    modal_quick_title: 'CATAT TRANSAKSI CEPAT',
    opt_expense: 'PENGELUARAN (-)',
    opt_income: 'PEMASUKAN (+)',
    field_wallet: 'PILIH WALLET',
    field_date: 'TANGGAL TRANSAKSI',
    quick_or_manual: 'Pilih Cepat atau Manual',
    field_amount: 'NOMINAL TRANSAKSI (RP)',
    amount_format_hint: 'Format: 2000 ➔ 2.000',
    field_category: 'KATEGORI',
    no_category: 'Tanpa Kategori',
    field_note: 'CATATAN (OPSIONAL)',
    note_placeholder: 'Contoh: Beli kopi, tagihan internet',
    btn_cancel: 'BATAL',
    btn_save: 'SIMPAN TRANSAKSI',
    btn_saving: 'MENYIMPAN...',

    // Navigation
    nav_dashboard: 'DASHBOARD',
    nav_transactions: 'TRANSAKSI',
    nav_wallets: 'DOMPET',
    nav_categories: 'KATEGORI',
    nav_budgets: 'ANGGARAN',
    nav_profile: 'PROFIL',
    nav_logout: 'KELUAR',

    // Transactions Page
    transactions_title: 'BUKU TRANSAKSI',
    transactions_sub: 'Riwayat arus kas & catatan pengeluaran/pemasukan',
    btn_export_excel: 'EKSPOR EXCEL',
    btn_export_csv: 'EKSPOR CSV',
    btn_export_pdf: 'EKSPOR PDF',
    btn_new_transaction: '+ CATAT TRANSAKSI',
    filter_all_types: 'Semua Tipe',
    filter_all_categories: 'Semua Kategori',
    filter_search_placeholder: 'Cari catatan...',
    modal_edit_transaction: 'EDIT TRANSAKSI',
    modal_add_transaction: 'CATAT TRANSAKSI BARU',
    btn_update_transaction: 'PERBARUI TRANSAKSI',
    confirm_delete_tx_title: 'HAPUS TRANSAKSI?',
    confirm_delete_tx_msg: 'Catatan transaksi ini akan dihapus permanen dari dompet.',

    // Wallets Page
    wallets_title: 'DOMPET KAS',
    wallets_sub: 'Kelola akun kas, rekening bank, & e-wallet',
    btn_add_wallet: '+ TAMBAH DOMPET',
    wallet_active_badge: 'AKTIF DIGUNAKAN',
    wallet_set_active: 'JADIKAN AKTIF',
    modal_add_wallet: 'TAMBAH DOMPET BARU',
    modal_edit_wallet: 'EDIT DOMPET',
    field_wallet_name: 'NAMA DOMPET',
    field_wallet_color: 'WARNA DOMPET',
    field_initial_balance: 'SALDO AWAL (RP)',
    wallet_name_placeholder: 'Contoh: Dompet Utama, BCA, Mandiri',
    btn_save_wallet: 'SIMPAN DOMPET',
    btn_update_wallet: 'PERBARUI DOMPET',
    confirm_delete_wallet_title: 'HAPUS DOMPET?',
    confirm_delete_wallet_msg: 'Semua transaksi dan anggaran di dompet ini akan ikut terhapus.',

    // Categories Page
    categories_title: 'KATEGORI & IKON 8-BIT',
    categories_sub: 'Setiap kategori terikat spesifik ke wallet dan memiliki koleksi ikon piksel.',
    btn_add_category: '+ TAMBAH KATEGORI',
    modal_add_category: 'TAMBAH KATEGORI BARU',
    modal_edit_category: 'EDIT KATEGORI',
    field_category_type: 'TIPE KATEGORI',
    field_category_name: 'NAMA KATEGORI',
    field_category_color: 'WARNA TEMA',
    field_category_icon: 'IKON PIXEL',
    field_indicator_color: 'WARNA INDIKATOR (MONOKROM)',
    select_pixel_icon: 'PILIH IKON PIKSEL (8-BIT CUSTOM)',
    category_name_placeholder: 'Contoh: Makanan, Transport, Gaji',
    tab_expense: 'PENGELUARAN',
    tab_income: 'PEMASUKAN',
    empty_categories_list: 'BELUM ADA KATEGORI UNTUK DOMPET INI.',
    btn_save_category: 'SIMPAN KATEGORI',
    btn_update_category: 'PERBARUI KATEGORI',
    confirm_delete_cat_title: 'HAPUS KATEGORI?',
    confirm_delete_cat_msg: 'Kategori ini akan dihapus dari dompet.',

    // Budgets Page
    budgets_title: 'BATAS ANGGARAN & GOALS',
    budgets_sub: 'Dukung limit anggaran per-wallet maupun limit global untuk seluruh rekening.',
    btn_add_budget: '+ PASANG LIMIT',
    scope_filter_label: 'CAKUPAN:',
    scope_all: 'SEMUA (GLOBAL & WALLET)',
    budget_type_expense: 'BATAS PENGELUARAN (MAKSIMAL)',
    budget_type_income: 'TARGET PEMASUKAN (MINIMAL)',
    budget_period_weekly: 'MINGGUAN (PEKAN)',
    budget_period_monthly: 'BULANAN',
    modal_add_budget: 'PASANG BATAS BARU',
    modal_edit_budget: 'EDIT TARGET',
    field_budget_type: 'TIPE TARGET',
    field_budget_period: 'PERIODE ANGGARAN',
    field_budget_amount: 'NOMINAL BATAS / TARGET (RP)',
    field_budget_category: 'KATEGORI (OPSIONAL)',
    budget_for_all_categories: 'Semua Kategori (Global Dompet)',
    all_expenses: 'Semua Pengeluaran',
    budget_used: 'TERPAKAI',
    budget_exceeded: 'MELEBIHI BATAS!',
    budget_near_limit: 'MENDEKATI LIMIT',
    budget_safe: 'AMAN',
    empty_budgets_list: 'BELUM ADA TARGET ANGGARAN. PASANG BATAS BARU!',
    field_wallet_scope: 'CAKUPAN WALLET',
    global_union_scope: 'GLOBAL / UNION (SEMUA WALLET)',
    all_categories_opt: 'Semua Kategori',
    target_nominal_label: 'TARGET NOMINAL (RP)',
    btn_save_budget: 'SIMPAN TARGET',
    btn_update_budget: 'PERBARUI TARGET',
    confirm_delete_budget_title: 'HAPUS TARGET ANGGARAN?',
    confirm_delete_budget_msg: 'Target anggaran ini akan dihapus.',

    // Profile Page
    profile_title: 'PROFIL USER & FEEDBACK',
    profile_sub: 'Identitas akun, statistik arus kas kumulatif, formulir ulasan, dan informasi pengembang.',
    user_account_overview: '[ RINGKASAN AKUN USER ]',
    change_name: '[GANTI NAMA]',
    save_btn: 'SIMPAN',
    stat_total_expense: 'TOTAL PENGELUARAN',
    stat_total_income: 'TOTAL PENDAPATAN',
    stat_net_balance: 'AKUMULASI BERSIH',
    cumulative_all_wallets: 'Kumulatif seluruh wallet',
    hero_title: 'IDENTITAS HERO',
    hero_name_label: 'NAMA PETUALANG',
    hero_email_label: 'EMAIL TERDAFTAR',
    feedback_section_title: 'KUESIONER & ULASAN APLIKASI',
    feedback_badge: 'FEEDBACK FORM',
    feedback_success_msg: 'Terima kasih! Ulasanmu telah berhasil dicatat.',
    star_rating_label: 'Beri Rating Bintang (1 - 5)',
    review_topic_label: 'Topik Ulasan',
    topic_features: 'Fitur & Fungsionalitas Multi-Wallet',
    topic_design: 'Tampilan & Desain Retro 8-Bit',
    topic_pwa: 'Kemudahan Penggunaan di Handphone (PWA)',
    topic_bug: 'Laporan Masalah / Bug',
    topic_ideas: 'Saran Fitur Baru',
    review_comments_label: 'Komentar & Masukan',
    review_comments_placeholder: 'Bagikan pengalamanmu, kritik, atau saran untuk CoinTomb...',
    btn_submit_review: 'KIRIM ULASAN [SUBMIT]',
    user_reviews_history: 'CATATAN ULASAN KAMU',
    dev_profile_section: '[ DEVELOPER PROFILE ]',
    dev_name: 'DEVELOPER: DZ',
    dev_role: 'Full-Stack Software Engineer.',
    dev_github_heading: 'OFFICIAL GITHUB REPOSITORY & PROFILE',
    feedback_title: 'KIRIM FEEDBACK DEVELOPER',
    feedback_sub: 'Bantu developer meningkatkan fitur CoinTomb',
    feedback_rating: 'RATING PENGALAMAN',
    feedback_category: 'KATEGORI MASUKAN',
    feedback_comment: 'CATATAN / MASUKAN ANDA',
    feedback_placeholder: 'Tuliskan ulasan, laporan bug, atau saran fitur...',
    btn_send_feedback: 'KIRIM MASUKAN [ENTER]',
    feedback_history: 'LOG MASUKAN ANDA',
    empty_feedback: 'BELUM ADA MASUKAN YANG DIKIRIM.',
  },
  en: {
    // Header & Banner
    overview: 'OVERVIEW',
    union_all: 'UNION (ALL)',
    overview_sub_union: 'Accumulated total balance & transactions across all wallets',
    overview_sub_wallet: 'Cash flow specific to wallet',
    label_dompet: 'WALLET',
    label_status_kas: 'CASH STATUS',
    week: 'WEEK',
    month: 'MONTH',
    btn_record: 'RECORD',

    // Summary Cards
    saldo_union: 'BALANCE (UNION)',
    wallets_active: 'active wallets',
    wallet_balance: 'Wallet balance',
    expenses: 'EXPENSES',
    income: 'INCOME',
    this_month: 'THIS MONTH',
    this_week: 'THIS WEEK',
    today: 'TODAY',
    yesterday: 'YESTERDAY',
    tomorrow: 'TOMORROW',
    label_in: 'Income:',
    label_out: 'Expense:',

    // Analytics Sections
    category_breakdown: 'CATEGORY BREAKDOWN',
    daily_cash_flow: 'DAILY CASH FLOW TREND',
    budget_status: 'BUDGET LIMIT STATUS',
    recent_transactions: 'RECENT TRANSACTIONS',
    all_wallets: 'All Wallets',
    empty_transactions: 'NO TRANSACTIONS RECORDED YET.',
    empty_categories: 'NO EXPENSE DATA IN THIS PERIOD.',
    empty_budgets: 'NO BUDGET LIMITS SET.',

    // Table Headers
    col_date: 'DATE',
    col_wallet: 'WALLET',
    col_category: 'CATEGORY',
    col_note: 'NOTE',
    col_amount: 'AMOUNT',
    col_actions: 'ACTION',

    // Modal Quick Record
    modal_quick_title: 'QUICK RECORD TRANSACTION',
    opt_expense: 'EXPENSE (-)',
    opt_income: 'INCOME (+)',
    field_wallet: 'SELECT WALLET',
    field_date: 'TRANSACTION DATE',
    quick_or_manual: 'Quick Select or Manual',
    field_amount: 'TRANSACTION AMOUNT (RP)',
    amount_format_hint: 'Format: 2000 ➔ 2.000',
    field_category: 'CATEGORY',
    no_category: 'No Category',
    field_note: 'NOTE (OPTIONAL)',
    note_placeholder: 'Example: Coffee, internet bill',
    btn_cancel: 'CANCEL',
    btn_save: 'SAVE TRANSACTION',
    btn_saving: 'SAVING...',

    // Navigation
    nav_dashboard: 'DASHBOARD',
    nav_transactions: 'TRANSACTIONS',
    nav_wallets: 'VAULTS',
    nav_categories: 'CATEGORIES',
    nav_budgets: 'BUDGETS',
    nav_profile: 'PROFILE',
    nav_logout: 'LOGOUT',

    // Transactions Page
    transactions_title: 'TRANSACTION LEDGER',
    transactions_sub: 'Cash flow history & expense/income ledger',
    btn_export_excel: 'EXPORT EXCEL',
    btn_export_csv: 'EXPORT CSV',
    btn_export_pdf: 'EXPORT PDF',
    btn_new_transaction: '+ RECORD TRANSACTION',
    filter_all_types: 'All Types',
    filter_all_categories: 'All Categories',
    filter_search_placeholder: 'Search notes...',
    modal_edit_transaction: 'EDIT TRANSACTION',
    modal_add_transaction: 'RECORD NEW TRANSACTION',
    btn_update_transaction: 'UPDATE TRANSACTION',
    confirm_delete_tx_title: 'DELETE TRANSACTION?',
    confirm_delete_tx_msg: 'This transaction entry will be permanently deleted from the vault.',

    // Wallets Page
    wallets_title: 'VAULTS',
    wallets_sub: 'Manage cash accounts, bank accounts, & e-wallets',
    btn_add_wallet: '+ ADD VAULT',
    wallet_active_badge: 'CURRENTLY ACTIVE',
    wallet_set_active: 'SET AS ACTIVE',
    modal_add_wallet: 'ADD NEW VAULT',
    modal_edit_wallet: 'EDIT VAULT',
    field_wallet_name: 'VAULT NAME',
    field_wallet_color: 'VAULT COLOR',
    field_initial_balance: 'INITIAL BALANCE (RP)',
    wallet_name_placeholder: 'Example: Main Wallet, Checking, Cash',
    btn_save_wallet: 'SAVE VAULT',
    btn_update_wallet: 'UPDATE VAULT',
    confirm_delete_wallet_title: 'DELETE VAULT?',
    confirm_delete_wallet_msg: 'All transactions and budget limits in this vault will also be deleted.',

    // Categories Page
    categories_title: '8-BIT CATEGORIES & ICONS',
    categories_sub: 'Each category is bound to a specific wallet and has a pixel icon collection.',
    btn_add_category: '+ ADD CATEGORY',
    modal_add_category: 'ADD NEW CATEGORY',
    modal_edit_category: 'EDIT CATEGORY',
    field_category_type: 'CATEGORY TYPE',
    field_category_name: 'CATEGORY NAME',
    field_category_color: 'THEME COLOR',
    field_category_icon: 'PIXEL ICON',
    field_indicator_color: 'INDICATOR COLOR (MONOCHROME)',
    select_pixel_icon: 'SELECT PIXEL ICON (8-BIT CUSTOM)',
    category_name_placeholder: 'Example: Food, Transport, Salary',
    tab_expense: 'EXPENSES',
    tab_income: 'INCOME',
    empty_categories_list: 'NO CATEGORIES CONFIGURED FOR THIS VAULT.',
    btn_save_category: 'SAVE CATEGORY',
    btn_update_category: 'UPDATE CATEGORY',
    confirm_delete_cat_title: 'DELETE CATEGORY?',
    confirm_delete_cat_msg: 'This category will be deleted from the vault.',

    // Budgets Page
    budgets_title: 'BUDGET LIMITS & GOALS',
    budgets_sub: 'Supports per-vault budget limits as well as global limits for all accounts.',
    btn_add_budget: '+ SET LIMIT',
    scope_filter_label: 'SCOPE:',
    scope_all: 'ALL (GLOBAL & VAULT)',
    budget_type_expense: 'EXPENSE LIMIT (MAXIMUM)',
    budget_type_income: 'INCOME TARGET (MINIMUM)',
    budget_period_weekly: 'WEEKLY',
    budget_period_monthly: 'MONTHLY',
    modal_add_budget: 'SET NEW LIMIT',
    modal_edit_budget: 'EDIT TARGET',
    field_budget_type: 'TARGET TYPE',
    field_budget_period: 'BUDGET PERIOD',
    field_budget_amount: 'LIMIT / TARGET AMOUNT (RP)',
    field_budget_category: 'CATEGORY (OPTIONAL)',
    budget_for_all_categories: 'All Categories (Global Vault)',
    all_expenses: 'All Expenses',
    budget_used: 'USED',
    budget_exceeded: 'LIMIT EXCEEDED!',
    budget_near_limit: 'NEAR LIMIT',
    budget_safe: 'SAFE',
    empty_budgets_list: 'NO BUDGET TARGETS YET. SET A NEW LIMIT!',
    field_wallet_scope: 'VAULT SCOPE',
    global_union_scope: 'GLOBAL / UNION (ALL VAULTS)',
    all_categories_opt: 'All Categories',
    target_nominal_label: 'TARGET AMOUNT (RP)',
    btn_save_budget: 'SAVE TARGET',
    btn_update_budget: 'UPDATE TARGET',
    confirm_delete_budget_title: 'DELETE BUDGET TARGET?',
    confirm_delete_budget_msg: 'This budget limit target will be deleted.',

    // Profile Page
    profile_title: 'USER PROFILE & FEEDBACK',
    profile_sub: 'Account identity, cumulative cash flow statistics, review forms, and developer info.',
    user_account_overview: '[ USER ACCOUNT OVERVIEW ]',
    change_name: '[CHANGE NAME]',
    save_btn: 'SAVE',
    stat_total_expense: 'TOTAL EXPENSE',
    stat_total_income: 'TOTAL INCOME',
    stat_net_balance: 'NET ACCUMULATION',
    cumulative_all_wallets: 'Cumulative across all vaults',
    hero_title: 'HERO IDENTITY',
    hero_name_label: 'ADVENTURER NAME',
    hero_email_label: 'REGISTERED EMAIL',
    feedback_section_title: 'QUESTIONNAIRE & APP REVIEWS',
    feedback_badge: 'FEEDBACK FORM',
    feedback_success_msg: 'Thank you! Your feedback has been recorded.',
    star_rating_label: 'Star Rating (1 - 5)',
    review_topic_label: 'Review Topic',
    topic_features: 'Multi-Vault Features & Functionality',
    topic_design: 'Retro 8-Bit UI & Design',
    topic_pwa: 'Mobile Usability (PWA)',
    topic_bug: 'Bug & Issue Report',
    topic_ideas: 'Feature Suggestions',
    review_comments_label: 'Comments & Feedback',
    review_comments_placeholder: 'Share your experience, feedback, or suggestions for CoinTomb...',
    btn_submit_review: 'SUBMIT FEEDBACK',
    user_reviews_history: 'YOUR FEEDBACK LOG',
    dev_profile_section: '[ DEVELOPER PROFILE ]',
    dev_name: 'DEVELOPER: DZ',
    dev_role: 'Full-Stack Software Engineer.',
    dev_github_heading: 'OFFICIAL GITHUB REPOSITORY & PROFILE',
    feedback_title: 'SEND DEVELOPER FEEDBACK',
    feedback_sub: 'Help developer improve CoinTomb features',
    feedback_rating: 'EXPERIENCE RATING',
    feedback_category: 'FEEDBACK CATEGORY',
    feedback_comment: 'YOUR NOTES / FEEDBACK',
    feedback_placeholder: 'Write your thoughts, bug reports, or feature ideas...',
    btn_send_feedback: 'SEND FEEDBACK [ENTER]',
    feedback_history: 'YOUR FEEDBACK LOG',
    empty_feedback: 'NO FEEDBACK ENTRIES SUBMITTED YET.',
  },
} as const;

export type TranslationKey = keyof typeof translations.id;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('cointomb_language') as Language;
      return saved === 'en' || saved === 'id' ? saved : 'id';
    } catch {
      return 'id';
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('cointomb_language', lang);
    } catch {
      // ignore
    }
  };

  const t = (key: TranslationKey, fallback?: string): string => {
    const langDict = translations[language];
    if (langDict && key in langDict) {
      return langDict[key];
    }
    return fallback || (translations.id[key] ?? key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
