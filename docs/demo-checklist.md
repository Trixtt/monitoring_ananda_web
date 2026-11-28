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

Backup database, lalu jalankan migrasi + seed. Jalankan hanya setelah
mendapat izin eksplisit; jangan menjalankan `SEED_FORCE=true` kecuali pengguna
memintanya sendiri.

```powershell
npm run db:backup --prefix server
npm run db:migrate --prefix server
npm run db:seed --prefix server
```

Migration `20261128000000-catatan-kejadian-sikap.cjs` hanya menghapus baris demo
pada tabel `sikap` dan tidak memulihkannya pada cabang `down` tanpa backup.

Setelah seed, tahun ajaran aktif adalah **2025/2026** dengan semester aktif **Ganjil**
(Ganjil `2025-07-14`–`2025-12-21`, Genap `2026-01-05`–`2026-06-21`). Data contoh nilai
(`2025-10-11`–`2025-10-14`), kehadiran (`2025-10-01`–`2025-10-15`), dan catatan sikap
(`2025-10-15`, kategori **Tidak mengerjakan tugas**, satu catatan per siswa) berada di
Ganjil, sehingga dashboard tidak kosong. Tidak ada lagi nilai sikap skala 1–5.

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
4a. **Admin → Konfigurasi SPK** — ubah slider bobot (total harus 100%) dan ambang rekomendasi (`0,65` akademik, `0,65` sikap, `0,80` kehadiran); pada kartu **Aturan Mata Pelajaran** ubah KKM (`70`) dan ambang unggul (`85`) dengan skala 0–100 (unggul harus lebih besar dari KKM); tunjukkan tombol **Reset** kembali ke bawaan `4/13, 4/13, 5/13` (tampil `0,31 / 0,31 / 0,38`) dan pastikan nilai tersimpan setelah reload.
5. **Login wali kelas** — input nilai, kehadiran (pilih status satu per satu; izin/sakit tetap efektif), dan catatan sikap berisi kategori, aspek sosial/spiritual, tanggal, serta keterangan. Tunjukkan daftar kategori: Bolos, Tidak mengerjakan tugas, Berkelahi dengan teman, Memalak uang teman, Membully teman/perundungan, Berbicara kotor kepada teman, Tidak sopan kepada guru, Lainnya. Kategori **Lainnya** mensyaratkan aspek dan keterangan; kategori **Bolos** hanya bisa disimpan jika sudah ada presensi alpa siswa yang sama pada tanggal itu dan tahunajarannya diambil dari presensi tersebut. Tidak ada input angka 1–5. Tunjukkan siswa **tanpa catatan** tetap dihitung dengan nilaiSikap 100 (R_S = 1) tanpa predikat "Sangat Baik" dan tanpa tombol konfirmasi; **Data Belum Lengkap** hanya muncul bila nilai atau rekap kehadiran belum ada. Monitoring menampilkan semester aktif.
5a. **Agregasi per mapel & rulebase** — pada monitoring/rekap tunjukkan nilai dirata-ratakan per mapel lebih dulu, lalu rata-rata dari semua rata mapel (mapel dengan banyak catatan tidak lebih berbobot). Perlihatkan rekomendasi **bimbingan** untuk mapel yang ratanya di bawah KKM dan **pengayaan/pendalaman** untuk mapel yang mencapai ambang unggul; keduanya dapat muncul bersamaan dalam `daftar` rekomendasi yang sama. Bila skor berada di bawah `intervalBerisikoBawah`, muncul kalimat **prioritas tindak lanjut intensif** tanpa menambah kategori baru.
6. **Login kepala sekolah** — rekap per kelas, daftar siswa berisiko, ekspor PDF rapor/laporan; bila rentang tanggal tidak diisi, laporan memakai semester aktif.
7. **Login orang tua** — dashboard perkembangan anak, nilai, kehadiran, rekomendasi; pada halaman catatan sikap tampil ringkas `nilai`, `jumlahCatatan`, dan daftar tanggal/kategori/aspek/keterangan. Kalender monitoring menampilkan semua catatan dalam satu tanggal; tanggal tanpa catatan memakai keterangan netral "Tidak ada catatan kejadian pada tanggal ini", bukan predikat tertentu.
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
# Hanya dengan izin eksplisit pengguna dan setelah backup:
# kembali ke data demo bersih (skema & migrasi tetap utuh)
$env:SEED_FORCE='true'
npm run db:seed --prefix server
Remove-Item Env:SEED_FORCE

# atau hanya menyelaraskan password akun demo yang sudah ada
npm run db:demo-passwords --prefix server
```

> Agent tidak menjalankan perintah di atas tanpa izin. `SEED_FORCE=true`
> menimpa data yang ada dan tidak dipakai dalam pengerjaan revisi v1.1.

> **Jangan** memakai `DEMO_MODE=true`, `VITE_DEMO_MODE=true`, atau akun demo untuk data asli/produksi.
