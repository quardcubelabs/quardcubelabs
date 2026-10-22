"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { AdminLoading } from "@/components/admin"
import { cn } from "@/lib/utils"
import { 
  getInventoryOverview, 
  getStockMovements, 
  getWarehouses, 
  recordStockMovement, 
  transferStockBetweenWarehouses 
} from "@/lib/inventory-actions"
import { getProducts, updateProduct, deleteProduct, getCategories, createProduct } from "@/lib/product-actions"
import { Product, Category, ProductFormData } from "@/types/database"
import ProductForm from "@/components/admin/product-form"
import { Warehouse, StockMovement, StockMovementType } from "@/lib/erp/types"
import {
  Boxes,
  PackageCheck,
  AlertTriangle,
  ArrowRightLeft,
  SlidersHorizontal,
  History,
  Search,
  RefreshCw,
  Plus,
  CheckCircle2,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  Package,
  Tag,
  Clock,
  Printer
} from "lucide-react"

export default function InventoryPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { isDark } = useAdminTheme()

  const [isLoading, setIsLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesList, setCategoriesList] = useState<string[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [activeTab, setActiveTab] = useState<"stock" | "movements">("stock")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState("all")
  const [movementTypeFilter, setMovementTypeFilter] = useState("all")

  // Overview metrics
  const [totalProducts, setTotalProducts] = useState(0)
  const [totalStockUnits, setTotalStockUnits] = useState(0)
  const [totalStockValue, setTotalStockValue] = useState(0)
  const [lowStockCount, setLowStockCount] = useState(0)
  const [outOfStockCount, setOutOfStockCount] = useState(0)

  // Product Details Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)

  // Product Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editFormData, setEditFormData] = useState({
    name: "",
    category: "",
    price: 0,
    stock: 0,
    description: "",
    image: ""
  })

  // Product Delete Modal State
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Transfer Modal State
  const [isTransferOpen, setIsTransferOpen] = useState(false)
  const [isTransferring, setIsTransferring] = useState(false)
  const [transferProductId, setTransferProductId] = useState<number | null>(null)
  const [transferSourceWh, setTransferSourceWh] = useState("")
  const [transferDestWh, setTransferDestWh] = useState("")
  const [transferQty, setTransferQty] = useState<number>(1)
  const [transferReason, setTransferReason] = useState("")

  // Adjustment Modal State
  const [isAdjustOpen, setIsAdjustOpen] = useState(false)
  const [isAdjusting, setIsAdjusting] = useState(false)
  const [adjustProductId, setAdjustProductId] = useState<number | null>(null)
  const [adjustType, setAdjustType] = useState<StockMovementType>("manual_adjustment")
  const [adjustWh, setAdjustWh] = useState("")
  const [adjustQty, setAdjustQty] = useState<number>(0)
  const [adjustReason, setAdjustReason] = useState("")

  const getCategoryAbbreviation = (category?: string) => {
    if (!category) return "General"
    const map: Record<string, string> = {
      "Security Products": "Security",
      "Power Solutions": "Power",
      "Connectivity & Networking": "Networking",
      "IT Products & Services": "IT Services",
      "Software Development": "Software",
      "Web Designing": "Web Design",
      "Corporate AI Automation": "AI / Auto"
    }
    return map[category] || category
  }

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product)
    setEditFormData({
      name: product.name,
      category: product.category,
      price: Number(product.price) || 0,
      stock: Number(product.stock) || 0,
      description: product.description || "",
      image: product.image || ""
    })
    setIsEditOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingProduct) return
    if (!editFormData.name.trim()) {
      toast({ title: "Validation Error", description: "Product name is required", variant: "destructive" })
      return
    }
    setIsUpdating(true)
    try {
      const res = await updateProduct(editingProduct.id, {
        name: editFormData.name,
        category: editFormData.category,
        price: Number(editFormData.price),
        stock: Number(editFormData.stock),
        description: editFormData.description,
        image: editFormData.image,
        rating: editingProduct.rating || 5,
        features: editingProduct.features || [],
        type: editingProduct.type || "physical",
        swatchImages: editingProduct.swatchImages || []
      })
      if (!res.success) {
        throw new Error(res.error || "Failed to update product")
      }
      toast({ title: "Product Updated", description: `Successfully updated ${editFormData.name}` })
      setIsEditOpen(false)
      setEditingProduct(null)
      loadData()
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteProduct = async () => {
    if (!productToDelete) return
    setIsDeleting(true)
    try {
      const res = await deleteProduct(productToDelete.id)
      if (!res.success) {
        throw new Error(res.error || "Failed to delete product")
      }
      toast({ title: "Product Deleted", description: `Removed "${productToDelete.name}" from inventory and catalog` })
      setProductToDelete(null)
      loadData()
    } catch (err: any) {
      toast({ title: "Delete Failed", description: err.message, variant: "destructive" })
    } finally {
      setIsDeleting(false)
    }
  }

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [overview, prodsList, whList, movList, catsList] = await Promise.all([
        getInventoryOverview(),
        getProducts(),
        getWarehouses(),
        getStockMovements({ limit: 50 }),
        getCategories().catch(() => [])
      ])

      setTotalProducts(overview.totalProducts)
      setTotalStockUnits(overview.totalStockUnits)
      setTotalStockValue(overview.totalStockValue)
      setLowStockCount(overview.lowStockCount)
      setOutOfStockCount(overview.outOfStockCount)

      setProducts(prodsList || [])
      setWarehouses(whList || [])
      setMovements(movList || [])
      setCategories(catsList || [])

      const uniqueCategories = Array.from(new Set([
        ...(catsList?.map(c => c.name) || []),
        ...(prodsList?.map(p => p.category) || [])
      ])).filter(Boolean)
      setCategoriesList(uniqueCategories)
    } catch (err: any) {
      toast({ title: "Error Loading Inventory", description: err.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateProduct = async (productData: ProductFormData) => {
    const result = await createProduct(productData)
    if (result.success) {
      toast({
        title: "Success",
        description: "Product created successfully",
      })
      setIsAddDialogOpen(false)
      loadData()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to create product",
        variant: "destructive",
      })
    }
  }

  // Handle Transfer
  const handleExecuteTransfer = async () => {
    if (!transferProductId || !transferSourceWh || !transferDestWh || transferQty <= 0) {
      toast({ title: "Invalid Input", description: "Select product, source, destination, and valid quantity.", variant: "destructive" })
      return
    }

    if (transferSourceWh === transferDestWh) {
      toast({ title: "Invalid Route", description: "Source and destination warehouses cannot be identical.", variant: "destructive" })
      return
    }

    const prod = products.find(p => String(p.id) === String(transferProductId))
    if (!prod) {
      toast({ title: "Product Not Found", description: "Please select a valid product.", variant: "destructive" })
      return
    }

    if (transferQty > (Number(prod.stock) || 0)) {
      toast({ 
        title: "Insufficient Stock", 
        description: `Cannot transfer ${transferQty} units. Only ${prod.stock || 0} available.`, 
        variant: "destructive" 
      })
      return
    }

    setIsTransferring(true)
    try {
      await transferStockBetweenWarehouses({
        productId: prod.id,
        productName: prod.name,
        sourceWarehouseId: transferSourceWh,
        destinationWarehouseId: transferDestWh,
        quantity: transferQty,
        reason: transferReason || "Standard Warehouse Rebalancing"
      })

      toast({ title: "Stock Transferred", description: `Successfully moved ${transferQty} units of ${prod.name}.` })
      setIsTransferOpen(false)
      setTransferReason("")
      loadData()
    } catch (err: any) {
      toast({ title: "Transfer Failed", description: err.message, variant: "destructive" })
    } finally {
      setIsTransferring(false)
    }
  }

  // Handle Adjustment
  const handleExecuteAdjustment = async () => {
    if (!adjustProductId || adjustQty === 0) {
      toast({ title: "Invalid Input", description: "Select product and enter non-zero adjustment quantity.", variant: "destructive" })
      return
    }

    const prod = products.find(p => String(p.id) === String(adjustProductId))
    if (!prod) {
      toast({ title: "Product Not Found", description: "Please select a valid product.", variant: "destructive" })
      return
    }

    setIsAdjusting(true)
    try {
      await recordStockMovement({
        productId: prod.id,
        productName: prod.name,
        warehouseId: adjustWh || warehouses[0]?.id || "wh-dar-main",
        movementType: adjustType,
        quantity: adjustQty,
        reason: adjustReason || "Audited Manual Adjustment",
        performedBy: "Administrator"
      })

      toast({ title: "Stock Adjusted", description: `Updated ${prod.name} by ${adjustQty > 0 ? "+" : ""}${adjustQty} units.` })
      setIsAdjustOpen(false)
      setAdjustReason("")
      loadData()
    } catch (err: any) {
      toast({ title: "Adjustment Failed", description: err.message, variant: "destructive" })
    } finally {
      setIsAdjusting(false)
    }
  }

  const formatStatNumber = (num: number) => {
    const n = Number(num) || 0
    if (n >= 1_000_000) {
      const millions = n / 1_000_000
      return millions % 1 === 0 ? `${millions.toFixed(0)}M` : `${millions.toFixed(1)}M`
    }
    if (n >= 1_000) {
      const thousands = n / 1_000
      return thousands % 1 === 0 ? `${thousands.toFixed(0)}K` : `${thousands.toFixed(1)}K`
    }
    return n.toLocaleString()
  }

  const formatStatCurrency = (num: number) => {
    const n = Number(num) || 0
    if (n >= 1_000_000) {
      const millions = n / 1_000_000
      const formatted = millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)
      return `TSH ${formatted}M`
    }
    if (n >= 1_000) {
      const thousands = n / 1_000
      const formatted = thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)
      return `TSH ${formatted}K`
    }
    return `TSH ${n.toLocaleString()}`
  }

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchesSearch) return false
    if (selectedWarehouseFilter === "low_stock") return (Number(p.stock) || 0) > 0 && (Number(p.stock) || 0) <= 5
    if (selectedWarehouseFilter === "out_of_stock") return (Number(p.stock) || 0) === 0
    return true
  })

  const filteredMovements = movements.filter(m => {
    if (movementTypeFilter !== "all" && m.movement_type !== movementTypeFilter) return false
    if (searchQuery) {
      return (
        m.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.movement_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.reason && m.reason.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }
    return true
  })

  const getMovementBadge = (type: StockMovementType) => {
    switch (type) {
      case "purchase_received":
      case "transfer_in":
      case "sales_return":
        return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] font-bold uppercase">{type.replace(/_/g, " ")}</Badge>
      case "sales_deduction":
      case "transfer_out":
      case "purchase_return":
        return <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px] font-bold uppercase">{type.replace(/_/g, " ")}</Badge>
      case "damage_loss":
        return <Badge className="bg-rose-500/15 text-rose-400 border-rose-500/30 text-[10px] font-bold uppercase">Damage / Loss</Badge>
      default:
        return <Badge variant="outline" className="text-[10px] font-bold uppercase">{type.replace(/_/g, " ")}</Badge>
    }
  }

  if (isLoading) return <AdminLoading />

  return (
    <div className="w-full space-y-6">
      {/* 1. Header Banner */}
      <div className={cn(
        "p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0 mb-6",
        isDark ? "bg-[#0a1033] border-none text-white shadow-none" : "bg-teal text-navy"
      )}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-1">
              Inventory <span className={cn(isDark ? "text-teal-400" : "text-white", "drop-shadow-sm")}>& Stock</span>
            </h1>
            <p className={cn("text-sm sm:text-base font-semibold", isDark ? "text-teal-300" : "text-navy/90")}>
              Live stock valuation, auditable movements ledger, reorder monitoring, and multi-warehouse transfers
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 ml-auto shrink-0 w-full sm:w-auto">
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 sm:h-11 px-4 sm:px-5 gap-2 shadow-lg transition-all active:scale-95 shrink-0"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
            <Button
              onClick={() => {
                if (warehouses.length >= 2) {
                  setTransferSourceWh(warehouses[0].id)
                  setTransferDestWh(warehouses[1].id)
                }
                if (!transferProductId && products.length > 0) {
                  setTransferProductId(products[0].id)
                }
                setIsTransferOpen(true)
              }}
              className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 sm:h-11 px-4 gap-2 shadow-lg transition-all active:scale-95 shrink-0"
            >
              <ArrowRightLeft className="h-4 w-4" />
              Stock Transfer
            </Button>
            <Button
              onClick={() => {
                if (!adjustProductId && products.length > 0) {
                  setAdjustProductId(products[0].id)
                }
                setIsAdjustOpen(true)
              }}
              className="bg-white hover:bg-teal-50 text-navy font-bold rounded-xl h-10 sm:h-11 px-4 gap-2 shadow-lg transition-all active:scale-95 border-2 border-navy/20 shrink-0"
            >
              <SlidersHorizontal className="h-4 w-4 text-navy" />
              Adjust Stock
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {[
          {
            title: "Total SKUs",
            value: totalProducts.toString(),
            icon: Boxes,
          },
          {
            title: "Stock Units",
            value: formatStatNumber(totalStockUnits),
            icon: PackageCheck,
          },
          {
            title: "Stock Value",
            value: formatStatCurrency(totalStockValue),
            icon: DollarSign,
          },
          {
            title: "Low Stock Alert",
            value: lowStockCount.toString(),
            icon: AlertTriangle,
          },
          {
            title: "Out of Stock",
            value: outOfStockCount.toString(),
            icon: AlertTriangle,
          }
        ].map((stat, idx) => {
          const Icon = stat.icon
          return (
            <Card
              key={idx}
              className={cn(
                "rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer overflow-hidden",
                isDark 
                  ? "bg-[#0a1033] border-none shadow-md hover:bg-[#0c1438]" 
                  : "bg-white border-2 border-navy/20 shadow-sm hover:border-navy hover:shadow-md",
                idx === 4 ? "col-span-2 lg:col-span-1" : ""
              )}
            >
              <CardContent className="p-3.5 sm:p-4.5 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className={cn("text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-1 truncate block", isDark ? "text-teal-400/80" : "text-navy/70")}>
                    {stat.title}
                  </p>
                  <span className={cn("text-lg sm:text-xl xl:text-2xl font-black truncate block leading-tight tracking-tight", isDark ? "text-white" : "text-navy")}>
                    {stat.value}
                  </span>
                </div>
                <div className={cn(
                  "w-10 h-10 sm:w-11 sm:h-11 rounded-full border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
                  isDark 
                    ? "bg-navy border-teal/30 text-teal group-hover:bg-navy/80" 
                    : "bg-teal-100/80 border-navy/15 text-navy group-hover:bg-teal-200"
                )}>
                  <Icon className={cn("h-5 w-5 shrink-0", isDark ? "text-teal" : "")} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 3. Navigation Tabs */}
      <div className="space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab("stock")}
            className={cn(
              "px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5",
              activeTab === "stock"
                ? "bg-navy text-white shadow-md"
                : isDark 
                  ? "text-slate-300 hover:bg-teal-400/10 hover:text-teal-300" 
                  : "text-navy/70 hover:bg-teal-50 hover:text-navy"
            )}
          >
            <PackageCheck className={cn("h-4 w-4 shrink-0 transition-colors", activeTab === "stock" ? "text-white" : isDark ? "text-slate-400" : "text-navy/60")} />
            <span>Stock Levels</span>
            <span className={cn(
              "ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold transition-colors",
              activeTab === "stock"
                ? "bg-white/20 text-white"
                : isDark ? "bg-slate-800 text-slate-300" : "bg-navy/10 text-navy"
            )}>
              {products.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("movements")}
            className={cn(
              "px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5",
              activeTab === "movements"
                ? "bg-navy text-white shadow-md"
                : isDark 
                  ? "text-slate-300 hover:bg-teal-400/10 hover:text-teal-300" 
                  : "text-navy/70 hover:bg-teal-50 hover:text-navy"
            )}
          >
            <History className={cn("h-4 w-4 shrink-0 transition-colors", activeTab === "movements" ? "text-white" : isDark ? "text-slate-400" : "text-navy/60")} />
            <span>Movements Ledger</span>
            <span className={cn(
              "ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold transition-colors",
              activeTab === "movements"
                ? "bg-white/20 text-white"
                : isDark ? "bg-slate-800 text-slate-300" : "bg-navy/10 text-navy"
            )}>
              {movements.length}
            </span>
          </button>
        </div>

        {/* Content Container with 4-Corner Rounded Border */}
        <div className={cn(
          "border-2 border-navy/15 dark:border-teal/20 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm space-y-4 relative z-0",
          isDark ? "bg-[#0c1833]" : "bg-white"
        )}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy/50 dark:text-teal-400/80" />
              <Input
                placeholder={activeTab === "stock" ? "Search product or category..." : "Search movements ledger..."}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={cn(
                  "pl-9 h-10 rounded-xl text-xs sm:text-sm font-medium border border-slate-300 dark:border-slate-600",
                  isDark ? "bg-[#080d2a] text-white placeholder:text-slate-400" : "bg-white text-navy placeholder:text-navy/50"
                )}
              />
            </div>

            {activeTab === "stock" ? (
              <Select value={selectedWarehouseFilter} onValueChange={setSelectedWarehouseFilter}>
                <SelectTrigger className={cn(
                  "h-10 rounded-xl text-xs font-bold w-44 border border-slate-300 dark:border-slate-600",
                  isDark ? "bg-[#080d2a] text-white" : "bg-white text-navy"
                )}>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="low_stock">Low Stock (≤ 5)</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock (0)</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Select value={movementTypeFilter} onValueChange={setMovementTypeFilter}>
                <SelectTrigger className={cn(
                  "h-10 rounded-xl text-xs font-bold w-44 border border-slate-300 dark:border-slate-600",
                  isDark ? "bg-[#080d2a] text-white" : "bg-white text-navy"
                )}>
                  <SelectValue placeholder="All Movement Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="purchase_received">Purchase Received</SelectItem>
                  <SelectItem value="sales_deduction">Sales Deduction</SelectItem>
                  <SelectItem value="transfer_out">Transfer Out</SelectItem>
                  <SelectItem value="transfer_in">Transfer In</SelectItem>
                  <SelectItem value="manual_adjustment">Manual Adjustment</SelectItem>
                  <SelectItem value="damage_loss">Damage & Loss</SelectItem>
                </SelectContent>
              </Select>
            )}

            <Button onClick={loadData} variant="outline" size="icon" className={cn("h-10 w-10 rounded-xl border-2 shrink-0", isDark ? "border-slate-700 text-teal-300 hover:bg-teal-400/15" : "border-navy/20 bg-white text-navy hover:bg-teal-50")}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

      {/* 4. Tab 1: Current Stock Table */}
      {activeTab === "stock" && (
        <Card className={cn(
          "rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl",
          isDark ? "bg-[#0a1033] border-none shadow-lg" : "bg-white border-2 border-navy/20 shadow-md hover:border-navy"
        )}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 text-xs uppercase tracking-wider font-black bg-navy text-white border-navy/30">
                  <th className="text-left py-2.5 sm:py-3 px-3 md:px-4"><span className="hidden sm:inline">Product Name</span><span className="sm:hidden">Product</span></th>
                  <th className="text-left py-2.5 sm:py-3 px-2 md:px-3">Category</th>
                  <th className="text-right py-2.5 sm:py-3 px-2 md:px-3">Price</th>
                  <th className="text-center py-2.5 sm:py-3 px-2 md:px-3">Stock</th>
                  <th className="text-right py-2.5 sm:py-3 px-3 md:px-4">Actions</th>
                </tr>
              </thead>
              <tbody className={cn("divide-y", isDark ? "divide-slate-800" : "divide-slate-100")}>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center font-semibold text-navy/60 dark:text-teal-400/80">
                      No stock items found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(p => {
                    const stock = Number(p.stock) || 0
                    return (
                      <tr
                        key={p.id}
                        onClick={() => {
                          setSelectedProduct(p)
                          setIsViewOpen(true)
                        }}
                        className={cn(
                          "border-b transition-colors cursor-pointer group",
                          isDark ? "border-teal/10 hover:bg-teal/30 hover:text-white" : "border-navy/10 hover:bg-teal/50 hover:text-navy"
                        )}
                      >
                        <td className="py-2.5 sm:py-3 px-3 md:px-4 font-bold">
                          <div className="flex items-center gap-2.5">
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border p-1", isDark ? "bg-navy border-teal/30" : "bg-teal border-teal/40")}>
                              <img src={p.image || "/placeholder.jpg"} alt={p.name} className="w-full h-full object-contain" />
                            </div>
                            <div className="min-w-0">
                              <p className={cn("text-xs sm:text-sm font-black truncate max-w-[140px] md:max-w-xs", isDark ? "text-white" : "text-navy")}>{p.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">SKU: QCL-PRD-{p.id.toString().padStart(4, "0")}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 sm:py-3 px-2 md:px-3 whitespace-nowrap">
                          <span 
                            className={cn(
                              "px-2 py-0.5 rounded-lg border font-extrabold uppercase tracking-wider text-[11px] inline-block",
                              isDark ? "bg-white/10 border-white/20 text-white" : "bg-navy/5 border-navy/10 text-navy"
                            )}
                            title={p.category}
                          >
                            {getCategoryAbbreviation(p.category)}
                          </span>
                        </td>
                        <td className="py-2.5 sm:py-3 px-2 md:px-3 text-right font-mono font-black text-xs whitespace-nowrap">
                          TSH {Number(p.price).toLocaleString()}
                        </td>
                        <td className="py-2.5 sm:py-3 px-2 md:px-3 text-center whitespace-nowrap">
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-xs font-black font-mono inline-flex items-center gap-1.5",
                            stock === 0 
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" 
                              : stock <= 5 
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" 
                              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          )}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", stock === 0 ? "bg-rose-500" : stock <= 5 ? "bg-amber-500" : "bg-emerald-500")} />
                            {stock} {stock === 1 ? "Unit" : "Units"}
                          </span>
                        </td>
                        <td className="py-2.5 sm:py-3 px-3 md:px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1 sm:gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                setSelectedProduct(p)
                                setIsViewOpen(true)
                              }}
                              className={cn(
                                "p-1.5 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer inline-flex items-center justify-center",
                                isDark ? "bg-navy border border-teal/40 text-teal hover:bg-teal hover:text-navy" : "bg-navy text-white hover:bg-navy/90"
                              )}
                              title="View Product Details"
                            >
                              <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className={cn(
                                "p-1.5 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer inline-flex items-center justify-center",
                                isDark ? "bg-white/10 text-white hover:bg-white hover:text-navy" : "bg-navy/10 text-navy hover:bg-navy hover:text-white"
                              )}
                              title="Edit Product"
                            >
                              <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </button>
                            <button
                              onClick={() => setProductToDelete(p)}
                              className={cn(
                                "p-1.5 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer inline-flex items-center justify-center",
                                isDark ? "bg-teal/15 text-white hover:bg-teal hover:text-navy" : "bg-red-50 text-brand-red hover:bg-red-500 hover:text-white"
                              )}
                              title="Delete Product"
                            >
                              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 5. Tab 2: Stock Movements Auditable Ledger */}
      {activeTab === "movements" && (
        <Card className={cn(
          "rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl",
          isDark ? "bg-[#0a1033] border-none shadow-lg" : "bg-white border-2 border-navy/20 shadow-md hover:border-navy"
        )}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 text-xs uppercase tracking-wider font-black bg-navy text-white border-navy/30">
                  <th className="text-left py-2.5 sm:py-3 px-3 md:px-4"><span className="hidden sm:inline">Movement #</span><span className="sm:hidden">Mov #</span></th>
                  <th className="text-left py-2.5 sm:py-3 px-2 md:px-3"><span className="hidden sm:inline">Product Name</span><span className="sm:hidden">Product</span></th>
                  <th className="text-left py-2.5 sm:py-3 px-2 md:px-3"><span className="hidden sm:inline">Type</span><span className="sm:hidden">Type</span></th>
                  <th className="text-center py-2.5 sm:py-3 px-2 md:px-3"><span className="hidden sm:inline">Qty Change</span><span className="sm:hidden">Qty</span></th>
                  <th className="text-center py-2.5 sm:py-3 px-2 md:px-3"><span className="hidden sm:inline">Balance</span><span className="sm:hidden">Bal</span></th>
                  <th className="text-left py-2.5 sm:py-3 px-2 md:px-3"><span className="hidden sm:inline">Reason / Reference</span><span className="sm:hidden">Ref</span></th>
                  <th className="text-left py-2.5 sm:py-3 px-3 md:px-4"><span className="hidden sm:inline">Date & Time</span><span className="sm:hidden">Date</span></th>
                </tr>
              </thead>
              <tbody className={cn("divide-y", isDark ? "divide-slate-800" : "divide-slate-100")}>
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center font-semibold text-navy/60 dark:text-teal-400/80">
                      No stock movement audit records found.
                    </td>
                  </tr>
                ) : (
                  filteredMovements.map(m => (
                    <tr
                      key={m.id}
                      className={cn(
                        "border-b transition-colors cursor-pointer group",
                        isDark ? "border-teal/10 hover:bg-teal/30 hover:text-white" : "border-navy/10 hover:bg-teal/50 hover:text-navy"
                      )}
                    >
                      <td className="py-2.5 sm:py-3 px-3 md:px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm border",
                            isDark ? "bg-navy text-teal border-teal/30" : "bg-teal text-navy border-teal/40"
                          )}>
                            <History className={cn("h-3.5 w-3.5", isDark ? "text-teal" : "text-navy")} />
                          </div>
                          <span className={cn("font-mono text-xs font-bold", isDark ? "text-teal-400" : "text-navy")}>
                            #{m.movement_number}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 sm:py-3 px-2 md:px-3 font-bold">
                        <p className={cn("text-xs sm:text-sm truncate max-w-[150px] md:max-w-xs", isDark ? "text-white" : "text-navy")}>{m.product_name}</p>
                      </td>
                      <td className="py-2.5 sm:py-3 px-2 md:px-3 whitespace-nowrap">
                        {getMovementBadge(m.movement_type)}
                      </td>
                      <td className="py-2.5 sm:py-3 px-2 md:px-3 text-center font-mono font-black text-xs sm:text-sm whitespace-nowrap">
                        <span className={m.quantity >= 0 ? "text-emerald-500" : "text-rose-500"}>
                          {m.quantity >= 0 ? `+${m.quantity}` : m.quantity}
                        </span>
                      </td>
                      <td className="py-2.5 sm:py-3 px-2 md:px-3 text-center font-mono text-xs font-bold text-slate-400 whitespace-nowrap">
                        {m.previous_quantity} ➔ <span className={cn(isDark ? "text-white" : "text-navy")}>{m.new_quantity}</span>
                      </td>
                      <td className="py-2.5 sm:py-3 px-2 md:px-3 text-xs font-medium">
                        <p className="font-semibold truncate max-w-[130px] md:max-w-xs">{m.reason || "—"}</p>
                        {m.reference_number && <p className={cn("text-[10px] font-mono", isDark ? "text-teal-400" : "text-navy/70")}>Ref: {m.reference_number}</p>}
                      </td>
                      <td className="py-2.5 sm:py-3 px-3 md:px-4 text-xs text-slate-400 font-mono whitespace-nowrap">
                        {new Date(m.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      </div>
      </div>

      {/* MODAL: CREATE / ADD PRODUCT */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className={cn(
          "sm:max-w-[620px] max-h-[90vh] overflow-y-auto rounded-3xl border-2",
          isDark ? "bg-[#0a1033] text-white border-teal/20" : "bg-white text-navy border-navy/20 shadow-2xl"
        )}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-xl font-black">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border", isDark ? "bg-navy text-teal border-teal/30" : "bg-teal text-navy border-teal/40")}>
                <Plus className={cn("h-4 w-4", isDark ? "text-teal" : "text-navy")} />
              </div>
              Create New Product
            </DialogTitle>
            <DialogDescription className="text-xs">
              Add a new product to your inventory stock and storefront catalog.
            </DialogDescription>
          </DialogHeader>
          <ProductForm
            categories={categories}
            onSubmit={handleCreateProduct}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* 6. MODAL 1: STOCK TRANSFER BETWEEN WAREHOUSES */}
      <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
        <DialogContent className={cn(
          "max-w-xl rounded-3xl max-h-[90vh] overflow-y-auto border-2",
          isDark ? "bg-[#0a1033] text-white border-teal/20" : "bg-white text-navy border-navy/20 shadow-2xl"
        )}>
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2 text-navy dark:text-white">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border", isDark ? "bg-navy text-teal border-teal/30" : "bg-teal text-navy border-teal/40")}>
                <ArrowRightLeft className={cn("h-4 w-4", isDark ? "text-teal" : "text-navy")} />
              </div>
              Warehouse Stock Transfer
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-slate-400">
              Move authenticated product inventory between physical hubs and branch locations.
            </DialogDescription>
          </DialogHeader>

          <div className="pt-2">
            <div className={cn(
              "p-5 rounded-2xl transition-all space-y-4",
              isDark ? "bg-teal/15 border border-teal/40 text-white" : "bg-teal/15 border-2 border-navy text-navy"
            )}>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-navy/80 dark:text-teal-400/80">
                  Select Product *
                </Label>
                <Select value={transferProductId ? String(transferProductId) : ""} onValueChange={val => setTransferProductId(Number(val))}>
                  <SelectTrigger className={cn("h-11 rounded-xl text-sm font-medium border border-slate-300 dark:border-slate-600", isDark ? "bg-[#080d2a] text-white" : "bg-white text-navy")}>
                    <SelectValue placeholder="Choose product..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name} (Stock: {p.stock} units)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-navy/80 dark:text-teal-400/80">
                    Source Warehouse *
                  </Label>
                  <Select value={transferSourceWh} onValueChange={setTransferSourceWh}>
                    <SelectTrigger className={cn("h-11 rounded-xl text-sm font-medium border border-slate-300 dark:border-slate-600", isDark ? "bg-[#080d2a] text-white" : "bg-white text-navy")}>
                      <SelectValue placeholder="Source..." />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map(w => (
                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-navy/80 dark:text-teal-400/80">
                    Destination Warehouse *
                  </Label>
                  <Select value={transferDestWh} onValueChange={setTransferDestWh}>
                    <SelectTrigger className={cn("h-11 rounded-xl text-sm font-medium border border-slate-300 dark:border-slate-600", isDark ? "bg-[#080d2a] text-white" : "bg-white text-navy")}>
                      <SelectValue placeholder="Destination..." />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map(w => (
                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-navy/80 dark:text-teal-400/80">
                  Transfer Quantity *
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={transferQty}
                  onChange={e => setTransferQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className={cn("h-11 rounded-xl text-sm font-mono font-bold border border-slate-300 dark:border-slate-600", isDark ? "bg-[#080d2a] text-white" : "bg-white text-navy")}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-navy/80 dark:text-teal-400/80">
                  Transfer Notes / Reason
                </Label>
                <Input
                  placeholder="e.g. Showroom restocking or client allocation"
                  value={transferReason}
                  onChange={e => setTransferReason(e.target.value)}
                  className={cn("h-11 rounded-xl text-sm font-medium border border-slate-300 dark:border-slate-600", isDark ? "bg-[#080d2a] text-white" : "bg-white text-navy")}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsTransferOpen(false)}
              className="h-11 rounded-xl px-5 font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExecuteTransfer}
              disabled={isTransferring}
              className="h-11 rounded-xl px-6 bg-navy hover:bg-navy/90 text-white font-bold transition-all shadow-md active:scale-95"
            >
              {isTransferring ? "Transferring..." : "Execute Transfer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 7. MODAL 2: MANUAL STOCK ADJUSTMENT */}
      <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
        <DialogContent className={cn(
          "max-w-xl rounded-3xl max-h-[90vh] overflow-y-auto border-2",
          isDark ? "bg-[#0a1033] text-white border-teal/20" : "bg-white text-navy border-navy/20 shadow-2xl"
        )}>
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2 text-navy dark:text-white">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border", isDark ? "bg-navy text-teal border-teal/30" : "bg-teal text-navy border-teal/40")}>
                <SlidersHorizontal className={cn("h-4 w-4", isDark ? "text-teal" : "text-navy")} />
              </div>
              Manual Stock Adjustment
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-slate-400">
              Audited quantity adjustment with mandatory business reason.
            </DialogDescription>
          </DialogHeader>

          <div className="pt-2">
            <div className={cn(
              "p-5 rounded-2xl transition-all space-y-4",
              isDark ? "bg-teal/15 border border-teal/40 text-white" : "bg-teal/15 border-2 border-navy text-navy"
            )}>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-navy/80 dark:text-teal-400/80">
                  Select Product *
                </Label>
                <Select value={adjustProductId ? String(adjustProductId) : ""} onValueChange={val => setAdjustProductId(Number(val))}>
                  <SelectTrigger className={cn("h-11 rounded-xl text-sm font-medium border border-slate-300 dark:border-slate-600", isDark ? "bg-[#080d2a] text-white" : "bg-white text-navy")}>
                    <SelectValue placeholder="Choose product..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name} (Current Stock: {p.stock} units)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-navy/80 dark:text-teal-400/80">
                    Adjustment Type
                  </Label>
                  <Select value={adjustType} onValueChange={(val: any) => setAdjustType(val)}>
                    <SelectTrigger className={cn("h-11 rounded-xl text-sm font-medium border border-slate-300 dark:border-slate-600", isDark ? "bg-[#080d2a] text-white" : "bg-white text-navy")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual_adjustment">Manual Adjustment</SelectItem>
                      <SelectItem value="opening_stock">Opening Stock Count</SelectItem>
                      <SelectItem value="damage_loss">Damaged / Lost Stock</SelectItem>
                      <SelectItem value="audit_correction">Audit Physical Count</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-navy/80 dark:text-teal-400/80">
                    Warehouse
                  </Label>
                  <Select value={adjustWh || warehouses[0]?.id} onValueChange={setAdjustWh}>
                    <SelectTrigger className={cn("h-11 rounded-xl text-sm font-medium border border-slate-300 dark:border-slate-600", isDark ? "bg-[#080d2a] text-white" : "bg-white text-navy")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map(w => (
                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-navy/80 dark:text-teal-400/80">
                  Quantity Change (+ to add, - to subtract) *
                </Label>
                <Input
                  type="number"
                  value={adjustQty}
                  onChange={e => setAdjustQty(parseInt(e.target.value) || 0)}
                  className={cn("h-11 rounded-xl text-sm font-mono font-bold border border-slate-300 dark:border-slate-600", isDark ? "bg-[#080d2a] text-white" : "bg-white text-navy")}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-navy/80 dark:text-teal-400/80">
                  Reason *
                </Label>
                <Input
                  placeholder="e.g. Physical inventory count discrepancy resolved"
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className={cn("h-11 rounded-xl text-sm font-medium border-2 border-navy/20", isDark ? "bg-[#080d2a] text-white border-slate-700" : "bg-white text-navy")}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAdjustOpen(false)}
              className="h-11 rounded-xl px-5 font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExecuteAdjustment}
              disabled={isAdjusting}
              className="h-11 rounded-xl px-6 bg-navy hover:bg-navy/90 text-white font-bold transition-all shadow-md active:scale-95"
            >
              {isAdjusting ? "Applying..." : "Save Stock Adjustment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PRODUCT DETAILS MODAL (Item 01 & Item 03 Theme) */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className={cn(
          "w-[95vw] sm:max-w-4xl max-h-[92vh] overflow-y-auto p-4 sm:p-7 rounded-2xl sm:rounded-3xl border-2 shadow-2xl",
          isDark ? "bg-[#0a1033] border-teal/20 text-white" : "bg-slate-50 border-navy/20 text-navy"
        )}>
          <DialogHeader className="sr-only">
            <DialogTitle>{selectedProduct?.name || "Product Details"}</DialogTitle>
            <DialogDescription>Product inventory specifications, valuation and stock breakdown</DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-6">
              {/* Top Bar Header Navigation */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-navy/10 dark:border-teal/20 pb-4">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0 border p-2 shadow-md",
                    isDark ? "bg-navy border-teal/30" : "bg-white border-navy/20"
                  )}>
                    <img 
                      src={selectedProduct.image || "/placeholder.jpg"} 
                      alt={selectedProduct.name} 
                      className="w-full h-full object-contain" 
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className={cn("text-xl sm:text-2xl font-black tracking-tight", isDark ? "text-white" : "text-navy")}>
                        {selectedProduct.name}
                      </h2>
                      <Badge variant="outline" className={cn("text-xs font-semibold border py-0.5 px-2.5", isDark ? "border-teal/40 bg-teal/10 text-teal-300" : "border-navy/20 bg-slate-50 text-navy font-bold")}>
                        {selectedProduct.category}
                      </Badge>
                    </div>
                    <p className={cn("text-xs sm:text-sm font-medium mt-1 font-mono", isDark ? "text-teal-400/80" : "text-navy/70")}>
                      SKU: QCL-PRD-{selectedProduct.id.toString().padStart(4, "0")}
                      {(selectedProduct as any).created_at && ` • Added: ${new Date((selectedProduct as any).created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsViewOpen(false)
                      handleOpenEdit(selectedProduct)
                    }}
                    className={cn("font-bold rounded-xl shadow-xs flex items-center gap-1.5 h-9 px-3 text-xs border-2", isDark ? "border-teal/40 text-teal-300 hover:bg-teal/20" : "border-navy/20 text-navy hover:bg-slate-100")}
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setIsViewOpen(false)
                      setAdjustProductId(selectedProduct.id)
                      setAdjustQty(0)
                      setIsAdjustOpen(true)
                    }}
                    className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5 h-9 px-3.5 text-xs"
                  >
                    <SlidersHorizontal className="h-4 w-4 text-teal" />
                    Adjust Stock
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsViewOpen(false)
                      setTransferProductId(selectedProduct.id)
                      if (warehouses.length >= 2) {
                        setTransferSourceWh(warehouses[0].id)
                        setTransferDestWh(warehouses[1].id)
                      }
                      setIsTransferOpen(true)
                    }}
                    className={cn("font-bold rounded-xl shadow-xs flex items-center gap-1.5 h-9 px-3.5 text-xs border-2", isDark ? "border-teal/40 text-teal-300 hover:bg-teal/20" : "border-navy/20 text-navy hover:bg-slate-100")}
                  >
                    <ArrowRightLeft className="h-4 w-4" />
                    Transfer
                  </Button>
                </div>
              </div>

              {/* 2-Column Responsive Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Left 2 Columns: Overview & Description */}
                <div className="lg:col-span-2 space-y-5">
                  <div className={cn(
                    "p-5 rounded-2xl transition-all space-y-3",
                    isDark ? "bg-teal/15 border border-teal/40 text-white" : "bg-teal/15 border-2 border-navy text-navy"
                  )}>
                    <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border-b border-navy/10 dark:border-teal/20 pb-2">
                      <Package className="h-3.5 w-3.5" />
                      <span>Product Overview & Description</span>
                    </h4>
                    <p className="text-xs sm:text-sm leading-relaxed opacity-95">
                      {selectedProduct.description || "Comprehensive enterprise technology hardware unit, validated for performance across industrial and laboratory applications."}
                    </p>
                  </div>

                  <div className={cn(
                    "p-5 rounded-2xl transition-all space-y-3",
                    isDark ? "bg-teal/15 border border-teal/40 text-white" : "bg-teal/15 border-2 border-navy text-navy"
                  )}>
                    <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border-b border-navy/10 dark:border-teal/20 pb-2">
                      <Tag className="h-3.5 w-3.5" />
                      <span>Specifications & Metadata</span>
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono">
                      <div>
                        <span className="opacity-75 block text-[10px] uppercase font-bold">Category</span>
                        <span className="font-bold">{selectedProduct.category}</span>
                      </div>
                      <div>
                        <span className="opacity-75 block text-[10px] uppercase font-bold">System ID</span>
                        <span className="font-bold">PRD-{selectedProduct.id}</span>
                      </div>
                      <div>
                        <span className="opacity-75 block text-[10px] uppercase font-bold">Inventory Unit</span>
                        <span className="font-bold">Piece (Unit)</span>
                      </div>
                      <div>
                        <span className="opacity-75 block text-[10px] uppercase font-bold">Reorder Alert</span>
                        <span className="font-bold text-amber-500">≤ 5 Units</span>
                      </div>
                      <div>
                        <span className="opacity-75 block text-[10px] uppercase font-bold">Stock Availability</span>
                        <span className="font-bold">{Number(selectedProduct.stock) > 0 ? "In Stock" : "Out of Stock"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Inventory Status & Valuation Cards */}
                <div className="space-y-5">
                  <div className={cn(
                    "p-5 rounded-2xl transition-all space-y-3",
                    isDark ? "bg-teal/15 border border-teal/40 text-white" : "bg-teal/15 border-2 border-navy text-navy"
                  )}>
                    <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border-b border-navy/10 dark:border-teal/20 pb-2">
                      <Boxes className="h-3.5 w-3.5" />
                      <span>Current Inventory Status</span>
                    </h4>
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between items-center">
                        <span className="opacity-80">Available Units:</span>
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-xs font-black inline-block",
                          Number(selectedProduct.stock) === 0 ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : Number(selectedProduct.stock) <= 5 ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        )}>
                          {Number(selectedProduct.stock) || 0} Units
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="opacity-80">Warehouse:</span>
                        <span className="font-bold">Main Lab Warehouse</span>
                      </div>
                    </div>
                  </div>

                  <div className={cn(
                    "p-5 rounded-2xl transition-all space-y-3",
                    isDark ? "bg-teal/15 border border-teal/40 text-white" : "bg-teal/15 border-2 border-navy text-navy"
                  )}>
                    <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border-b border-navy/10 dark:border-teal/20 pb-2">
                      <DollarSign className="h-3.5 w-3.5" />
                      <span>Commercial & Valuation</span>
                    </h4>
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="opacity-80">Unit Selling Price:</span>
                        <span className="font-bold">TSH {Number(selectedProduct.price).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t border-navy/20 dark:border-teal/40 pt-2 text-sm font-black">
                        <span className="uppercase">Stock Valuation:</span>
                        <span>TSH {(Number(selectedProduct.stock || 0) * Number(selectedProduct.price || 0)).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 8. Edit Product Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className={cn(
          "max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 shadow-2xl border-2",
          isDark ? "bg-[#0a1033] border-teal/40 text-white" : "bg-white border-navy text-navy"
        )}>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", isDark ? "bg-teal/20 text-teal" : "bg-navy text-white")}>
                <Edit className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className={cn("text-xl sm:text-2xl font-black tracking-tight", isDark ? "text-white" : "text-navy")}>
                  Edit Product
                </DialogTitle>
                <DialogDescription className={cn("text-xs font-medium mt-0.5", isDark ? "text-slate-300" : "text-navy/70")}>
                  Update catalog specifications, pricing and stock levels.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {editingProduct && (
            <div className="space-y-4 pt-2">
              <div className={cn(
                "p-5 rounded-2xl transition-all space-y-4",
                isDark ? "bg-teal/15 border border-teal/40 text-white" : "bg-teal/15 border-2 border-navy text-navy"
              )}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-black uppercase tracking-wider">Product Name *</Label>
                    <Input
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className={cn("h-9 rounded-xl text-xs font-bold", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                      placeholder="e.g. Dell PowerEdge Server R750"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-black uppercase tracking-wider">Category *</Label>
                    <Select
                      value={editFormData.category}
                      onValueChange={(val) => setEditFormData({ ...editFormData, category: val })}
                    >
                      <SelectTrigger className={cn("h-9 rounded-xl text-xs font-bold", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriesList.map((cat) => (
                          <SelectItem key={cat} value={cat} className="text-xs font-medium">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-black uppercase tracking-wider">Unit Selling Price (TSH) *</Label>
                    <Input
                      type="number"
                      min={0}
                      value={editFormData.price}
                      onChange={(e) => setEditFormData({ ...editFormData, price: Number(e.target.value) })}
                      className={cn("h-9 rounded-xl text-xs font-bold font-mono", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-black uppercase tracking-wider">Inventory Stock (Units) *</Label>
                    <Input
                      type="number"
                      min={0}
                      value={editFormData.stock}
                      onChange={(e) => setEditFormData({ ...editFormData, stock: Number(e.target.value) })}
                      className={cn("h-9 rounded-xl text-xs font-bold font-mono", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs font-black uppercase tracking-wider">Image URL</Label>
                    <Input
                      value={editFormData.image}
                      onChange={(e) => setEditFormData({ ...editFormData, image: e.target.value })}
                      placeholder="https://images.unsplash.com/... or /products/..."
                      className={cn("h-9 rounded-xl text-xs font-medium", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs font-black uppercase tracking-wider">Product Description</Label>
                    <Textarea
                      rows={3}
                      value={editFormData.description}
                      onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      placeholder="Detailed hardware specifications, deployment scope, and parameters..."
                      className={cn("rounded-xl text-xs font-medium", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-2 gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  disabled={isUpdating}
                  className={cn("rounded-xl text-xs font-bold", isDark ? "border-slate-700 hover:bg-slate-800" : "border-navy/20 text-navy hover:bg-slate-100")}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isUpdating}
                  className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  {isUpdating ? "Saving Changes..." : "Save Product Changes"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 9. Delete Product Confirmation Dialog */}
      <Dialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <DialogContent className={cn(
          "max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border-2",
          isDark ? "bg-[#0a1033] border-rose-500/40 text-white" : "bg-white border-rose-500/30 text-navy"
        )}>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-rose-500/20 text-rose-500">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className={cn("text-xl font-black tracking-tight", isDark ? "text-white" : "text-navy")}>
                  Delete Product
                </DialogTitle>
                <DialogDescription className={cn("text-xs font-medium mt-0.5", isDark ? "text-slate-300" : "text-navy/70")}>
                  Permanent catalog deletion warning.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {productToDelete && (
            <div className="space-y-4 pt-2">
              <div className={cn(
                "p-4 rounded-2xl transition-all space-y-2",
                isDark ? "bg-teal/15 border border-teal/40 text-white" : "bg-teal/15 border-2 border-navy text-navy"
              )}>
                <p className="text-sm font-bold">{productToDelete.name}</p>
                <div className="flex items-center justify-between text-xs font-mono opacity-80">
                  <span>Category: {productToDelete.category}</span>
                  <span>Stock: {productToDelete.stock} Units</span>
                </div>
                <div className="text-xs font-mono font-bold text-teal dark:text-teal-300">
                  Price: TSH {Number(productToDelete.price).toLocaleString()}
                </div>
              </div>

              <p className="text-xs text-rose-500/90 dark:text-rose-400 font-medium">
                Are you sure you want to delete this product? This action cannot be undone and will permanently remove this item from the inventory catalog and online shop.
              </p>

              <DialogFooter className="pt-2 gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setProductToDelete(null)}
                  disabled={isDeleting}
                  className={cn("rounded-xl text-xs font-bold", isDark ? "border-slate-700 hover:bg-slate-800" : "border-navy/20 text-navy hover:bg-slate-100")}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleDeleteProduct}
                  disabled={isDeleting}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  {isDeleting ? "Deleting..." : "Yes, Delete Product"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
