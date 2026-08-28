# =============================================================
# Restore database MySQL dari file dump di backups/ (terbaru)
# atau file yang ditentukan.
# Penggunaan:
#   pwsh scripts/restore.ps1                 # pakai dump terbaru
#   pwsh scripts/restore.ps1 -File path.sql   # file tertentu
# PERINGATAN: akan MENGHAPUS isi database yang ada.
# =============================================================
param([string]$File = '')

$ErrorActionPreference = 'Stop'

$envFile = Join-Path $PSScriptRoot '..\.env'
$dbHost = '127.0.0.1'
$dbPort = '3306'
$dbName = 'monitoring_siswa'
$dbUser = 'root'
$dbPassword = ''
$mysql = 'mysql'

if (Test-Path $envFile) {
  foreach ($line in Get-Content $envFile) {
    if ($line -match '^\s*([A-Z_]+)\s*=(.*)$') {
      $key = $Matches[1]
      $val = $Matches[2].Trim().Trim('"').Trim("'")
      switch ($key) {
        'DB_HOST' { $dbHost = $val }
        'DB_PORT' { $dbPort = $val }
        'DB_NAME' { $dbName = $val }
        'DB_USER' { $dbUser = $val }
        'DB_PASSWORD' { $dbPassword = $val }
      }
    }
  }
}

if (-not $File) {
  $backupDir = Join-Path $PSScriptRoot '..\backups'
  $File = Get-ChildItem $backupDir -Filter "$dbName`_*.sql" -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName
  if (-not $File) { Write-Error 'Tidak ada file backup ditemukan.'; exit 1 }
}

if (-not (Test-Path $File)) { Write-Error "File backup tidak ditemukan: $File"; exit 1 }

Write-Host "[Restore] Akan menimpa $dbName dengan: $File"
$konfirmasi = Read-Host 'Ketik YES untuk melanjutkan'
if ($konfirmasi -ne 'YES') { Write-Host 'Dibatalkan.'; exit 0 }

$args = @("-h$dbHost", "-P$dbPort", "-u$dbUser", $dbName)
if ($dbPassword) { $args = @("-h$dbHost", "-P$dbPort", "-u$dbUser", "-p$dbPassword", $dbName) }

Get-Content $File -Raw | & $mysql @args
if (-not $?) { Write-Error 'Restore gagal.'; exit 1 }

Write-Host '[Restore] Selesai.'
