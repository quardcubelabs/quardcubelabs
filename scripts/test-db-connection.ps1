# PowerShell script to test database connection
# Run with: .\scripts\test-db-connection.ps1

Write-Host "🔍 Testing database connection..." -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "❌ .env.local file not found!" -ForegroundColor Red
    Write-Host "Please create .env.local with your database credentials" -ForegroundColor Yellow
    exit 1
}

# Check if required environment variables are set
$envContent = Get-Content ".env.local" -Raw
if ($envContent -notmatch "POSTGRES_URL") {
    Write-Host "❌ POSTGRES_URL not found in .env.local!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Environment file found" -ForegroundColor Green

# Run the Node.js test script
try {
    node scripts/test-db-connection.js
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -eq 0) {
        Write-Host ""
        Write-Host "🎉 Database test completed successfully!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Database test failed!" -ForegroundColor Red
        Write-Host "Please check the error messages above." -ForegroundColor Yellow
    }
    
    exit $exitCode
} catch {
    Write-Host "❌ Failed to run database test:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
