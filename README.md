# Sistem Monitoring dan Rekomendasi Perkembangan Siswa Berbasis Website

**SD Negeri 4 Keling, Kabupaten Jepara**

Sistem informasi berbasis web untuk memantau perkembangan siswa SD pada tiga dimensi — **akademik, kehadiran, dan sikap (spiritual & sosial)** — secara terintegrasi untuk Wali Kelas, Kepala Sekolah, Orang Tua, dan Admin. Sistem menggunakan **Sistem Pendukung Keputusan (SPK)** dengan metode **Simple Additive Weighting (SAW)** untuk mengklasifikasikan kondisi siswa, dilengkapi **rule-based recommendation** serta **notifikasi ganda** (real-time in-app via Socket.io + WhatsApp via Fonnte).

---

## Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Arsitektur Sistem](#arsitektur-sistem)
- [Stack Teknologi](#stack-teknologi)
- [Struktur Folder](#struktur-folder)
- [Role Pengguna](#role-pengguna)
- [Persiapan Lingkungan](#persiapan-lingkungan)
- [Instalasi (Development)](#instalasi-development)
- [Seed Data Demo](#seed-data-demo)
- [Deploy & Produksi](#deploy--produksi)
- [Backup & Restore Database](#backup--restore-database)
- [Testing](#testing)
- [Logika SPK](#logika-spk)

---

## Fitur Utama

| Modul | Deskripsi |
|---|---|
| **Landing page publik** | Info sekolah + daftar berita/artikel, halaman detail artikel. Bisa dibuka tanpa login. |
| **Login terpusat** | Satu halaman login untuk semua role; redirect otomatis ke dashboard masing-masing. |
| **Wali Kelas** | Unggah nilai (judul bebas + file pendukung), input kehadiran (Hadir/Izin/Sakit/Alpa), penilaian sikap (spiritual & sosial skala 1-4), tandai siswa **ABK**, lihat klasifikasi SPK & rekomendasi per siswa, kirim notifikasi. |
| **Kepala Sekolah** | Dashboard rekap seluruh kelas, statistik distribusi kondisi, filter kategori/kelas/**tahun ajaran**, generate laporan, **ekspor PDF resmi** (kop surat + tanda tangan). |
| **Orang Tua** | Login khusus (username = tahun angkatan + no absen), wajib ganti password pertama kali, lihat skor & grafik perkembangan anak, rekomendasi pendampingan di rumah, terima notifikasi ganda. |
| **Admin** | CRUD data master (siswa, kelas, tahun ajaran, mapel) + validasi unik (NISN), CRUD akun + reset password + aktif/nonaktif, konfigurasi bobot SPK (validasi total = 100%), kelola artikel, akses **general** sebagai Wali Kelas / Kepala Sekolah. |
| **SPK SAW** | Skoring & klasifikasi otomatis (Baik/Aman, Perlu Perhatian, Berisiko); siswa **ABK dikecualikan** dari skoring otomatis. Bobot & ambang batas bisa dikonfigurasi. |
| **Rule-based recommendation** | Rekomendasi tindak lanjut beda tiap kondisi (akademik→les, kehadiran→investigasi, sikap→coaching, ABK→pendekatan khusus) + sorot mapel terlemah. |
| **Notifikasi ganda** | Saat nilai baru diinput: real-time in-app (badge/lonceng via Socket.io) + WhatsApp via Fonnte. |

---

## Arsitektur Sistem

```
┌─────────────────────────┐        ┌─────────────────────────┐
│  Client (Vue 3 + Vite)  │  HTTP  │  Server (Node.js/Express)│
│  - Pinia state          │◄──────►│  - REST API (RESTful)    │
│  - Vue Router           │  WS    │  - Socket.io (real-time) │
│  - Socket.io-client     │◄──────►│  - Sequelize ORM         │
└─────────────────────────┘        │  - Zod validation        │
                                   │  - Helmet + httpOnly cookie│
                                   └────────────┬────────────┘
                                                │
                                         ┌──────▼──────┐
                                         │  Database   │
                                         │  MySQL      │
                                         └─────────────┘
                        Notifikasi WhatsApp (Fonnte API)
```

- **Backend**: Node.js + Express, autentikasi JWT pada **httpOnly cookie**, otorisasi berbasis role (RBAC), validasi Zod, keamanan Helmet.
- **Frontend**: Vue 3 + Vite + Pinia + Vue Router, Tailwind CSS.
- **Real-time**: Socket.io (notifikasi in-app, badge lonceng).
- **Database**: MySQL (relasional) via Sequelize ORM; skema dikelola `sequelize-cli` (migrasi).
- **Perancangan**: metode **Prototyping**; perancangan UML (Use Case, Activity, Sequence, Class) disesuaikan dengan kebutuhan skripsi.

---

## Stack Teknologi

| Layer | Teknologi |
|---|---|
| Frontend | Vue 3, Vite, Pinia, Vue Router, Tailwind CSS, Axios, Socket.io-client, jsPDF |
| Backend | Node.js, Express, Socket.io, jsonwebtoken, bcryptjs, Helmet, Zod, Multer |
| Database | MySQL (XAMPP), Sequelize ORM, sequelize-cli |
| Notifikasi | Fonnte (WhatsApp gateway), Socket.io |
| Testing | Node built-in test runner (`node --test`), Vitest + Vue Test Utils |
| Linting | ESLint (flat config) server & client |

---

## Struktur Folder

```
monitoring-sd-n-4-keling/
├── client/                        # Frontend Vue 3
│   └── src/
│       ├── components/            # Komponen reusable
│       ├── layouts/               # Layout aplikasi (sidebar, dll)
│       ├── router/                # Konfigurasi rute + guard role
│       ├── services/              # Axios instance (api)
│       ├── stores/                # Pinia (auth, notifikasi, toast, dll)
│       ├── utils/                 # Format, export CSV
│       └── views/                 # Halaman per role
│           ├── public/            # Landing & artikel
│           ├── auth/              # Login, ganti password
│           ├── admin/             # Dashboard & data master
│           ├── guru/              # Wali Kelas
│           ├── kepsek/            # Kepala Sekolah
│           └── orangtua/          # Orang Tua
│
└── server/                        # Backend Express
    ├── src/
    │   ├── config/                # env & koneksi database
    │   ├── controllers/           # Logika endpoint
    │   ├── database/              # config.cjs & migrasi sequelize-cli
    │   ├── middlewares/           # auth (JWT+RBAC), upload, rateLimit
    │   ├── models/                # Definisi model Sequelize
    │   ├── routes/                # Definisi rute REST
    │   ├── services/              # SPK, rapor, notifikasi, fonnte
    │   ├── validators/            # Skema Zod
    │   ├── index.js               # Entry point server
    │   └── seed.js                # Seed data demo
    ├── scripts/                   # Backup & restore database
    ├── .env.example               # Contoh konfigurasi dev
    └── .env.production.example    # Contoh konfigurasi produksi
```

---

## Role Pengguna

| Role | Redirect | Akses |
|---|---|---|
| `admin` | `/admin` | Data master, akun, konfigurasi SPK, artikel, akses general sebagai guru/kepsek |
| `wali_kelas` | `/guru` | Nilai, kehadiran, sikap, status ABK, dashboard klasifikasi kelas, rekomendasi |
| `kepala_sekolah` | `/kepsek` | Rekap seluruh kelas, laporan, ekspor PDF, rapor |
| `orang_tua` | `/orangtua` | Skor & rekomendasi anak, notifikasi |

**Login orang tua**: username = tahun angkatan + nomor absen (3 digit), contoh `2025001`. Password awal dibuat acak oleh admin dan hanya ditampilkan sekali; pengguna wajib mengganti password saat login pertama kali (`mustChangePassword = true`).

---

## Persiapan Lingkungan

1. **Node.js** versi 18+ (disarankan 20 LTS).
2. **MySQL** — di sini memakai **XAMPP** (MariaDB). Pastikan service MySQL berjalan pada port `3306`, user `root` tanpa password (default lokal).
3. Buat database kosong di MySQL:
   ```sql
   CREATE DATABASE monitoring_siswa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
   (Opsional sesuaikan kredensial di `.env`.)

> Untuk development *offline* tanpa MySQL, Anda bisa memakai **SQLite** (lihat `.env.example`). Untuk produksi tetap disarankan MySQL.

---

## Instalasi (Development)

```bash
# 1. Install semua dependensi (root + server + client)
npm install
npm install --prefix server
npm install --prefix client

# 2. Siapkan konfigurasi server
cd server
cp .env.example .env
#   -> sesuaikan DB_DIALECT=mysql, DB_NAME, dll. sesuai lingkungan
cd ..

# 3. Jalankan migrasi untuk membuat skema tabel di database
npm run db:migrate --prefix server

# 4. (Opsional) isi data demo
npm run db:seed --prefix server

# 5. Jalankan server + client bersamaan
npm run dev
```

Akses:
- Frontend: http://localhost:5173
- API: http://localhost:5000/api
- Health check: http://localhost:5000/api/health

---

## Seed Data Demo

Mengisi data contoh: admin, kepala sekolah, 6 wali kelas, siswa + akun orang tua, nilai/kehadiran/sikap, konfigurasi SPK, dan artikel.

```bash
npm run db:seed --prefix server
```

**Akun demo** (hanya muncul di frontend bila `VITE_DEMO_MODE=true`):

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `Admin#2026` |
| Kepala Sekolah | `kepsek` | `Kepsek#2026` |
| Wali Kelas 1-6 | `wali1` … `wali6` | `Wali#2026` |
| Orang Tua | lihat di bawah | `Ortu#2026` |

Password demo dapat diganti lewat variabel `DEMO_ADMIN_PASSWORD`, `DEMO_KEPSEK_PASSWORD`, `DEMO_WALI_PASSWORD`, dan `DEMO_ORANGTUA_PASSWORD` sebelum seed. Seed **menolak berjalan** saat `NODE_ENV=production` kecuali `SEED_ALLOW_PRODUCTION=true` diisi secara eksplisit.

**Login orang tua demo**: username = `2025` + nomor absen (3 digit), contoh `2025001`, `2025002`, dst.

> Seed **idempoten** — jika data demo sudah ada, seed akan dilewati. Untuk mereset data demo (tanpa menghapus skema/migrasi): `SEED_FORCE=true npm run db:seed --prefix server`.
>
> Bila database sudah berisi data demo lama dan hanya password akun yang perlu diselaraskan dengan tabel di atas, jalankan `npm run db:demo-passwords --prefix server`. Skrip ini menolak berjalan di produksi dan hanya menyentuh akun demo yang dikenal.

> **Untuk demo lokal/offline**, buat `client/.env` berisi `VITE_DEMO_MODE=true` agar kredensial demo tampil di halaman login. Jangan aktifkan di produksi.

---

## Deploy & Produksi

Konfigurasi produksi disediakan di `server/.env.production.example` (salin sebagai `.env` di server deployment). Poin penting:

1. **`NODE_ENV=production`** → memaksa validasi `JWT_SECRET` (minimal 32 karakter acak). Server menolak berjalan tanpa ini.
2. **`DB_SYNC=none`** → menonaktifkan auto-sync supaya skema dikelola eksklusif lewat migrasi. Jangan pakai auto-sync di produksi.
3. **Jalankan migrasi sekali** di server produksi: `npm run db:migrate --prefix server`.
4. **`APP_DOMAIN` / `CORS_ORIGIN`** → set ke domain frontend Anda (dipakai untuk CORS & link notifikasi). Bisa lebih dari satu origin, dipisah koma.
5. **`DEMO_MODE=false`** dan **`VITE_DEMO_MODE` tidak diisi** → kredensial demo tidak pernah tampil di produksi.
6. **Build frontend** dan sajikan sebagai file statik:
   ```bash
   npm run build --prefix client
   ```
   Hasil build di `client/dist`. Anda bisa menyajikannya lewat server statik (nginx / Apache) atau `Vite preview`. Atur `VITE_SITE_URL` sebelum build agar canonical/OG/sitemap memakai domain yang benar.
7. **Cookie secure**: pada produksi, cookie token otomatis diberi atribut `Secure` (HTTPS) dan memakai prefix `__Host-`.
8. **Reverse proxy**: set `TRUST_PROXY=1` bila di belakang nginx/Caddy agar rate limit memakai IP klien yang benar.
9. **Rotasi rahasia**: `JWT_SECRET` dan `FONNTE_TOKEN` yang pernah masuk riwayat git publik harus dianggap bocor. Ganti keduanya sebelum produksi.
10. **Instalasi produksi**: gunakan `npm ci --omit=dev --prefix server` agar dependensi dev/build (termasuk `sqlite3`) tidak terpasang. Produksi memakai MySQL.
11. **Hak akses database**: gunakan user MySQL khusus aplikasi dengan hak minimum; jalankan migrasi memakai user yang berhak DDL, lalu kembalikan ke hak operasional.

Langkah umum deploy (misal VPS + nginx):

```bash
# server side
NODE_ENV=production npm start --prefix server

# frontend (built) disajikan oleh web server, proxy /api ke server:5000
```

---

## Backup & Restore Database

Skrip disediakan di `server/scripts/` (membaca kredensial dari `.env`).

```bash
# Backup (mysqldump) ke folder BACKUP_DIR (default server/backups/)
# - password dikirim lewat MYSQL_PWD, bukan argumen CLI
# - checksum SHA-256 dibuat otomatis
# - backup > 14 hari dihapus otomatis
npm run db:backup --prefix server

# Restore dari dump terbaru (AKAN MENIMPA database)
npm run db:restore --prefix server
# atau tentukan file
pwsh server/scripts/restore.ps1 -File server/backups/monitoring_siswa_20260201_100000.sql
```

> Pastikan `mysqldump`/`mysql` berada di PATH. Jika memakai XAMPP, skrip otomatis mencoba `C:\xampp\mysql\bin\`.
>
> File backup berisi data pribadi siswa. Folder `backups/` sudah masuk `.gitignore`; simpan salinan di lokasi terenkripsi dan jangan pernah commit ke git. Detail prosedur ada di [`docs/backup-restore.md`](docs/backup-restore.md).

---

## Keamanan

Ringkasan pengendalian keamanan yang sudah diterapkan:

- **Autentikasi**: JWT HS256 di cookie `httpOnly` (prefix `__Host-` saat HTTPS), issuer/audience diverifikasi, dan token otomatis tidak berlaku setelah password diganti (sidik jari `pv`).
- **Otorisasi**: RBAC per role + validasi akses kelas/siswa di server (bukan hanya di UI).
- **CSRF**: double-submit cookie dengan token bertanda tangan HMAC dan perbandingan timing-safe.
- **Rate limit**: per IP, per IP+username, dan per akun untuk login; rate limit terpisah untuk API dan unggahan.
- **Password**: minimal 8 karakter, wajib huruf+angka, tidak boleh memuat username/nama/tanggal lahir, dan password sementara dibuat secara kriptografis.
- **Wajib ganti password**: akun baru/reset password memakai `mustChangePassword` yang ditegakkan di server.
- **Upload**: nama file acak, validasi MIME + magic bytes, batas ukuran, dan penyajian statis dengan `nosniff`.
- **Audit**: aksi sensitif (login, perubahan akun, reset password, CRUD data, artikel) dicatat ke tabel `audit_logs` secara best-effort.
- **Hardening HTTP**: Helmet, CSP, CORS allowlist, body limit, `frame-ancestors 'none'`, timeout server, graceful shutdown, dan error tanpa membocorkan detail internal.
- **Privasi data**: dump SQL berisi PII tidak lagi dilacak git; kredensial demo hanya aktif lewat `DEMO_MODE`/`VITE_DEMO_MODE`.
- **Dependensi**: `npm audit --omit=dev` bersih (0 kerentanan produksi) untuk server maupun client; `sqlite3` hanya dipakai di lingkungan dev.

Catatan lengkap dan checklist demo: [`docs/security-notes.md`](docs/security-notes.md) dan [`docs/demo-checklist.md`](docs/demo-checklist.md).

> Tidak ada sistem yang 100% aman. Untuk produksi, wajib HTTPS, rotasi `JWT_SECRET`/`FONNTE_TOKEN`, backup terenkripsi, pembatasan akses database, dan pemantauan log.

---

## Testing

```bash
# Test server (Node built-in test runner)
npm test --prefix server

# Test client (Vitest)
npm test --prefix client

# Lint
npm run lint --prefix server
npm run lint --prefix client

# Build client
npm run build --prefix client
```

---

## Logika SPK

**Simple Additive Weighting (SAW)** — semua kriteria bersifat *benefit* (semakin tinggi semakin baik).

| Kriteria | Bobot mentah | Bobot ternormalisasi |
|---|---|---|
| C1 Akademik | 4 | ~0.31 |
| C2 Kehadiran | 4 | ~0.31 |
| C3 Sikap | 5 | ~0.38 |
| **Total** | **13** | **1.00** |

- Normalisasi benefit: `rij = xij / max(xij)`
- Nilai preferensi: `Vi = Σ (Wj × rij)`
- Klasifikasi (interval):
  - `0.67 <= Vi <= 1.00` → **Baik / Aman**
  - `0.34 <= Vi < 0.67` → **Perlu Perhatian**
  - `0.00 <= Vi < 0.34` → **Berisiko / Butuh Tindak Lanjut**

**Pengecualian**: siswa berstatus **ABK** tidak diikutkan skoring SAW; sistem menampilkan catatan "memerlukan pendekatan pembelajaran khusus".

Bobot dan ambang batas **dapat dikonfigurasi ulang oleh Admin** dengan validasi jumlah bobot harus = 100%.

### Rekomendasi berbasis aturan (rule-based)

- Akademik rendah → les/bimbingan tambahan + sorot mapel terlemah (min nilai per mapel).
- Sikap rendah → pendekatan personal/coaching ke siswa & orang tua.
- Kehadiran rendah **tetapi** akademik & sikap baik → investigasi penyebab ketidakhadiran + coaching (bukan les tambahan).
- Status ABK → dikecualikan dari klasifikasi otomatis, tampilkan catatan pendekatan pembelajaran khusus.

---

## Batasan (Versi Awal)

- Analisis tren lintas semester belum termasuk (future work).
- Siswa tidak punya akun/akses ke sistem.
- Tidak ada integrasi langsung ke E-Rapor Kemendikdasmen (input nilai manual).
- Notifikasi WhatsApp memakai **Fonnte** (bukan WhatsApp Business API resmi).
- Data kesehatan & ekstrakurikuler tidak dicakup.

---

*Sistem Informasi Monitoring dan Rekomendasi Perkembangan Siswa Berbasis Website — SD Negeri 4 Keling, Kabupaten Jepara.*
