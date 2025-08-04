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
import AdminLoading from "@/components/admin/admin-loading"
import { 
  Settings, Save, Database, Mail, Bell, Shield, Globe, Palette, 
  Users, CreditCard, FileText, Activity, Key, Clock, HardDrive,
  Eye, Upload, Download, RefreshCw, AlertTriangle, CheckCircle
} from "lucide-react"

// Removed local SystemSettings interface to avoid import conflict

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("general")
  const [isBackupDialogOpen, setIsBackupDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const { toast } = useToast()

  const defaultSettings: SystemSettings = {
    general: {
      siteName: "QuardCube Labs",
      siteDescription: "Premium technology solutions and innovative services for modern businesses",
      contactEmail: "info@quardcubelabs.com",
      supportEmail: "support@quardcubelabs.com",
      timezone: "UTC",
      language: "en",
      currency: "USD"
    },
    appearance: {
      theme: "light",
      primaryColor: "#1e40af",
      logoUrl: "/logo.svg",
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
      currency: "USD",
      taxRate: 0.15
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

  // Load settings from DB on mount using server actions
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true)
      const { settings, error } = await getSystemSettings()
      if (settings) {
        setSettings(settings)
      } else if (error) {
        toast({
          title: "Error Loading Settings",
          description: error,
          variant: "destructive",
        })
      }
      setIsLoading(false)
    }
    loadSettings()
  }, [])

  const handleSaveSettings = async (section: keyof SystemSettings) => {
    setIsSaving(true)
    try {
      const { success, error } = await saveSystemSettings(settings)
      if (success) {
        setLastSaved(new Date().toLocaleString())
        toast({
          title: "Settings Saved",
          description: `${section.charAt(0).toUpperCase() + section.slice(1)} settings have been updated successfully.`,
        })
      } else {
        toast({
          title: "Error",
          description: error || "Failed to save settings. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleBackupDatabase = async () => {
    try {
      // Download settings as JSON file
      const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `system-settings-backup-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast({
        title: "Backup Complete",
        description: "System settings have been exported as a backup file.",
      })
      setIsBackupDialogOpen(false)
    } catch (error) {
      toast({
        title: "Backup Failed",
        description: "Failed to create backup file.",
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
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        <AdminLoading message="Loading system settings..." size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600">Configure and manage system preferences</p>
          {lastSaved && (
            <p className="text-sm text-green-600 mt-1">
              <CheckCircle className="h-4 w-4 inline mr-1" />
              Last saved: {lastSaved}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Dialog open={isBackupDialogOpen} onOpenChange={setIsBackupDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <HardDrive className="h-4 w-4 mr-2" />
                Backup
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Database Backup</DialogTitle>
                <DialogDescription>
                  Create a backup of all system data and configurations
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Database className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-medium">Full System Backup</div>
                      <div className="text-sm text-gray-600">Includes all data, settings, and configurations</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    This process may take a few minutes depending on the amount of data.
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsBackupDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleBackupDatabase}>
                  <Download className="h-4 w-4 mr-2" />
                  Create Backup
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline">
            <Activity className="h-4 w-4 mr-2" />
            System Status
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Site Information
                </CardTitle>
                <CardDescription>
                  Basic site configuration and contact details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={settings.general.siteName}
                    onChange={(e) => updateSettings('general', 'siteName', e.target.value)}
                    placeholder="Enter site name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <Textarea
                    id="siteDescription"
                    value={settings.general.siteDescription}
                    onChange={(e) => updateSettings('general', 'siteDescription', e.target.value)}
                    placeholder="Enter site description"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={settings.general.contactEmail}
                      onChange={(e) => updateSettings('general', 'contactEmail', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={settings.general.supportEmail}
                      onChange={(e) => updateSettings('general', 'supportEmail', e.target.value)}
                    />
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => handleSaveSettings('general')}
                  disabled={isSaving}
                >
                  {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save General Settings
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Localization
                </CardTitle>
                <CardDescription>
                  Regional settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={settings.general.timezone} onValueChange={(value) => updateSettings('general', 'timezone', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London">GMT</SelectItem>
                      <SelectItem value="Africa/Johannesburg">South Africa Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={settings.general.language} onValueChange={(value) => updateSettings('general', 'language', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Default Currency</Label>
                  <Select value={settings.general.currency} onValueChange={(value) => updateSettings('general', 'currency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="ZAR">ZAR - South African Rand</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Theme & Branding
                </CardTitle>
                <CardDescription>
                  Customize the look and feel of your admin panel
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select value={settings.appearance.theme} onValueChange={(value) => updateSettings('appearance', 'theme', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="auto">Auto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={settings.appearance.primaryColor}
                      onChange={(e) => updateSettings('appearance', 'primaryColor', e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      value={settings.appearance.primaryColor}
                      onChange={(e) => updateSettings('appearance', 'primaryColor', e.target.value)}
                      placeholder="#1e40af"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    value={settings.appearance.logoUrl}
                    onChange={(e) => updateSettings('appearance', 'logoUrl', e.target.value)}
                    placeholder="/logo.svg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customCSS">Custom CSS</Label>
                  <Textarea
                    id="customCSS"
                    value={settings.appearance.customCSS}
                    onChange={(e) => updateSettings('appearance', 'customCSS', e.target.value)}
                    placeholder="/* Custom CSS rules */"
                    rows={4}
                  />
                </div>
                <Button 
                  className="w-full"
                  onClick={() => handleSaveSettings('appearance')}
                  disabled={isSaving}
                >
                  {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Appearance Settings
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>
                  Preview your theme changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded"
                      style={{ backgroundColor: settings.appearance.primaryColor }}
                    ></div>
                    <div>
                      <div className="font-medium">{settings.general.siteName}</div>
                      <div className="text-sm text-gray-500">Admin Panel</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    Theme: <Badge variant="outline">{settings.appearance.theme}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Configure when and how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Email Notifications</h4>
                  {Object.entries(settings.notifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </Label>
                        <p className="text-sm text-gray-500">
                          {key === 'orderNotifications' && 'Get notified when new orders are placed'}
                          {key === 'lowStockAlerts' && 'Alert when products are running low'}
                          {key === 'userRegistration' && 'Notify when new users register'}
                          {key === 'paymentAlerts' && 'Receive payment and transaction updates'}
                          {key === 'systemUpdates' && 'Get system maintenance notifications'}
                          {key === 'emailDigest' && 'Daily summary of activities'}
                        </p>
                      </div>
                      <Switch 
                        checked={value}
                        onCheckedChange={(checked) => updateSettings('notifications', key, checked)}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <Button 
                className="w-full"
                onClick={() => handleSaveSettings('notifications')}
                disabled={isSaving}
              >
                {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Authentication & Access
                </CardTitle>
                <CardDescription>
                  Security settings and access controls
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-500">Add an extra layer of security</p>
                  </div>
                  <Switch 
                    checked={settings.security.twoFactorAuth}
                    onCheckedChange={(checked) => updateSettings('security', 'twoFactorAuth', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Session Timeout</Label>
                    <p className="text-sm text-gray-500">Auto-logout after inactivity</p>
                  </div>
                  <Switch 
                    checked={settings.security.sessionTimeout}
                    onCheckedChange={(checked) => updateSettings('security', 'sessionTimeout', checked)}
                  />
                </div>
                {settings.security.sessionTimeout && (
                  <div className="space-y-2">
                    <Label htmlFor="timeoutDuration">Timeout Duration (minutes)</Label>
                    <Input
                      id="timeoutDuration"
                      type="number"
                      value={settings.security.timeoutDuration}
                      onChange={(e) => updateSettings('security', 'timeoutDuration', parseInt(e.target.value))}
                      min="5"
                      max="480"
                    />
                  </div>
                )}
                <Button 
                  className="w-full"
                  onClick={() => handleSaveSettings('security')}
                  disabled={isSaving}
                >
                  {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Security Settings
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Password Policy
                </CardTitle>
                <CardDescription>
                  Configure password requirements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    value={settings.security.passwordMinLength}
                    onChange={(e) => updateSettings('security', 'passwordMinLength', parseInt(e.target.value))}
                    min="6"
                    max="20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) => updateSettings('security', 'maxLoginAttempts', parseInt(e.target.value))}
                    min="3"
                    max="10"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Strong Passwords</Label>
                    <p className="text-sm text-gray-500">Include uppercase, lowercase, numbers</p>
                  </div>
                  <Switch 
                    checked={settings.security.requireStrongPassword}
                    onCheckedChange={(checked) => updateSettings('security', 'requireStrongPassword', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payment">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Providers
                </CardTitle>
                <CardDescription>
                  Configure payment processing options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries({
                  stripeEnabled: 'Stripe',
                  paypalEnabled: 'PayPal',
                  vodacomEnabled: 'Vodacom Pay'
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{label}</Label>
                      <p className="text-sm text-gray-500">Enable {label} payments</p>
                    </div>
                    <Switch 
                      checked={settings.payment[key as keyof typeof settings.payment] as boolean}
                      onCheckedChange={(checked) => updateSettings('payment', key, checked)}
                    />
                  </div>
                ))}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Test Mode</Label>
                    <p className="text-sm text-gray-500">Use sandbox for testing</p>
                  </div>
                  <Switch 
                    checked={settings.payment.testMode}
                    onCheckedChange={(checked) => updateSettings('payment', 'testMode', checked)}
                  />
                </div>
                <Button 
                  className="w-full"
                  onClick={() => handleSaveSettings('payment')}
                  disabled={isSaving}
                >
                  {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Payment Settings
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tax & Currency</CardTitle>
                <CardDescription>
                  Configure tax rates and currency settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    value={settings.payment.taxRate * 100}
                    onChange={(e) => updateSettings('payment', 'taxRate', parseFloat(e.target.value) / 100)}
                    min="0"
                    max="50"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentCurrency">Payment Currency</Label>
                  <Select value={settings.payment.currency} onValueChange={(value) => updateSettings('payment', 'currency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="ZAR">ZAR - South African Rand</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Status
                </CardTitle>
                <CardDescription>
                  Monitor database health and performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <div className="font-medium text-green-900">Connection Status</div>
                      <div className="text-sm text-green-700">Connected to Supabase</div>
                    </div>
                    <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <div className="font-medium text-blue-900">Last Backup</div>
                      <div className="text-sm text-blue-700">Today at 3:00 AM</div>
                    </div>
                    <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <div className="font-medium text-yellow-900">Storage Used</div>
                      <div className="text-sm text-yellow-700">2.4 GB / 10 GB</div>
                    </div>
                    <div className="text-sm font-medium text-yellow-800">24%</div>
                  </div>
                </div>
                
                <div className="pt-2 space-y-2">
                  <Button variant="outline" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    View Connection Logs
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Activity className="h-4 w-4 mr-2" />
                    Performance Metrics
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Configuration
                </CardTitle>
                <CardDescription>
                  SMTP settings for outgoing emails
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpHost">SMTP Host</Label>
                    <Input
                      id="smtpHost"
                      value={settings.email.smtpHost}
                      onChange={(e) => updateSettings('email', 'smtpHost', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">Port</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      value={settings.email.smtpPort}
                      onChange={(e) => updateSettings('email', 'smtpPort', parseInt(e.target.value))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromEmail">From Email</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    value={settings.email.fromEmail}
                    onChange={(e) => updateSettings('email', 'fromEmail', e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Secure Connection (TLS)</Label>
                    <p className="text-sm text-gray-500">Use encrypted connection</p>
                  </div>
                  <Switch 
                    checked={settings.email.smtpSecure}
                    onCheckedChange={(checked) => updateSettings('email', 'smtpSecure', checked)}
                  />
                </div>
                <Button 
                  className="w-full"
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
