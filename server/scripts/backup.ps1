# =============================================================
# Backup database MySQL (mysqldump) ke folder backups/
# Penggunaan:
#   pwsh scripts/backup.ps1
# Atau dari package.json: npm run db:backup
# =============================================================
$ErrorActionPreference = 'Stop'

# Baca konfigurasi dari .env (format KEY=VALUE)
$envFile = Join-Path $PSScriptRoot '..\.env'
$dbHost = '127.0.0.1'
$dbPort = '3306'
$dbName = 'monitoring_siswa'
$dbUser = 'root'
$dbPassword = ''
$mysql = 'mysql'
$mysqldump = 'mysqldump'

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

$backupDir = Join-Path $PSScriptRoot '..\backups'
if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir -Force | Out-Null }

$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$file = Join-Path $backupDir "$dbName`_$stamp.sql"

$args = @("-h$dbHost", "-P$dbPort", "-u$dbUser", "--routines", "--single-transaction", $dbName)
if ($dbPassword) { $args = @("-h$dbHost", "-P$dbPort", "-u$dbUser", "-p$dbPassword", "--routines", "--single-transaction", $dbName) }

Write-Host "[Backup] Mencoba $mysqldump ($dbName@$dbHost:$dbPort) -> $file"
& $mysqldump @args | Out-File -FilePath $file -Encoding utf8

if (-not $?) { Write-Error "Backup gagal. Pastikan mysqldump ada di PATH (XAMPP: C:\xampp\mysql\bin)."; exit 1 }

# Hapus backup lebih dari 14 hari
Get-ChildItem $backupDir -Filter "$dbName`_*.sql" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-14) } | Remove-Item -Force

Write-Host "[Backup] Selesai: $file"
