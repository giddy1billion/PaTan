# Create Azure PostgreSQL Flexible Server in resource group g1b
# Run: powershell -ExecutionPolicy Bypass -File scripts/create-azure-pg.ps1

$rg = "g1b"
$serverName = "patan-db"
$dbName = "patan"
$location = "uksouth"
$adminUser = "patanadmin"
$adminPassword = -join ((48..57) + (65..90) + (97..122) + (33,35,37,38,42) | Get-Random -Count 24 | ForEach-Object { [char]$_ })

Write-Host "=== Checking for existing Postgres servers in $rg ===" -ForegroundColor Cyan
$existing = az postgres flexible-server list --resource-group $rg --query "[].name" -o tsv 2>$null

if ($existing) {
    Write-Host "Existing server(s) found: $existing" -ForegroundColor Yellow
    $serverName = $existing.Split("`n")[0].Trim()
    Write-Host "Using server: $serverName" -ForegroundColor Green
} else {
    Write-Host "No existing server. Creating $serverName..." -ForegroundColor Yellow
    az postgres flexible-server create `
        --resource-group $rg `
        --name $serverName `
        --location $location `
        --admin-user $adminUser `
        --admin-password $adminPassword `
        --sku-name Standard_B1ms `
        --tier Burstable `
        --storage-size 32 `
        --version 16 `
        --yes

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to create server." -ForegroundColor Red
        exit 1
    }
    Write-Host "Server created." -ForegroundColor Green
}

Write-Host "`n=== Creating database '$dbName' ===" -ForegroundColor Cyan
az postgres flexible-server db create `
    --resource-group $rg `
    --server-name $serverName `
    --database-name $dbName 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "Database may already exist, continuing..." -ForegroundColor Yellow
} else {
    Write-Host "Database '$dbName' created." -ForegroundColor Green
}

Write-Host "`n=== Adding firewall rule for Azure services ===" -ForegroundColor Cyan
az postgres flexible-server firewall-rule create `
    --resource-group $rg `
    --name $serverName `
    --rule-name AllowAzureServices `
    --start-ip-address 0.0.0.0 `
    --end-ip-address 0.0.0.0 2>$null

Write-Host "`n=== Getting server FQDN ===" -ForegroundColor Cyan
$fqdn = az postgres flexible-server show --resource-group $rg --name $serverName --query fullyQualifiedDomainName -o tsv

Write-Host "`n=== RESULTS ===" -ForegroundColor Green
Write-Host "Server:   $serverName"
Write-Host "FQDN:     $fqdn"
Write-Host "Admin:    $adminUser"
Write-Host "Password: $adminPassword"
Write-Host "Database: $dbName"
Write-Host "`nDATABASE_URL:" -ForegroundColor Green
$dbUrl = "postgresql://${adminUser}:${adminPassword}@${fqdn}:5432/${dbName}?sslmode=require"
Write-Host $dbUrl

Write-Host "`n=== Setting GitHub secret ===" -ForegroundColor Cyan
$setSecret = Read-Host "Push DATABASE_URL to GitHub secrets? (y/n)"
if ($setSecret -eq "y") {
    gh secret set DATABASE_URL --body $dbUrl
    Write-Host "DATABASE_URL secret set." -ForegroundColor Green
}
