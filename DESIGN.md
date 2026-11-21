# Technical Design Document (DESIGN.md)
## CoinTomb - 8-Bit Mobile-First Personal Expense Tracker System Architecture

---

## 1. System Overview & Architectural Topology

CoinTomb mengadopsi arsitektur terpisah **Client-Server (Decoupled Single Page Application)** yang dioptimalkan untuk perangkat mobile (*Mobile-First PWA*) dan desktop:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Client: React 18 + Vite PWA                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Global Context State:                                            │  │
│  │ - AuthContext (JWT, User Profile, Avatar)                        │  │
│  │ - WalletContext (Active Wallet: 'UNION' | UUID, Balances)        │  │
│  │ - ThemeContext (100% Auto-Switch: 'theme-prosper' | 'theme-spooky') │
│  │ - ModalAlertContext (Custom Retro 8-Bit Dialog System)           │  │
│  └───────────────────▲──────────────────────────▲───────────────────┘  │
│                      │                          │                      │
│            [Mobile Viewport]             [Desktop Viewport]            │
│         Fixed Bottom Navigation          Sticky Top Header Navbar      │
│      (Home, Tx, Vault, Budget, Profile)  (Nav Links & Quick Switcher)  │
└──────────────────────┬─────────────────────────────────────────────────┘
                       │ HTTPS REST (Bearer JWT + CSRF safe headers)
                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Reverse Proxy / Load Balancer                        │
│           (Nginx / Cloudflare - SSL Termination & Compression)         │
└──────────────────────┬─────────────────────────────────────────────────┘
                       │ Forwarded Requests
                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Express.js TypeScript Server                      │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Middlewares:                                                     │  │
│  │ - Security Headers (Helmet, CORS)                                │  │
│  │ - Auth Rate Limiter & Throttler (3 Failures = 30s IP Lockout)    │  │
│  │ - JWT Bearer Authentication & User Identification                │  │
│  │ - Zod Schema Validation & Input Sanitization                     │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │ Clean Queries                    │
│                                     ▼                                  │
│                 Drizzle ORM Engine (Type-safe SQL)                     │
└─────────────────────────────────────┬──────────────────────────────────┘
                                      │ Connection Pool (pg)
                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      PostgreSQL Database Storage                       │
│     users ──< wallets ──< categories ──< transactions                  │
│       │          └───< budget_limits                                   │
│       └───< feedbacks                                                  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Database Schema (Drizzle ORM & PostgreSQL)

Semua entitas data dilindungi oleh integritas referensial relasional (*Foreign Keys*) dan penghapusan berantai (*Cascading Deletion*).

### 2.1 Schema Definition (`server/src/db/schema.ts`)

```typescript
import { pgTable, uuid, varchar, text, timestamp, numeric, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Users & Security Audit Table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull().default('Player 1'),
  passwordHash: text('password_hash'), // Nullable if registered via Google OAuth
  googleId: varchar('google_id', { length: 255 }).unique(),
  avatarUrl: text('avatar_url'), // Base64 data URI or public asset URL
  failedLoginAttempts: integer('failed_login_attempts').notNull().default(0),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 2. Wallets (Multi-Wallet Pos Rekening)
export const wallets = pgTable('wallets', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(), // Contoh: "BNI", "BRI", "Cash"
  color: varchar('color', { length: 30 }).notNull().default('#000000'),
  icon: varchar('icon', { length: 50 }).notNull().default('Wallet'),
  initialBalance: numeric('initial_balance', { precision: 14, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 3. Categories (Strictly Tied to Wallet)
export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  walletId: uuid('wallet_id').notNull().references(() => wallets.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // 'EXPENSE' | 'INCOME'
  color: varchar('color', { length: 30 }).notNull().default('#000000'),
  icon: varchar('icon', { length: 50 }).notNull().default('Tag'), // Pixel icon identifier
});

// 4. Transactions (Isolated to Wallet & Category)
export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  walletId: uuid('wallet_id').notNull().references(() => wallets.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // 'EXPENSE' | 'INCOME'
  date: timestamp('date', { withTimezone: true }).defaultNow().notNull(),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 5. Budget Limits (Per-Wallet or Global Union)
export const budgetLimits = pgTable('budget_limits', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  walletId: uuid('wallet_id').references(() => wallets.id, { onDelete: 'cascade' }), // NULL = Global Union Limit
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'cascade' }),
  targetAmount: numeric('target_amount', { precision: 14, scale: 2 }).notNull(),
  type: varchar('type', { length: 30 }).notNull(), // 'EXPENSE_LIMIT' | 'INCOME_GOAL'
  period: varchar('period', { length: 20 }).notNull(), // 'WEEKLY' | 'MONTHLY'
});

// 6. User Feedbacks & Questionnaires
export const feedbacks = pgTable('feedbacks', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(), // 1 - 5
  topic: varchar('topic', { length: 100 }).notNull(),
  comment: text('comment').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Drizzle Relations Configuration
export const usersRelations = relations(users, ({ many }) => ({
  wallets: many(wallets),
  categories: many(categories),
  transactions: many(transactions),
  budgetLimits: many(budgetLimits),
  feedbacks: many(feedbacks),
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  user: one(users, { fields: [wallets.userId], references: [users.id] }),
  categories: many(categories),
  transactions: many(transactions),
  budgetLimits: many(budgetLimits),
}));
```

---

## 3. Security, Authentication & Rate Limiting Architecture

### 3.1 Rate Limiting & Login Throttling Engine
Mekanisme pertahanan terhadap serangan brute-force dan DoS diimplementasikan di layer middleware Express:

```typescript
// Throttling State Policy:
// 1. Catat percobaan login gagal per Email + IP.
// 2. Jika failed attempts >= 3 berturut-turut:
//    Set locked_until = NOW() + 30 SECONDS.
// 3. Jika login berhasil:
//    Reset failed_login_attempts = 0 dan locked_until = null.
```

#### Middleware Flowchart:
```
[POST /api/auth/login]
        │
        ▼
[Check user.lockedUntil > NOW()]
  ├── Yes ──> Return 429 Too Many Requests { 
  │             error: "Akun terkunci karena 3x gagal login.", 
  │             retryAfterSeconds: Math.ceil((lockedUntil - now) / 1000) 
  │           }
  │
  └── No  ──> [Verify Password with bcryptjs]
                ├── Match: 
                │     - Reset failedLoginAttempts = 0
                │     - Issue JWT Bearer Token (Expires in 7d)
                │     - Return 200 OK
                └── Mismatch:
                      - Increment failedLoginAttempts += 1
                      - If failedLoginAttempts >= 3:
                          Set lockedUntil = NOW() + 30 detik
                      - Return 401 Unauthorized {
                          error: "Email atau password salah",
                          attemptsLeft: Math.max(0, 3 - failedLoginAttempts)
                        }
```

### 3.2 Google OAuth Authentication Flow
1. Client menginisialisasi Google Sign-In via Google Identity Services Script.
2. User memilih akun Google dan memberikan consent.
3. Client menerima `credential` (Google ID Token).
4. Client mengirim ID Token ke endpoint `POST /api/auth/google`.
5. Server memvalidasi token via `google-auth-library`.
6. Jika email belum terdaftar di `users`, server membuat entitas user baru dengan default initial wallet ("Dompet Utama") dan default kategori.
7. Server menerbitkan JWT CoinTomb untuk sesi autentikasi reguler.

---

## 4. API Endpoints Specification

### 4.1 Authentication & Profile (`/api/auth`)
* `POST /api/auth/register` - Pendaftaran akun baru (Body: `{ email, password, name }`).
* `POST /api/auth/login` - Autentikasi email & password dengan rate limiting & 30s lockout policy.
* `POST /api/auth/google` - Autentikasi Google OAuth via Google ID Token.
* `GET /api/auth/profile` - Mengambil profil user aktif, email, avatar, dan ringkasan all-time expense/income.
* `PUT /api/auth/profile` - Memperbarui nama dan foto profil user (Base64 avatar upload).

### 4.2 Wallets (`/api/wallets`)
* `GET /api/wallets` - Mengambil daftar seluruh wallet milik user dengan saldo real-time (`initialBalance + totalIncome - totalExpense`).
* `POST /api/wallets` - Membuat wallet baru (Body: `{ name, color, icon, initialBalance }`).
* `PUT /api/wallets/:id` - Mengubah data wallet.
* `DELETE /api/wallets/:id` - Menghapus wallet (menghapus kategori & transaksi di dalamnya via CASCADE).

### 4.3 Transactions (`/api/transactions`)
* `GET /api/transactions` - Query parameters:
  - `walletId`: string (opsional; jika kosong = **Mode Union**).
  - `startDate`, `endDate`, `type`, `categoryId`, `limit`, `offset`.
* `POST /api/transactions` - Body: `{ walletId, categoryId, amount, type, date, note }`.
* `PUT /api/transactions/:id` - Memperbarui data transaksi.
* `DELETE /api/transactions/:id` - Menghapus transaksi.

### 4.4 Analytics (`/api/analytics`)
* `GET /api/analytics/summary?walletId=<uuid|empty>`
  - Return: `{ currentBalance, todayExpense, todayIncome, weekExpense, weekIncome, monthExpense, monthIncome }`.
* `GET /api/analytics/category-breakdown?walletId=<uuid|empty>&period=month`
  - Return: `{ totalExpense, categories: [{ name, icon, color, amount, percentage, tier: 'TOP'|'MID'|'LOW' }] }`.
* `GET /api/analytics/trends?walletId=<uuid|empty>&days=7`
  - **Spesifikasi Real-Time Dinamis:** Mengembalikan array 7 hari terakhir yang **berakhir tepat pada hari ini (H-0)**:
  ```json
  [
    { "date": "12 Okt", "expense": 150000, "income": 0 },
    { "date": "13 Okt", "expense": 80000, "income": 500000 },
    { "date": "14 Okt", "expense": 120000, "income": 0 },
    { "date": "15 Okt", "expense": 45000, "income": 0 },
    { "date": "16 Okt", "expense": 210000, "income": 0 },
    { "date": "17 Okt", "expense": 95000, "income": 0 },
    { "date": "Hari Ini", "expense": 60000, "income": 1200000 }
  ]
  ```

### 4.5 Feedbacks (`/api/feedback`)
* `POST /api/feedback` - Menyimpan kuesioner pengguna (Body: `{ rating, topic, comment }`).
* `GET /api/feedback` - Mengambil riwayat feedback yang dikirim user.

---

## 5. Form Input, Formatting, BVA & EQP Specification

### 5.1 Real-Time Indonesian Currency Formatter
Ketika user mengetik nominal pada input form, display value diformat dengan pemisah ribuan titik Indonesia tanpa mengganggu kursor:

```typescript
export function formatRupiahInput(value: string): { display: string; rawNumber: number } {
  // 1. Bersihkan semua karakter selain digit
  const cleanDigits = value.replace(/\D/g, '');
  if (!cleanDigits) return { display: '', rawNumber: 0 };

  const rawNumber = parseInt(cleanDigits, 10);
  
  // 2. Format dengan pemisah ribuan titik
  const display = new Intl.NumberFormat('id-ID').format(rawNumber);
  return { display, rawNumber };
}
```

### 5.2 Date Selector Logic & Quick Presets
```typescript
export function getQuickDateString(offsetDays: number = 0): string {
  const target = new Date();
  target.setDate(target.getDate() + offsetDays);
  
  const yyyy = target.getFullYear();
  const mm = String(target.getMonth() + 1).padStart(2, '0');
  const dd = String(target.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
// offsetDays: -1 (Kemarin), 0 (Hari Ini), 1 (Besok)
```

### 5.3 Zero Native Alert Policy & Custom Retro Modal Dialog
Seluruh pemanggilan native `window.alert()` dan `window.confirm()` digantikan oleh komponen reaktif `ModalAlertContext`:

```typescript
interface RetroDialogProps {
  isOpen: boolean;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'CONFIRM';
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}
```
Visual modal menggunakan retro pixel box dengan shadow solid 3px (`shadow-[var(--glow-shadow)]`), ikon piksel 8-bit, dan tombol bergaya arcade.

---

## 6. Category Pixel Icon Library & Selector

Sistem menyediakan pustaka ikon piksel 8-bit terindeks untuk kategori transaksi:

| Kategori | Nama Ikon Piksel | Visual Representasi 8-bit |
| :--- | :--- | :--- |
| **Makanan & Minuman** | `PixelBurger`, `PixelCoffee`, `PixelPizza` | Burger 8-bit, Cangkir Kopi retro, Pizza slice |
| **Fashion & Belanja** | `PixelShirt`, `PixelBag`, `PixelSneakers` | Kemeja piksel, Tas belanja, Sepatu |
| **Transportasi** | `PixelCar`, `PixelGas`, `PixelBus` | Mobil arcade, Pom bensin, Bus kota |
| **Kebutuhan & Tagihan** | `PixelFlash`, `PixelDrop`, `PixelWifi` | Petir listrik, Tetesan air, Sinyal wifi |
| **Hiburan & Game** | `PixelGamepad`, `PixelMovie`, `PixelMusic` | Stik gamepad NES, Roll film, Not balok |
| **Kesehatan** | `PixelPotion`, `PixelHeart`, `PixelPill` | Botol ramuan RPG, Pixel heart, Kapsul obat |
| **Pendapatan & Gaji** | `PixelCoinBag`, `PixelGem`, `PixelChest` | Kantong koin emas, Permata hijau, Peti harta |

Komponen `PixelIconSelector.tsx` menampilkan grid pemilih ikon interaktif dengan hover preview piksel tajam.

---

## 7. Dynamic Atmospheric Animation Engine (100% Auto-Switch)

Dropdown pemilihan tema manual ditiadakan. Transisi tema dipicu secara otomatis oleh hook reaktif `useFinancialThemeWatcher`:

```
                           [Financial Metrics Evaluator]
                       (Expense, Income, Active Budget Limit)
                                         │
                    ┌────────────────────┴────────────────────┐
                    ▼                                         ▼
         Expense > Income OR                       Expense <= Income AND
         Expense > 85% Budget                      Expense <= 85% Budget
                    │                                         │
                    ▼                                         ▼
            [SPOOKY STATE]                            [PROSPER STATE]
      - Background: #0A0A0A (Black)             - Background: #FFFFFF (White)
      - Border: 3px solid #FFFFFF               - Border: 3px solid #000000
      - Text: #FFFFFF                           - Text: #000000
      - Semantic Red/Green Accents              - Semantic Red/Green Accents
      - Atmospheric Engine:                     - Atmospheric Engine:
        * Pixel Casper Ghosts Floating            * Pixel Falling Leaves
        * Creeping Ground Fog Effect              * Gentle Pixel Waterfall Flow
        * Flying Pixel Bats & Skulls              * Hovering Pixel Angels
```

### 7.1 Semantic Financial Color Tokens
Meskipun tema utama berbasis monokrom kontras tinggi, warna fungsional finansial tetap tegas:
- **`--color-expense`**: `#DC2626` (Merah tajam untuk pengeluaran, defisit, dan peringatan batas anggaran).
- **`--color-income`**: `#16A34A` (Hijau tajam untuk pemasukan, surplus, dan kondisi aman).

---

## 8. Mobile-First & Desktop UI/UX Component Tree

```
App.tsx
├── AuthProvider (JWT Session, User Data, Avatar)
├── WalletProvider (Active Wallet Context: UNION | UUID)
├── ThemeProvider (100% Auto Health Watcher & Atmospheric Canvas)
└── ModalAlertProvider (Custom Retro Dialog Manager)
    ├── Navbar (Sticky Top Header - Desktop view)
    │   ├── Logo & Arcade Title
    │   ├── Context Switcher Dropdown (Union vs Specific Vaults)
    │   └── Nav Links (Dashboard, Tx, Vaults, Budgets, Profile)
    │
    ├── MainContentContainer (Clearance padding pb-24 lg:pb-12)
    │   ├── AtmosphericParticleCanvas (Leaves / Ghost floating layers)
    │   ├── DashboardPage
    │   │   ├── SummaryMetricsCards (Red/Green semantic indicators)
    │   │   ├── RealTime7DayBarChart (H-6 s/d Hari Ini)
    │   │   ├── CategoryDonutChart & Tiering breakdown
    │   │   └── QuickActionFloatingButton (+ Transaksi dengan modal auto-format)
    │   │
    │   ├── TransactionsPage
    │   │   ├── FilterToolbar (Date range, categories, type)
    │   │   ├── ExportActionGroup (Excel .xlsx, CSV, PDF)
    │   │   └── RetroTransactionTable
    │   │
    │   ├── WalletsPage (Vaults Management)
    │   │   ├── WalletCardGrid (Real-time balance, color tag, actions)
    │   │   └── ModalAddEditWallet
    │   │
    │   ├── BudgetsPage
    │   │   ├── BudgetLimitsList (Union and Per-Wallet Progress Gauges)
    │   │   └── ModalAddEditBudget
    │   │
    │   └── UserProfilePage (Tab "Profile User")
    │       ├── Section A: User Card (Upload Avatar, Name, Email, All-Time Income/Expense)
    │       ├── Section B: App Questionnaire (1-5 Star rating, Category, Comment, History)
    │       └── Section C: Dev Profile Card (Initial "DZ" only, Bio, GitHub link)
    │
    ├── BottomNav (Fixed Bottom Navigation Bar - Mobile view only lg:hidden)
    │   ├── Home Tab
    │   ├── Tx Log Tab
    │   ├── Vaults Tab
    │   ├── Budget Tab
    │   └── Profile Tab
    │
    └── Footer ("Copyright by dz // 8-Bit Mobile-First Expense Tracker")
```

---

## 9. Deployment, PWA & Production Readiness

1. **PWA Standalone Configuration:**
   - File `public/manifest.json` mengonfigurasi `display: "standalone"`, `start_url: "/"`, dan tema `#000000`.
   - File `index.html` menyertakan `apple-mobile-web-app-capable` dan viewport `viewport-fit=cover` untuk kompatibilitas penuh dengan notch iPhone dan gesture bar Android.
2. **Stateless Scalability:**
   - Otentikasi menggunakan stateless JWT yang ditandatangani dengan `JWT_SECRET`.
   - Backend dapat dideploy di container Docker independen di belakang reverse proxy dengan sticky sessions atau load balancing acak.
