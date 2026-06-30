# Get Azure secrets for GitHub Actions workflow
# Run this in PowerShell after: az login

Write-Host "=== Step 1: Confirming Azure session ===" -ForegroundColor Cyan
az account show --output table

$subscriptionId = az account show --query id -o tsv
$tenantId = az account show --query tenantId -o tsv

Write-Host "`nSubscription: $subscriptionId" -ForegroundColor Green
Write-Host "Tenant: $tenantId" -ForegroundColor Green

# --- ACR_PASSWORD ---
Write-Host "`n=== Step 2: Getting ACR_PASSWORD for registry 'honeyhive' ===" -ForegroundColor Cyan

$adminEnabled = az acr show -n honeyhive --query adminUserEnabled -o tsv 2>$null
if ($adminEnabled -ne "true") {
    Write-Host "Enabling admin user on ACR..." -ForegroundColor Yellow
    az acr update -n honeyhive --admin-enabled true --output none
}

$acrPassword = az acr credential show -n honeyhive --query "passwords[0].value" -o tsv

Write-Host "`nACR_PASSWORD:" -ForegroundColor Green
Write-Host $acrPassword

# --- AZURE_CREDENTIALS ---
Write-Host "`n=== Step 3: Creating Service Principal for AZURE_CREDENTIALS ===" -ForegroundColor Cyan
Write-Host "Scope: /subscriptions/$subscriptionId/resourceGroups/g1b" -ForegroundColor Gray

$spJson = az ad sp create-for-rbac `
    --name "github-actions-honeyhive" `
    --role contributor `
    --scopes "/subscriptions/$subscriptionId/resourceGroups/g1b" `
    --sdk-auth

Write-Host "`nAZURE_CREDENTIALS (full JSON):" -ForegroundColor Green
Write-Host $spJson

# --- Summary ---
Write-Host "`n=== Step 4: Summary ===" -ForegroundColor Cyan
Write-Host "Set these as GitHub repo secrets:" -ForegroundColor Yellow
Write-Host "  ACR_PASSWORD   = $acrPassword"
Write-Host "  AZURE_CREDENTIALS = (the JSON block above)"

# --- Optional: set via gh CLI ---
Write-Host "`n=== Optional: Push to GitHub secrets via gh CLI ===" -ForegroundColor Cyan
$setSecrets = Read-Host "Push secrets to GitHub now? (y/n)"
if ($setSecrets -eq "y") {
    gh secret set ACR_PASSWORD --body $acrPassword
    gh secret set AZURE_CREDENTIALS --body $spJson
    Write-Host "Secrets pushed to GitHub." -ForegroundColor Green
}
