# PowerShell script to regenerate Google Merchant product feed
# Run this after updating products in your database

Write-Host "🚀 Regenerating Google Merchant Product Feed..." -ForegroundColor Cyan
Write-Host ""

# Run the Node.js script
node scripts/generate-product-feed.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Feed regenerated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Commit and push the changes to Git"
    Write-Host "2. Deploy to Vercel (or wait for auto-deploy)"
    Write-Host "3. Google will automatically fetch the updated feed"
    Write-Host ""
    Write-Host "🌐 Your product feed URL:" -ForegroundColor Cyan
    Write-Host "   https://quardcube.vercel.app/products.xml"
} else {
    Write-Host ""
    Write-Host "❌ Failed to generate feed. Check the error above." -ForegroundColor Red
    exit 1
}
