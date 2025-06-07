$imageUrl = "https://images.unsplash.com/photo-1600880292203-757bb62b4baf"
$outputPath = "public/Quardcubelabs_01.png"

# Create directory if it doesn't exist
$directory = Split-Path $outputPath
if (-not (Test-Path $directory)) {
    New-Item -ItemType Directory -Path $directory -Force
}

# Download the image
Write-Host "Downloading team image..."
try {
    Invoke-WebRequest -Uri $imageUrl -OutFile $outputPath
    Write-Host "Image downloaded successfully to $outputPath"
} catch {
    Write-Host "Failed to download image: $_"
} 