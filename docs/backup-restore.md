# Backup & Restore Database

Backup berisi seluruh data siswa dan akun. Perlakukan sebagai data rahasia.

## Prasyarat

- MySQL/MariaDB berjalan.
- `mysqldump` dan `mysql` tersedia di `PATH`, atau gunakan instalasi XAMPP (`C:\xampp\mysql\bin\` — skrip mencoba path ini otomatis).
- Konfigurasi database di `server/.env` (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`).

## Backup

```powershell
npm run db:backup --prefix server
```

Perilaku skrip:

- Menulis dump ke `BACKUP_DIR` (default `server/backups/`).
- Mengirim password lewat variabel lingkungan `MYSQL_PWD`, bukan argumen CLI (tidak terlihat di daftar proses).
- Membuat file checksum `.sha256` di samping dump.
- Menghapus backup lebih dari 14 hari.
- Membatasi ACL folder backup ke pengguna Windows saat ini (bila memungkinkan).

Nama file: `monitoring_siswa_YYYYMMDD_HHMMSS.sql`.

## Restore

```powershell
# dump terbaru
npm run db:restore --prefix server

# file tertentu
pwsh server/scripts/restore.ps1 -File server/backups/monitoring_siswa_20260201_100000.sql

# tanpa konfirmasi interaktif (hati-hati)
pwsh server/scripts/restore.ps1 -File <file> -Force
```

Skrip akan:

1. Memverifikasi checksum `.sha256` bila tersedia.
2. Meminta konfirmasi `YES` (kecuali `-Force`).
3. Menimpa isi database saat ini.

Setelah restore, jalankan migrasi bila versi skema berbeda:

```powershell
npm run db:migrate --prefix server
```

## Penyimpanan Aman

- Jangan commit `backups/` atau file `*.sql` ke git (sudah di-`.gitignore`).
- Simpan salinan terenkripsi di lokasi terpisah (external drive/server lain).
- Batasi siapa yang dapat membaca folder backup.
- Uji restore minimal sekali sebelum demo/produksi.
- Untuk data asli, pertimbangkan enkripsi at-rest (BitLocker/VeraCrypt) dan retensi sesuai kebijakan sekolah.

## SQLite (Demo Offline)

Untuk `DB_DIALECT=sqlite`, skrip MySQL tidak dipakai. Cukup salin file database:

```powershell
Copy-Item server\src\database\dev.sqlite "server\backups\dev_$(Get-Date -Format yyyyMMdd_HHmmss).sqlite"
```

Restore: hentikan server, ganti file `dev.sqlite` dengan salinan, lalu jalankan server kembali.
