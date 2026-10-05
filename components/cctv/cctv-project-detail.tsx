"use client"

import { useState, useEffect } from "react"
import { 
  FolderKanban, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  FileText, 
  HardDrive, 
  Cable, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowLeft, 
  DollarSign, 
  Layers, 
  Wrench, 
  ExternalLink, 
  ShieldCheck, 
  Percent, 
  Building2, 
  User, 
  MapPin, 
  Info,
  ChevronRight,
  PackageCheck,
  Zap,
  Calculator
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"
import { 
  CctvProject, 
  CctvProjectItem, 
  ProjectType, 
  ProjectStatus,
  QuickCctvPackage 
} from "@/types/cctv"
import { getProducts, type Product } from "@/lib/product-actions"
import { getServices } from "@/lib/services-actions"
import type { Service } from "@/types/database"
import { calculateStorage, calculateCabling, getRecommendedNvr, getQuickPackages } from "@/lib/cctv-utils"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface CctvProjectDetailProps {
  project: CctvProject
  onUpdateProject: (id: string, projectData: Partial<CctvProject>, items?: Array<Omit<CctvProjectItem, "created_at" | "updated_at"> & { id?: string }>) => Promise<CctvProject | null>
  onGenerateQuotation: (projectId: string) => Promise<any>
  onBack: () => void
  onOpenStorageCalc: () => void
  onOpenCableCalc: () => void
}

const CATEGORY_DEFAULT_MARKUPS: Record<string, number> = {
  "Cameras": 20,
  "Recording": 20,
  "Storage": 15,
  "Networking": 20,
  "Cabling": 25,
  "Accessories": 30,
  "Services": 0,
  "Custom": 20
}

export default function CctvProjectDetail({
  project,
  onUpdateProject,
  onGenerateQuotation,
  onBack,
  onOpenStorageCalc,
  onOpenCableCalc
}: CctvProjectDetailProps) {
  const { isDark } = useAdminTheme()
  const { toast } = useToast()

  // Project state
  const [items, setItems] = useState<CctvProjectItem[]>(project.items || [])
  const [status, setStatus] = useState<ProjectStatus>(project.status || "planning")
  const [projectType, setProjectType] = useState<ProjectType>(project.project_type || "commercial")
  const [recordingType, setRecordingType] = useState<'IP/NVR' | 'Analog/XVR' | 'Hybrid'>(project.recording_type || "IP/NVR")
  const [discountAmount, setDiscountAmount] = useState<number>(project.discount_amount || 0)
  const [taxRatePercent, setTaxRatePercent] = useState<number>(project.tax_rate_percent ?? 18.0)
  const [notes, setNotes] = useState<string>(project.notes || "")

  // Catalog products and services for selection
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([])
  const [catalogServices, setCatalogServices] = useState<Service[]>([])

  // Add Item Dialog State
  const [isAddItemOpen, setIsAddItemOpen] = useState(false)
  const [itemType, setItemType] = useState<'product' | 'service' | 'custom'>('product')
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const [itemName, setItemName] = useState("")
  const [itemCategory, setItemCategory] = useState("Cameras")
  const [itemDescription, setItemDescription] = useState("")
  const [itemQuantity, setItemQuantity] = useState(1)
  const [itemUnitCost, setItemUnitCost] = useState(0)
  const [itemMarkupPercent, setItemMarkupPercent] = useState(20)
  const [itemUnitPrice, setItemUnitPrice] = useState(0)

  // Package modal
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingQuote, setIsGeneratingQuote] = useState(false)

  // Smart suggestions
  const cameraCount = items.filter(i => i.category === 'Cameras').reduce((sum, i) => sum + (Number(i.quantity) || 0), 0)
  const smartNvr = getRecommendedNvr(cameraCount, recordingType === 'Analog/XVR' ? 'Analog/XVR' : 'IP/NVR', true)

  useEffect(() => {
    getProducts().then(setCatalogProducts).catch(() => {})
    getServices().then(setCatalogServices).catch(() => {})
  }, [])

  // Auto-recalculate unit price when cost or markup changes
  const handleCostOrMarkupChange = (cost: number, markup: number) => {
    setItemUnitCost(cost)
    setItemMarkupPercent(markup)
    const price = Math.round(cost * (1 + markup / 100))
    setItemUnitPrice(price)
  }

  // Handle selecting an existing product
  const handleSelectProduct = (productId: number) => {
    const prod = catalogProducts.find(p => p.id === productId)
    if (prod) {
      setSelectedProductId(prod.id)
      setItemName(prod.name)
      setItemDescription(prod.description || "")
      const cost = Math.round(prod.price * 0.8) // Estimate cost from existing price
      const cat = prod.category.toLowerCase().includes("camera") ? "Cameras" :
                  prod.category.toLowerCase().includes("storage") || prod.category.toLowerCase().includes("hdd") ? "Storage" :
                  prod.category.toLowerCase().includes("network") ? "Networking" : "Accessories"
      setItemCategory(cat)
      const defaultMarkup = CATEGORY_DEFAULT_MARKUPS[cat] || 20
      setItemUnitCost(cost)
      setItemMarkupPercent(defaultMarkup)
      setItemUnitPrice(prod.price)
    }
  }

  // Add Item to List
  const handleAddItemToList = () => {
    if (!itemName) {
      toast({ title: "Name Required", description: "Please enter an item name.", variant: "destructive" })
      return
    }

    const subtotal = Math.round(itemUnitPrice * itemQuantity)
    const newItem: CctvProjectItem = {
      id: crypto.randomUUID(),
      project_id: project.id,
      product_id: selectedProductId,
      item_type: itemType,
      name: itemName,
      description: itemDescription,
      category: itemCategory,
      quantity: Number(itemQuantity) || 1,
      unit_cost: Number(itemUnitCost) || 0,
      markup_percentage: Number(itemMarkupPercent) || 0,
      unit_price: Number(itemUnitPrice) || 0,
      discount: 0,
      tax: 0,
      subtotal,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    setItems([...items, newItem])
    setIsAddItemOpen(false)
    resetAddItemForm()
    toast({ title: "Item Added", description: `${itemName} added to project.` })
  }

  const resetAddItemForm = () => {
    setItemName("")
    setItemDescription("")
    setItemCategory("Cameras")
    setItemQuantity(1)
    setItemUnitCost(0)
    setItemMarkupPercent(20)
    setItemUnitPrice(0)
    setSelectedProductId(null)
    setSelectedServiceId(null)
    setItemType("product")
  }

  // Update item field inside table
  const handleUpdateItemField = (index: number, field: keyof CctvProjectItem, value: any) => {
    const updated = [...items]
    const current = updated[index]

    if (field === 'quantity') {
      const qty = Number(value) || 1
      current.quantity = qty
      current.subtotal = Math.round(current.unit_price * qty)
    } else if (field === 'unit_cost') {
      const cost = Number(value) || 0
      current.unit_cost = cost
      current.unit_price = Math.round(cost * (1 + current.markup_percentage / 100))
      current.subtotal = Math.round(current.unit_price * current.quantity)
    } else if (field === 'markup_percentage') {
      const markup = Number(value) || 0
      current.markup_percentage = markup
      current.unit_price = Math.round(current.unit_cost * (1 + markup / 100))
      current.subtotal = Math.round(current.unit_price * current.quantity)
    } else if (field === 'unit_price') {
      const price = Number(value) || 0
      current.unit_price = price
      current.subtotal = Math.round(price * current.quantity)
    } else {
      (current as any)[field] = value
    }

    setItems(updated)
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  // Load a quick package into items
  const handleApplyPackage = (pkg: QuickCctvPackage) => {
    const newItems: CctvProjectItem[] = pkg.items.map(pItem => {
      const unitPrice = Math.round(pItem.unitCost * (1 + pItem.defaultMarkup / 100))
      return {
        id: crypto.randomUUID(),
        project_id: project.id,
        product_id: null,
        item_type: pItem.type,
        name: pItem.name,
        description: pItem.description || "",
        category: pItem.category,
        quantity: pItem.quantity,
        unit_cost: pItem.unitCost,
        markup_percentage: pItem.defaultMarkup,
        unit_price: unitPrice,
        discount: 0,
        tax: 0,
        subtotal: unitPrice * pItem.quantity,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    })

    setItems(newItems)
    setIsPackageModalOpen(false)
    toast({
      title: "Package Applied",
      description: `Loaded ${pkg.name} (${pkg.items.length} components) into project.`,
    })
  }

  // Live Financial Calculations
  const equipmentSubtotal = items
    .filter(i => i.item_type !== 'service')
    .reduce((sum, i) => sum + (Number(i.subtotal) || 0), 0)

  const servicesSubtotal = items
    .filter(i => i.item_type === 'service')
    .reduce((sum, i) => sum + (Number(i.subtotal) || 0), 0)

  const subtotalBeforeTax = Math.max(0, equipmentSubtotal + servicesSubtotal - discountAmount)
  const taxAmount = Math.round((subtotalBeforeTax * taxRatePercent) / 100)
  const grandTotal = Math.round(subtotalBeforeTax + taxAmount)

  // Save Project
  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onUpdateProject(project.id, {
        status,
        project_type: projectType,
        recording_type: recordingType,
        camera_count: cameraCount,
        discount_amount: discountAmount,
        tax_rate_percent: taxRatePercent,
        notes
      }, items)

      toast({
        title: "Project Saved",
        description: "CCTV project equipment, pricing and specifications updated.",
      })
    } catch (err: any) {
      toast({
        title: "Save Failed",
        description: err.message || "Failed to save project.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  // 1-Click Generate Quotation
  const handleGenerateQuote = async () => {
    if (items.length === 0) {
      toast({
        title: "No Equipment Selected",
        description: "Add equipment or services to the project before generating a quotation.",
        variant: "destructive"
      })
      return
    }

    setIsGeneratingQuote(true)
    try {
      // First save project with current items
      await onUpdateProject(project.id, {
        status: "quoted",
        project_type: projectType,
        recording_type: recordingType,
        camera_count: cameraCount,
        discount_amount: discountAmount,
        tax_rate_percent: taxRatePercent,
        notes
      }, items)

      // Then generate quotation
      const res = await onGenerateQuotation(project.id)
      toast({
        title: "Quotation Generated Successfully!",
        description: `Quotation ${res?.quotation?.quote_number || 'created'} is now available in the Quotations module.`,
      })
    } catch (err: any) {
      toast({
        title: "Quotation Generation Error",
        description: err.message || "Failed to generate quotation.",
        variant: "destructive"
      })
    } finally {
      setIsGeneratingQuote(false)
    }
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      maximumFractionDigits: 0
    }).format(val).replace('TZS', 'TZS ')
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header Card */}
      <div className={cn(
        "p-6 rounded-2xl sm:rounded-3xl border shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4",
        isDark ? "bg-[#0a1033] border-none text-white shadow-md" : "bg-white border-2 border-navy/20"
      )}>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className={cn("h-7 px-2 text-xs font-bold", isDark ? "text-slate-300 hover:text-white" : "text-navy/70 hover:text-navy")}
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Back
            </Button>
            <span className={cn("text-xs font-mono font-bold", isDark ? "text-teal-400" : "text-navy/70")}>{project.project_number}</span>
            <Badge variant="outline" className={cn(
              "text-[10px] uppercase font-bold py-0 rounded-md",
              status === 'approved' || status === 'completed' ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" :
              status === 'quoted' ? "border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-500/10" :
              "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-500/10"
            )}>
              {status}
            </Badge>
          </div>

          <h1 className={cn("text-2xl sm:text-3xl font-black tracking-tight", isDark ? "text-white" : "text-navy")}>
            {project.site_name}
          </h1>

          <div className={cn("flex items-center gap-4 text-xs flex-wrap", isDark ? "text-slate-400" : "text-navy/70")}>
            <span className={cn("flex items-center gap-1 font-bold", isDark ? "text-white" : "text-navy")}>
              <Building2 className="h-3.5 w-3.5 text-teal" />
              {project.customer_name}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {project.customer_address || "Tanzania"}
            </span>
            <span>•</span>
            <span className="font-bold text-teal">{cameraCount} Cameras Designed</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={() => setIsPackageModalOpen(true)}
            variant="outline"
            className={cn(
              "text-xs font-bold h-10 rounded-xl transition-all",
              isDark ? "bg-[#070d24] border-amber-400/40 text-amber-400 hover:bg-amber-500/10" : "bg-white border-2 border-navy/20 text-navy hover:bg-amber-50"
            )}
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
            Quick Packages
          </Button>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            variant="outline"
            className={cn(
              "text-xs font-bold h-10 rounded-xl transition-all",
              isDark ? "bg-[#070d24] border-slate-700 text-white hover:bg-slate-800" : "bg-white border-2 border-navy/20 text-navy hover:bg-teal-50"
            )}
          >
            <Save className="h-3.5 w-3.5 mr-1.5 text-teal" />
            <span>Save Design</span>
          </Button>

          <Button
            onClick={handleGenerateQuote}
            disabled={isGeneratingQuote}
            className="bg-teal hover:bg-teal/90 text-navy font-bold text-xs h-10 px-5 rounded-xl shadow-lg shadow-teal/20 transition-all active:scale-95 flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            <span>{project.quotation_number ? "Update Quotation" : "Generate Quotation"}</span>
          </Button>
        </div>
      </div>

      {/* Linked Quotation Banner (If Quotation Exists) */}
      {project.quotation_number && (
        <div className={cn(
          "p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm",
          isDark ? "bg-purple-950/40 border-purple-800/60 text-purple-200" : "bg-purple-50 border-2 border-purple-200 text-purple-900"
        )}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-sm flex items-center gap-2">
                <span>Existing Quotation Linked:</span>
                <Badge className="bg-purple-600 text-white font-mono text-xs">
                  {project.quotation_number}
                </Badge>
              </div>
              <p className="text-xs opacity-80 mt-0.5">
                This project is connected directly to the QuardCube Quotations module. Any invoice or sales order will update inventory automatically.
              </p>
            </div>
          </div>

          <Button
            asChild
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shrink-0"
          >
            <Link href="/admin/quotations">
              <span>View in Quotations Module</span>
              <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
            </Link>
          </Button>
        </div>
      )}

      {/* Main Grid: Left side Equipment Table / Right side Financials & Calculators */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Equipment Design Table */}
        <div className="lg:col-span-2 space-y-6">
          <Card className={cn(
            "rounded-2xl sm:rounded-3xl border shadow-sm overflow-hidden",
            isDark ? "bg-[#0a1033] border-none text-white shadow-md" : "bg-white border-2 border-navy/20"
          )}>
            <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between border-b border-navy/10 dark:border-slate-800">
              <div>
                <CardTitle className={cn("text-base font-black flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
                  <Layers className="h-4 w-4 text-teal" />
                  CCTV Bill of Materials & Equipment
                </CardTitle>
                <CardDescription className={cn("text-xs mt-0.5", isDark ? "text-slate-400" : "text-navy/70")}>
                  Select products from catalog, adjust quantities, costs, markups and prices
                </CardDescription>
              </div>

              <Button
                onClick={() => setIsAddItemOpen(true)}
                size="sm"
                className="bg-teal hover:bg-teal/90 text-navy font-bold text-xs h-8 rounded-xl"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                + Add Component / Labor
              </Button>
            </CardHeader>

            <CardContent className="p-0">
              {items.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <PackageCheck className={cn("h-10 w-10 mx-auto mb-2", isDark ? "text-slate-600" : "text-navy/30")} />
                  <p className={cn("font-bold text-sm", isDark ? "text-white" : "text-navy")}>No Equipment in Design</p>
                  <p className={cn("text-xs mt-1 max-w-xs mx-auto", isDark ? "text-slate-400" : "text-navy/70")}>
                    Add cameras, NVRs, HDDs, cables or load a pre-configured quick package.
                  </p>
                  <div className="flex justify-center gap-2 mt-4">
                    <Button
                      onClick={() => setIsPackageModalOpen(true)}
                      size="sm"
                      variant="outline"
                      className={cn(
                        "text-xs font-bold rounded-xl",
                        isDark ? "bg-[#070d24] border-slate-700 text-white hover:bg-slate-800" : "bg-white border-2 border-navy/20 text-navy hover:bg-amber-50"
                      )}
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1 text-amber-500" />
                      Load Quick Package
                    </Button>
                    <Button
                      onClick={() => setIsAddItemOpen(true)}
                      size="sm"
                      className="bg-teal hover:bg-teal/90 text-navy font-bold text-xs rounded-xl"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add First Item
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className={cn(
                        "border-b font-bold uppercase text-[10px]",
                        isDark ? "bg-[#070d24] text-slate-300 border-slate-800" : "bg-teal/10 text-navy border-navy/10"
                      )}>
                        <th className="py-2.5 px-3 text-left">Item / Specification</th>
                        <th className="py-2.5 px-2 text-center w-16">Qty</th>
                        <th className="py-2.5 px-2 text-right w-24">Cost (TZS)</th>
                        <th className="py-2.5 px-2 text-center w-16">Markup %</th>
                        <th className="py-2.5 px-2 text-right w-24">Price (TZS)</th>
                        <th className="py-2.5 px-3 text-right w-28">Subtotal</th>
                        <th className="py-2.5 px-2 text-center w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy/10 dark:divide-slate-800">
                      {items.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-navy/5 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={cn("font-bold text-xs", isDark ? "text-white" : "text-navy")}>{item.name}</span>
                                <Badge variant="outline" className={cn(
                                  "text-[9px] py-0 px-1 font-semibold uppercase rounded-md",
                                  isDark ? "border-slate-700 text-teal-400" : "border-navy/20 text-navy"
                                )}>
                                  {item.category}
                                </Badge>
                              </div>
                              {item.description && (
                                <p className={cn("text-[11px] line-clamp-1", isDark ? "text-slate-400" : "text-navy/60")}>{item.description}</p>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-2 text-center">
                            <Input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={e => handleUpdateItemField(idx, "quantity", e.target.value)}
                              className={cn(
                                "h-7 w-14 text-center text-xs font-bold mx-auto p-1 rounded-lg",
                                isDark ? "bg-[#070d24] border-slate-700 text-white" : "border-2 border-navy/20 text-navy"
                              )}
                            />
                          </td>

                          <td className="py-3 px-2 text-right">
                            <Input
                              type="number"
                              value={item.unit_cost}
                              onChange={e => handleUpdateItemField(idx, "unit_cost", e.target.value)}
                              className={cn(
                                "h-7 w-20 text-right text-xs font-mono ml-auto p-1 rounded-lg",
                                isDark ? "bg-[#070d24] border-slate-700 text-white" : "border-2 border-navy/20 text-navy"
                              )}
                            />
                          </td>

                          <td className="py-3 px-2 text-center">
                            <Input
                              type="number"
                              value={item.markup_percentage}
                              onChange={e => handleUpdateItemField(idx, "markup_percentage", e.target.value)}
                              className={cn(
                                "h-7 w-12 text-center text-xs font-bold mx-auto p-1 rounded-lg",
                                isDark ? "bg-[#070d24] border-slate-700 text-white" : "border-2 border-navy/20 text-navy"
                              )}
                            />
                          </td>

                          <td className="py-3 px-2 text-right">
                            <Input
                              type="number"
                              value={item.unit_price}
                              onChange={e => handleUpdateItemField(idx, "unit_price", e.target.value)}
                              className={cn(
                                "h-7 w-24 text-right text-xs font-mono font-bold ml-auto p-1 rounded-lg",
                                isDark ? "bg-[#070d24] border-slate-700 text-white" : "border-2 border-navy/20 text-navy"
                              )}
                            />
                          </td>

                          <td className={cn("py-3 px-3 text-right font-mono font-bold", isDark ? "text-teal-400" : "text-navy")}>
                            {formatCurrency(item.subtotal)}
                          </td>

                          <td className="py-3 px-2 text-center">
                            <button
                              onClick={() => handleRemoveItem(idx)}
                              className="text-navy/50 dark:text-slate-500 hover:text-red-500 p-1 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Smart System Recommendation Box */}
          <Card className={cn(
            "rounded-2xl sm:rounded-3xl border shadow-sm p-4",
            isDark ? "bg-[#0a1033] border-none text-white shadow-md" : "bg-white border-2 border-navy/20"
          )}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={cn(
                  "p-2.5 rounded-xl transition-all shrink-0",
                  isDark ? "bg-[#080d28] text-teal-400" : "bg-teal/20 text-navy"
                )}>
                  <Zap className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className={cn("font-bold text-sm flex items-center gap-1.5", isDark ? "text-white" : "text-navy")}>
                    <span>Intelligent NVR & Capacity Engine</span>
                    <Badge className="bg-teal text-navy text-[10px] font-black">Smart Match</Badge>
                  </h4>
                  <p className={cn("text-xs font-semibold", isDark ? "text-teal-300" : "text-navy/90")}>
                    {smartNvr.modelSuggestion}
                  </p>
                  <p className={cn("text-[11px]", isDark ? "text-slate-400" : "text-navy/70")}>
                    {smartNvr.details}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
                <Button
                  onClick={onOpenStorageCalc}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "text-xs font-bold h-8 rounded-xl",
                    isDark ? "bg-[#070d24] border-slate-700 text-white hover:bg-slate-800" : "bg-white border-2 border-navy/20 text-navy hover:bg-teal-50"
                  )}
                >
                  <HardDrive className="h-3.5 w-3.5 mr-1 text-teal" />
                  Storage Calc
                </Button>
                <Button
                  onClick={onOpenCableCalc}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "text-xs font-bold h-8 rounded-xl",
                    isDark ? "bg-[#070d24] border-slate-700 text-white hover:bg-slate-800" : "bg-white border-2 border-navy/20 text-navy hover:bg-blue-50"
                  )}
                >
                  <Cable className="h-3.5 w-3.5 mr-1 text-blue-500" />
                  Cable Calc
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right 1 Col: Pricing Engine, Markup Rules, and Financial Summary */}
        <div className="space-y-6">
          <Card className={cn(
            "rounded-2xl sm:rounded-3xl border shadow-sm",
            isDark ? "bg-[#0a1033] border-none text-white shadow-md" : "bg-white border-2 border-navy/20"
          )}>
            <CardHeader className="p-4 pb-3 border-b border-navy/10 dark:border-slate-800">
              <CardTitle className={cn("text-base font-black flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
                <DollarSign className="h-4 w-4 text-teal" />
                Pricing Engine & Quotation Total
              </CardTitle>
            </CardHeader>

            <CardContent className="p-4 space-y-4 text-xs">
              {/* Equipment Cost */}
              <div className="flex items-center justify-between">
                <span className={cn("font-medium", isDark ? "text-slate-400" : "text-navy/70")}>Equipment Subtotal:</span>
                <span className={cn("font-mono font-bold", isDark ? "text-white" : "text-navy")}>{formatCurrency(equipmentSubtotal)}</span>
              </div>

              {/* Services Cost */}
              <div className="flex items-center justify-between">
                <span className={cn("font-medium", isDark ? "text-slate-400" : "text-navy/70")}>Installation & Services:</span>
                <span className={cn("font-mono font-bold", isDark ? "text-white" : "text-navy")}>{formatCurrency(servicesSubtotal)}</span>
              </div>

              {/* Discount Input */}
              <div className={cn("space-y-1 pt-1 border-t", isDark ? "border-slate-800" : "border-navy/10")}>
                <div className="flex items-center justify-between">
                  <Label className={cn("text-xs font-semibold", isDark ? "text-slate-300" : "text-navy/80")}>Project Discount (TZS):</Label>
                  <Input
                    type="number"
                    min={0}
                    value={discountAmount}
                    onChange={e => setDiscountAmount(parseFloat(e.target.value) || 0)}
                    className={cn(
                      "h-7 w-28 text-right font-mono font-bold text-xs rounded-lg",
                      isDark ? "bg-[#070d24] border-slate-700 text-white" : "border-2 border-navy/20 text-navy"
                    )}
                  />
                </div>
              </div>

              {/* Tax / VAT Toggle */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className={cn("text-xs font-semibold", isDark ? "text-slate-300" : "text-navy/80")}>Applicable Tax (%):</Label>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={taxRatePercent}
                      onChange={e => setTaxRatePercent(parseFloat(e.target.value) || 0)}
                      className={cn(
                        "h-7 w-16 text-right font-mono font-bold text-xs rounded-lg",
                        isDark ? "bg-[#070d24] border-slate-700 text-white" : "border-2 border-navy/20 text-navy"
                      )}
                    />
                    <span className={cn("font-bold", isDark ? "text-white" : "text-navy")}>%</span>
                  </div>
                </div>
                <div className={cn("flex items-center justify-between text-[11px] pt-0.5", isDark ? "text-slate-400" : "text-navy/70")}>
                  <span>VAT Amount:</span>
                  <span className={cn("font-mono font-semibold", isDark ? "text-white" : "text-navy")}>{formatCurrency(taxAmount)}</span>
                </div>
              </div>

              {/* Grand Total Box */}
              <div className={cn(
                "p-4 rounded-2xl border text-center space-y-1 mt-2",
                isDark ? "bg-[#070d24] border-teal/40" : "bg-teal/15 border-2 border-teal/40"
              )}>
                <span className={cn("text-xs font-black uppercase tracking-wider", isDark ? "text-teal-300" : "text-navy/80")}>Grand Total (Quote Value)</span>
                <div className="text-2xl font-black text-teal font-mono">
                  {formatCurrency(grandTotal)}
                </div>
              </div>

              {/* Status & Type Selector */}
              <div className="space-y-3 pt-2 border-t">
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Project Status</Label>
                  <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                    <SelectTrigger className="h-8 text-xs font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft Design</SelectItem>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="quoted">Quoted</SelectItem>
                      <SelectItem value="approved">Approved by Client</SelectItem>
                      <SelectItem value="in_progress">Installation In Progress</SelectItem>
                      <SelectItem value="completed">Completed & Handed Over</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">Recording Architecture</Label>
                  <Select value={recordingType} onValueChange={(val: any) => setRecordingType(val)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IP/NVR">IP Network (PoE NVR)</SelectItem>
                      <SelectItem value="Analog/XVR">Analog HD (TVI/XVR)</SelectItem>
                      <SelectItem value="Hybrid">Hybrid IP + Analog</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">Engineering / Handover Notes</Label>
                  <Textarea
                    placeholder="Enter project notes, camera heights, warranty terms..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="text-xs"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ADD ITEM DIALOG */}
      <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-black">Add CCTV Component or Service</DialogTitle>
            <DialogDescription className="text-xs">
              Select an existing product from the store catalog or enter custom equipment
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                size="sm"
                variant={itemType === 'product' ? 'default' : 'outline'}
                onClick={() => setItemType('product')}
                className={cn("text-xs font-bold h-8", itemType === 'product' && "bg-teal text-navy")}
              >
                Catalog Product
              </Button>
              <Button
                type="button"
                size="sm"
                variant={itemType === 'service' ? 'default' : 'outline'}
                onClick={() => {
                  setItemType('service')
                  setItemCategory('Services')
                  setItemMarkupPercent(0)
                }}
                className={cn("text-xs font-bold h-8", itemType === 'service' && "bg-teal text-navy")}
              >
                Service / Labor
              </Button>
              <Button
                type="button"
                size="sm"
                variant={itemType === 'custom' ? 'default' : 'outline'}
                onClick={() => setItemType('custom')}
                className={cn("text-xs font-bold h-8", itemType === 'custom' && "bg-teal text-navy")}
              >
                Custom Item
              </Button>
            </div>

            {itemType === 'product' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Select Existing Store Product</Label>
                <Select onValueChange={val => handleSelectProduct(parseInt(val))}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Choose product from catalog..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {catalogProducts.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.name} — {formatCurrency(p.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Item Name *</Label>
              <Input
                placeholder="e.g. Hikvision 4MP ColorVu Turret Camera"
                value={itemName}
                onChange={e => setItemName(e.target.value)}
                className="text-xs font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Category</Label>
                <Select value={itemCategory} onValueChange={setItemCategory}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cameras">Cameras</SelectItem>
                    <SelectItem value="Recording">Recording (NVR/XVR)</SelectItem>
                    <SelectItem value="Storage">Storage (HDD)</SelectItem>
                    <SelectItem value="Networking">Networking & PoE</SelectItem>
                    <SelectItem value="Cabling">Cabling & Conduits</SelectItem>
                    <SelectItem value="Accessories">Accessories & Mounts</SelectItem>
                    <SelectItem value="Services">Installation & Labor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Quantity</Label>
                <Input
                  type="number"
                  min={1}
                  value={itemQuantity}
                  onChange={e => setItemQuantity(parseInt(e.target.value) || 1)}
                  className="h-8 text-xs font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold">Cost Price (TZS)</Label>
                <Input
                  type="number"
                  value={itemUnitCost || ""}
                  onChange={e => handleCostOrMarkupChange(parseFloat(e.target.value) || 0, itemMarkupPercent)}
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold">Markup %</Label>
                <Input
                  type="number"
                  value={itemMarkupPercent}
                  onChange={e => handleCostOrMarkupChange(itemUnitCost, parseFloat(e.target.value) || 0)}
                  className="h-8 text-xs font-bold text-center"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold">Unit Price (TZS)</Label>
                <Input
                  type="number"
                  value={itemUnitPrice || ""}
                  onChange={e => setItemUnitPrice(parseFloat(e.target.value) || 0)}
                  className="h-8 text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Item Description / Model Details</Label>
              <Textarea
                placeholder="Specifications, lens, range, waterproof IP rating..."
                value={itemDescription}
                onChange={e => setItemDescription(e.target.value)}
                className="text-xs"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setIsAddItemOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button
              onClick={handleAddItemToList}
              size="sm"
              className="bg-teal hover:bg-teal-400 text-navy font-bold text-xs"
            >
              Add to Design
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QUICK PACKAGES MODAL */}
      <Dialog open={isPackageModalOpen} onOpenChange={setIsPackageModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Quick CCTV Turnkey Packages
            </DialogTitle>
            <DialogDescription className="text-xs">
              Select a pre-designed turnkey package to populate components, NVR, storage, cabling and labor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {getQuickPackages().map(pkg => (
              <div
                key={pkg.id}
                className={cn(
                  "p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:scale-[1.01]",
                  isDark ? "bg-slate-800/40 border-slate-700 hover:border-teal" : "bg-slate-50 border-slate-200 hover:border-teal"
                )}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">{pkg.name}</span>
                    <Badge className="bg-teal text-navy font-black text-[10px]">{pkg.badgeText}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{pkg.description}</p>
                  <div className="text-xs font-bold text-teal mt-1">
                    Estimated Bundle: {formatCurrency(pkg.estimatedPriceTzs)} ({pkg.items.length} Line Items)
                  </div>
                </div>

                <Button
                  onClick={() => handleApplyPackage(pkg)}
                  className="bg-teal hover:bg-teal-400 text-navy font-black text-xs shrink-0"
                >
                  Apply Package
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
