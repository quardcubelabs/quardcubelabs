$url = "https://quardcube.vercel.app/api/product-feed"

Write-Host "Testing product feed at: $url" -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $url -Method Get -TimeoutSec 15 -UseBasicParsing
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Content-Type: $($response.Headers['Content-Type'])" -ForegroundColor Green
    Write-Host "Content Length: $($response.Content.Length) bytes" -ForegroundColor Green
    
    $content = $response.Content
    
    # Check for product items
    $productMatches = [regex]::Matches($content, '<g:id>')
    $productCount = $productMatches.Count
    
    Write-Host "Products Found: $productCount" -ForegroundColor Green
    
    # Check for TZS currency
    if ($content -match 'TZS') {
        Write-Host "Currency: TZS ✓" -ForegroundColor Green
    } else {
        Write-Host "Currency: TZS NOT FOUND ✗" -ForegroundColor Red
    }
    
    # Check for XML structure
    if ($content -match '<?xml' -and $content -match '<rss') {
        Write-Host "XML Structure: Valid ✓" -ForegroundColor Green
    } else {
        Write-Host "XML Structure: Invalid ✗" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "First 500 characters:" -ForegroundColor Yellow
    Write-Host $content.Substring(0, [Math]::Min(500, $content.Length))
    
    Write-Host ""
    Write-Host "✅ Your feed is WORKING! Use this URL in Google Merchant Center:" -ForegroundColor Green
    Write-Host "   $url" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ FAILED!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    
    if ($_.Exception.Message -match "404") {
        Write-Host "The API route doesn't exist yet. Deployment may still be in progress." -ForegroundColor Yellow
        Write-Host "Wait 2-3 minutes and run this script again." -ForegroundColor Yellow
    } elseif ($_.Exception.Message -match "500") {
        Write-Host "Server error. Check Vercel logs for details." -ForegroundColor Yellow
        Write-Host "Possible causes:" -ForegroundColor Yellow
        Write-Host "  - Missing Supabase environment variables in Vercel" -ForegroundColor Yellow
        Write-Host "  - Database connection error" -ForegroundColor Yellow
    } else {
        Write-Host "Check if the site is deployed: https://vercel.com/dashboard" -ForegroundColor Yellow
    }
}
