$imageUrls = @{
    # Security Products
    "enterprise-security-suite.jpg" = "https://images.unsplash.com/photo-1550751827-4bd374c3f58b"
    "network-security-appliance.jpg" = "https://images.unsplash.com/photo-1550751827-4bd374c3f58b"
    "endpoint-protection.jpg" = "https://images.unsplash.com/photo-1550751827-4bd374c3f58b"
    "security-analytics.jpg" = "https://images.unsplash.com/photo-1550751827-4bd374c3f58b"
    "threat-intelligence.jpg" = "https://images.unsplash.com/photo-1550751827-4bd374c3f58b"
    "secure-access-gateway.jpg" = "https://images.unsplash.com/photo-1550751827-4bd374c3f58b"

    # Power Solutions
    "smart-power-manager.jpg" = "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e"
    "data-center-cooling.jpg" = "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e"
    "ups-system.jpg" = "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e"
    "power-distribution.jpg" = "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e"
    "energy-monitoring.jpg" = "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e"
    "backup-power.jpg" = "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e"

    # Connectivity & Networking
    "network-pro-router.jpg" = "https://images.unsplash.com/photo-1558494949-ef010cbdcc31"
    "wireless-access-point.jpg" = "https://images.unsplash.com/photo-1558494949-ef010cbdcc31"
    "network-switch.jpg" = "https://images.unsplash.com/photo-1558494949-ef010cbdcc31"
    "sd-wan-controller.jpg" = "https://images.unsplash.com/photo-1558494949-ef010cbdcc31"
    "network-monitoring.jpg" = "https://images.unsplash.com/photo-1558494949-ef010cbdcc31"
    "vpn-gateway.jpg" = "https://images.unsplash.com/photo-1558494949-ef010cbdcc31"

    # IT Products & Services
    "cloud-backup.jpg" = "https://images.unsplash.com/photo-1576091160550-2173dba999ef"
    "smart-office-kit.jpg" = "https://images.unsplash.com/photo-1576091160550-2173dba999ef"
    "managed-it-service.jpg" = "https://images.unsplash.com/photo-1576091160550-2173dba999ef"
    "it-consulting.jpg" = "https://images.unsplash.com/photo-1576091160550-2173dba999ef"
    "disaster-recovery.jpg" = "https://images.unsplash.com/photo-1576091160550-2173dba999ef"
    "it-infrastructure.jpg" = "https://images.unsplash.com/photo-1576091160550-2173dba999ef"

    # Software Development
    "business-analytics.jpg" = "https://images.unsplash.com/photo-1551288049-bebda4e38f71"
    "erp-system.jpg" = "https://images.unsplash.com/photo-1551288049-bebda4e38f71"
    "crm-platform.jpg" = "https://images.unsplash.com/photo-1551288049-bebda4e38f71"
    "mobile-app.jpg" = "https://images.unsplash.com/photo-1551288049-bebda4e38f71"
    "web-application.jpg" = "https://images.unsplash.com/photo-1551288049-bebda4e38f71"
    "custom-software.jpg" = "https://images.unsplash.com/photo-1551288049-bebda4e38f71"

    # Web Designing
    "ecommerce-platform.jpg" = "https://images.unsplash.com/photo-1661956602116-aa6865609028"
    "corporate-website.jpg" = "https://images.unsplash.com/photo-1661956602116-aa6865609028"
    "landing-page.jpg" = "https://images.unsplash.com/photo-1661956602116-aa6865609028"
    "web-redesign.jpg" = "https://images.unsplash.com/photo-1661956602116-aa6865609028"
    "ui-design.jpg" = "https://images.unsplash.com/photo-1661956602116-aa6865609028"
    "responsive-design.jpg" = "https://images.unsplash.com/photo-1661956602116-aa6865609028"
}

$outputDir = "public/products"

# Create directory if it doesn't exist
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force
}

# Download each image
foreach ($image in $imageUrls.GetEnumerator()) {
    $outputPath = Join-Path $outputDir $image.Key
    Write-Host "Downloading $($image.Key)..."
    try {
        Invoke-WebRequest -Uri $image.Value -OutFile $outputPath
        Write-Host "Downloaded $($image.Key)"
    } catch {
        Write-Host "Failed to download $($image.Key): $_"
    }
} 