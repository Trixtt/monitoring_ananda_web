# Checklist Demo Lokal/Offline

Demo dijalankan sepenuhnya di komputer lokal, tanpa internet. WhatsApp/Fonnte dinonaktifkan karena membutuhkan jaringan.

## 1. Persiapan Sekali

```powershell
# dari root repo
npm install
npm install --prefix server
npm install --prefix client
```

Pastikan **MySQL/XAMPP** berjalan, lalu buat database:

```sql
CREATE DATABASE monitoring_siswa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Atur `server/.env`:

```env
NODE_ENV=development
DB_DIALECT=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=monitoring_siswa
DB_USER=root
DB_PASSWORD=
DEMO_MODE=true
FONNTE_TOKEN=
APP_DOMAIN=http://localhost:5175
CORS_ORIGIN=http://localhost:5175
```

Atur `client/.env`:

```env
VITE_SITE_URL=http://localhost:5175
VITE_DEMO_MODE=true
VITE_DEV_API_TARGET=http://localhost:5000
```

Jalankan migrasi + seed:

```powershell
npm run db:migrate --prefix server
npm run db:seed --prefix server
```

Setelah seed, tahun ajaran aktif adalah **2025/2026** dengan semester aktif **Ganjil**
(Ganjil `2025-07-14`–`2025-12-21`, Genap `2026-01-05`–`2026-06-21`). Data contoh nilai
(`2025-10-11`–`2025-10-14`), kehadiran (`2025-10-01`–`2025-10-15`), dan sikap
(`2025-10-15`) berada di Ganjil, sehingga dashboard tidak kosong.

## 2. Menjalankan Demo

```powershell
npm run dev
```

Buka **http://localhost:5175**. Kredensial demo tampil di halaman login karena `VITE_DEMO_MODE=true`.

## 3. Akun Demo

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `Admin#2026` |
| Kepala Sekolah | `kepsek` | `Kepsek#2026` |
| Wali Kelas | `wali1` … `wali6` | `Wali#2026` |
| Orang Tua | `2025001` … | `Ortu#2026` |

## 4. Alur Demonstrasi yang Disarankan

1. **Landing page publik** — buka `/`, tunjukkan berita sekolah, buka detail artikel.
2. **Login admin** — tunjukkan dashboard, data siswa/kelas/mapel/tahun ajaran.
3. **Manajemen akun** — buat akun orang tua, tunjukkan password sementara muncul **sekali**.
4. **Admin → Tahun Ajaran** — tunjukkan `2025/2026` aktif dengan semester **Ganjil** dan rentang ganjil/genap. Coba ubah semester aktif menjadi **Genap**, amati monitoring/laporan ikut berubah, lalu kembalikan ke **Ganjil**.
4a. **Admin → Konfigurasi SPK** — ubah slider bobot (total harus 100%) dan ambang rekomendasi (`0,65` akademik, `0,65` sikap, `0,80` kehadiran); tunjukkan tombol **Reset** kembali ke bawaan `4/13, 4/13, 5/13` (tampil `0,31 / 0,31 / 0,38`) dan pastikan nilai tersimpan setelah reload.
5. **Login wali kelas** — input nilai, kehadiran (pilih status satu per satu; izin/sakit tetap efektif), dan kejadian sikap skala 1–5 (`1 Kurang`, `2 Cukup`, `3 Baik`, `4 Baik Sekali`, `5 Sangat Baik`). Tunjukkan bahwa siswa **tanpa kejadian** langsung bernilai **5 / Sangat Baik** tanpa tombol konfirmasi; **Data Belum Lengkap** hanya muncul bila nilai atau rekap kehadiran belum ada. Monitoring menampilkan semester aktif.
6. **Login kepala sekolah** — rekap per kelas, daftar siswa berisiko, ekspor PDF rapor/laporan; bila rentang tanggal tidak diisi, laporan memakai semester aktif.
7. **Login orang tua** — dashboard perkembangan anak, nilai, kehadiran, rekomendasi; pada kalender sikap, bulan tanpa kejadian ditampilkan **Sangat Baik**.
8. **Ganti password** — dari menu Profil, tunjukkan validasi password kuat (minimal 8 karakter).
9. **Logout** — tunjukkan kembalian ke halaman login.

## 5. Memeriksa Fitur Keamanan (Opsional)

- Buka DevTools → Application → Cookies: token harus `HttpOnly`; cookie CSRF tidak.
- Coba login salah berkali-kali: muncul pesan rate limit.
- Coba akses `/admin` saat login sebagai orang tua: diarahkan ke dashboard orang tua.
- Coba buka artikel draft tanpa login: 404.
- Coba unggah file non-gambar sebagai sampul artikel: ditolak.

## 6. Reset Demo

```powershell
# kembali ke data demo bersih (skema & migrasi tetap utuh)
$env:SEED_FORCE='true'
npm run db:seed --prefix server
Remove-Item Env:SEED_FORCE

# atau hanya menyelaraskan password akun demo yang sudah ada
npm run db:demo-passwords --prefix server
```

> **Jangan** memakai `DEMO_MODE=true`, `VITE_DEMO_MODE=true`, atau akun demo untuk data asli/produksi.
