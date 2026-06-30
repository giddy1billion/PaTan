# Migrate Neon PostgreSQL to Azure PostgreSQL (zero data loss)
# Run: powershell -ExecutionPolicy Bypass -File scripts/migrate-neon-to-azure.ps1

param(
    [string]$AzureDbUrl
)

$ErrorActionPreference = "Stop"
$dumpFile = "neon_full_backup.dump"

# Source: Neon (direct endpoint, not pooler)
$neonUrl = "postgresql://neondb_owner:npg_SvQjRA9Elxg4@ep-withered-hat-abp4ofiq.eu-west-2.aws.neon.tech/neondb?sslmode=require"

# Target: Azure PostgreSQL
if (-not $AzureDbUrl) {
    $AzureDbUrl = Read-Host "Enter Azure DATABASE_URL (postgresql://user:pass@host:5432/db?sslmode=require)"
}

if (-not $AzureDbUrl) {
    Write-Host "ERROR: Azure DATABASE_URL is required." -ForegroundColor Red
    exit 1
}

# Check tools
Write-Host "=== Checking prerequisites ===" -ForegroundColor Cyan
$pgDump = Get-Command pg_dump -ErrorAction SilentlyContinue
$pgRestore = Get-Command pg_restore -ErrorAction SilentlyContinue
$psqlCmd = Get-Command psql -ErrorAction SilentlyContinue

if (-not $pgDump -or -not $pgRestore -or -not $psqlCmd) {
    Write-Host "ERROR: pg_dump, pg_restore, and psql must be on PATH." -ForegroundColor Red
    Write-Host "Install PostgreSQL client tools or add them to PATH." -ForegroundColor Yellow
    exit 1
}
Write-Host "pg_dump, pg_restore, psql found." -ForegroundColor Green

# Step 1: Dump from Neon
Write-Host "`n=== Step 1: Dumping from Neon (custom format) ===" -ForegroundColor Cyan
Write-Host "Source: Neon direct endpoint (non-pooler)" -ForegroundColor Gray

$env:PGPASSWORD = ""
pg_dump $neonUrl `
    --format=custom `
    --no-owner `
    --no-privileges `
    --verbose `
    --file=$dumpFile

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: pg_dump failed." -ForegroundColor Red
    exit 1
}

$fileSize = (Get-Item $dumpFile).Length / 1MB
Write-Host "Dump complete: $dumpFile ($([math]::Round($fileSize, 2)) MB)" -ForegroundColor Green

# Step 2: Restore to Azure
Write-Host "`n=== Step 2: Restoring to Azure PostgreSQL ===" -ForegroundColor Cyan
Write-Host "Target: $($AzureDbUrl -replace '://[^@]+@', '://***@')" -ForegroundColor Gray

pg_restore `
    --dbname=$AzureDbUrl `
    --no-owner `
    --no-privileges `
    --single-transaction `
    --verbose `
    $dumpFile

if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: pg_restore reported issues (may be non-fatal role/extension warnings)." -ForegroundColor Yellow
} else {
    Write-Host "Restore complete." -ForegroundColor Green
}

# Step 3: Validate row counts
Write-Host "`n=== Step 3: Validating row counts ===" -ForegroundColor Cyan

$countQuery = "SELECT tablename, n_live_tup FROM pg_stat_user_tables ORDER BY tablename;"

Write-Host "`nNeon row counts:" -ForegroundColor Yellow
psql $neonUrl -c "ANALYZE;"
$neonCounts = psql $neonUrl -t -A -F "," -c $countQuery
Write-Host $neonCounts

Write-Host "`nAzure row counts:" -ForegroundColor Yellow
psql $AzureDbUrl -c "ANALYZE;"
$azureCounts = psql $AzureDbUrl -t -A -F "," -c $countQuery
Write-Host $azureCounts

# Compare
$neonLines = ($neonCounts -split "`n") | Where-Object { $_ -match "\S" }
$azureLines = ($azureCounts -split "`n") | Where-Object { $_ -match "\S" }

$mismatch = $false
for ($i = 0; $i -lt $neonLines.Count; $i++) {
    if ($neonLines[$i] -ne $azureLines[$i]) {
        Write-Host "MISMATCH: Neon[$($neonLines[$i])] vs Azure[$($azureLines[$i])]" -ForegroundColor Red
        $mismatch = $true
    }
}

if (-not $mismatch) {
    Write-Host "`nAll tables match. Migration verified." -ForegroundColor Green
} else {
    Write-Host "`nWARNING: Row count mismatches detected. Investigate before switching." -ForegroundColor Red
    exit 1
}

# Step 4: Verify Prisma migrations table
Write-Host "`n=== Step 4: Verifying _prisma_migrations ===" -ForegroundColor Cyan
$migrationCount = psql $AzureDbUrl -t -A -c "SELECT COUNT(*) FROM _prisma_migrations WHERE finished_at IS NOT NULL;"
Write-Host "Applied migrations on Azure: $migrationCount" -ForegroundColor Green

# Cleanup
Write-Host "`n=== Done ===" -ForegroundColor Green
Write-Host "Dump file retained: $dumpFile"
Write-Host "`nNext steps:"
Write-Host "  1. Update DATABASE_URL in .env to Azure"
Write-Host "  2. Update GitHub secret: gh secret set DATABASE_URL --body `"$AzureDbUrl`""
Write-Host "  3. Test app locally against Azure DB"
Write-Host "  4. Delete Neon project once confirmed"
