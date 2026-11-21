# Product Requirement Document (PRD)
## CoinTomb - 8-Bit Mobile-First Personal & Multi-User Expense Tracker (PWA)

---

## 1. Executive Summary & Vision
**CoinTomb** adalah web application pengelolaan keuangan pribadi dan multi-user berkonsep **Mobile-First Progressive Web App (PWA)** dengan estetika retro **8-bit arcade**. Aplikasi ini dirancang untuk mengatasi kompleksitas pelacakan keuangan modern dengan arsitektur **Multi-Wallet** (pemisahan pos rekening mandiri seperti BNI, BRI, Cash, E-Wallet), validasi input matematis berbasis **Boundary Value Analysis (BVA)** dan **Equivalence Partitioning (EQP)**, visualisasi arus kas real-time, keamanan berlapis dengan rate limiting & login throttling, serta **Dynamic Atmospheric Animation Engine** yang bertransformasi otomatis 100% berdasarkan kesehatan finansial pengguna.

---

## 2. Target Users & Core Objectives
* **Target Users:** 
  1. Individu dengan banyak rekening, dompet digital, dan pos kas harian yang membutuhkan isolasi pencatatan per rekening maupun ringkasan teragregasi.
  2. Pengguna ponsel cerdas yang membutuhkan input cepat (PWA mobile-first dengan Bottom Navigation) dengan pengalaman pengguna retro gamified.
* **Core Objectives:**
  1. **Strict Multi-Wallet Isolation:** Mencegah percampuran transaksi dan kategori antar dompet/rekening.
  2. **Dual-Mode Financial Observability:** Mode Union (gambaran global seluruh aset) dan Mode Per-Wallet (fokus rekening tunggal).
  3. **Zero Native Alerts & Robust Form Quality:** Menghilangkan `alert()` browser sepenuhnya; menggantinya dengan Custom Retro Modal Pop-up, auto-formatting nominal rupiah berpemisah ribuan titik Indonesia, serta quick-date presets.
  4. **Strict Security & Throttling:** Proteksi login brute-force (3x gagal = lockout 30 detik) dan dukungan OAuth Google.
  5. **Auto-Switching Dynamic Visuals:** Pengalaman tematik otomatis tanpa tombol manual (Prosper vs Spooky) lengkap dengan animasi piksel dinamis (daun gugur & malaikat vs hantu Casper, kelelawar, kabut).

---

## 3. Product Architecture & Tech Stack

| Layer | Komponen & Teknologi | Peran & Justifikasi |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 + Vite + TypeScript | SPA reaktif, rendering performan, type-safe |
| **Styling & Theme** | Tailwind CSS + CSS Variables | Desain 8-bit monokrom responsif, custom layout PWA |
| **PWA Engine** | Web App Manifest + Service Worker + Icons | Installable di homescreen mobile, standalone display mode |
| **Icons & Pixel Art** | Lucide React + Custom 8-bit Pixel SVG Icons | Koleksi ikon kategori piksel tematik yang kaya |
| **Data Visualization** | Recharts (ResponsiveContainer) | Donut Category Breakdown & Real-Time 7-Day Bar Chart |
| **Client Export** | SheetJS (`xlsx`) + `jspdf` & `autotable` | Export laporan transaksi ke Excel (.xlsx), CSV, dan PDF |
| **Backend API** | Node.js + Express.js + TypeScript | RESTful API modular, JSON response standardized |
| **Database & ORM** | PostgreSQL + Drizzle ORM | Database relasional dengan Foreign Key cascade & Drizzle kit migrations |
| **Security & Auth** | JWT + bcryptjs + Google OAuth (Google API Client) | Stateless session, enkripsi password, autentikasi ganda |
| **Traffic & Rate Limiting** | `express-rate-limit` + Memory / Redis Cache | Rate limiting endpoint login, brute-force lock policy |

---

## 4. Functional Specifications & Modules

### 4.1 Multi-Wallet Management
* **Wallet Entities:** Pengguna dapat membuat, melihat, mengubah, dan menghapus wallet (contoh: "BNI", "BRI", "Cash", "GoPay", "Bibit").
* **Wallet Attributes:** Nama wallet, warna indikator (monokrom/grayscale), saldo awal (*initial balance*), dan ikon.
* **Strict Relational Isolation:**
  - Setiap transaksi (`transactions`) wajib mereferensikan `wallet_id`.
  - Setiap kategori (`categories`) wajib terikat ke `wallet_id` tertentu.
  - Menghapus wallet akan menghapus transaksi dan kategori di dalamnya (`ON DELETE CASCADE`).

### 4.2 Dual-Mode Analytics & Summary Engine
Sistem menyediakan konteks global yang dapat beralih antara 2 mode:
1. **Mode Union (Keseluruhan):**
   - Mengakumulasi total saldo bersih dari seluruh wallet yang dimiliki: $\sum (\text{Initial Balance} + \text{Income} - \text{Expense})$.
   - Ringkasan arus kas agregat (Hari Ini, Pekan Ini, Bulan Ini).
   - Donut Chart mengagregasikan pengeluaran dari semua wallet dengan tiering (*Top*, *Mid*, *Low*).
   - Bar Chart menampilkan perbandingan pengeluaran dan pemasukan 7 hari terakhir secara agregat.
2. **Mode Per-Wallet (Spesifik):**
   - Menampilkan saldo dan metrik finansial terisolasi untuk satu wallet yang dipilih.
   - Donut Chart dan Bar Chart hanya memproses data transaksi pada wallet tersebut.
   - Riwayat transaksi terfilter 100% pada wallet yang dipilih.

### 4.3 Form Input, Validation, BVA & EQP Matrix
Semua form transaksi dan pembuatan wallet menerapkan teknik pengujian software terstandar:

#### A. Equivalence Partitioning (EQP) & Boundary Value Analysis (BVA)
* **Nominal Transaksi (Amount):**
  - *Valid Range:* Rp 1 s/d Rp 10.000.000.000 (10 Miliar).
  - *Boundary Values:*
    - $0$ (Invalid - Nominal harus lebih besar dari 0).
    - $1$ (Valid - Batas bawah minimum nominal transaksi).
    - $10.000.000.000$ (Valid - Batas atas nominal wajar).
    - $10.000.000.001$ (Invalid - Melebihi limit transaksi tunggal).
    - Negatif / String Karakter (Invalid - Ditolak otomatis oleh parser angka).
* **Automatic Indonesian Thousand Separator (Titik):**
  - Input field memformat angka secara real-time saat pengguna mengetik (contoh: user mengetik `2000` -> terformat menjadi `2.000`, `2000000` -> `2.000.000`).
  - Nilai murni integer/float disimpan ke state untuk dikirim ke backend API.
* **Input Date & Quick Selectors:**
  - Komponen Date Picker fleksibel mendukung input manual kalender.
  - Quick-select preset pills/dropdown:
    - **HARI INI (Today):** Offset $0$ hari dari tanggal sistem saat ini.
    - **KEMARIN (Yesterday):** Offset $-1$ hari dari tanggal sistem saat ini.
    - **BESOK (Tomorrow):** Offset $+1$ hari (pencatatan pos anggaran mendatang).
* **Deskripsi / Catatan Transaksi:**
  - *Valid Range:* 0 - 255 karakter string UTF-8. Sanitasi XSS diterapkan pada input.
* **Nama Wallet & Kategori:**
  - *Valid Range:* 1 - 50 karakter alfanumerik.

#### B. Zero JavaScript Alert Policy
* **Dilarang keras** menggunakan fungsi bawaan `window.alert()`, `window.confirm()`, atau `window.prompt()`.
* Seluruh feedback sistem, konfirmasi penghapusan, dan pesan error menggunakan **Custom Retro 8-bit Modal Pop-up** dengan tombol bertema piksel, backdrop blur, dan animasi fade-in retro.

### 4.4 Pixel Icon Selector & Real-Time Bar Chart
* **Pixel Icon Library:** Saat membuat atau mengubah kategori transaksi, modal menyediakan pemilih ikon piksel 8-bit tematik yang melimpah (kategori: Makanan/Minuman, Belanja, Transport, Tagihan, Hiburan, Hadiah, Kesehatan, Gaji, Investasi, dsb.).
* **Dynamic 7-Day Real-Time Bar Chart:**
  - Bar chart menampilkan tren arus kas harian selama 7 hari terakhir **sampai dengan hari ini (H-0 / Real-time)**, bukan terputus di kemarin (H-1).
  - Format sumbu X: Hari/Tanggal dinamis (misal: "Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Hari Ini").
* **Semantic Color Coding (Financial Meaning):**
  - Meskipun tema umum berbasis monokrom arcade, elemen finansial fungsional tetap memiliki aksen semantik yang jelas:
    - **Expense / Pengeluaran / Warning:** Merah (#DC2626 / #EF4444).
    - **Income / Pemasukan / Prosperity:** Hijau (#16A34A / #22C55E).

### 4.5 Navigation, Mobile-First PWA, & User Profile Page
* **Mobile-First Layout:**
  - Di perangkat seluler (<1024px), navigasi utama menggunakan **Bottom Navigation Bar** persisten yang berisi tab:
    1. **Home / Dashboard** (Ringkasan & Chart)
    2. **Tx Log** (Tabel & Filter Transaksi)
    3. **Vaults** (Manajemen Wallet)
    4. **Budget** (Batas Anggaran & Goals)
    5. **Profile User** (Profil Pengguna, Kuesioner, Dev)
  - Di desktop (>=1024px), navbar atas menyediakan navigasi penuh dan drawer wallet switcher.
  - Clearance padding bawah (`pb-24 lg:pb-12`) memastikan elemen konten tidak tertutup navigation bar.
* **Tab "Profile User":**
  1. **User Section:**
     - Foto Profil: Pengguna dapat mengunggah (*upload*) avatar atau foto profil kustom (disimpan via base64/storage).
     - Nama Pengguna & Email.
     - Ringkasan kumulatif: Total Pengeluaran (*All-time Expense*) & Total Pendapatan (*All-time Income*).
  2. **Questionnaire & Feedback Section:**
     - Rating bintang interaktif 1 hingga 5 bintang dengan label deskripsi.
     - Dropdown topik ulasan (Fitur, UI 8-bit, Kemudahan PWA, Bug, Saran).
     - Kolom teks komentar/saran pengguna.
     - Riwayat ulasan yang telah dikirimkan.
  3. **Dev Profile Section:**
     - Menampilkan inisial **DZ** (tanpa nama panjang).
     - Deskripsi singkat pengembang ("Full-Stack Software Engineer & 8-Bit Pixel Enthusiast").
     - Tautan resmi GitHub: [https://github.com/Fadhli12-zak](https://github.com/Fadhli12-zak).
* **Footer:**
  - Wajib mencantumkan teks: `"Copyright by dz // 8-Bit Mobile-First Expense Tracker"`.

### 4.6 100% Dynamic Theme & Pixel Atmospheric Engine (Auto-Switch Only)
Dropdown pemilihan tema manual ditiadakan. Status tema berubah **100% otomatis** secara real-time berdasarkan rasio kesehatan finansial:

$$\text{Status Finansial} = \begin{cases} 
\text{Spooky State}, & \text{jika } \text{Expense} > \text{Income} \text{ (Defisit)} \lor \text{Expense} > 85\% \text{ Budget Limit} \\
\text{Prosper State}, & \text{jika } \text{Expense} \le \text{Income} \land \text{Expense} \le 85\% \text{ Budget Limit}
\end{cases}$$

1. **Prosper State (Hemat / Normal / Sehat):**
   - **Palet Visual:** Monokrom Putih-Hitam (Latar belakang putih bersih `#FFFFFF`, border tajam hitam solid 3px, teks hitam, kontras tinggi).
   - **Animasi & Atmosfer:** Animasi partikel piksel yang damai dan menenangkan:
     - Efek daun berguguran piksel (*falling pixel leaves*).
     - Aliran air terjun lembut (*pixel gentle flow*).
     - Malaikat piksel mini (*pixel angels*) melayang di latar belakang.
2. **Spooky State (Boros / Defisit / Melebihi Batas):**
   - **Palet Visual:** Hitam-Putih Monokrom Spooky (Latar belakang hitam pekat `#0A0A0A`, border tajam putih solid 3px, teks putih, tanpa warna neon).
   - **Animasi & Atmosfer:** Animasi piksel horor retro:
     - Karakter hantu piksel (*Casper / ghost float animation*).
     - Tengkorak piksel melayang (*floating skulls*).
     - Kelelawar berterbangan (*flying pixel bats*).
     - Efek kabut piksel bergerak perlahan (*pixelated creeping fog*).

### 4.7 Authentication, Security & Infrastructure
* **Opsi Autentikasi:**
  1. **Email & Password Standar:** Enkripsi hash password menggunakan `bcryptjs` (salt rounds = 10).
  2. **OAuth Google Login:** Integrasi tombol "Sign in with Google" untuk autentikasi sekali klik via token Google Identity Services.
* **Rate Limiting & Anti Brute-Force Policy:**
  - Rate limiting diaplikasikan pada seluruh rute API publik, khususnya endpoint `/api/auth/login`.
  - **Throttling Policy:**
    - Sistem mencatat kegagalan login berturut-turut berdasarkan kombinasi Email dan IP Address.
    - Jika pengguna gagal login sebanyak **3 kali berturut-turut**, akun dan IP di-lockout sementara.
    - Pengguna wajib menunggu masa penalti **30 detik** sebelum dapat mencoba login kembali.
    - Response HTTP saat terkunci: status code `429 Too Many Requests` disertai sisa waktu tunggu detik dalam format JSON.
* **Load Balancing Readiness:**
  - Arsitektur stateless backend (JWT Bearer Token tanpa session memory lokal) siap di-scale horizontal di belakang reverse proxy / load balancer (Nginx / Cloudflare).

---

## 5. Non-Functional Requirements (NFR)
1. **Performance:** Respon API di bawah 200ms; ukuran initial bundle frontend < 300KB (Gzip).
2. **Accessibility & Usability:** Kontras rasio teks terhadap latar belakang memenuhi standar WCAG AAA (kontras monokrom 21:1). Touch target tombol mobile minimal 44x44px.
3. **PWA Compliance:** Mendukung service worker caching untuk asset statis, manifest valid dengan ikon maskable, dan tampilan standalone tanpa browser URL bar.
4. **Data Integrity:** Referential integrity terjamin dengan relasi PostgreSQL cascading foreign keys.
