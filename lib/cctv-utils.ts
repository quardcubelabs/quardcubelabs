// Pure CCTV calculation utilities & package templates (usable in both Client and Server)

import { 
  StorageCalculationParams, 
  StorageCalculationResult, 
  CableCalculationParams, 
  CableCalculationResult, 
  QuickCctvPackage 
} from "@/types/cctv"

export function calculateStorage(params: StorageCalculationParams): StorageCalculationResult {
  const {
    cameraCount,
    resolution,
    fps = 25,
    codec = 'H.265+',
    recordingHoursPerDay = 24,
    retentionDays = 30,
    motionActivityPercentage = 100,
    safetyMarginPercentage = 15
  } = params

  // Base bitrates (Mbps) at 25fps for H.264
  let baseBitrateMbps = 4.0
  if (resolution.includes('2MP') || resolution.includes('1080p')) baseBitrateMbps = 2.5
  else if (resolution.includes('4MP') || resolution.includes('2K')) baseBitrateMbps = 4.5
  else if (resolution.includes('5MP')) baseBitrateMbps = 6.0
  else if (resolution.includes('8MP') || resolution.includes('4K')) baseBitrateMbps = 9.0

  // Adjust for FPS
  const fpsFactor = fps / 25
  let adjustedBitrate = baseBitrateMbps * fpsFactor

  // Codec compression efficiency multiplier
  let codecMultiplier = 1.0
  if (codec === 'H.265+') codecMultiplier = 0.35
  else if (codec === 'H.265') codecMultiplier = 0.50
  else if (codec === 'H.264+') codecMultiplier = 0.70
  else if (codec === 'H.264') codecMultiplier = 1.0

  const effectiveBitrateMbps = Math.max(0.5, adjustedBitrate * codecMultiplier)

  // Storage Formula: GB per camera per day = (Bitrate Mbps * 3600s * Hours * Motion%) / (8 * 1024)
  const motionFactor = Math.min(1.0, Math.max(0.1, motionActivityPercentage / 100))
  const dailyStorageGbPerCamera = (effectiveBitrateMbps * 3600 * recordingHoursPerDay * motionFactor) / 8192
  const totalDailyStorageGb = dailyStorageGbPerCamera * cameraCount
  const rawStorageRequiredGb = totalDailyStorageGb * retentionDays
  const storageWithMarginGb = rawStorageRequiredGb * (1 + safetyMarginPercentage / 100)
  const rawStorageTb = storageWithMarginGb / 1024

  let recommendedStorageTb = 2
  let hddConfig = { hddSizeTb: 2, quantity: 1, description: "1 × 2TB Western Digital Purple Surveillance HDD" }

  if (rawStorageTb <= 2) {
    recommendedStorageTb = 2
    hddConfig = { hddSizeTb: 2, quantity: 1, description: "1 × 2TB Western Digital Purple Surveillance HDD" }
  } else if (rawStorageTb <= 4) {
    recommendedStorageTb = 4
    hddConfig = { hddSizeTb: 4, quantity: 1, description: "1 × 4TB Western Digital Purple Surveillance HDD" }
  } else if (rawStorageTb <= 6) {
    recommendedStorageTb = 6
    hddConfig = { hddSizeTb: 6, quantity: 1, description: "1 × 6TB Western Digital Purple Surveillance HDD" }
  } else if (rawStorageTb <= 8) {
    recommendedStorageTb = 8
    hddConfig = { hddSizeTb: 8, quantity: 1, description: "1 × 8TB Western Digital Purple Surveillance HDD" }
  } else if (rawStorageTb <= 16) {
    recommendedStorageTb = 16
    hddConfig = { hddSizeTb: 8, quantity: 2, description: "2 × 8TB Western Digital Purple Surveillance HDDs (16TB Total)" }
  } else {
    const needed8TbHdds = Math.ceil(rawStorageTb / 8)
    recommendedStorageTb = needed8TbHdds * 8
    hddConfig = { hddSizeTb: 8, quantity: needed8TbHdds, description: `${needed8TbHdds} × 8TB Western Digital Purple Surveillance HDDs (${recommendedStorageTb}TB Total)` }
  }

  return {
    bitratePerCameraMbps: Number(effectiveBitrateMbps.toFixed(2)),
    dailyStorageGbPerCamera: Number(dailyStorageGbPerCamera.toFixed(2)),
    totalDailyStorageGb: Number(totalDailyStorageGb.toFixed(2)),
    rawStorageRequiredGb: Number(rawStorageRequiredGb.toFixed(1)),
    storageWithMarginGb: Number(storageWithMarginGb.toFixed(1)),
    recommendedStorageTb,
    recommendedHddConfiguration: hddConfig
  }
}

export function calculateCabling(params: CableCalculationParams): CableCalculationResult {
  const {
    cameraRuns,
    wastagePercentage = 10,
    spareSlackMetersPerRun = 3,
    boxLengthMeters = 305
  } = params

  const totalMeasured = cameraRuns.reduce((sum, run) => sum + (Number(run.distanceMeters) || 0), 0)
  const totalSlack = cameraRuns.length * spareSlackMetersPerRun
  const subtotal = totalMeasured + totalSlack
  const wastage = subtotal * (wastagePercentage / 100)
  const finalRequired = Math.ceil(subtotal + wastage)

  const boxesRequired = Math.max(1, Math.ceil(finalRequired / boxLengthMeters))
  const leftoverMeters = (boxesRequired * boxLengthMeters) - finalRequired

  return {
    totalMeasuredLengthMeters: totalMeasured,
    totalSlackLengthMeters: totalSlack,
    totalWastageMeters: Number(wastage.toFixed(1)),
    finalRequiredLengthMeters: finalRequired,
    boxesRequired,
    boxLengthMeters,
    leftoverMeters
  }
}

export function getRecommendedNvr(cameraCount: number, systemType: 'IP/NVR' | 'Analog/XVR' = 'IP/NVR', poeNeeded: boolean = true): {
  channels: number
  modelSuggestion: string
  details: string
} {
  let channels = 4
  if (cameraCount <= 4) channels = 4
  else if (cameraCount <= 8) channels = 8
  else if (cameraCount <= 16) channels = 16
  else if (cameraCount <= 32) channels = 32
  else channels = 64

  if (systemType === 'Analog/XVR') {
    return {
      channels,
      modelSuggestion: `Hikvision iDS-72${channels < 10 ? '0' + channels : channels}HQHI-M Series AcuSense XVR (${channels}-Channel)`,
      details: `${channels}-channel hybrid digital video recorder supporting TVI/AHD/CVI/CVBS and additional IP camera channels with H.265 Pro+ compression.`
    }
  }

  const poeSuffix = poeNeeded ? `${channels}P (Built-in PoE)` : `Non-PoE (Requires external PoE Switch)`
  return {
    channels,
    modelSuggestion: `Hikvision DS-76${channels < 10 ? '0' + channels : channels}NXI-I2/${channels}P AcuSense 4K NVR (${channels}-Channel PoE)`,
    details: `${channels}-channel 4K Ultra-HD Network Video Recorder with integrated ${poeSuffix}, smart AcuSense human/vehicle detection analytics, and dual HDD bays.`
  }
}

export function getQuickPackages(): QuickCctvPackage[] {
  return [
    {
      id: "pkg-home-4",
      name: "Home Guard 4-Camera System",
      code: "QC-PKG-HOME4",
      targetSegment: "Residential & Small Shops",
      cameraCount: 4,
      badgeText: "Most Popular Home",
      description: "Complete 4-channel 4MP ColorVu 24/7 color night-vision security system with mobile live-view and 2-week recording.",
      estimatedPriceTzs: 1650000,
      items: [
        { name: "Hikvision 4MP ColorVu Fixed Turret IP Camera", category: "Cameras", quantity: 4, unitCost: 145000, defaultMarkup: 20, unitPrice: 174000, type: "product", description: "24/7 full-color imaging, 30m warm light, built-in mic, IP67 weatherproof" },
        { name: "Hikvision 4-Channel 4K AcuSense PoE NVR", category: "Recording", quantity: 1, unitCost: 280000, defaultMarkup: 20, unitPrice: 336000, type: "product", description: "Plug & Play PoE, AI human/vehicle motion alerts, mobile remote app" },
        { name: "Western Digital Purple 2TB Surveillance HDD", category: "Storage", quantity: 1, unitCost: 175000, defaultMarkup: 15, unitPrice: 201250, type: "product", description: "24/7 AllFrame surveillance drive with 3-year warranty" },
        { name: "D-Link CAT6 Pure Copper Network Cable (305m Box)", category: "Cabling", quantity: 1, unitCost: 160000, defaultMarkup: 25, unitPrice: 200000, type: "product", description: "High-speed 1000Mbps pure copper cable" },
        { name: "CCTV Installation & Commissioning (4 Points)", category: "Services", quantity: 4, unitCost: 35000, defaultMarkup: 0, unitPrice: 45000, type: "service", description: "Cabling, camera mounting, connector termination, NVR setup & mobile pairing" },
        { name: "CCTV Accessories Pack (RJ45, Junction Boxes, Trunking)", category: "Accessories", quantity: 1, unitCost: 65000, defaultMarkup: 30, unitPrice: 84500, type: "product", description: "Waterproof IP66 junction boxes, RJ45 shielded plugs & clips" }
      ]
    },
    {
      id: "pkg-business-8",
      name: "Business Pro 8-Camera Solution",
      code: "QC-PKG-BIZ8",
      targetSegment: "Offices, Retail Stores, Restaurants & Warehouses",
      cameraCount: 8,
      badgeText: "Best Seller Business",
      description: "8-channel 4MP AcuSense system with smart perimeter protection, audio recording, 30-day storage, and high-performance PoE switch.",
      estimatedPriceTzs: 3250000,
      items: [
        { name: "Hikvision 4MP AcuSense ColorVu Bullet IP Camera", category: "Cameras", quantity: 8, unitCost: 160000, defaultMarkup: 20, unitPrice: 192000, type: "product", description: "4MP UHD, Smart AI false-alarm filter, ColorVu 24/7, IP67 Outdoor rated" },
        { name: "Hikvision 8-Channel 4K AcuSense PoE NVR", category: "Recording", quantity: 1, unitCost: 420000, defaultMarkup: 20, unitPrice: 504000, type: "product", description: "8-Port PoE, 80Mbps bandwidth, 4K HDMI local output, dual HDD bay" },
        { name: "Western Digital Purple 4TB Surveillance HDD", category: "Storage", quantity: 1, unitCost: 290000, defaultMarkup: 15, unitPrice: 333500, type: "product", description: "Engineered specifically for 24/7 high-definition security systems" },
        { name: "D-Link CAT6 Pure Copper Network Cable (305m Box)", category: "Cabling", quantity: 2, unitCost: 160000, defaultMarkup: 25, unitPrice: 200000, type: "product", description: "Pure solid copper 23AWG CAT6 Ethernet cable" },
        { name: "QuardCube Professional CCTV Commissioning (8 Points)", category: "Services", quantity: 8, unitCost: 35000, defaultMarkup: 0, unitPrice: 45000, type: "service", description: "Full routing, testing, NVR programming, mobile alert tuning" },
        { name: "Heavy-Duty Junction Boxes & Mounting Enclosures", category: "Accessories", quantity: 8, unitCost: 12000, defaultMarkup: 30, unitPrice: 15600, type: "product", description: "Weather-sealed camera back-boxes for clean and protected wiring" },
        { name: "APC 650VA Line-Interactive UPS for NVR & Router Backup", category: "Networking", quantity: 1, unitCost: 180000, defaultMarkup: 20, unitPrice: 216000, type: "product", description: "Protects NVR from power outages and voltage spikes" }
      ]
    },
    {
      id: "pkg-commercial-16",
      name: "Commercial Enterprise 16-Camera Matrix",
      code: "QC-PKG-COMM16",
      targetSegment: "Factories, Schools, Supermarkets & Fuel Stations",
      cameraCount: 16,
      badgeText: "Enterprise Grade",
      description: "Heavy-duty 16-camera 4K ecosystem with dedicated 16-Port Gigabit PoE switch, 8TB storage, wall rack cabinet, and centralized workstation display.",
      estimatedPriceTzs: 6850000,
      items: [
        { name: "Hikvision 4MP AcuSense Fixed Turret IP Camera", category: "Cameras", quantity: 12, unitCost: 155000, defaultMarkup: 20, unitPrice: 186000, type: "product", description: "AI human/vehicle classification, built-in mic, darkfighter low light" },
        { name: "Hikvision 8MP 4K ColorVu Outdoor Bullet Camera", category: "Cameras", quantity: 4, unitCost: 260000, defaultMarkup: 20, unitPrice: 312000, type: "product", description: "8MP Ultra HD wide perimeter coverage with 40m ColorVu illumination" },
        { name: "Hikvision 16-Channel 4K 16-PoE Enterprise NVR", category: "Recording", quantity: 1, unitCost: 780000, defaultMarkup: 20, unitPrice: 936000, type: "product", description: "160Mbps incoming bandwidth, 2x SATA bays up to 20TB, AI facial/vehicle indexing" },
        { name: "Western Digital Purple 8TB Surveillance HDD", category: "Storage", quantity: 1, unitCost: 560000, defaultMarkup: 15, unitPrice: 644000, type: "product", description: "8TB enterprise 256MB cache surveillance storage" },
        { name: "D-Link CAT6 Pure Copper Network Cable (305m Box)", category: "Cabling", quantity: 4, unitCost: 160000, defaultMarkup: 25, unitPrice: 200000, type: "product", description: "CAT6 UTP solid cable 305m drums" },
        { name: "Totem 6U Wall Mount Network Cabinet / Rack", category: "Accessories", quantity: 1, unitCost: 210000, defaultMarkup: 25, unitPrice: 262500, type: "product", description: "Toughened glass door, lockable rack for NVR, patch panel & UPS" },
        { name: "APC 1000VA Smart-UPS with AVR", category: "Networking", quantity: 1, unitCost: 380000, defaultMarkup: 20, unitPrice: 456000, type: "product", description: "Reliable battery backup and surge suppression" },
        { name: "Commercial Installation, Testing & Handover (16 Points)", category: "Services", quantity: 16, unitCost: 40000, defaultMarkup: 0, unitPrice: 50000, type: "service", description: "Full commercial cabling in PVC conduits, labeling, NVR calibration & staff training" }
      ]
    }
  ]
}
