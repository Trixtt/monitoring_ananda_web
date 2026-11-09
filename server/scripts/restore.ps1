# =============================================================
# Restore database MySQL dari file dump di backups/ (terbaru)
# atau file yang ditentukan.
# Penggunaan:
#   pwsh scripts/restore.ps1                 # pakai dump terbaru
#   pwsh scripts/restore.ps1 -File path.sql  # file tertentu
# PERINGATAN: akan MENGHAPUS isi database yang ada.
# =============================================================
param([string]$File = '', [switch]$Force)

$ErrorActionPreference = 'Stop'

function Baca-EnvFile([string]$path) {
  $hasil = @{}
  if (-not (Test-Path $path)) { return $hasil }
  foreach ($line in Get-Content $path) {
    if ($line -match '^\s*#') { continue }
    if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$') {
      $hasil[$Matches[1]] = $Matches[2].Trim().Trim('"').Trim("'")
    }
  }
  return $hasil
}

function Cari-Executable([string]$nama, [string]$fallback) {
  $cmd = Get-Command $nama -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  if ($fallback -and (Test-Path $fallback)) { return $fallback }
  return $null
}

$envFile = Join-Path $PSScriptRoot '..\.env'
$konfig = Baca-EnvFile $envFile

$dialect = if ($konfig['DB_DIALECT']) { $konfig['DB_DIALECT'] } else { 'mysql' }
if ($dialect -ne 'mysql') {
  Write-Error "Restore otomatis hanya tersedia untuk MySQL (DB_DIALECT=$dialect)."
  exit 1
}

$dbHost = if ($konfig['DB_HOST']) { $konfig['DB_HOST'] } else { '127.0.0.1' }
$dbPort = if ($konfig['DB_PORT']) { $konfig['DB_PORT'] } else { '3306' }
$dbName = if ($konfig['DB_NAME']) { $konfig['DB_NAME'] } else { 'monitoring_siswa' }
$dbUser = if ($konfig['DB_USER']) { $konfig['DB_USER'] } else { 'root' }
$dbPassword = if ($konfig.ContainsKey('DB_PASSWORD')) { $konfig['DB_PASSWORD'] } else { '' }

$backupDir = if ($konfig['BACKUP_DIR']) {
  Join-Path (Join-Path $PSScriptRoot '..') $konfig['BACKUP_DIR']
} else {
  Join-Path $PSScriptRoot '..\backups'
}
$backupDir = [System.IO.Path]::GetFullPath($backupDir)

$mysql = Cari-Executable 'mysql' 'C:\xampp\mysql\bin\mysql.exe'
if (-not $mysql) {
  Write-Error 'mysql client tidak ditemukan. Tambahkan folder bin MySQL/XAMPP ke PATH.'
  exit 1
}

if (-not $File) {
  $File = Get-ChildItem $backupDir -Filter "$dbName`_*.sql" -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName
  if (-not $File) { Write-Error 'Tidak ada file backup ditemukan.'; exit 1 }
}

if (-not (Test-Path $File)) { Write-Error "File backup tidak ditemukan: $File"; exit 1 }

# Verifikasi checksum jika tersedia.
$checksumFile = "$File.sha256"
if (Test-Path $checksumFile) {
  $harapan = (Get-Content $checksumFile -TotalCount 1).Split(' ')[0].Trim().ToLowerInvariant()
  $aktual = (Get-FileHash -Path $File -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($harapan -ne $aktual) {
    Write-Error 'Checksum backup tidak cocok. File mungkin rusak atau diubah. Restore dibatalkan.'
    exit 1
  }
  Write-Host '[Restore] Checksum SHA-256 cocok.'
} else {
  Write-Warning '[Restore] File checksum tidak ditemukan. Integritas backup tidak dapat diverifikasi.'
}

Write-Host "[Restore] Akan menimpa database '$dbName' dengan: $File"
if (-not $Force) {
  $konfirmasi = Read-Host 'Ketik YES untuk melanjutkan'
  if ($konfirmasi -ne 'YES') { Write-Host 'Dibatalkan.'; exit 0 }
}

$argumen = @('-h', $dbHost, '-P', $dbPort, '-u', $dbUser, '--default-character-set=utf8mb4', $dbName)

$lamaPwd = $env:MYSQL_PWD
try {
  if ($dbPassword) { $env:MYSQL_PWD = $dbPassword }
  Get-Content $File -Raw -Encoding utf8 | & $mysql @argumen
  if ($LASTEXITCODE -ne 0) { throw "mysql keluar dengan kode $LASTEXITCODE" }
} finally {
  if ($null -eq $lamaPwd) { Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue } else { $env:MYSQL_PWD = $lamaPwd }
}

Write-Host '[Restore] Selesai. Jalankan migrasi bila skema berubah: npm run db:migrate'
