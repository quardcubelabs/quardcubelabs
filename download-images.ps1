$imageUrls = @{
    # ERP System Images
    "erp-system.jpg" = "https://images.unsplash.com/photo-1551288049-bebda4e38f71"
    "erp-system-1.jpg" = "https://images.unsplash.com/photo-1552664730-d307ca884978"
    "erp-system-2.jpg" = "https://images.unsplash.com/photo-1522071820081-009f0129c71c"
    "erp-system-3.jpg" = "https://images.unsplash.com/photo-1460925895917-afdab827c52f"
    
    # E-commerce Images
    "ecommerce-redesign.jpg" = "https://images.unsplash.com/photo-1661956602116-aa6865609028"
    "ecommerce-1.jpg" = "https://images.unsplash.com/photo-1661956602116-aa6865609028"
    "ecommerce-2.jpg" = "https://images.unsplash.com/photo-1661956602116-aa6865609028"
    "ecommerce-3.jpg" = "https://images.unsplash.com/photo-1661956602116-aa6865609028"
    
    # Banking Security Images
    "banking-security.jpg" = "https://images.unsplash.com/photo-1550751827-4bd374c3f58b"
    "banking-1.jpg" = "https://images.unsplash.com/photo-1550751827-4bd374c3f58b"
    "banking-2.jpg" = "https://images.unsplash.com/photo-1550751827-4bd374c3f58b"
    "banking-3.jpg" = "https://images.unsplash.com/photo-1550751827-4bd374c3f58b"
    
    # Smart Grid Images
    "smart-grid.jpg" = "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e"
    "smart-grid-1.jpg" = "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e"
    "smart-grid-2.jpg" = "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e"
    "smart-grid-3.jpg" = "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e"
    
    # Network Infrastructure Images
    "network-infrastructure.jpg" = "https://images.unsplash.com/photo-1558494949-ef010cbdcc31"
    "network-1.jpg" = "https://images.unsplash.com/photo-1558494949-ef010cbdcc31"
    "network-2.jpg" = "https://images.unsplash.com/photo-1558494949-ef010cbdcc31"
    "network-3.jpg" = "https://images.unsplash.com/photo-1558494949-ef010cbdcc31"
    
    # Healthcare IT Images
    "healthcare-it.jpg" = "https://images.unsplash.com/photo-1576091160550-2173dba999ef"
    "healthcare-1.jpg" = "https://images.unsplash.com/photo-1576091160550-2173dba999ef"
    "healthcare-2.jpg" = "https://images.unsplash.com/photo-1576091160550-2173dba999ef"
    "healthcare-3.jpg" = "https://images.unsplash.com/photo-1576091160550-2173dba999ef"
}

$outputDir = "public/images/projects"

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