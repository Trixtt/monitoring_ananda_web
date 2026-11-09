# Catatan Keamanan

Dokumen ini merangkum pengendalian keamanan yang diterapkan pada aplikasi, batasannya, serta tindakan yang masih perlu dilakukan sebelum produksi.

## 1. Autentikasi & Sesi

- JWT ditandatangani dengan **HS256**, memiliki `issuer` dan `audience`, serta disimpan di cookie `httpOnly`, `SameSite=Lax`, dan `Secure` saat produksi.
- Di produksi, nama cookie memakai prefix `__Host-` (`__Host-token`, `__Host-csrf`) agar tidak dapat ditimpa subdomain lain.
- Token memuat sidik jari hash password (`pv`). Saat password diganti, seluruh token lama otomatis tidak berlaku tanpa perlu tabel sesi tambahan.
- Akun yang dinonaktifkan langsung kehilangan akses karena status user diperiksa di setiap request.
- Login memakai perbandingan bcrypt terhadap hash dummy bila username tidak ditemukan, sehingga waktu respons relatif seragam (mengurangi user enumeration lewat timing).
- Pesan gagal login bersifat generik: "Username atau password salah."

**Batas:** JWT bersifat stateless. Logout menghapus cookie, tetapi token yang sudah tersalin tetap valid sampai kedaluwarsa kecuali password diganti. Jangan menyalin token ke penyimpanan lain.

## 2. Otorisasi

- RBAC diterapkan di server melalui middleware `auth` + `rbac`.
- Akses wali kelas dibatasi ke kelasnya sendiri; akses orang tua dibatasi ke `siswaId` miliknya.
- Endpoint publik artikel hanya menampilkan status `publish`; draft hanya terlihat oleh admin dengan sesi valid.
- Akun baru/reset password memiliki `mustChangePassword=true`, dan server menolak endpoint lain sampai password diganti.

## 3. CSRF

- Sesi berbasis cookie dilindungi double-submit cookie.
- Token CSRF dibuat acak dan ditandatangani HMAC-SHA256; verifikasi memakai `timingSafeEqual`.
- Klien membaca token dari respons login/`/auth/me` atau cookie non-`httpOnly` sebagai fallback setelah reload.

## 4. Rate Limiting

| Lingkup | Batas |
|---|---|
| Login per IP | 40 percobaan / 15 menit |
| Login per akun | 20 percobaan / 15 menit |
| Login per IP+username | 10 percobaan / 15 menit |
| API umum | 600 permintaan / menit |
| Unggahan | 20 unggahan / menit |

Rate limit disimpan di memori proses. Untuk multi-instance produksi, gunakan store terpusat (mis. Redis).

## 5. Password

- Minimal 8 karakter, wajib mengandung huruf dan angka.
- Ditolak bila terlalu umum, memuat username, nama lengkap, atau tanggal lahir.
- Password sementara dibuat dengan `crypto.randomInt`, ditampilkan **sekali** kepada admin, dan wajib diganti saat login pertama.
- Password tidak pernah dikirim kembali oleh API dalam bentuk plaintext/hash.

## 6. Upload File

- Hanya PNG/JPG/JPEG/GIF/WEBP.
- Nama file sementara acak; ekstensi final ditentukan dari **magic bytes**, bukan dari nama/MIME klien.
- Batas ukuran default 5 MB (`UPLOAD_MAX_BYTES`).
- File statis disajikan dengan `X-Content-Type-Options: nosniff`, tanpa direktori listing.
- Gambar artikel lama dihapus saat diganti/dihapus.

## 7. Audit Log

Aksi sensitif dicatat ke tabel `audit_logs`: login berhasil/gagal, logout, perubahan profil, ganti password, reset password, CRUD akun, CRUD master data, dan CRUD artikel.

- Penulisan audit bersifat **best-effort**: kegagalan audit tidak menggagalkan operasi utama, tetapi dicatat di log server.
- Audit menyimpan aktor, aksi, entitas, IP, dan user agent. Jangan memasukkan password/token ke detail audit.

## 8. Hardening HTTP & Operasional

- Helmet, CSP ketat, CORS allowlist (`CORS_ORIGIN`), `frame-ancestors 'none'`, `base-uri 'self'`.
- Body limit JSON/urlencoded dapat diatur lewat env.
- Error handler tidak mengirim stack trace ke klien saat produksi dan tidak mencatat body/header mentah.
- Server memiliki `headersTimeout`, `requestTimeout`, `keepAliveTimeout`, serta graceful shutdown (SIGINT/SIGTERM).
- `/api/health` memeriksa koneksi database dengan timeout.
- Socket.IO memverifikasi token dan membership user sebelum menerima koneksi.

## 9. Data & Rahasia

- `server/.env`, `client/.env`, folder `uploads/`, `backups/`, dan seluruh `*.sql`/`*.dump` di-`.gitignore`.
- Dump SQL yang sebelumnya dilacak (`server/database/monitoring_siswa.sql`) sudah di-untrack. **Riwayat git lama masih memuatnya**; jika repo publik, anggap PII dan hash password di dalamnya telah bocor.
- `JWT_SECRET` dan `FONNTE_TOKEN` yang pernah masuk riwayat publik harus dianggap kompromi dan sudah dirotasi di `.env` lokal.
- Untuk membersihkan riwayat, gunakan `git filter-repo` atau BFG, lalu force-push. Ini operasi destruktif; koordinasikan dengan seluruh kolaborator.

## 10. Yang Masih Perlu Dilakukan Sebelum Produksi

1. Jalankan `npm run db:migrate` di database MySQL produksi (migrasi `20261108000000-hardening.cjs`).
2. Aktifkan HTTPS dan pastikan `TRUST_PROXY=1` bila di belakang reverse proxy.
3. Ganti `JWT_SECRET` dengan nilai acak baru minimal 32 karakter (disarankan 64+).
4. Rotasi/isi ulang `FONNTE_TOKEN` hanya bila WhatsApp memang dipakai.
5. Set `DEMO_MODE=false` dan jangan set `VITE_DEMO_MODE` saat build frontend.
6. Ganti password seluruh akun demo atau hapus akun demo.
7. Batasi akses database ke localhost/VPN dan gunakan user DB dengan hak minimum.
8. Simpan backup terenkripsi di lokasi terpisah, uji restore secara berkala.
9. Pertimbangkan rate-limit store terpusat (Redis) bila memakai lebih dari satu instance.
10. Tinjau log audit dan log server secara berkala; pasang alert untuk lonjakan login gagal.

## 11. Dependensi & Supply Chain

- `npm audit --omit=dev` untuk server dan client: **0 kerentanan pada dependensi produksi** (per 9 November 2026).
- Override `qs` dan `uuid` dipakai agar express/sequelize memakai versi yang sudah ditambal tanpa mengubah API aplikasi.
- Sisa temuan `npm audit` hanya berada di rantai **dev/build**: ESLint, `sequelize-cli`, dan `sqlite3 → node-gyp → tar`. Paket ini tidak dipakai saat server produksi berjalan.
- `sqlite3` sengaja dipindahkan ke `devDependencies` karena produksi memakai MySQL. Untuk deploy produksi gunakan `npm ci --omit=dev`.
- Jalankan `npm audit --omit=dev` secara berkala dan perbarui dependensi produksi bila ada temuan baru.

## 12. Melaporkan Insiden

Jika curiga akun/token bocor:

1. Nonaktifkan akun terkait melalui menu Admin.
2. Ganti password akun tersebut (token lama otomatis tidak berlaku).
3. Rotasi `JWT_SECRET` untuk membatalkan seluruh sesi.
4. Periksa `audit_logs` dan log server.
5. Jika data siswa terekspos, ikuti prosedur sekolah dan pelaporan yang berlaku.
