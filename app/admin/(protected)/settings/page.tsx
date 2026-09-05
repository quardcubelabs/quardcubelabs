"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { type SystemSettings, getSystemSettings, saveSystemSettings } from "@/lib/system-settings-actions"
import { changeAdminPassword, changeAdminEmail, verifyAdminSession } from "@/lib/admin-auth"
import { useAdminTheme, AdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"
import AdminLoading from "@/components/admin/admin-loading"
import { 
  Settings, Save, Database, Mail, Bell, Shield, Globe, Palette, 
  CreditCard, FileText, Activity, Key, Clock, HardDrive,
  Eye, EyeOff, Download, RefreshCw, AlertTriangle, CheckCircle, Sun, Moon, Sparkles, Server, Lock, AtSign, Check
} from "lucide-react"

export default function AdminSettingsPage() {
  const { theme, setTheme, isDark } = useAdminTheme()
  const [activeTab, setActiveTab] = useState("general")
  const [isBackupDialogOpen, setIsBackupDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const { toast } = useToast()

  // Admin account credentials management
  const [currentAdminEmail, setCurrentAdminEmail] = useState<string>("admin@quardcubelabs.com")
  const [newAdminEmail, setNewAdminEmail] = useState("")
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState("")
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false)

  const [currentPasswordForPass, setCurrentPasswordForPass] = useState("")
  const [newAdminPassword, setNewAdminPassword] = useState("")
  const [confirmAdminPassword, setConfirmAdminPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  useEffect(() => {
    async function loadAdminUser() {
      try {
        const { user } = await verifyAdminSession()
        if (user?.email) {
          setCurrentAdminEmail(user.email)
        }
      } catch (err) {
        console.error("Error loading admin user:", err)
      }
    }
    loadAdminUser()
  }, [])

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAdminEmail || !currentPasswordForEmail) {
      toast({
        title: "Missing Fields",
        description: "Please enter your new email address and current password.",
        variant: "destructive",
      })
      return
    }

    setIsUpdatingEmail(true)
    try {
      const res = await changeAdminEmail(newAdminEmail, currentPasswordForEmail)
      if (res.success) {
        toast({
          title: "Admin Email Updated",
          description: `Your admin login email has been updated to ${newAdminEmail}.`,
        })
        setCurrentAdminEmail(newAdminEmail)
        setNewAdminEmail("")
        setCurrentPasswordForEmail("")
      } else {
        toast({
          title: "Email Update Failed",
          description: res.error || "Could not update email.",
          variant: "destructive",
        })
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingEmail(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPasswordForPass || !newAdminPassword || !confirmAdminPassword) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all password fields.",
        variant: "destructive",
      })
      return
    }

    if (newAdminPassword !== confirmAdminPassword) {
      toast({
        title: "Passwords Do Not Match",
        description: "Your new password and confirmation password must match.",
        variant: "destructive",
      })
      return
    }

    if (newAdminPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "New password must be at least 6 characters long.",
        variant: "destructive",
      })
      return
    }

    setIsUpdatingPassword(true)
    try {
      const res = await changeAdminPassword(currentPasswordForPass, newAdminPassword)
      if (res.success) {
        toast({
          title: "Password Changed",
          description: "Your admin password has been successfully updated.",
        })
        setCurrentPasswordForPass("")
        setNewAdminPassword("")
        setConfirmAdminPassword("")
      } else {
        toast({
          title: "Password Change Failed",
          description: res.error || "Could not update password.",
          variant: "destructive",
        })
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const defaultSettings: SystemSettings = {
    general: {
      siteName: "QuardCube Labs",
      siteDescription: "Premium technology solutions and innovative services for modern businesses",
      contactEmail: "info@quardcubelabs.com",
      supportEmail: "support@quardcubelabs.com",
      timezone: "Africa/Dar_es_Salaam",
      language: "en",
      currency: "TZS"
    },
    appearance: {
      theme: "dark",
      primaryColor: "#000080",
      logoUrl: "/turquoise.png",
      faviconUrl: "/favicon.ico",
      customCSS: ""
    },
    notifications: {
      orderNotifications: true,
      lowStockAlerts: true,
      userRegistration: false,
      paymentAlerts: true,
      systemUpdates: true,
      emailDigest: false
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: true,
      timeoutDuration: 30,
      maxLoginAttempts: 5,
      passwordMinLength: 8,
      requireStrongPassword: true
    },
    payment: {
      stripeEnabled: true,
      paypalEnabled: true,
      vodacomEnabled: true,
      testMode: false,
      currency: "TZS",
      taxRate: 0.18
    },
    email: {
      provider: "smtp",
      smtpHost: "smtp.gmail.com",
      smtpPort: 587,
      smtpUser: "noreply@quardcubelabs.com",
      smtpSecure: true,
      fromName: "QuardCube Labs",
      fromEmail: "noreply@quardcubelabs.com"
    }
  }

  const [settings, setSettings] = useState<SystemSettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)

  // Load settings from DB on mount
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true)
      try {
        const { settings: loadedSettings, error } = await getSystemSettings()
        
        if (loadedSettings) {
          const mergedSettings: SystemSettings = {
            general: { ...defaultSettings.general, ...loadedSettings.general },
            appearance: { 
              ...defaultSettings.appearance, 
              ...loadedSettings.appearance,
              logoUrl: (!loadedSettings.appearance?.logoUrl || loadedSettings.appearance.logoUrl === "/logo.svg") 
                ? "/turquoise.png" 
                : loadedSettings.appearance.logoUrl
            },
            notifications: { ...defaultSettings.notifications, ...loadedSettings.notifications },
            security: { ...defaultSettings.security, ...loadedSettings.security },
            payment: { ...defaultSettings.payment, ...loadedSettings.payment },
            email: { ...defaultSettings.email, ...loadedSettings.email }
          }
          setSettings(mergedSettings)
          
          // Sync appearance theme if present
          if (mergedSettings.appearance.theme === "dark" || mergedSettings.appearance.theme === "light") {
            setTheme(mergedSettings.appearance.theme as AdminTheme)
          }
        } else if (error) {
          console.error("Settings load warning:", error)
          setSettings(defaultSettings)
        } else {
          setSettings(defaultSettings)
        }
      } catch (error) {
        console.error("Failed to load settings:", error)
        setSettings(defaultSettings)
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [])

  const handleSaveSettings = async (section: keyof SystemSettings) => {
    setIsSaving(true)
    try {
      const { success, error } = await saveSystemSettings(settings)
      if (success) {
        setLastSaved(new Date().toLocaleTimeString())
        toast({
          title: "Settings Saved Successfully",
          description: `${section.charAt(0).toUpperCase() + section.slice(1)} configurations are now live.`,
        })
      } else {
        toast({
          title: "Save Notice",
          description: error || "Saved locally in session.",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleThemeChange = (newTheme: AdminTheme) => {
    setTheme(newTheme)
    updateSettings("appearance", "theme", newTheme)
  }

  const handleBackupDatabase = async () => {
    try {
      const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `quardcube-settings-backup-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast({
        title: "Backup Complete",
        description: "System settings exported successfully.",
      })
      setIsBackupDialogOpen(false)
    } catch (error) {
      toast({
        title: "Backup Failed",
        description: "Could not generate backup file.",
        variant: "destructive",
      })
    }
  }

  const updateSettings = (section: keyof SystemSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black">System Settings</h1>
        <AdminLoading message="Loading system settings..." size="lg" />
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Page Header Card in Teal with website theme */}
      <div className={cn(
        "p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-0 shadow-md transition-all duration-300",
        isDark ? "bg-[#0a1033] border-none text-white shadow-none" : "bg-teal text-navy"
      )}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shadow-xs border", isDark ? "bg-navy text-teal border-teal/30" : "bg-navy text-white border-navy/20")}>
                <Settings className={cn("h-5 w-5", isDark ? "text-teal" : "text-white")} />
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black">
                System <span className="text-white drop-shadow-sm">Settings</span>
              </h1>
            </div>
            <p className={cn("text-sm sm:text-base font-semibold mt-1", isDark ? "text-teal-300" : "text-navy/90")}>
              Global preferences, theme customization, localization, security & integrations
            </p>
            {lastSaved && (
              <p className={cn("text-xs font-bold mt-1.5 flex items-center gap-1", isDark ? "text-teal-300" : "text-navy")}>
                <CheckCircle className="h-3.5 w-3.5" />
                Last saved at: {lastSaved}
              </p>
            )}
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Dialog open={isBackupDialogOpen} onOpenChange={setIsBackupDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-white text-navy border-2 border-navy/20 hover:bg-navy hover:text-white font-bold rounded-xl h-10 px-4 shadow-sm flex-1 sm:flex-none transition-colors"
                >
                  <HardDrive className="h-4 w-4 mr-2" />
                  <span>Backup JSON</span>
                </Button>
              </DialogTrigger>
              <DialogContent className={cn(
                "rounded-3xl border-2 p-6 max-w-md shadow-2xl",
                isDark ? "bg-[#0a1033] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
              )}>
                <DialogHeader>
                  <DialogTitle className="text-xl font-black">Export System Backup</DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm font-medium">
                    Download a secure JSON copy of your global settings and configurations.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-3 space-y-3">
                  <div className={cn("flex items-center gap-3 p-3.5 rounded-2xl border", isDark ? "bg-[#080d2a] border-teal/20" : "bg-teal-50 border-navy/10")}>
                    <Database className="h-5 w-5 text-teal shrink-0" />
                    <div>
                      <div className="font-bold text-sm">Full Configuration Export</div>
                      <div className="text-xs opacity-75">Includes appearance, security, notifications and payment keys</div>
                    </div>
                  </div>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
                  <Button variant="outline" onClick={() => setIsBackupDialogOpen(false)} className="rounded-xl font-bold h-10">
                    Cancel
                  </Button>
                  <Button onClick={handleBackupDatabase} className="bg-teal text-navy hover:bg-teal-400 font-black rounded-xl h-10 shadow-md">
                    <Download className="mr-2 h-4 w-4" />
                    Download Backup
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Tabs List */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className={cn(
          "grid grid-cols-3 sm:grid-cols-6 w-full h-auto p-1.5 rounded-2xl shadow-sm gap-1",
          isDark ? "bg-[#060a22] border-none text-slate-300 shadow-none" : "border-2 bg-white border-navy/20 text-navy"
        )}>
          <TabsTrigger value="general" className="data-[state=active]:bg-navy data-[state=active]:text-white font-black text-xs sm:text-sm py-2 rounded-xl transition-all">
            General
          </TabsTrigger>
          <TabsTrigger value="appearance" className="data-[state=active]:bg-navy data-[state=active]:text-white font-black text-xs sm:text-sm py-2 rounded-xl transition-all">
            Appearance
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-navy data-[state=active]:text-white font-black text-xs sm:text-sm py-2 rounded-xl transition-all">
            Alerts
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-navy data-[state=active]:text-white font-black text-xs sm:text-sm py-2 rounded-xl transition-all">
            Security
          </TabsTrigger>
          <TabsTrigger value="payment" className="data-[state=active]:bg-navy data-[state=active]:text-white font-black text-xs sm:text-sm py-2 rounded-xl transition-all">
            Payment
          </TabsTrigger>
          <TabsTrigger value="system" className="data-[state=active]:bg-navy data-[state=active]:text-white font-black text-xs sm:text-sm py-2 rounded-xl transition-all">
            System
          </TabsTrigger>
        </TabsList>

        {/* 1. General Settings */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Site Information */}
            <Card className={cn(
              "rounded-2xl sm:rounded-3xl shadow-lg transition-all",
              isDark ? "bg-[#060a22] border-none text-white shadow-none" : "border-2 bg-white border-navy/20 text-navy"
            )}>
              <CardHeader className="border-b border-navy/10 dark:border-teal/20 pb-4">
                <CardTitle className="text-base sm:text-lg font-black flex items-center gap-2.5">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shadow-xs border", isDark ? "bg-navy text-teal border-teal/30" : "bg-navy text-white border-navy/20")}>
                    <Globe className={cn("h-4 w-4", isDark ? "text-teal" : "text-white")} />
                  </div>
                  Site Information
                </CardTitle>
                <CardDescription className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/70")}>
                  Basic website identity and administrative contact details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="siteName" className="text-xs font-bold uppercase tracking-wider">Site Name</Label>
                  <Input
                    id="siteName"
                    value={settings.general.siteName}
                    onChange={(e) => updateSettings('general', 'siteName', e.target.value)}
                    placeholder="QuardCube Labs"
                    className={cn("h-11 rounded-xl border-2 font-medium", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="siteDescription" className="text-xs font-bold uppercase tracking-wider">Site Description</Label>
                  <Textarea
                    id="siteDescription"
                    value={settings.general.siteDescription}
                    onChange={(e) => updateSettings('general', 'siteDescription', e.target.value)}
                    placeholder="Brief description of your digital agency"
                    rows={3}
                    className={cn("rounded-xl border-2 font-medium", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="contactEmail" className="text-xs font-bold uppercase tracking-wider">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={settings.general.contactEmail}
                      onChange={(e) => updateSettings('general', 'contactEmail', e.target.value)}
                      className={cn("h-11 rounded-xl border-2 font-medium", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="supportEmail" className="text-xs font-bold uppercase tracking-wider">Support Email</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={settings.general.supportEmail}
                      onChange={(e) => updateSettings('general', 'supportEmail', e.target.value)}
                      className={cn("h-11 rounded-xl border-2 font-medium", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                    />
                  </div>
                </div>
                <Button 
                  className="w-full bg-teal text-navy font-black hover:bg-teal-400 rounded-xl shadow-md h-11 transition-all mt-2" 
                  onClick={() => handleSaveSettings('general')}
                  disabled={isSaving}
                >
                  {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save General Settings
                </Button>
              </CardContent>
            </Card>

            {/* Localization & Currency */}
            <Card className={cn(
              "rounded-2xl sm:rounded-3xl shadow-lg transition-all",
              isDark ? "bg-[#060a22] border-none text-white shadow-none" : "border-2 bg-white border-navy/20 text-navy"
            )}>
              <CardHeader className="border-b border-navy/10 dark:border-teal/20 pb-4">
                <CardTitle className="text-base sm:text-lg font-black flex items-center gap-2.5">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shadow-xs border", isDark ? "bg-navy text-teal border-teal/30" : "bg-navy text-white border-navy/20")}>
                    <Clock className={cn("h-4 w-4", isDark ? "text-teal" : "text-white")} />
                  </div>
                  Localization & Currency
                </CardTitle>
                <CardDescription className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/70")}>
                  Regional timezones, system language, and default monetary currency
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="currency" className="text-xs font-bold uppercase tracking-wider text-teal dark:text-teal-300">
                    Default Currency (Tanzanian Shillings Included)
                  </Label>
                  <Select value={settings.general.currency} onValueChange={(value) => updateSettings('general', 'currency', value)}>
                    <SelectTrigger className={cn("h-11 rounded-xl border-2 font-bold", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TZS" className="font-bold text-teal">TZS - Tanzanian Shilling (TSh)</SelectItem>
                      <SelectItem value="USD">USD - US Dollar ($)</SelectItem>
                      <SelectItem value="EUR">EUR - Euro (€)</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound (£)</SelectItem>
                      <SelectItem value="KES">KES - Kenyan Shilling (KSh)</SelectItem>
                      <SelectItem value="UGX">UGX - Ugandan Shilling (USh)</SelectItem>
                      <SelectItem value="ZAR">ZAR - South African Rand (R)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="timezone" className="text-xs font-bold uppercase tracking-wider">Timezone</Label>
                  <Select value={settings.general.timezone} onValueChange={(value) => updateSettings('general', 'timezone', value)}>
                    <SelectTrigger className={cn("h-11 rounded-xl border-2 font-medium", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Africa/Dar_es_Salaam">Africa/Dar_es_Salaam (EAT - UTC+3)</SelectItem>
                      <SelectItem value="Africa/Nairobi">Africa/Nairobi (EAT - UTC+3)</SelectItem>
                      <SelectItem value="UTC">UTC (Universal Coordinated Time)</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                      <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="language" className="text-xs font-bold uppercase tracking-wider">Language</Label>
                  <Select value={settings.general.language} onValueChange={(value) => updateSettings('general', 'language', value)}>
                    <SelectTrigger className={cn("h-11 rounded-xl border-2 font-medium", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="sw">Swahili (Kiswahili)</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className={cn("p-4 rounded-2xl border flex items-center gap-3", isDark ? "bg-[#080d2a] border-teal/20 text-slate-200" : "bg-teal-50/70 border-navy/10 text-navy")}>
                  <Sparkles className="h-5 w-5 text-teal shrink-0" />
                  <p className="text-xs font-semibold leading-relaxed">
                    Selected default currency is currently <strong className="text-navy dark:text-white font-black">{settings.general.currency}</strong>. It will be used across Invoices, Quotations, and Store products.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 2. Appearance Settings (Full Theme Switching with Persistence) */}
        <TabsContent value="appearance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className={cn(
              "rounded-2xl sm:rounded-3xl shadow-lg transition-all",
              isDark ? "bg-[#060a22] border-none text-white shadow-none" : "border-2 bg-white border-navy/20 text-navy"
            )}>
              <CardHeader className="border-b border-navy/10 dark:border-teal/20 pb-4">
                <CardTitle className="text-base sm:text-lg font-black flex items-center gap-2.5">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shadow-xs border", isDark ? "bg-navy text-teal border-teal/30" : "bg-navy text-white border-navy/20")}>
                    <Palette className={cn("h-4 w-4", isDark ? "text-teal" : "text-white")} />
                  </div>
                  Theme & Branding
                </CardTitle>
                <CardDescription className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/70")}>
                  Select your active dashboard theme. Changes persist permanently across sessions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-4">
                {/* Theme Selector Dropdown */}
                <div className="space-y-1.5">
                  <Label htmlFor="themeSelect" className="text-xs font-bold uppercase tracking-wider">Active Color Theme</Label>
                  <Select value={theme} onValueChange={(value) => handleThemeChange(value as AdminTheme)}>
                    <SelectTrigger id="themeSelect" className={cn("h-11 rounded-xl border-2 font-bold", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
                      <SelectValue placeholder="Select Color Theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark" className="font-bold">
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4 text-teal" />
                          <span>Dark Mode (Deep Navy & Cyber Teal)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="light" className="font-bold">
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4 text-amber-500" />
                          <span>Light Mode (Clean Teal & Navy)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="logoUrl" className="text-xs font-bold uppercase tracking-wider">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    value={settings.appearance.logoUrl}
                    onChange={(e) => updateSettings('appearance', 'logoUrl', e.target.value)}
                    placeholder="/turquoise.png"
                    className={cn("h-11 rounded-xl border-2 font-medium", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="customCSS" className="text-xs font-bold uppercase tracking-wider">Custom CSS Rules</Label>
                  <Textarea
                    id="customCSS"
                    value={settings.appearance.customCSS}
                    onChange={(e) => updateSettings('appearance', 'customCSS', e.target.value)}
                    placeholder="/* Custom CSS overrides */"
                    rows={3}
                    className={cn("rounded-xl border-2 font-medium font-mono text-xs", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                  />
                </div>

                <Button 
                  className="w-full bg-teal text-navy font-black hover:bg-teal-400 rounded-xl shadow-md h-11 transition-all"
                  onClick={() => handleSaveSettings('appearance')}
                  disabled={isSaving}
                >
                  {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Appearance Settings
                </Button>
              </CardContent>
            </Card>

            {/* Live Theme Preview Card */}
            <Card className={cn(
              "rounded-2xl sm:rounded-3xl shadow-lg transition-all",
              isDark ? "bg-[#060a22] border-none text-white shadow-none" : "border-2 bg-white border-navy/20 text-navy"
            )}>
              <CardHeader className="border-b border-navy/10 dark:border-teal/20 pb-4">
                <CardTitle className="text-base sm:text-lg font-black flex items-center gap-2">
                  <Eye className="h-4 w-4 text-teal" />
                  Live Theme Preview
                </CardTitle>
                <CardDescription className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/70")}>
                  Real-time visual display of the active theme tokens
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className={cn(
                  "border-2 rounded-2xl p-5 space-y-4 shadow-md",
                  isDark ? "bg-[#0a1033] border-teal/30 text-white" : "bg-slate-50 border-navy/20 text-navy"
                )}>
                  <div className="flex items-center gap-3.5">
                    <img 
                      src="/turquoise.png" 
                      alt="Logo" 
                      className="w-16 h-16 object-contain shrink-0 drop-shadow-sm"
                    />
                    <div>
                      <div className="font-black text-lg sm:text-xl tracking-tight">{settings.general.siteName}</div>
                      <div className="text-xs sm:text-sm opacity-75 font-medium">Admin Operations Panel</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="p-3 rounded-xl bg-navy text-white text-center">
                      <div className="text-xs uppercase font-bold tracking-wider">Primary Navy</div>
                      <div className="text-sm font-black mt-0.5">#000080</div>
                    </div>
                    <div className="p-3 rounded-xl bg-teal text-navy text-center">
                      <div className="text-xs uppercase font-bold tracking-wider">Vibrant Teal</div>
                      <div className="text-sm font-black mt-0.5">#40E0D0</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-navy/10 dark:border-teal/20">
                    <span>Persistent Theme Mode</span>
                    <Badge className={cn("text-xs font-black uppercase", isDark ? "bg-teal text-navy" : "bg-navy text-white")}>
                      {theme}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 3. Alerts & Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className={cn(
            "rounded-2xl sm:rounded-3xl shadow-lg transition-all",
            isDark ? "bg-[#060a22] border-none text-white shadow-none" : "border-2 bg-white border-navy/20 text-navy"
          )}>
            <CardHeader className="border-b border-navy/10 dark:border-teal/20 pb-4">
              <CardTitle className="text-base sm:text-lg font-black flex items-center gap-2.5">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shadow-xs border", isDark ? "bg-navy text-teal border-teal/30" : "bg-navy text-white border-navy/20")}>
                  <Bell className={cn("h-4 w-4", isDark ? "text-teal" : "text-white")} />
                </div>
                Notification & Alert Preferences
              </CardTitle>
              <CardDescription className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/70")}>
                Control which events trigger automated notifications and email dispatches
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(settings.notifications).map(([key, value]) => (
                  <div 
                    key={key} 
                    className={cn(
                      "flex items-center justify-between p-4 rounded-2xl border-2 transition-all",
                      isDark ? "bg-[#080d2a] border-teal/20" : "bg-slate-50 border-navy/10"
                    )}
                  >
                    <div className="space-y-0.5 pr-4">
                      <Label className="capitalize font-bold text-sm">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </Label>
                      <p className={cn("text-xs font-medium", isDark ? "text-slate-400" : "text-navy/70")}>
                        {key === 'orderNotifications' && 'Alert upon customer order checkout'}
                        {key === 'lowStockAlerts' && 'Notify when product inventory is low'}
                        {key === 'userRegistration' && 'Notice when a new user signs up'}
                        {key === 'paymentAlerts' && 'Real-time transaction settlement updates'}
                        {key === 'systemUpdates' && 'Critical software & database alerts'}
                        {key === 'emailDigest' && 'Daily summary digest report to admin'}
                      </p>
                    </div>
                    <Switch 
                      checked={value}
                      onCheckedChange={(checked) => updateSettings('notifications', key, checked)}
                    />
                  </div>
                ))}
              </div>
              <Button 
                className="w-full bg-teal text-navy font-black hover:bg-teal-400 rounded-xl shadow-md h-11 transition-all"
                onClick={() => handleSaveSettings('notifications')}
                disabled={isSaving}
              >
                {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Notification Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className={cn(
              "rounded-2xl sm:rounded-3xl shadow-lg transition-all",
              isDark ? "bg-[#060a22] border-none text-white shadow-none" : "border-2 bg-white border-navy/20 text-navy"
            )}>
              <CardHeader className="border-b border-navy/10 dark:border-teal/20 pb-4">
                <CardTitle className="text-base sm:text-lg font-black flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center shadow-xs border border-navy/20">
                    <Shield className="h-4 w-4 text-white" />
                  </div>
                  Authentication & Access
                </CardTitle>
                <CardDescription className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/70")}>
                  Manage administrative authentication safeguards and session timers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className={cn("flex items-center justify-between p-3.5 rounded-2xl border", isDark ? "bg-[#080d2a] border-teal/20" : "bg-slate-50 border-navy/10")}>
                  <div className="space-y-0.5">
                    <Label className="font-bold text-sm">Two-Factor Authentication (2FA)</Label>
                    <p className="text-xs opacity-75">Require secondary OTP verification code</p>
                  </div>
                  <Switch 
                    checked={settings.security.twoFactorAuth}
                    onCheckedChange={(checked) => updateSettings('security', 'twoFactorAuth', checked)}
                  />
                </div>

                <div className={cn("flex items-center justify-between p-3.5 rounded-2xl border", isDark ? "bg-[#080d2a] border-teal/20" : "bg-slate-50 border-navy/10")}>
                  <div className="space-y-0.5">
                    <Label className="font-bold text-sm">Session Timeout</Label>
                    <p className="text-xs opacity-75">Auto logout inactive administrator sessions</p>
                  </div>
                  <Switch 
                    checked={settings.security.sessionTimeout}
                    onCheckedChange={(checked) => updateSettings('security', 'sessionTimeout', checked)}
                  />
                </div>

                {settings.security.sessionTimeout && (
                  <div className="space-y-1.5 pt-1">
                    <Label htmlFor="timeoutDuration" className="text-xs font-bold uppercase tracking-wider">Timeout Duration (Minutes)</Label>
                    <Input
                      id="timeoutDuration"
                      type="number"
                      value={settings.security.timeoutDuration}
                      onChange={(e) => updateSettings('security', 'timeoutDuration', parseInt(e.target.value) || 30)}
                      min="5"
                      max="480"
                      className={cn("h-11 rounded-xl border-2 font-medium", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                    />
                  </div>
                )}

                <Button 
                  className="w-full bg-teal text-navy font-black hover:bg-teal-400 rounded-xl shadow-md h-11 transition-all mt-2"
                  onClick={() => handleSaveSettings('security')}
                  disabled={isSaving}
                >
                  {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Security Settings
                </Button>
              </CardContent>
            </Card>

            <Card className={cn(
              "rounded-2xl sm:rounded-3xl shadow-lg transition-all",
              isDark ? "bg-[#060a22] border-none text-white shadow-none" : "border-2 bg-white border-navy/20 text-navy"
            )}>
              <CardHeader className="border-b border-navy/10 dark:border-teal/20 pb-4">
                <CardTitle className="text-base sm:text-lg font-black flex items-center gap-2.5">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shadow-xs border", isDark ? "bg-navy text-teal border-teal/30" : "bg-navy text-white border-navy/20")}>
                    <Key className={cn("h-4 w-4", isDark ? "text-teal" : "text-white")} />
                  </div>
                  Password Policy & Locks
                </CardTitle>
                <CardDescription className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/70")}>
                  Enforce strict credential complexity requirements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="passwordMinLength" className="text-xs font-bold uppercase tracking-wider">Minimum Password Length</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    value={settings.security.passwordMinLength}
                    onChange={(e) => updateSettings('security', 'passwordMinLength', parseInt(e.target.value) || 8)}
                    min="6"
                    max="24"
                    className={cn("h-11 rounded-xl border-2 font-medium", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="maxLoginAttempts" className="text-xs font-bold uppercase tracking-wider">Max Failed Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) => updateSettings('security', 'maxLoginAttempts', parseInt(e.target.value) || 5)}
                    min="3"
                    max="10"
                    className={cn("h-11 rounded-xl border-2 font-medium", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                  />
                </div>

                <div className={cn("flex items-center justify-between p-3.5 rounded-2xl border", isDark ? "bg-[#080d2a] border-teal/20" : "bg-slate-50 border-navy/10")}>
                  <div className="space-y-0.5">
                    <Label className="font-bold text-sm">Require Strong Passwords</Label>
                    <p className="text-xs opacity-75">Must contain symbols, numbers & uppercase letters</p>
                  </div>
                  <Switch 
                    checked={settings.security.requireStrongPassword}
                    onCheckedChange={(checked) => updateSettings('security', 'requireStrongPassword', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Change Admin Password Card */}
            <Card className={cn(
              "rounded-2xl sm:rounded-3xl shadow-lg transition-all",
              isDark ? "bg-[#060a22] border-none text-white shadow-none" : "border-2 bg-white border-navy/20 text-navy"
            )}>
              <CardHeader className="border-b border-navy/10 dark:border-teal/20 pb-4">
                <CardTitle className="text-base sm:text-lg font-black flex items-center gap-2.5">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shadow-xs border", isDark ? "bg-navy text-teal border-teal/30" : "bg-navy text-white border-navy/20")}>
                    <Lock className={cn("h-4 w-4", isDark ? "text-teal" : "text-white")} />
                  </div>
                  Change Admin Password
                </CardTitle>
                <CardDescription className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/70")}>
                  Update the password used to access the administrator panel
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="currentAdminPass" className="text-xs font-bold uppercase tracking-wider">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentAdminPass"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPasswordForPass}
                        onChange={(e) => setCurrentPasswordForPass(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        className={cn("h-11 rounded-xl border-2 font-medium pr-10", isDark ? "bg-[#080d2a] border-teal/30 text-white placeholder:text-slate-500" : "bg-white border-navy/20 text-navy placeholder:text-navy/40")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="newAdminPass" className="text-xs font-bold uppercase tracking-wider">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newAdminPass"
                        type={showNewPassword ? "text" : "password"}
                        value={newAdminPassword}
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        required
                        className={cn("h-11 rounded-xl border-2 font-medium pr-10", isDark ? "bg-[#080d2a] border-teal/30 text-white placeholder:text-slate-500" : "bg-white border-navy/20 text-navy placeholder:text-navy/40")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirmAdminPass" className="text-xs font-bold uppercase tracking-wider">Confirm New Password</Label>
                    <Input
                      id="confirmAdminPass"
                      type="password"
                      value={confirmAdminPassword}
                      onChange={(e) => setConfirmAdminPassword(e.target.value)}
                      placeholder="Repeat new password"
                      required
                      className={cn("h-11 rounded-xl border-2 font-medium", isDark ? "bg-[#080d2a] border-teal/30 text-white placeholder:text-slate-500" : "bg-white border-navy/20 text-navy placeholder:text-navy/40")}
                    />
                  </div>

                  <Button 
                    type="submit"
                    className="w-full bg-navy hover:bg-brand-red text-white font-black rounded-xl shadow-md h-11 transition-all"
                    disabled={isUpdatingPassword}
                  >
                    {isUpdatingPassword ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Update Admin Password
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Change Admin Email Card */}
            <Card className={cn(
              "rounded-2xl sm:rounded-3xl shadow-lg transition-all",
              isDark ? "bg-[#060a22] border-none text-white shadow-none" : "border-2 bg-white border-navy/20 text-navy"
            )}>
              <CardHeader className="border-b border-navy/10 dark:border-teal/20 pb-4">
                <CardTitle className="text-base sm:text-lg font-black flex items-center gap-2.5">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shadow-xs border", isDark ? "bg-navy text-teal border-teal/30" : "bg-navy text-white border-navy/20")}>
                    <AtSign className={cn("h-4 w-4", isDark ? "text-teal" : "text-white")} />
                  </div>
                  Update Admin Email
                </CardTitle>
                <CardDescription className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/70")}>
                  Modify the email address associated with this administrator profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className={cn(
                  "p-3.5 rounded-2xl border-2 flex items-center justify-between",
                  isDark ? "bg-[#080d2a] border-teal/20" : "bg-slate-50 border-navy/10"
                )}>
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Admin Email</div>
                    <div className="text-sm font-black">{currentAdminEmail}</div>
                  </div>
                  <Badge className="bg-teal text-navy font-bold text-xs">Verified</Badge>
                </div>

                <form onSubmit={handleChangeEmail} className="space-y-4 pt-1">
                  <div className="space-y-1.5">
                    <Label htmlFor="newAdminEmail" className="text-xs font-bold uppercase tracking-wider">New Email Address</Label>
                    <Input
                      id="newAdminEmail"
                      type="email"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      placeholder="newadmin@quardcubelabs.com"
                      required
                      className={cn("h-11 rounded-xl border-2 font-medium", isDark ? "bg-[#080d2a] border-teal/30 text-white placeholder:text-slate-500" : "bg-white border-navy/20 text-navy placeholder:text-navy/40")}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="currentPassEmail" className="text-xs font-bold uppercase tracking-wider">Current Password</Label>
                    <Input
                      id="currentPassEmail"
                      type="password"
                      value={currentPasswordForEmail}
                      onChange={(e) => setCurrentPasswordForEmail(e.target.value)}
                      placeholder="Confirm with current password"
                      required
                      className={cn("h-11 rounded-xl border-2 font-medium", isDark ? "bg-[#080d2a] border-teal/30 text-white placeholder:text-slate-500" : "bg-white border-navy/20 text-navy placeholder:text-navy/40")}
                    />
                  </div>

                  <Button 
                    type="submit"
                    className="w-full bg-teal text-navy font-black hover:bg-teal-400 rounded-xl shadow-md h-11 transition-all"
                    disabled={isUpdatingEmail}
                  >
                    {isUpdatingEmail ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Update Email Address
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 5. Payment Settings */}
        <TabsContent value="payment" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className={cn(
              "rounded-2xl sm:rounded-3xl shadow-lg transition-all",
              isDark ? "bg-[#060a22] border-none text-white shadow-none" : "border-2 bg-white border-navy/20 text-navy"
            )}>
              <CardHeader className="border-b border-navy/10 dark:border-teal/20 pb-4">
                <CardTitle className="text-base sm:text-lg font-black flex items-center gap-2.5">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shadow-xs border", isDark ? "bg-navy text-teal border-teal/30" : "bg-navy text-white border-navy/20")}>
                    <CreditCard className={cn("h-4 w-4", isDark ? "text-teal" : "text-white")} />
                  </div>
                  Payment Gateways
                </CardTitle>
                <CardDescription className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/70")}>
                  Enable local and international payment processors
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className={cn("flex items-center justify-between p-3.5 rounded-2xl border", isDark ? "bg-[#080d2a] border-teal/20" : "bg-slate-50 border-navy/10")}>
                  <div className="space-y-0.5">
                    <Label className="font-bold text-sm text-teal dark:text-teal-300">Vodacom M-Pesa / Vodacom Pay</Label>
                    <p className="text-xs opacity-75">Local mobile money payments in Tanzania (TZS)</p>
                  </div>
                  <Switch 
                    checked={settings.payment.vodacomEnabled}
                    onCheckedChange={(checked) => updateSettings('payment', 'vodacomEnabled', checked)}
                  />
                </div>

                <div className={cn("flex items-center justify-between p-3.5 rounded-2xl border", isDark ? "bg-[#080d2a] border-teal/20" : "bg-slate-50 border-navy/10")}>
                  <div className="space-y-0.5">
                    <Label className="font-bold text-sm">Stripe Payments</Label>
                    <p className="text-xs opacity-75">Credit / Debit Cards, Apple Pay, Google Pay</p>
                  </div>
                  <Switch 
                    checked={settings.payment.stripeEnabled}
                    onCheckedChange={(checked) => updateSettings('payment', 'stripeEnabled', checked)}
                  />
                </div>

                <div className={cn("flex items-center justify-between p-3.5 rounded-2xl border", isDark ? "bg-[#080d2a] border-teal/20" : "bg-slate-50 border-navy/10")}>
                  <div className="space-y-0.5">
                    <Label className="font-bold text-sm">PayPal Checkout</Label>
                    <p className="text-xs opacity-75">International PayPal account payments</p>
                  </div>
                  <Switch 
                    checked={settings.payment.paypalEnabled}
                    onCheckedChange={(checked) => updateSettings('payment', 'paypalEnabled', checked)}
                  />
                </div>

                <div className={cn("flex items-center justify-between p-3.5 rounded-2xl border", isDark ? "bg-[#080d2a] border-teal/20" : "bg-amber-50 border-amber-200")}>
                  <div className="space-y-0.5">
                    <Label className="font-bold text-sm text-amber-600 dark:text-amber-400">Sandbox Test Mode</Label>
                    <p className="text-xs opacity-75">Process mock test transactions without live charging</p>
                  </div>
                  <Switch 
                    checked={settings.payment.testMode}
                    onCheckedChange={(checked) => updateSettings('payment', 'testMode', checked)}
                  />
                </div>

                <Button 
                  className="w-full bg-teal text-navy font-black hover:bg-teal-400 rounded-xl shadow-md h-11 transition-all mt-2"
                  onClick={() => handleSaveSettings('payment')}
                  disabled={isSaving}
                >
                  {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Payment Gateways
                </Button>
              </CardContent>
            </Card>

            <Card className={cn(
              "rounded-2xl sm:rounded-3xl shadow-lg transition-all",
              isDark ? "bg-[#060a22] border-none text-white shadow-none" : "border-2 bg-white border-navy/20 text-navy"
            )}>
              <CardHeader className="border-b border-navy/10 dark:border-teal/20 pb-4">
                <CardTitle className="text-base sm:text-lg font-black flex items-center gap-2.5">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shadow-xs border", isDark ? "bg-navy text-teal border-teal/30" : "bg-navy text-white border-navy/20")}>
                    <FileText className={cn("h-4 w-4", isDark ? "text-teal" : "text-white")} />
                  </div>
                  Tax & Settlement Currency
                </CardTitle>
                <CardDescription className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/70")}>
                  VAT rate calculations and invoice default currency
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="taxRate" className="text-xs font-bold uppercase tracking-wider">VAT / Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    value={Math.round(settings.payment.taxRate * 100)}
                    onChange={(e) => updateSettings('payment', 'taxRate', (parseFloat(e.target.value) || 0) / 100)}
                    min="0"
                    max="50"
                    step="1"
                    className={cn("h-11 rounded-xl border-2 font-medium", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="paymentCurrency" className="text-xs font-bold uppercase tracking-wider text-teal dark:text-teal-300">
                    Payment Settlement Currency
                  </Label>
                  <Select value={settings.payment.currency} onValueChange={(value) => updateSettings('payment', 'currency', value)}>
                    <SelectTrigger className={cn("h-11 rounded-xl border-2 font-bold", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TZS" className="font-bold text-teal">TZS - Tanzanian Shilling (TSh)</SelectItem>
                      <SelectItem value="USD">USD - US Dollar ($)</SelectItem>
                      <SelectItem value="EUR">EUR - Euro (€)</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound (£)</SelectItem>
                      <SelectItem value="KES">KES - Kenyan Shilling (KSh)</SelectItem>
                      <SelectItem value="UGX">UGX - Ugandan Shilling (USh)</SelectItem>
                      <SelectItem value="ZAR">ZAR - South African Rand (R)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 6. System & Infrastructure */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className={cn(
              "rounded-2xl sm:rounded-3xl shadow-lg transition-all",
              isDark ? "bg-[#060a22] border-none text-white shadow-none" : "border-2 bg-white border-navy/20 text-navy"
            )}>
              <CardHeader className="border-b border-navy/10 dark:border-teal/20 pb-4">
                <CardTitle className="text-base sm:text-lg font-black flex items-center gap-2.5">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shadow-xs border", isDark ? "bg-navy text-teal border-teal/30" : "bg-navy text-white border-navy/20")}>
                    <Server className={cn("h-4 w-4", isDark ? "text-teal" : "text-white")} />
                  </div>
                  System Infrastructure & Health
                </CardTitle>
                <CardDescription className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/70")}>
                  Database connection, cache status, and cloud storage telemetry
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3.5 pt-4">
                <div className={cn("flex items-center justify-between p-3.5 rounded-2xl border", isDark ? "bg-[#080d2a] border-teal/20" : "bg-slate-50 border-navy/10")}>
                  <div>
                    <div className="font-bold text-sm">Supabase PostgreSQL</div>
                    <div className="text-xs text-emerald-500 font-semibold">Active & Healthy</div>
                  </div>
                  <div className="h-3.5 w-3.5 bg-emerald-500 rounded-full animate-pulse shadow-sm" />
                </div>

                <div className={cn("flex items-center justify-between p-3.5 rounded-2xl border", isDark ? "bg-[#080d2a] border-teal/20" : "bg-slate-50 border-navy/10")}>
                  <div>
                    <div className="font-bold text-sm">Storage Bucket Usage</div>
                    <div className="text-xs opacity-75">Avatars, Invoices & Product Images</div>
                  </div>
                  <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-teal/20 text-navy dark:text-teal-300">
                    Healthy
                  </span>
                </div>

                <div className={cn("flex items-center justify-between p-3.5 rounded-2xl border", isDark ? "bg-[#080d2a] border-teal/20" : "bg-slate-50 border-navy/10")}>
                  <div>
                    <div className="font-bold text-sm">Next.js Turbopack Core</div>
                    <div className="text-xs opacity-75">v16.1.6 Server Actions Active</div>
                  </div>
                  <div className="h-3.5 w-3.5 bg-emerald-500 rounded-full" />
                </div>
              </CardContent>
            </Card>

            <Card className={cn(
              "rounded-2xl sm:rounded-3xl shadow-lg transition-all",
              isDark ? "bg-[#060a22] border-none text-white shadow-none" : "border-2 bg-white border-navy/20 text-navy"
            )}>
              <CardHeader className="border-b border-navy/10 dark:border-teal/20 pb-4">
                <CardTitle className="text-base sm:text-lg font-black flex items-center gap-2.5">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shadow-xs border", isDark ? "bg-navy text-teal border-teal/30" : "bg-navy text-white border-navy/20")}>
                    <Mail className={cn("h-4 w-4", isDark ? "text-teal" : "text-white")} />
                  </div>
                  SMTP Mail Server
                </CardTitle>
                <CardDescription className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/70")}>
                  Dispatch transactional emails for invoices and quotes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="smtpHost" className="text-xs font-bold uppercase tracking-wider">SMTP Host</Label>
                    <Input
                      id="smtpHost"
                      value={settings.email.smtpHost}
                      onChange={(e) => updateSettings('email', 'smtpHost', e.target.value)}
                      className={cn("h-11 rounded-xl border-2 font-medium", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="smtpPort" className="text-xs font-bold uppercase tracking-wider">Port</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      value={settings.email.smtpPort}
                      onChange={(e) => updateSettings('email', 'smtpPort', parseInt(e.target.value) || 587)}
                      className={cn("h-11 rounded-xl border-2 font-medium", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="fromEmail" className="text-xs font-bold uppercase tracking-wider">From Email Address</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    value={settings.email.fromEmail}
                    onChange={(e) => updateSettings('email', 'fromEmail', e.target.value)}
                    className={cn("h-11 rounded-xl border-2 font-medium", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                  />
                </div>

                <div className={cn("flex items-center justify-between p-3.5 rounded-2xl border", isDark ? "bg-[#080d2a] border-teal/20" : "bg-slate-50 border-navy/10")}>
                  <div className="space-y-0.5">
                    <Label className="font-bold text-sm">Secure Connection (TLS)</Label>
                    <p className="text-xs opacity-75">Encrypt outbound mail traffic</p>
                  </div>
                  <Switch 
                    checked={settings.email.smtpSecure}
                    onCheckedChange={(checked) => updateSettings('email', 'smtpSecure', checked)}
                  />
                </div>

                <Button 
                  className="w-full bg-teal text-navy font-black hover:bg-teal-400 rounded-xl shadow-md h-11 transition-all mt-2"
                  onClick={() => handleSaveSettings('email')}
                  disabled={isSaving}
                >
                  {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Email Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
