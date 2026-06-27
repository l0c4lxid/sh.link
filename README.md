# Sisolo Link - Pemendek URL & Domain Kustom Berkinerja Tinggi

Sisolo Link adalah platform pemendek URL modern, berkinerja tinggi, dan full-stack yang mendukung domain kustom, generator kode QR dinamis, serta analitik klik real-time. Aplikasi ini dirancang dengan antarmuka monospace industrial retro yang tajam dan responsif.

---

## 🚀 Fitur Utama

- **Pemendek URL Dinamis**: Membuat tautan singkat secara otomatis atau menggunakan slug kustom.
- **Dukungan Domain Kustom**: Mengelola dan menggunakan domain sendiri untuk tautan singkat yang dibuat.
- **Tampilan Fleksibel (Layout Toggle)**: Beralih dengan mudah antara tampilan **Daftar** (tabel detail) dan **QR Code** (grid kartu kode QR simetris 5x2).
- **Pengontrol Lengkap (Filter & Sortir)**:
  - **Pencarian**: Pencarian instan berdasarkan nama slug atau tujuan asli.
  - **Urutan**: Mengurutkan berdasarkan Terbaru, Terlama, Klik Terbanyak/Tersedikit, dan Abjad Slug.
  - **Filter Status**: Menampilkan semua, tautan aktif, atau tautan kedaluwarsa.
  - **Filter Keamanan**: Menampilkan tautan umum atau yang dilindungi kata sandi.
  - **Filter Domain**: Menampilkan tautan berdasarkan domain tertentu.
- **Pagination Interaktif**: Pembatasan maksimal 10, 25, 50, atau 100 entri per halaman dengan navigasi slide (panah kiri/kanan) dan penomoran halaman pintar (`...`).
- **Pratinjau & Unduh QR**: Membuat kode QR interaktif dari tautan yang dapat dipratinjau secara instan (tengah layar & aman mobile) dan diunduh dalam format JPEG.
- **Analitik Real-time & Admin**: Memantau statistik kunjungan link secara langsung.

---

## 🛠️ Tech Stack & Arsitektur

- **Full-stack SSR**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [TanStack Start](https://tanstack.com/router/v1/docs/start/overview) (SSR & File-based routing).
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) untuk performa compile super cepat dan gaya desain bersih.
- **Database**: [MongoDB](https://www.mongodb.com/) (menggunakan native driver via `src/lib/mongodb.ts`).
- **UI Components**: [Radix UI Primitives](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/), dan [Sonner](https://sonner.emilkowal.ski/) untuk notifikasi toast yang mulus.

---

## 📦 Struktur Proyek

```bash
sh.link/
├── src/
│   ├── components/       # Komponen UI modular (Dialog, Modals, AppShell, dll.)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilitas backend (MongoDB, enkripsi, JWT, sesi)
│   ├── routes/           # Routing berbasis berkas (File-based routes)
│   │   ├── __root.tsx    # App Shell utama aplikasi
│   │   ├── index.tsx     # Landing page
│   │   └── dashboard.tsx # Halaman-halaman panel dashboard utama
│   ├── styles.css        # Konfigurasi Tailwind CSS v4 & tema warna
│   ├── router.tsx        # Konfigurasi TanStack Router
│   ├── start.ts          # Entry point client
│   └── server.ts         # Wrapper SSR server
├── public/               # Aset statis publik (favicon, logo, dll.)
├── vite.config.ts        # Konfigurasi bundler Vite
├── tsconfig.json         # Konfigurasi TypeScript compiler
└── package.json          # Manajemen dependensi dan script proyek
```

---

## 💻 Panduan Menjalankan

### Persyaratan
- [Bun](https://bun.sh/) (Disarankan) atau Node.js v20+

### 1. Instalasi Dependensi
Jalankan perintah berikut pada direktori utama untuk menginstal seluruh dependensi:
```bash
bun install
```

### 2. Konfigurasi Lingkungan (Environment Variables)
Salin berkas `.env.example` menjadi `.env` terlebih dahulu:
```bash
cp .env.example .env
```
Kemudian, buka berkas `.env` yang baru dibuat dan isi variabel `MONGODB_URI` dengan string koneksi database MongoDB Anda:
```env
MONGODB_URI="mongodb+srv://<username>:<password>@cluster.mongodb.net/dbname?retryWrites=true&w=majority"
```

### 3. Jalankan Mode Pengembangan (Development)
Untuk menjalankan server lokal dengan fitur hot-reload:
```bash
bun run dev
```
Aplikasi dapat diakses melalui peramban di alamat `http://localhost:8080/`.

### 4. Build untuk Produksi (Production)
Untuk melakukan kompilasi dan optimalisasi aplikasi sebelum dideploy:
```bash
bun run build
```

---

## 🛡️ Keamanan & Lisensi
- Dilengkapi enkripsi kata sandi untuk tautan terproteksi.
- Sesi pengguna dikelola secara aman menggunakan token JWT berbasis cookie HTTP-Only.
