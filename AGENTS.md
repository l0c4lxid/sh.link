# Panduan Pengembangan Sisolo Link

Proyek ini adalah pemendek URL berkinerja tinggi yang mendukung domain kustom, generator kode QR dinamis, dan analitik real-time.

## Tech Stack & Arsitektur
- **Frontend & Backend**: React 19 + TypeScript + TanStack Start (Full-stack SSR).
- **Styling**: Tailwind CSS v4 (menggunakan utility v4 baru seperti `@utility` dan standard `translate`).
- **Database**: MongoDB (via `src/lib/mongodb.ts`).
- **UI Components**: Radix UI Primitives + Lucide React + Sonner.

## Aturan Khusus Pengembangan

1. **Tata Letak & Kompatibilitas Dialog/Modal**:
   - Semua dialog (`DialogContent` / `AlertDialogContent`) wajib diposisikan di tengah layar menggunakan classes berikut untuk kompatibilitas Tailwind CSS v4:
     `fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`
   - Pastikan dialog aman diakses di perangkat mobile dengan memberikan kelas pembatas tinggi dan scroll bar:
     `max-h-[90vh] overflow-y-auto`

2. **Tema Desain (Aesthetics)**:
   - Pertahankan estetika monospace industrial retro (font monospace, warna-warna terkurasi seperti Electric Blue, border hitam/solid minimalis, dan gaya layout tajam).

3. **Verifikasi Build**:
   - Sebelum menyelesaikan tugas, selalu jalankan `bun run build` untuk memastikan tidak ada kesalahan kompilasi TypeScript atau bundler Vite.
