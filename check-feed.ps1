$url = "https://quardcube.vercel.app/api/feeds/google-merchant"

Write-Host "Testing Google Merchant Feed..." -ForegroundColor Cyan
Write-Host "URL: $url" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $url -Method Get -TimeoutSec 15 -UseBasicParsing
    $content = $response.Content
    
    Write-Host "✅ Feed is accessible!" -ForegroundColor Green
    Write-Host ""
    
    # Count products
    $productCount = ([regex]::Matches($content, '<g:id>')).Count
    Write-Host "Products: $productCount" -ForegroundColor Cyan
    
    # Check for XML formatting issues
    $hasDoubleSlash = $content -match '//shop/'
    $hasUnescapedAmp = $content -match '&ssl=' -or $content -match '&fit=' -or $content -match '&w='
    
    Write-Host ""
    Write-Host "XML Validation:" -ForegroundColor Yellow
    Write-Host "  Double slashes (//): $(if($hasDoubleSlash){'❌ FOUND (ERROR)'}else{'✅ None'})" -ForegroundColor $(if($hasDoubleSlash){'Red'}else{'Green'})
    Write-Host "  Unescaped & chars: $(if($hasUnescapedAmp){'❌ FOUND (ERROR)'}else{'✅ None'})" -ForegroundColor $(if($hasUnescapedAmp){'Red'}else{'Green'})
    
    # Extract sample URLs
    Write-Host ""
    Write-Host "Sample URLs:" -ForegroundColor Yellow
    
    if ($content -match '<g:link>([^<]+)</g:link>') {
        Write-Host "  Product link: $($matches[1])" -ForegroundColor Gray
    }
    
    if ($content -match '<g:image_link>([^<]+)</g:image_link>') {
        Write-Host "  Image link: $($matches[1])" -ForegroundColor Gray
    }
    
    # Show first 1000 characters
    Write-Host ""
    Write-Host "Feed Preview (first 1000 chars):" -ForegroundColor Yellow
    Write-Host $content.Substring(0, [Math]::Min(1000, $content.Length)) -ForegroundColor Gray
    
    Write-Host ""
    if (-not $hasDoubleSlash -and -not $hasUnescapedAmp) {
        Write-Host "✅ XML IS VALID! No formatting errors detected." -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Go to Google Merchant Center" -ForegroundColor White
        Write-Host "2. Click 'Fetch now' to refresh the feed" -ForegroundColor White
        Write-Host "3. Wait 5-10 minutes for Google to process" -ForegroundColor White
    } else {
        Write-Host "❌ XML ERRORS STILL PRESENT" -ForegroundColor Red
        Write-Host "Deployment may not be complete. Wait 2-3 minutes." -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ ERROR:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
