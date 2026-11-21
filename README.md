# Multi-User Expense Tracker Web App

Aplikasi web pencatat keuangan pribadi multi-user dengan analitik kategori (Donut chart & breakdown tier), ringkasan harian/mingguan/bulanan, batas anggaran, dan ekspor data ke Excel, CSV, dan PDF.

---

## 🛠️ Tech Stack
- **Backend:** Node.js, Express.js, TypeScript, Drizzle ORM, PostgreSQL (`pg`), JWT (`jsonwebtoken` + `bcryptjs`), Zod.
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Recharts, Lucide Icons.
- **Export Data:** SheetJS (`xlsx`) untuk Excel & CSV, `jspdf` + `jspdf-autotable` untuk PDF.

---

## 🚀 Panduan Setup & Menjalankan

### 1. Install Dependencies
Jalankan di root folder:
```bash
# Install dependencies server & client sekaligus via workspaces
npm install
cd server && npm install
cd ../client && npm install
```

### 2. Konfigurasi Environment Server
Salin file `.env.example` di folder `server`:
```bash
cd server
cp .env.example .env
```
Isi variabel database PostgreSQL kamu (bisa dari [Neon.tech](https://neon.tech), Supabase, atau PostgreSQL lokal):
```env
PORT=5000
DATABASE_URL=postgresql://user:password@ep-sample-pool.neon.tech/expense_tracker?sslmode=require
JWT_SECRET=super_secret_jwt_key_change_me_in_production
CLIENT_URL=http://localhost:5173
```

### 3. Push Skema Database (Drizzle ORM)
Sinkronisasi tabel ke PostgreSQL:
```bash
cd server
npm run db:push
```
Tabel otomatis dibuat:
- `users`
- `categories` (otomatis di-seed dengan kategori default saat user baru registrasi)
- `transactions`
- `budget_limits`

### 4. Jalankan Aplikasi (Development Mode)

Buka 2 terminal terpisah:

**Terminal 1 (Backend Server):**
```bash
cd server
npm run dev
# Server berjalan di http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
# Frontend berjalan di http://localhost:5173
```

---

## 📊 Fitur Utama
1. **Multi-User & Data Isolation:** Registrasi dan login aman menggunakan JWT token, data setiap user terisolasi 100%.
2. **Kategori Custom & Default:** Diberikan 9 kategori bawaan saat daftar, serta bisa menambah/mengubah kategori dan warna sesuka hati.
3. **Analytics Dashboard:**
   - Donut Chart dengan pembagian kategori **Top, Mid, dan Low**.
   - Ringkasan pengeluaran harian, mingguan, dan bulanan.
   - Tren pengeluaran 7 hari terakhir (Bar chart).
4. **Batas Anggaran & Goals:** Atur batas pengeluaran mingguan/bulanan per kategori atau global dengan visual progress bar.
5. **Ekspor Data:**
   - Unduh laporan transaksi ke format **Excel (.xlsx)**
   - Unduh format **CSV**
   - Unduh dokumen **PDF (.pdf)** lengkap dengan ringkasan & tabel transaksi
