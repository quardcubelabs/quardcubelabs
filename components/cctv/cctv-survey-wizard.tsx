"use client"

import { useState, useEffect } from "react"
import { 
  Building2, 
  User, 
  MapPin, 
  Mail, 
  Phone, 
  Plus, 
  Trash2, 
  Camera, 
  Video, 
  ShieldCheck, 
  Wifi, 
  Zap, 
  Server, 
  Monitor, 
  BatteryCharging, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  Sparkles,
  Search,
  Check,
  HardDrive
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"
import { CctvSiteSurvey, CctvSiteSurveyItem, CameraType } from "@/types/cctv"
import { getAuthUsers, type AuthUser } from "@/lib/auth-users-actions"
import { useToast } from "@/hooks/use-toast"

interface CctvSurveyWizardProps {
  initialSurvey?: CctvSiteSurvey | null
  onSave: (survey: Omit<CctvSiteSurvey, "id" | "survey_number" | "created_at" | "updated_at">, items: Array<Omit<CctvSiteSurveyItem, "id" | "survey_id" | "created_at" | "updated_at">>, convertToProject?: boolean) => Promise<void>
  onCancel: () => void
}

const COMMON_LOCATION_PRESETS = [
  { name: "Main Gate / Entry", area: "Entrance", type: "Bullet" as CameraType, res: "4MP (2K)", colorvu: true, cable: 45, dist: 25 },
  { name: "Reception / Lobby", area: "Lobby", type: "Turret" as CameraType, res: "4MP (2K)", colorvu: true, cable: 25, dist: 12 },
  { name: "Parking Area", area: "Parking", type: "Bullet" as CameraType, res: "4MP (2K)", colorvu: true, cable: 60, dist: 35 },
  { name: "Cashier / POS Counter", area: "Cash Counter", type: "Dome" as CameraType, res: "4MP (2K)", colorvu: false, cable: 20, dist: 5, audio: true },
  { name: "Main Warehouse / Storage", area: "Warehouse", type: "Turret" as CameraType, res: "4MP (2K)", colorvu: true, cable: 50, dist: 30 },
  { name: "Back Emergency Exit", area: "Perimeter", type: "Bullet" as CameraType, res: "4MP (2K)", colorvu: true, cable: 40, dist: 20 },
  { name: "Perimeter Fence - North", area: "Perimeter", type: "Bullet" as CameraType, res: "8MP (4K)", colorvu: true, cable: 80, dist: 40, analytics: true },
  { name: "Server Room / Rack", area: "Office", type: "Dome" as CameraType, res: "2MP (1080p)", colorvu: false, cable: 15, dist: 8, audio: true },
]

export default function CctvSurveyWizard({ initialSurvey, onSave, onCancel }: CctvSurveyWizardProps) {
  const { isDark } = useAdminTheme()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Auth Users for selection
  const [users, setUsers] = useState<AuthUser[]>([])
  const [userSearchTerm, setUserSearchTerm] = useState("")
  const [isSearchingUsers, setIsSearchingUsers] = useState(false)

  // Form states
  const [customerId, setCustomerId] = useState<string | null>(initialSurvey?.customer_id || null)
  const [customerName, setCustomerName] = useState(initialSurvey?.customer_name || "")
  const [customerEmail, setCustomerEmail] = useState(initialSurvey?.customer_email || "")
  const [customerPhone, setCustomerPhone] = useState(initialSurvey?.customer_phone || "")
  const [customerAddress, setCustomerAddress] = useState(initialSurvey?.customer_address || "")

  const [siteName, setSiteName] = useState(initialSurvey?.site_name || "")
  const [siteAddress, setSiteAddress] = useState(initialSurvey?.site_address || "")
  const [buildingType, setBuildingType] = useState(initialSurvey?.building_type || "Commercial")
  const [numberOfBuildings, setNumberOfBuildings] = useState(initialSurvey?.number_of_buildings || 1)
  const [numberOfFloors, setNumberOfFloors] = useState(initialSurvey?.number_of_floors || 1)
  const [environment, setEnvironment] = useState<'Indoor' | 'Outdoor' | 'Mixed'>(initialSurvey?.environment || "Mixed")

  // Infrastructure
  const [internetAvailable, setInternetAvailable] = useState(initialSurvey?.internet_available ?? true)
  const [internetSpeedMbps, setInternetSpeedMbps] = useState(initialSurvey?.internet_speed_mbps || 20)
  const [remoteViewingRequired, setRemoteViewingRequired] = useState(initialSurvey?.remote_viewing_required ?? true)
  const [existingCctv, setExistingCctv] = useState(initialSurvey?.existing_cctv ?? false)
  const [existingCctvDetails, setExistingCctvDetails] = useState(initialSurvey?.existing_cctv_details || "")
  const [existingNvrDvr, setExistingNvrDvr] = useState(initialSurvey?.existing_nvr_dvr ?? false)
  const [existingNetwork, setExistingNetwork] = useState(initialSurvey?.existing_network ?? true)
  const [powerAvailable, setPowerAvailable] = useState(initialSurvey?.power_available ?? true)
  const [upsRequired, setUpsRequired] = useState(initialSurvey?.ups_required ?? true)
  const [monitorRequired, setMonitorRequired] = useState(initialSurvey?.monitor_required ?? true)
  const [technicianName, setTechnicianName] = useState(initialSurvey?.technician_name || "QuardCube Field Lead")
  const [specialRequirements, setSpecialRequirements] = useState(initialSurvey?.special_requirements || "")
  const [notes, setNotes] = useState(initialSurvey?.notes || "")

  // Camera items list
  const [items, setItems] = useState<Array<Omit<CctvSiteSurveyItem, "id" | "survey_id" | "created_at" | "updated_at">>>(
    initialSurvey?.items?.map(i => ({
      location_name: i.location_name,
      area_type: i.area_type,
      indoor_outdoor: i.indoor_outdoor,
      camera_type: i.camera_type,
      required_resolution: i.required_resolution,
      lens_requirement: i.lens_requirement || "2.8mm (Wide 100°)",
      night_vision_required: i.night_vision_required ?? true,
      colorvu_required: i.colorvu_required ?? true,
      audio_required: i.audio_required ?? false,
      ptz_required: i.ptz_required ?? false,
      varifocal_required: i.varifocal_required ?? false,
      analytics_required: i.analytics_required ?? true,
      target_distance_meters: i.target_distance_meters || 15,
      coverage_notes: i.coverage_notes || "",
      estimated_cable_length_meters: i.estimated_cable_length_meters || 30,
      quantity: i.quantity || 1
    })) || [
      {
        location_name: "Main Entrance",
        area_type: "Entrance",
        indoor_outdoor: "Outdoor",
        camera_type: "Turret",
        required_resolution: "4MP (2K)",
        lens_requirement: "2.8mm (Wide 100°)",
        night_vision_required: true,
        colorvu_required: true,
        audio_required: false,
        ptz_required: false,
        varifocal_required: false,
        analytics_required: true,
        target_distance_meters: 15,
        coverage_notes: "Cover pedestrian and car arrivals",
        estimated_cable_length_meters: 35,
        quantity: 1
      },
      {
        location_name: "Reception Desk",
        area_type: "Lobby",
        indoor_outdoor: "Indoor",
        camera_type: "Turret",
        required_resolution: "4MP (2K)",
        lens_requirement: "2.8mm (Wide 100°)",
        night_vision_required: true,
        colorvu_required: true,
        audio_required: true,
        ptz_required: false,
        varifocal_required: false,
        analytics_required: false,
        target_distance_meters: 10,
        coverage_notes: "Cash collection & visitor check-in",
        estimated_cable_length_meters: 25,
        quantity: 1
      },
      {
        location_name: "Perimeter & Parking",
        area_type: "Perimeter",
        indoor_outdoor: "Outdoor",
        camera_type: "Bullet",
        required_resolution: "4MP (2K)",
        lens_requirement: "4mm (Standard 80°)",
        night_vision_required: true,
        colorvu_required: true,
        audio_required: false,
        ptz_required: false,
        varifocal_required: false,
        analytics_required: true,
        target_distance_meters: 25,
        coverage_notes: "Vehicle parking slots and boundary fence",
        estimated_cable_length_meters: 50,
        quantity: 1
      },
      {
        location_name: "Rear Warehouse / Store",
        area_type: "Warehouse",
        indoor_outdoor: "Indoor",
        camera_type: "Bullet",
        required_resolution: "4MP (2K)",
        lens_requirement: "2.8mm (Wide 100°)",
        night_vision_required: true,
        colorvu_required: true,
        audio_required: false,
        ptz_required: false,
        varifocal_required: false,
        analytics_required: true,
        target_distance_meters: 20,
        coverage_notes: "Stock racks and goods inward/outward",
        estimated_cable_length_meters: 40,
        quantity: 1
      }
    ]
  )

  useEffect(() => {
    getAuthUsers().then(res => {
      if (res.users) setUsers(res.users)
    }).catch(() => {})
  }, [])

  const handleSelectUser = (user: AuthUser) => {
    setCustomerId(user.id)
    setCustomerName(user.user_metadata?.full_name || user.email?.split("@")[0] || "Customer")
    setCustomerEmail(user.email || "")
    setCustomerPhone(user.phone || "")
    setIsSearchingUsers(false)
  }

  const handleAddPresetLocation = (preset: typeof COMMON_LOCATION_PRESETS[0]) => {
    setItems([
      ...items,
      {
        location_name: preset.name,
        area_type: preset.area,
        indoor_outdoor: preset.area === 'Lobby' || preset.area === 'Warehouse' || preset.area === 'Office' || preset.area === 'Cash Counter' ? 'Indoor' : 'Outdoor',
        camera_type: preset.type,
        required_resolution: preset.res,
        lens_requirement: "2.8mm (Wide 100°)",
        night_vision_required: true,
        colorvu_required: preset.colorvu,
        audio_required: preset.audio || false,
        ptz_required: false,
        varifocal_required: false,
        analytics_required: preset.analytics || false,
        target_distance_meters: preset.dist,
        coverage_notes: "",
        estimated_cable_length_meters: preset.cable,
        quantity: 1
      }
    ])
  }

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        location_name: `Camera Point #${items.length + 1}`,
        area_type: "Perimeter",
        indoor_outdoor: "Outdoor",
        camera_type: "Turret",
        required_resolution: "4MP (2K)",
        lens_requirement: "2.8mm (Wide 100°)",
        night_vision_required: true,
        colorvu_required: true,
        audio_required: false,
        ptz_required: false,
        varifocal_required: false,
        analytics_required: true,
        target_distance_meters: 15,
        coverage_notes: "",
        estimated_cable_length_meters: 30,
        quantity: 1
      }
    ])
  }

  const handleUpdateItem = (index: number, field: keyof CctvSiteSurveyItem, value: any) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
  }

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      toast({
        title: "Minimum 1 Camera Point Required",
        description: "A CCTV site survey must contain at least one camera location.",
        variant: "destructive"
      })
      return
    }
    setItems(items.filter((_, i) => i !== index))
  }

  const handleSubmit = async (convertToProject: boolean = false) => {
    if (!customerName || !customerEmail || !siteName || !siteAddress) {
      toast({
        title: "Missing Information",
        description: "Please fill in Customer Name, Customer Email, Site Name, and Site Address.",
        variant: "destructive"
      })
      return
    }

    if (items.length === 0) {
      toast({
        title: "No Cameras Added",
        description: "Please add at least one camera point.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      await onSave({
        customer_id: customerId,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        site_name: siteName,
        site_address: siteAddress,
        building_type: buildingType,
        number_of_buildings: Number(numberOfBuildings) || 1,
        number_of_floors: Number(numberOfFloors) || 1,
        environment,
        internet_available: internetAvailable,
        internet_speed_mbps: Number(internetSpeedMbps) || 20,
        remote_viewing_required: remoteViewingRequired,
        existing_cctv: existingCctv,
        existing_cctv_details: existingCctvDetails,
        existing_nvr_dvr: existingNvrDvr,
        existing_network: existingNetwork,
        power_available: powerAvailable,
        ups_required: upsRequired,
        monitor_required: monitorRequired,
        estimated_camera_count: items.reduce((s, i) => s + (Number(i.quantity) || 1), 0),
        special_requirements: specialRequirements,
        notes,
        technician_name: technicianName,
        status: convertToProject ? "completed" : (initialSurvey?.status || "completed"),
      }, items, convertToProject)

      toast({
        title: "Site Survey Saved Successfully",
        description: convertToProject ? "Survey saved and converted to CCTV Project." : "Site survey recorded.",
      })
    } catch (err: any) {
      toast({
        title: "Error Saving Survey",
        description: err.message || "Failed to save survey. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredUsers = users.filter(u => 
    (u.user_metadata?.full_name || "").toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    (u.phone || "").includes(userSearchTerm)
  )

  const totalCameras = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)
  const totalEstimatedCables = items.reduce((sum, item) => sum + ((Number(item.estimated_cable_length_meters) || 0) * (Number(item.quantity) || 1)), 0)

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Wizard Header */}
      <div className={cn(
        "p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4",
        isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200"
      )}>
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-teal text-navy font-black text-xs">Step {currentStep} of 4</Badge>
            <span className="text-xs text-muted-foreground font-mono">
              {initialSurvey ? `Editing Survey ${initialSurvey.survey_number}` : "New CCTV Site Survey"}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black mt-1 text-foreground">
            {currentStep === 1 && "1. Customer & Site Identification"}
            {currentStep === 2 && "2. Infrastructure, Power & Network"}
            {currentStep === 3 && "3. Camera Locations & Coverage Points"}
            {currentStep === 4 && "4. Review, Specifications & Submit"}
          </h2>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4].map(step => (
            <button
              key={step}
              onClick={() => setCurrentStep(step)}
              className={cn(
                "h-9 px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all",
                currentStep === step 
                  ? "bg-teal text-navy shadow-md shadow-teal/20"
                  : currentStep > step
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"
              )}
            >
              {currentStep > step ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : step}
              <span className="hidden sm:inline">
                {step === 1 && "Site"}
                {step === 2 && "Network"}
                {step === 3 && "Cameras"}
                {step === 4 && "Review"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* STEP 1: Customer & Site Details */}
      {currentStep === 1 && (
        <div className="space-y-6">
          {/* Customer Selection Card */}
          <Card className={cn(
            "border shadow-sm",
            isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
          )}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-black flex items-center gap-2">
                    <User className="h-4 w-4 text-teal" />
                    Customer Information
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Select an existing QuardCube customer or enter new client details
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSearchingUsers(!isSearchingUsers)}
                  className="text-xs font-semibold h-8"
                >
                  <Search className="h-3.5 w-3.5 mr-1" />
                  {isSearchingUsers ? "Close Search" : "Search Existing Customer"}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Existing user picker dropdown/drawer */}
              {isSearchingUsers && (
                <div className={cn(
                  "p-4 rounded-xl border space-y-3 mb-4 animate-in fade-in-50",
                  isDark ? "bg-slate-800/40 border-slate-700" : "bg-slate-50 border-slate-200"
                )}>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search customers by name, email, or phone..."
                      value={userSearchTerm}
                      onChange={e => setUserSearchTerm(e.target.value)}
                      className="pl-9 text-sm"
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {filteredUsers.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-3">No matching customers found</p>
                    ) : (
                      filteredUsers.slice(0, 8).map(u => (
                        <div
                          key={u.id}
                          onClick={() => handleSelectUser(u)}
                          className={cn(
                            "p-2.5 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all",
                            isDark ? "bg-slate-900/80 border-slate-800 hover:border-teal" : "bg-white border-slate-200 hover:border-teal hover:bg-teal/5"
                          )}
                        >
                          <div>
                            <span className="font-bold text-foreground">
                              {u.user_metadata?.full_name || u.email?.split("@")[0]}
                            </span>
                            <span className="text-muted-foreground ml-2">({u.email})</span>
                          </div>
                          <Badge variant="outline" className="text-[10px]">Select</Badge>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Client / Company Name *</Label>
                  <Input
                    placeholder="e.g. Serengeti Hotel & Suites Ltd"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="text-sm font-medium"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Client Email *</Label>
                  <Input
                    type="email"
                    placeholder="e.g. manager@serengetihotel.co.tz"
                    value={customerEmail}
                    onChange={e => setCustomerEmail(e.target.value)}
                    className="text-sm font-medium"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Contact Phone Number</Label>
                  <Input
                    placeholder="e.g. +255 754 123 456"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="text-sm font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Billing / Main Office Address</Label>
                  <Input
                    placeholder="e.g. Bagamoyo Road, Victoria, Dar es Salaam"
                    value={customerAddress}
                    onChange={e => setCustomerAddress(e.target.value)}
                    className="text-sm font-medium"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Site Location & Physical Profile */}
          <Card className={cn(
            "border shadow-sm",
            isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
          )}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <Building2 className="h-4 w-4 text-teal" />
                Physical Site Profile
              </CardTitle>
              <CardDescription className="text-xs">
                Premises characteristics, building count, and environmental classification
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Site / Branch Name *</Label>
                  <Input
                    placeholder="e.g. Kigamboni Logistics Warehouse"
                    value={siteName}
                    onChange={e => setSiteName(e.target.value)}
                    className="text-sm font-medium"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Physical Site Address / GPS *</Label>
                  <Input
                    placeholder="e.g. Plot 14, Industrial Area, Kigamboni, Dar es Salaam"
                    value={siteAddress}
                    onChange={e => setSiteAddress(e.target.value)}
                    className="text-sm font-medium"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Building Category</Label>
                  <Select value={buildingType} onValueChange={setBuildingType}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select building type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Commercial">Commercial (Office / Store / Plaza)</SelectItem>
                      <SelectItem value="Industrial">Industrial (Factory / Warehouse / Yard)</SelectItem>
                      <SelectItem value="Residential">Residential (Villa / Apartment)</SelectItem>
                      <SelectItem value="Hospitality">Hospitality (Hotel / Resort / Club)</SelectItem>
                      <SelectItem value="Educational">Educational (School / Campus)</SelectItem>
                      <SelectItem value="Fuel Station">Fuel Station / Depot</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Environment Type</Label>
                  <Select value={environment} onValueChange={(val: any) => setEnvironment(val)}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select environment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mixed">Mixed (Indoor & Outdoor)</SelectItem>
                      <SelectItem value="Outdoor">Predominantly Outdoor (Perimeter/Yard)</SelectItem>
                      <SelectItem value="Indoor">Indoor Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Number of Buildings</Label>
                  <Input
                    type="number"
                    min={1}
                    value={numberOfBuildings}
                    onChange={e => setNumberOfBuildings(parseInt(e.target.value) || 1)}
                    className="text-sm font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Number of Floors</Label>
                  <Input
                    type="number"
                    min={1}
                    value={numberOfFloors}
                    onChange={e => setNumberOfFloors(parseInt(e.target.value) || 1)}
                    className="text-sm font-medium"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* STEP 2: Infrastructure & Power */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <Card className={cn(
            "border shadow-sm",
            isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
          )}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <Wifi className="h-4 w-4 text-teal" />
                Network & Internet Readiness
              </CardTitle>
              <CardDescription className="text-xs">
                Inspect connectivity for mobile remote viewing, bandwidth, and existing network infrastructure
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-3.5 rounded-xl border">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold">Internet Connection Available</Label>
                    <p className="text-xs text-muted-foreground">Fiber, 4G Router or Starlink on site</p>
                  </div>
                  <Switch checked={internetAvailable} onCheckedChange={setInternetAvailable} />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold">Remote Mobile Viewing Required</Label>
                    <p className="text-xs text-muted-foreground">Hik-Connect / DMSS phone app</p>
                  </div>
                  <Switch checked={remoteViewingRequired} onCheckedChange={setRemoteViewingRequired} />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold">Existing LAN / Network Rack</Label>
                    <p className="text-xs text-muted-foreground">Patch panels, routers or PoE switches</p>
                  </div>
                  <Switch checked={existingNetwork} onCheckedChange={setExistingNetwork} />
                </div>

                {internetAvailable && (
                  <div className="space-y-1.5 p-3.5 rounded-xl border">
                    <Label className="text-xs font-bold">Estimated Internet Speed (Mbps)</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 20"
                      value={internetSpeedMbps || ""}
                      onChange={e => setInternetSpeedMbps(parseInt(e.target.value) || 0)}
                      className="text-sm"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className={cn(
            "border shadow-sm",
            isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
          )}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                Power Stability & Existing Equipment
              </CardTitle>
              <CardDescription className="text-xs">
                Assess UPS backup power, monitoring screens, and legacy CCTV replacement
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-3.5 rounded-xl border">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold">Reliable Mains Power on Site</Label>
                    <p className="text-xs text-muted-foreground">TANESCO power / Generator backup</p>
                  </div>
                  <Switch checked={powerAvailable} onCheckedChange={setPowerAvailable} />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold">Dedicated UPS Backup Required</Label>
                    <p className="text-xs text-muted-foreground">Keep cameras recording during power cut</p>
                  </div>
                  <Switch checked={upsRequired} onCheckedChange={setUpsRequired} />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold">Local TV / Monitor Required</Label>
                    <p className="text-xs text-muted-foreground">22" - 32" HDMI security monitor in guardhouse</p>
                  </div>
                  <Switch checked={monitorRequired} onCheckedChange={setMonitorRequired} />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold">Existing Legacy CCTV on Site</Label>
                    <p className="text-xs text-muted-foreground">Replacing or upgrading old cameras</p>
                  </div>
                  <Switch checked={existingCctv} onCheckedChange={setExistingCctv} />
                </div>
              </div>

              {existingCctv && (
                <div className="space-y-1.5 p-3.5 rounded-xl border bg-amber-500/5 border-amber-500/20">
                  <Label className="text-xs font-bold text-amber-500">Existing CCTV System Details</Label>
                  <Textarea
                    placeholder="e.g. 4 old analog cameras, faulty power supply, co-axial cabling might be reused or replaced..."
                    value={existingCctvDetails}
                    onChange={e => setExistingCctvDetails(e.target.value)}
                    className="text-xs"
                    rows={2}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* STEP 3: Camera Locations & Coverage Points */}
      {currentStep === 3 && (
        <div className="space-y-6">
          {/* Quick Preset Buttons Bar */}
          <div className={cn(
            "p-4 rounded-xl border space-y-2.5",
            isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
          )}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-teal" />
                Quick Location Presets (1-Click Add)
              </span>
              <span className="text-xs font-bold text-teal">{items.length} Points Configured</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {COMMON_LOCATION_PRESETS.map((preset, idx) => (
                <Button
                  key={idx}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddPresetLocation(preset)}
                  className="text-xs h-7 font-bold border-teal/30 hover:bg-teal/10 hover:text-teal"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Camera Items Table / Cards */}
          <div className="space-y-4">
            {items.map((item, index) => (
              <Card key={index} className={cn(
                "border shadow-sm transition-all relative overflow-hidden",
                isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
              )}>
                <div className="absolute top-0 left-0 w-1.5 h-full bg-teal" />

                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-teal text-navy font-black text-xs">
                        Point #{index + 1}
                      </Badge>
                      <Input
                        value={item.location_name}
                        onChange={e => handleUpdateItem(index, "location_name", e.target.value)}
                        placeholder="Location Name"
                        className="h-8 font-bold text-sm w-48 sm:w-64"
                      />
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-500/10 h-8 px-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-2 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold">Camera Housing</Label>
                      <Select
                        value={item.camera_type}
                        onValueChange={(val: any) => handleUpdateItem(index, "camera_type", val)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Turret">Turret (Eyeball - Anti-Spider)</SelectItem>
                          <SelectItem value="Bullet">Bullet (Outdoor Long-Range)</SelectItem>
                          <SelectItem value="Dome">Dome (Vandal-Proof IK10)</SelectItem>
                          <SelectItem value="PTZ">PTZ (Pan-Tilt-Zoom)</SelectItem>
                          <SelectItem value="Varifocal">Varifocal Zoom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold">Resolution</Label>
                      <Select
                        value={item.required_resolution}
                        onValueChange={val => handleUpdateItem(index, "required_resolution", val)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2MP (1080p)">2MP Full HD (1080p)</SelectItem>
                          <SelectItem value="4MP (2K)">4MP Ultra HD (2K)</SelectItem>
                          <SelectItem value="5MP">5MP High Resolution</SelectItem>
                          <SelectItem value="8MP (4K)">8MP 4K Ultra HD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold">Lens Angle</Label>
                      <Select
                        value={item.lens_requirement || "2.8mm (Wide 100°)"}
                        onValueChange={val => handleUpdateItem(index, "lens_requirement", val)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2.8mm (Wide 100°)">2.8mm (Wide 100° Angle)</SelectItem>
                          <SelectItem value="4mm (Standard 80°)">4mm (Standard 80° View)</SelectItem>
                          <SelectItem value="6mm (Narrow 50°)">6mm (Narrow Long Corridor)</SelectItem>
                          <SelectItem value="Varifocal 2.8-12mm">Varifocal 2.8-12mm</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold">Placement</Label>
                      <Select
                        value={item.indoor_outdoor}
                        onValueChange={(val: any) => handleUpdateItem(index, "indoor_outdoor", val)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Outdoor">Outdoor Weatherproof</SelectItem>
                          <SelectItem value="Indoor">Indoor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Feature Toggles */}
                  <div className="flex flex-wrap items-center gap-4 pt-1">
                    <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.colorvu_required}
                        onChange={e => handleUpdateItem(index, "colorvu_required", e.target.checked)}
                        className="rounded text-teal focus:ring-teal"
                      />
                      <span>ColorVu 24/7 Color</span>
                    </label>

                    <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.audio_required}
                        onChange={e => handleUpdateItem(index, "audio_required", e.target.checked)}
                        className="rounded text-teal focus:ring-teal"
                      />
                      <span>Built-in Mic Audio</span>
                    </label>

                    <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.analytics_required}
                        onChange={e => handleUpdateItem(index, "analytics_required", e.target.checked)}
                        className="rounded text-teal focus:ring-teal"
                      />
                      <span>AI AcuSense Human/Vehicle</span>
                    </label>

                    <div className="flex items-center gap-2 ml-auto">
                      <Label className="text-[11px] font-bold text-muted-foreground">Cable Est (m):</Label>
                      <Input
                        type="number"
                        min={5}
                        max={150}
                        value={item.estimated_cable_length_meters || 30}
                        onChange={e => handleUpdateItem(index, "estimated_cable_length_meters", parseFloat(e.target.value) || 30)}
                        className="h-7 w-20 text-xs font-bold"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={handleAddItem}
              className="w-full py-5 border-dashed border-teal/40 text-teal hover:bg-teal/10 font-bold text-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              + Add Another Camera Location
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: Review, Specifications & Submit */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className={cn(
              "border shadow-sm p-4",
              isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
            )}>
              <div className="text-xs text-muted-foreground uppercase font-bold">Total Cameras</div>
              <div className="text-3xl font-black text-teal mt-1">{totalCameras} Points</div>
              <p className="text-xs text-muted-foreground mt-1">
                {items.filter(i => i.indoor_outdoor === 'Outdoor').length} Outdoor / {items.filter(i => i.indoor_outdoor === 'Indoor').length} Indoor
              </p>
            </Card>

            <Card className={cn(
              "border shadow-sm p-4",
              isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
            )}>
              <div className="text-xs text-muted-foreground uppercase font-bold">Cabling Estimate</div>
              <div className="text-3xl font-black text-blue-500 mt-1">{totalEstimatedCables} Meters</div>
              <p className="text-xs text-muted-foreground mt-1">
                Approx {Math.ceil((totalEstimatedCables * 1.1) / 305)} × 305m CAT6 boxes
              </p>
            </Card>

            <Card className={cn(
              "border shadow-sm p-4",
              isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
            )}>
              <div className="text-xs text-muted-foreground uppercase font-bold">Recommended NVR</div>
              <div className="text-2xl font-black text-purple-500 mt-1">
                {totalCameras <= 4 ? "4-Channel 4K NVR" : totalCameras <= 8 ? "8-Channel 4K NVR" : totalCameras <= 16 ? "16-Channel 4K NVR" : "32-Channel Enterprise NVR"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Integrated PoE & AcuSense AI
              </p>
            </Card>
          </div>

          <Card className={cn(
            "border shadow-sm",
            isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
          )}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-black">Technician Notes & Special Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Field Technician Name</Label>
                  <Input
                    value={technicianName}
                    onChange={e => setTechnicianName(e.target.value)}
                    placeholder="Technician name"
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Special Client Requirements</Label>
                  <Input
                    value={specialRequirements}
                    onChange={e => setSpecialRequirements(e.target.value)}
                    placeholder="e.g. License plate reading at gate, 60 days video retention"
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Survey Summary / Site Inspection Notes</Label>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Conduit routing conditions, high ceiling access requirements, wall thickness..."
                  className="text-xs"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Wizard Footer Navigation */}
      <div className={cn(
        "p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg",
        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      )}>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="font-bold text-xs flex-1 sm:flex-initial"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="text-xs text-muted-foreground flex-1 sm:flex-initial"
          >
            Cancel
          </Button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {currentStep < 4 ? (
            <Button
              type="button"
              onClick={() => {
                if (currentStep === 1 && (!customerName || !customerEmail || !siteName || !siteAddress)) {
                  toast({
                    title: "Required Fields Missing",
                    description: "Please fill in Customer Name, Email, Site Name and Site Address to proceed.",
                    variant: "destructive"
                  })
                  return
                }
                setCurrentStep(currentStep + 1)
              }}
              className="bg-teal hover:bg-teal-400 text-navy font-black text-xs px-6 py-5 rounded-xl shadow-md flex items-center gap-1.5 w-full sm:w-auto"
            >
              <span>Next Step</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
                variant="outline"
                className="font-bold text-xs py-5 px-5 rounded-xl border-teal/40 hover:bg-teal/10 w-full sm:w-auto"
              >
                <Save className="h-4 w-4 mr-1.5 text-teal" />
                <span>Save Site Survey</span>
              </Button>

              <Button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting}
                className="bg-teal hover:bg-teal-400 text-navy font-black text-xs py-5 px-6 rounded-xl shadow-lg shadow-teal/25 border border-teal-300 w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                <span>Save & Convert to CCTV Project</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
