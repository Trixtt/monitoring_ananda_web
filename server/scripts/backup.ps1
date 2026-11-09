# =============================================================
# Backup database MySQL (mysqldump) ke folder backups/
# Penggunaan:
#   pwsh scripts/backup.ps1
# Atau dari package.json: npm run db:backup
#
# Catatan keamanan:
# - Password TIDAK ditaruh di argumen CLI (tidak terlihat di proses list),
#   melainkan lewat variabel lingkungan MYSQL_PWD.
# - File backup berisi data pribadi siswa. Jangan commit ke git.
# - Checksum SHA-256 dibuat untuk memverifikasi integritas saat restore.
# =============================================================
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
  Write-Host "[Backup] DB_DIALECT=$dialect. Skrip ini hanya untuk MySQL."
  Write-Host "[Backup] Untuk SQLite cukup salin file database secara manual."
  exit 0
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

$mysqldump = Cari-Executable 'mysqldump' 'C:\xampp\mysql\bin\mysqldump.exe'
if (-not $mysqldump) {
  Write-Error 'mysqldump tidak ditemukan. Tambahkan folder bin MySQL/XAMPP ke PATH.'
  exit 1
}

New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$file = Join-Path $backupDir "$dbName`_$stamp.sql"

# Batasi akses folder backup ke pengguna saat ini (Windows).
try {
  $acl = Get-Acl $backupDir
  $acl.SetAccessRuleProtection($true, $false)
  $rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
    [System.Security.Principal.WindowsIdentity]::GetCurrent().Name,
    'FullControl',
    'ContainerInherit,ObjectInherit',
    'None',
    'Allow'
  )
  $acl.SetAccessRule($rule)
  Set-Acl -Path $backupDir -AclObject $acl
} catch {
  Write-Warning "[Backup] Tidak dapat mengatur ACL folder backup: $($_.Exception.Message)"
}

$argumen = @(
  '-h', $dbHost,
  '-P', $dbPort,
  '-u', $dbUser,
  '--single-transaction',
  '--routines',
  '--triggers',
  '--default-character-set=utf8mb4',
  '--no-tablespaces',
  $dbName
)

Write-Host "[Backup] $dbName@$dbHost`:$dbPort -> $file"

$lamaPwd = $env:MYSQL_PWD
try {
  if ($dbPassword) { $env:MYSQL_PWD = $dbPassword }
  & $mysqldump @argumen 2>$null | Set-Content -Path $file -Encoding utf8 -NoNewline
  if ($LASTEXITCODE -ne 0) { throw "mysqldump keluar dengan kode $LASTEXITCODE" }
} finally {
  if ($null -eq $lamaPwd) { Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue } else { $env:MYSQL_PWD = $lamaPwd }
}

$info = Get-Item $file
if ($info.Length -lt 1024) {
  Remove-Item $file -Force -ErrorAction SilentlyContinue
  Write-Error 'Backup gagal: file hasil terlalu kecil. Periksa kredensial database.'
  exit 1
}

$hash = (Get-FileHash -Path $file -Algorithm SHA256).Hash.ToLowerInvariant()
"$hash  $([System.IO.Path]::GetFileName($file))" | Set-Content -Path "$file.sha256" -Encoding ascii

# Retensi: hapus backup lebih dari 14 hari.
Get-ChildItem $backupDir -Filter "$dbName`_*.sql" |
  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-14) } |
  ForEach-Object {
    Remove-Item "$($_.FullName).sha256" -Force -ErrorAction SilentlyContinue
    Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue
  }

Write-Host "[Backup] Selesai: $file ($([math]::Round($info.Length / 1KB)) KB)"
Write-Host "[Backup] SHA-256: $hash"
Write-Host '[Backup] PENTING: simpan salinan di lokasi terenkripsi, jangan commit ke git.'
