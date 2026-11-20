"use client"

import { useState, useEffect, useMemo, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Package,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  Check,
  ExternalLink,
  Star,
  Sparkles,
  Globe,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Boxes,
  Tag,
  Download,
  Loader2,
  LayoutGrid,
  List,
  ArrowRightLeft,
  SlidersHorizontal,
  History,
  ClipboardList,
} from "lucide-react"
import ProductGridColumnsPicker, { GRID_COLUMN_CLASSES } from "@/components/product-grid-columns-picker"
import type { Product, Category, ProductFormData } from "@/types/database"
import AdminLoading from "@/components/admin/admin-loading"
import {
  getProducts,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteMultipleProducts,
  bulkUpdateProductsCategory,
  bulkUpdateProductsStock,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/product-actions"
import {
  getStockMovements,
  getWarehouses,
  recordStockMovement,
  transferStockBetweenWarehouses,
} from "@/lib/inventory-actions"
import { createStockAdjustment, getStockAdjustments } from "@/lib/stock-adjustment-actions"
import type { StockMovement, StockMovementType, Warehouse } from "@/lib/erp/types"
import type { StockAdjustment, StockAdjustmentReason } from "@/lib/erp/inventory-extra-types"
import {
  AdminPageHeader,
  AdminStats,
  AdminFilterBar,
  AdminTable,
  AdminModalShell,
  AdminPrimaryCell,
  AdminPill,
  AdminTag,
  AdminMutedText,
  AdminStatusBadge,
  AdminDetailModal,
  AdminFormModal,
  AdminFormGrid,
  AdminFormField,
  AdminInput,
  AdminTextarea,
  AdminSelect,
  AdminConfirmDialog,
  type AdminTableColumn,
  type AdminTableAction,
} from "@/components/admin/ui"

const ITEMS_PER_PAGE = 36

/** Stock movement reasons available in the quick stock adjustment dialog. */
const ADJUSTMENT_TYPE_OPTIONS: { value: StockMovementType; label: string }[] = [
  { value: "manual_adjustment", label: "Manual Adjustment" },
  { value: "opening_stock", label: "Opening Stock Count" },
  { value: "damage_loss", label: "Damaged / Lost Stock" },
  { value: "audit_correction", label: "Audit Physical Count" },
  { value: "purchase_received", label: "Purchase Received" },
  { value: "sales_return", label: "Customer Return" },
]

/** Reason codes for the audited stocktake voucher (also posts a GL journal on write-downs). */
const STOCKTAKE_REASONS: StockAdjustmentReason[] = [
  "Physical Stocktake Count Discrepancy",
  "Damage / Breakage",
  "Theft / Shrinkage",
  "Demonstration / Internal Lab Use",
  "Supplier Return / RMA",
]

/** Scales every element of a product card together so fewer columns = larger cards, not stretched cards. */
const CARD_SCALE: Record<number, {
  image: string
  detailPad: string
  actionPad: string
  title: string
  price: string
  circle: string
  check: string
  button: string
  icon: string
  badge: string
}> = {
  2: {
    image: "h-48 sm:h-64",
    detailPad: "p-4 sm:p-5 pb-2",
    actionPad: "p-4 sm:p-5 pt-1",
    title: "text-sm sm:text-lg",
    price: "text-sm sm:text-lg",
    circle: "w-9 h-9",
    check: "h-5 w-5",
    button: "h-9 sm:h-10 text-sm",
    icon: "h-4 w-4 sm:h-5 sm:w-5",
    badge: "text-xs px-2.5 py-0.5",
  },
  3: {
    image: "h-36 sm:h-48",
    detailPad: "p-3 sm:p-4 pb-1.5",
    actionPad: "p-3 sm:p-4 pt-1",
    title: "text-sm sm:text-base",
    price: "text-sm sm:text-base",
    circle: "w-8 h-8",
    check: "h-4 w-4",
    button: "h-8 sm:h-9 text-xs",
    icon: "h-3.5 w-3.5 sm:h-4 sm:w-4",
    badge: "text-[10px] px-2 py-0.5",
  },
  4: {
    image: "h-28 sm:h-36",
    detailPad: "p-2.5 sm:p-3 pb-1",
    actionPad: "p-2.5 sm:p-3 pt-1",
    title: "text-xs sm:text-sm",
    price: "text-xs sm:text-sm",
    circle: "w-7 h-7",
    check: "h-4 w-4",
    button: "h-7 sm:h-8 text-xs",
    icon: "h-3 w-3 sm:h-3.5 sm:w-3.5",
    badge: "text-[10px] px-2 py-0.5",
  },
  5: {
    image: "h-24 sm:h-28",
    detailPad: "p-2 pb-1",
    actionPad: "p-2 pt-1",
    title: "text-[11px] sm:text-xs",
    price: "text-[11px] sm:text-xs",
    circle: "w-6 h-6",
    check: "h-3 w-3",
    button: "h-7 text-[11px]",
    icon: "h-3 w-3",
    badge: "text-[9px] px-1.5 py-0.5",
  },
}

const EPIC_CATEGORIES = [
  { label: "All Products (Shop)", value: "__all__", group: "General" },
  { label: "Laptops", value: "laptops", group: "Laptops" },
  { label: "New Laptops", value: "laptops/new-laptops", group: "Laptops" },
  { label: "Refurbished Laptops", value: "laptops/refurbished-laptops", group: "Laptops" },
  { label: "Desktops", value: "desktops", group: "Desktops" },
  { label: "All-in-One", value: "desktops/all-in-one", group: "Desktops" },
  { label: "Gaming", value: "gaming", group: "Gaming" },
  { label: "Gaming Laptops", value: "gaming/gaming-laptops", group: "Gaming" },
  { label: "Gaming Desktop", value: "gaming/gaming-desktop", group: "Gaming" },
  { label: "Gaming Chairs", value: "gaming/gaming-chairs", group: "Gaming" },
  { label: "Gaming Accessories", value: "gaming/gaming-accessories", group: "Gaming" },
  { label: "Components", value: "components", group: "Components" },
  { label: "Monitors", value: "components/computer-monitors", group: "Components" },
  { label: "Graphics Card", value: "components/graphics-card", group: "Components" },
  { label: "Motherboard", value: "components/motherboard", group: "Components" },
  { label: "RAM Memory", value: "components/ram-memory", group: "Components" },
  { label: "Processors", value: "components/processors", group: "Components" },
  { label: "Power Supply", value: "components/power-supply", group: "Components" },
  { label: "CPU Cooling", value: "components/cpu-cooling", group: "Components" },
  { label: "PC Cases", value: "components/pc-cases", group: "Components" },
  { label: "PC Case Fans", value: "components/pc-case-fans", group: "Components" },
  { label: "Peripherals", value: "peripherals", group: "Peripherals" },
  { label: "Printers", value: "peripherals/printers", group: "Peripherals" },
  { label: "Keyboard/Mouse", value: "peripherals/keyboard-mouse", group: "Peripherals" },
  { label: "Headphones & Speakers", value: "peripherals/headphones-speakers", group: "Peripherals" },
  { label: "Webcam", value: "peripherals/webcam", group: "Peripherals" },
  { label: "Laptop Bags", value: "peripherals/laptop-bags", group: "Peripherals" },
  { label: "Laptop Chargers", value: "peripherals/laptop-chargers", group: "Peripherals" },
  { label: "Cables & Dongles", value: "peripherals/cables-dongles", group: "Peripherals" },
  { label: "Toners and Ink", value: "peripherals/toners-and-ink", group: "Peripherals" },
  { label: "Monitor Stands", value: "peripherals/monitor-stands", group: "Peripherals" },
  { label: "Power Banks", value: "peripherals/power-banks", group: "Peripherals" },
  { label: "Storage", value: "storage", group: "Storage" },
  { label: "Solid State Drives", value: "storage/solid-state-drives", group: "Storage" },
  { label: "Internal Hard Drives", value: "storage/internal-hard-drives", group: "Storage" },
  { label: "External Hard Drives", value: "storage/external-hard-drives", group: "Storage" },
  { label: "USB Flash Disk", value: "storage/usb-flash-disk", group: "Storage" },
  { label: "SD & Micro SD Cards", value: "storage/sd-micro-sd-cards", group: "Storage" },
  { label: "HDD Cases & Racks", value: "storage/hdd-cases-racks", group: "Storage" },
  { label: "Networking", value: "networking", group: "Networking" },
  { label: "Routers/Switches", value: "networking/routers-switches", group: "Networking" },
  { label: "WiFi Adapters", value: "networking/wifi-adapters", group: "Networking" },
  { label: "Tablets", value: "tablets", group: "Tablets" },
  { label: "UPS", value: "ups", group: "Power & Backup" },
  { label: "Powerstations", value: "powerstations", group: "Power & Backup" },
  { label: "Power Backup (All)", value: "power-backup", group: "Power & Backup" },
  { label: "Cash Counting Machines", value: "cash-counting-machines", group: "Office Equipment" },
  { label: "Gadgets & Accessories", value: "smart-gadgets-accessories", group: "Gadgets" },
  { label: "Smartphones", value: "smart-gadgets-accessories/smartphones", group: "Gadgets" },
  { label: "CCTV Cameras", value: "smart-gadgets-accessories/cctv-cameras", group: "Gadgets" },
  { label: "Software", value: "software", group: "Software & Digital" },
  { label: "Anti-virus", value: "software/anti-virus", group: "Software & Digital" },
  { label: "Operating Systems", value: "software/operating-systems", group: "Software & Digital" },
  { label: "Office", value: "software/office", group: "Software & Digital" },
  { label: "Digital Codes", value: "digital-codes", group: "Software & Digital" },
  { label: "Apple Gift Card", value: "digital-codes/apple-gift-card", group: "Software & Digital" },
]

interface ProductFormDataState {
  name: string
  category: string
  price: string
  image: string
  description: string
  features: string
  stock: string
  rating: string
  swatchImages: string
  type: "physical" | "service"
}

/** Row shapes returned by the Epic catalog sync and live price sync endpoints. */
interface EpicSyncAddedRow {
  id?: string
  name: string
  category: string
  rawEpicPrice?: number
  price: number
  epicUrl?: string
}

interface EpicSyncUpdatedRow {
  id: string
  name: string
  oldPrice: number
  rawEpicPrice?: number
  newPrice: number
  difference: number
  percentageChange?: number
}

interface EpicSyncUnlistedRow {
  id?: string
  name: string
  category: string
  price?: number
}

interface PriceSyncChangeRow {
  id: string
  name: string
  oldPrice: number
  rawEpicPrice?: number
  newPrice: number
  difference: number
  percentageChange: number
  epicUrl?: string
}

const emptyProductForm = (category = ""): ProductFormDataState => ({
  name: "",
  category,
  price: "",
  image: "",
  description: "",
  features: "",
  stock: "",
  rating: "5",
  swatchImages: "",
  type: "physical",
})

const productFormFrom = (product: Product): ProductFormDataState => ({
  name: product.name || "",
  category: product.category || "",
  price: product.price?.toString() || "",
  image: product.image || "",
  description: product.description || "",
  features: (product.features || []).join(", "),
  stock: product.stock?.toString() || "",
  rating: product.rating?.toString() || "5",
  swatchImages: (product.swatchImages || []).join(", "),
  type: product.type || "physical",
})

export default function AdminProductsPage() {
  const { isDark } = useAdminTheme()
  const { toast } = useToast()

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [isBulkFetching, setIsBulkFetching] = useState(false)
  const [isUrlScraperOpen, setIsUrlScraperOpen] = useState(false)
  const [scrapeUrlInput, setScrapeUrlInput] = useState("https://maishacomputers.com/shop")
  const [scrapeLimit, setScrapeLimit] = useState(500)
  const [isUrlScraping, setIsUrlScraping] = useState(false)
  const [urlScrapeResult, setUrlScrapeResult] = useState<any>(null)
  const [isExporting, setIsExporting] = useState(false)

  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState<string>("all")
  const [epicStatusFilter, setEpicStatusFilter] = useState<"all" | "synced" | "unlisted">("all")

  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productForm, setProductForm] = useState<ProductFormDataState>(emptyProductForm())
  const [epicFetchUrl, setEpicFetchUrl] = useState("")
  const [isFetchingProduct, setIsFetchingProduct] = useState(false)
  const [isSavingProduct, setIsSavingProduct] = useState(false)

  const [viewingProduct, setViewingProduct] = useState<Product | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [activeModalImage, setActiveModalImage] = useState<string>("")
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [isDeletingProduct, setIsDeletingProduct] = useState(false)

  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryName, setCategoryName] = useState("")
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)

  const [isEpicSyncDialogOpen, setIsEpicSyncDialogOpen] = useState(false)
  const [epicSyncStep, setEpicSyncStep] = useState<"idle" | "syncing" | "results">("idle")
  const [epicSyncResult, setEpicSyncResult] = useState<any>(null)
  const [epicActiveTab, setEpicActiveTab] = useState<"added" | "updated" | "unlisted">("added")
  const [epicSearchFilter, setEpicSearchFilter] = useState("")
  const [selectedEpicCategory, setSelectedEpicCategory] = useState<string>("")
  const [epicProductCount, setEpicProductCount] = useState<number>(60)

  const [isPriceSyncDialogOpen, setIsPriceSyncDialogOpen] = useState(false)
  const [isSyncingPrices, setIsSyncingPrices] = useState(false)
  const [priceSyncStep, setPriceSyncStep] = useState<"idle" | "syncing" | "results">("idle")
  const [priceSyncResult, setPriceSyncResult] = useState<any>(null)
  const [priceDiffFilter, setPriceDiffFilter] = useState<"all" | "increased" | "decreased">("all")
  const [priceDiffSearch, setPriceDiffSearch] = useState("")

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [currentPage, setCurrentPage] = useState(1)
  const [gridColumns, setGridColumns] = useState(4)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false)
  const [isBulkCategoryOpen, setIsBulkCategoryOpen] = useState(false)
  const [isBulkStockOpen, setIsBulkStockOpen] = useState(false)
  const [targetCategory, setTargetCategory] = useState("")
  const [targetStock, setTargetStock] = useState<number>(0)

  // Stock transfer (moved here from the retired inventory overview)
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [isTransferOpen, setIsTransferOpen] = useState(false)
  const [isTransferring, setIsTransferring] = useState(false)
  const [transferProductId, setTransferProductId] = useState<number | null>(null)
  const [transferSourceWh, setTransferSourceWh] = useState("")
  const [transferDestWh, setTransferDestWh] = useState("")
  const [transferQty, setTransferQty] = useState(1)
  const [transferReason, setTransferReason] = useState("")

  // Stock adjustments — quick ledger movements and audited stocktake vouchers
  const [isAdjustOpen, setIsAdjustOpen] = useState(false)
  const [isAdjusting, setIsAdjusting] = useState(false)
  const [adjustMode, setAdjustMode] = useState<"quick" | "voucher">("quick")
  const [adjustProductId, setAdjustProductId] = useState<number | null>(null)
  const [adjustType, setAdjustType] = useState<StockMovementType>("manual_adjustment")
  const [adjustWh, setAdjustWh] = useState("")
  const [adjustQty, setAdjustQty] = useState(0)
  const [adjustReason, setAdjustReason] = useState<StockAdjustmentReason>("Physical Stocktake Count Discrepancy")
  const [adjustNotes, setAdjustNotes] = useState("")
  const [adjustUnitCost, setAdjustUnitCost] = useState(0)

  // Auditable stock ledger (movements + stocktake vouchers)
  const [isLedgerOpen, setIsLedgerOpen] = useState(false)
  const [isLedgerLoading, setIsLedgerLoading] = useState(false)
  const [ledgerTab, setLedgerTab] = useState<"movements" | "adjustments">("movements")
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([])

  const formatSourceName = (domain?: string) => {
    if (!domain || domain === "other") return "Other / Manual"
    if (domain === "epiccomputers.co.tz") return "Epic Computers"
    if (domain === "maishacomputers.com") return "Maisha Computers"
    if (domain === "laptopcitystore.co.tz") return "Laptop City Store"
    const namePart = domain.split(".")[0]
    return namePart.charAt(0).toUpperCase() + namePart.slice(1)
  }

  const availableSources = useMemo(() => {
    const domainCounts = new Map<string, number>()
    for (const p of products) {
      const d = p.sourceDomain || "other"
      domainCounts.set(d, (domainCounts.get(d) || 0) + 1)
    }
    return Array.from(domainCounts.entries())
      .map(([domain, count]) => ({ domain, name: formatSourceName(domain), count }))
      .sort((a, b) => {
        if (a.domain === "epiccomputers.co.tz") return -1
        if (b.domain === "epiccomputers.co.tz") return 1
        if (a.domain === "maishacomputers.com") return -1
        if (b.domain === "maishacomputers.com") return 1
        if (a.domain === "laptopcitystore.co.tz") return -1
        if (b.domain === "laptopcitystore.co.tz") return 1
        if (a.domain === "other") return 1
        if (b.domain === "other") return -1
        return b.count - a.count
      })
  }, [products])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [productsData, categoriesData, warehousesData] = await Promise.all([
        getProducts({ includeUnlisted: true }),
        getCategories(),
        getWarehouses(),
      ])
      setProducts(productsData)
      setCategories(categoriesData)
      setWarehouses(warehousesData)
      setFilteredProducts(productsData)
    } catch (error) {
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let filtered = products
    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    if (categoryFilter !== "all") {
      filtered = filtered.filter((product) => product.category === categoryFilter)
    }
    if (sourceFilter !== "all") {
      if (sourceFilter === "epic") {
        filtered = filtered.filter((p) => p.sourceDomain === "epiccomputers.co.tz")
      } else if (sourceFilter === "maisha") {
        filtered = filtered.filter((p) => p.sourceDomain === "maishacomputers.com")
      } else if (sourceFilter === "other") {
        filtered = filtered.filter((p) => !p.sourceDomain || p.sourceDomain === "other")
      } else {
        filtered = filtered.filter((p) => p.sourceDomain === sourceFilter)
      }
    }
    if (epicStatusFilter === "synced") {
      filtered = filtered.filter((p) => !p.notOnEpic)
    } else if (epicStatusFilter === "unlisted") {
      filtered = filtered.filter((p) => p.notOnEpic)
    }
    setFilteredProducts(filtered)
    setCurrentPage(1)
  }, [products, searchTerm, categoryFilter, epicStatusFilter, sourceFilter])

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredProducts, currentPage])
  const cardScale = CARD_SCALE[gridColumns] ?? CARD_SCALE[4]

  const isAllPageSelected = paginatedProducts.length > 0 && paginatedProducts.every((p) => selectedIds.includes(p.id))
  const isAllFilteredSelected = filteredProducts.length > 0 && selectedIds.length === filteredProducts.length

  const toggleSelectProduct = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }
  const toggleSelectAllPage = () => {
    if (isAllPageSelected) {
      const pageIdSet = new Set(paginatedProducts.map((p) => p.id))
      setSelectedIds((prev) => prev.filter((id) => !pageIdSet.has(id)))
    } else {
      setSelectedIds(Array.from(new Set([...selectedIds, ...paginatedProducts.map((p) => p.id)])))
    }
  }
  const selectAllFiltered = () => setSelectedIds(filteredProducts.map((p) => p.id))
  const clearSelection = () => setSelectedIds([])

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    setIsBulkDeleting(true)
    try {
      const res = await deleteMultipleProducts(selectedIds)
      if (!res.success) throw new Error(res.error || "Failed to delete products")
      toast({ title: "Bulk Delete Successful", description: `Successfully deleted ${res.count} products from catalog.` })
      setSelectedIds([])
      setIsBulkDeleteConfirmOpen(false)
      loadData()
    } catch (err: any) {
      toast({ title: "Bulk Delete Failed", description: err.message, variant: "destructive" })
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const handleBulkUpdateCategory = async () => {
    if (selectedIds.length === 0 || !targetCategory) return
    try {
      const res = await bulkUpdateProductsCategory(selectedIds, targetCategory)
      if (!res.success) throw new Error(res.error || "Failed to update category")
      toast({ title: "Category Updated", description: `Updated category to "${targetCategory}" for ${res.count} products.` })
      setSelectedIds([])
      setIsBulkCategoryOpen(false)
      loadData()
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" })
    }
  }

  const handleBulkUpdateStock = async () => {
    if (selectedIds.length === 0) return
    try {
      const res = await bulkUpdateProductsStock(selectedIds, targetStock)
      if (!res.success) throw new Error(res.error || "Failed to update stock")
      toast({ title: "Stock Updated", description: `Updated stock level to ${targetStock} for ${res.count} products.` })
      setSelectedIds([])
      setIsBulkStockOpen(false)
      loadData()
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" })
    }
  }

  // ---------------------------------------------------------------
  // Stock operations — consolidated from the retired inventory page
  // ---------------------------------------------------------------

  const openTransferForProduct = (product?: Product) => {
    if (product) setTransferProductId(product.id)
    else if (!transferProductId && products.length > 0) setTransferProductId(products[0].id)

    if (warehouses.length >= 2) {
      setTransferSourceWh(warehouses[0].id)
      setTransferDestWh(warehouses[1].id)
    }
    setTransferQty(1)
    setTransferReason("")
    setIsTransferOpen(true)
  }

  const handleExecuteTransfer = async (event?: FormEvent) => {
    event?.preventDefault()
    if (!transferProductId || !transferSourceWh || !transferDestWh || transferQty <= 0) {
      toast({ title: "Invalid Input", description: "Select a product, source, destination and a valid quantity.", variant: "destructive" })
      return
    }
    if (transferSourceWh === transferDestWh) {
      toast({ title: "Invalid Route", description: "Source and destination warehouses must be different.", variant: "destructive" })
      return
    }

    const product = products.find((p) => p.id === transferProductId)
    if (!product) {
      toast({ title: "Product Not Found", description: "Please select a valid product.", variant: "destructive" })
      return
    }
    if (transferQty > (Number(product.stock) || 0)) {
      toast({
        title: "Insufficient Stock",
        description: `Cannot transfer ${transferQty} units. Only ${product.stock || 0} available.`,
        variant: "destructive",
      })
      return
    }

    setIsTransferring(true)
    try {
      await transferStockBetweenWarehouses({
        productId: product.id,
        productName: product.name,
        sourceWarehouseId: transferSourceWh,
        destinationWarehouseId: transferDestWh,
        quantity: transferQty,
        reason: transferReason || "Standard Warehouse Rebalancing",
      })
      toast({ title: "Stock Transferred", description: `Moved ${transferQty} units of ${product.name} between warehouses.` })
      setIsTransferOpen(false)
      loadData()
    } catch (err: any) {
      toast({ title: "Transfer Failed", description: err.message, variant: "destructive" })
    } finally {
      setIsTransferring(false)
    }
  }

  const openAdjustForProduct = (product?: Product, mode: "quick" | "voucher" = "quick") => {
    setAdjustMode(mode)
    if (product) {
      setAdjustProductId(product.id)
      setAdjustUnitCost(Number(product.price) || 0)
    } else if (!adjustProductId && products.length > 0) {
      setAdjustProductId(products[0].id)
      setAdjustUnitCost(Number(products[0].price) || 0)
    }
    setAdjustQty(0)
    setAdjustNotes("")
    setIsAdjustOpen(true)
  }

  const handleExecuteAdjustment = async (event: FormEvent) => {
    event.preventDefault()
    if (!adjustProductId || adjustQty === 0) {
      toast({ title: "Invalid Input", description: "Select a product and enter a non-zero quantity change.", variant: "destructive" })
      return
    }

    const product = products.find((p) => p.id === adjustProductId)
    if (!product) {
      toast({ title: "Product Not Found", description: "Please select a valid product.", variant: "destructive" })
      return
    }

    const warehouse = warehouses.find((w) => w.id === adjustWh) || warehouses[0]

    setIsAdjusting(true)
    try {
      if (adjustMode === "voucher") {
        const unitCost = adjustUnitCost > 0 ? adjustUnitCost : Number(product.price) || 0
        const voucher = await createStockAdjustment({
          product_id: product.id,
          product_name: product.name,
          warehouse_id: warehouse?.id || "wh-dar-main",
          warehouse_name: warehouse?.name || "QuardCube Central Hub — Kigamboni",
          previous_quantity: Number(product.stock) || 0,
          quantity_adjusted: adjustQty,
          unit_cost: unitCost,
          reason: adjustReason,
          notes: adjustNotes || undefined,
        })
        toast({
          title: "Stocktake Voucher Recorded",
          description: `${voucher.adjustment_number} saved. Stock ledger and General Ledger updated.`,
        })
      } else {
        await recordStockMovement({
          productId: product.id,
          productName: product.name,
          warehouseId: warehouse?.id || "wh-dar-main",
          movementType: adjustType,
          quantity: adjustQty,
          reason: adjustNotes || "Audited Manual Adjustment",
          performedBy: "Administrator",
        })
        toast({
          title: "Stock Adjusted",
          description: `Updated ${product.name} by ${adjustQty > 0 ? "+" : ""}${adjustQty} units.`,
        })
      }
      setIsAdjustOpen(false)
      loadData()
    } catch (err: any) {
      toast({ title: "Adjustment Failed", description: err.message || "Could not apply the stock adjustment.", variant: "destructive" })
    } finally {
      setIsAdjusting(false)
    }
  }

  const loadLedger = async () => {
    setIsLedgerLoading(true)
    try {
      const [movementData, adjustmentData] = await Promise.all([
        getStockMovements({ limit: 50 }),
        getStockAdjustments(),
      ])
      setMovements(movementData)
      setAdjustments(adjustmentData)
    } catch {
      toast({ title: "Error", description: "Failed to load the stock ledger.", variant: "destructive" })
    } finally {
      setIsLedgerLoading(false)
    }
  }

  const openLedger = (tab: "movements" | "adjustments" = "movements") => {
    setLedgerTab(tab)
    setIsLedgerOpen(true)
    loadLedger()
  }

  const fetchEpicProductData = async () => {
    if (!productForm.name.trim() && !epicFetchUrl.trim()) {
      toast({
        title: "Product Details Required",
        description: "Enter a product name or a product URL before auto-fetching.",
        variant: "destructive",
      })
      return
    }

    setIsFetchingProduct(true)
    try {
      const response = await fetch("/api/extract-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: productForm.name.trim(),
          productUrl: epicFetchUrl.trim() || undefined,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch product data")
      }

      setProductForm((prev) => ({
        ...prev,
        name: data.name || prev.name,
        image: data.mainImage || prev.image,
        description: data.description || prev.description,
        swatchImages: (data.swatchImages || []).join(", "),
        price: data.price?.toString() ?? prev.price,
      }))
      toast({
        title: "Product Data Fetched",
        description: `Applied profit margin (Base: TZS ${(data.rawPrice || 0).toLocaleString()} → Catalog Price: TZS ${(data.price || 0).toLocaleString()}).`,
      })
    } catch (error: any) {
      toast({
        title: "Auto-Fetch Failed",
        description: error?.message || "Failed to fetch product data.",
        variant: "destructive",
      })
    } finally {
      setIsFetchingProduct(false)
    }
  }

  const submitProductForm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSavingProduct) return

    setIsSavingProduct(true)
    const productData: ProductFormData = {
      name: productForm.name.trim(),
      category: productForm.category,
      price: parseFloat(productForm.price) || 0,
      image: productForm.image.trim(),
      description: productForm.description.trim(),
      features: productForm.features.split(",").map((f) => f.trim()).filter(Boolean),
      stock: parseInt(productForm.stock) || 0,
      rating: parseFloat(productForm.rating) || 5,
      type: productForm.type,
      swatchImages: productForm.swatchImages.split(",").map((url) => url.trim()).filter(Boolean),
    }

    try {
      if (editingProduct) {
        await handleUpdateProduct(productData)
      } else {
        await handleCreateProduct(productData)
      }
    } finally {
      setIsSavingProduct(false)
    }
  }

  const openCreateProduct = () => {
    setEditingProduct(null)
    setProductForm(emptyProductForm(categoryFilter !== "all" ? categoryFilter : categories[0]?.name || ""))
    setEpicFetchUrl("")
    setIsProductDialogOpen(true)
  }

  const openEditProduct = (product: Product) => {
    setEditingProduct(product)
    setProductForm(productFormFrom(product))
    setEpicFetchUrl("")
    setIsProductDialogOpen(true)
  }

  const openViewProduct = (product: Product) => {
    setViewingProduct(product)
    setActiveModalImage(product.image || "")
    setIsViewDialogOpen(true)
  }

  const handleCreateProduct = async (productData: ProductFormData) => {
    const result = await createProduct(productData)
    if (result.success) {
      toast({ title: "Success", description: "Product created successfully" })
      setIsProductDialogOpen(false)
      setEditingProduct(null)
      loadData()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to create product",
        variant: "destructive",
      })
    }
  }

  const handleUpdateProduct = async (productData: ProductFormData) => {
    if (!editingProduct) return
    const result = await updateProduct(editingProduct.id, productData)
    if (result.success) {
      toast({ title: "Success", description: "Product updated successfully" })
      setIsProductDialogOpen(false)
      setEditingProduct(null)
      loadData()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update product",
        variant: "destructive",
      })
    }
  }

  const handleDeleteProduct = async () => {
    if (!productToDelete) return
    const result = await deleteProduct(productToDelete.id)
    if (result.success) {
      toast({ title: "Success", description: "Product deleted successfully" })
      setProductToDelete(null)
      setIsViewDialogOpen(false)
      loadData()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete product",
        variant: "destructive",
      })
    }
  }

  const openCreateCategory = () => {
    setEditingCategory(null)
    setCategoryName("")
    setIsCategoryDialogOpen(true)
  }

  const openEditCategory = (category: Category) => {
    setEditingCategory(category)
    setCategoryName(category.name)
    setIsCategoryDialogOpen(true)
  }

  const submitCategoryForm = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = categoryName.trim()
    if (!name) return

    const result = editingCategory
      ? await updateCategory(editingCategory.id, { name })
      : await createCategory({ name })

    if (result.success) {
      toast({
        title: "Success",
        description: editingCategory ? "Category updated successfully" : "Category created successfully",
      })
      setIsCategoryDialogOpen(false)
      setEditingCategory(null)
      setCategoryName("")
      loadData()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to save category",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return
    const result = await deleteCategory(categoryToDelete.id)
    if (result.success) {
      toast({ title: "Success", description: "Category deleted successfully" })
      setCategoryToDelete(null)
      loadData()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete category",
        variant: "destructive",
      })
    }
  }

  const handleUniversalUrlScrape = async () => {
    if (!scrapeUrlInput.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a valid e-commerce URL to scrape.",
        variant: "destructive",
      })
      return
    }

    setIsUrlScraping(true)
    setUrlScrapeResult(null)
    try {
      toast({
        title: "Scraper Started",
        description: `Connecting to ${scrapeUrlInput}... Discovering products and extracting specifications.`,
      })
      const response = await fetch("/api/scrape-ecommerce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scrapeUrlInput.trim(), maxProducts: scrapeLimit }),
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || "Failed to scrape target website.")
      }

      setUrlScrapeResult(result.data)
      toast({
        title: "Scraping Completed!",
        description: `Imported ${result.data.created} new products, updated ${result.data.updated} existing ones with +20k TZS cut.`,
      })
      await loadData()
      if (result.data?.domain) {
        setSourceFilter(result.data.domain)
      }
    } catch (err: any) {
      toast({
        title: "Scraping Failed",
        description: err.message || "Failed to scrape the provided e-commerce link.",
        variant: "destructive",
      })
    } finally {
      setIsUrlScraping(false)
    }
  }

  const handleExportExcel = async () => {
    setIsExporting(true)
    try {
      const response = await fetch("/api/export-products-excel")
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Export failed")
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      const disposition = response.headers.get("Content-Disposition")
      const fileName = disposition?.match(/filename="(.+)"/)?.[1] || `Products_${new Date().toISOString().split("T")[0]}.xlsx`
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast({
        title: "Export Successful",
        description: `Exported ${products.length} products to Excel.`,
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export products",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleSyncEpicCatalog = async (dryRun: boolean = false) => {
    setIsBulkFetching(true)
    setEpicSyncStep("syncing")
    try {
      const response = await fetch("/api/sync-epic-catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun }),
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to synchronize with Epic Computers")
      }

      setEpicSyncResult(data)
      setEpicSyncStep("results")
      if (!dryRun) {
        toast({
          title: "Synchronization Complete!",
          description: `Added ${data.summary?.added || 0} new products to shop, updated ${data.summary?.updated || 0} prices (+20k cut), and unlisted ${data.summary?.unlisted || 0} products missing from Epic.`,
          duration: 9000,
        })
        loadData()
      } else {
        toast({
          title: "Preview Generated",
          description: `Preview: ${data.summary?.added || 0} new products to add, ${data.summary?.updated || 0} prices to update, and ${data.summary?.unlisted || 0} to unlist from shop.`,
          duration: 5000,
        })
      }
    } catch (error: any) {
      console.error("Error synchronizing catalog:", error)
      toast({
        title: "Synchronization Failed",
        description: error.message || "Failed to communicate with Epic Computers server.",
        variant: "destructive",
      })
      setEpicSyncStep("idle")
    } finally {
      setIsBulkFetching(false)
    }
  }

  const handleImportFromEpic = async () => {
    setIsBulkFetching(true)
    setIsEpicSyncDialogOpen(false)

    const selectedCat = EPIC_CATEGORIES.find((c) => c.value === selectedEpicCategory)
    const categoryLabel = selectedCat?.label || "All Products"
    const categorySlug = selectedEpicCategory === "__all__" ? "" : selectedEpicCategory

    try {
      toast({
        title: `Scraping ${categoryLabel}...`,
        description: `Fetching up to ${epicProductCount} products from Epic Computers. This may take several minutes. Please wait.`,
        duration: 300000,
      })
      const response = await fetch("/api/bulk-extract-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categorySlug: categorySlug || undefined,
          maxProducts: epicProductCount,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to fetch products")
      }

      const data = await response.json()
      if (data.status === "success") {
        const errorCount = data.errors?.length || 0
        toast({
          title: "Import Completed!",
          description: `Found ${data.listingsFound || 0} listings, scraped ${data.count} details from ${categoryLabel}. Saved ${data.saved || 0} new, skipped ${data.skipped || 0} existing. ${errorCount > 0 ? `${errorCount} errors.` : ""}`,
          duration: 10000,
        })
        loadData()
      } else {
        toast({
          title: "Import Failed",
          description: data.errors?.join(", ") || "Could not import products from Epic Computers website.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error importing products:", error)
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import products from Epic Computers",
        variant: "destructive",
      })
    } finally {
      setIsBulkFetching(false)
    }
  }

  const handleSyncPrices = async (dryRun: boolean = false) => {
    setIsSyncingPrices(true)
    setPriceSyncStep("syncing")
    try {
      const response = await fetch("/api/sync-epic-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun }),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || "Failed to update prices")
      }

      const data = await response.json()
      setPriceSyncResult(data)
      setPriceSyncStep("results")
      if (!dryRun) {
        toast({
          title: "Prices Updated Successfully!",
          description: `Updated ${data.summary?.updated || 0} product prices with your constant +20,000 TZS cut added.`,
          duration: 6000,
        })
        loadData()
      } else {
        toast({
          title: "Price Preview Ready",
          description: `Found ${data.summary?.updated || 0} products needing updates out of ${data.summary?.matched || 0} matched (with +20,000 TZS cut included).`,
          duration: 6000,
        })
      }
    } catch (error: any) {
      console.error("Error syncing prices:", error)
      toast({
        title: "Price Update Failed",
        description: error?.message || "Failed to sync product prices from Epic Computers.",
        variant: "destructive",
      })
      setPriceSyncStep("idle")
    } finally {
      setIsSyncingPrices(false)
    }
  }

  if (isLoading) {
    return <AdminLoading type="products" />
  }

  const productColumns: AdminTableColumn<Product>[] = [
    {
      key: "name",
      header: "Product",
      render: (product) => (
        <AdminPrimaryCell
          icon={Package}
          title={product.name}
          subtitle={product.description || "No description"}
          badge={product.notOnEpic ? <AdminPill className="ml-1">Unlisted</AdminPill> : undefined}
        />
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (product) => <AdminPill title={product.category}>{product.category}</AdminPill>,
      hidden: "sm",
    },
    {
      key: "price",
      header: "Price",
      render: (product) => <span className="font-bold whitespace-nowrap">TZS {product.price.toLocaleString()}</span>,
    },
    {
      key: "stock",
      header: "Stock",
      render: (product) => (
        <AdminStatusBadge
          status={product.stock > 10 ? "available" : product.stock > 0 ? "low_stock" : "out_of_stock"}
          label={`${product.stock} in stock`}
        />
      ),
      hidden: "md",
    },
    {
      key: "source",
      header: "Source",
      render: (product) => <AdminMutedText>{formatSourceName(product.sourceDomain)}</AdminMutedText>,
      hidden: "lg",
    },
    {
      key: "epic",
      header: "Epic",
      render: (product) => (
        <AdminStatusBadge
          status={product.notOnEpic ? "inactive" : "synced"}
          label={product.notOnEpic ? "Unlisted" : "Synced"}
        />
      ),
      hidden: "md",
    },
  ]

  const productActions: AdminTableAction<Product>[] = [
    { key: "view", label: "View details", icon: Eye, variant: "view", onClick: openViewProduct },
    { key: "edit", label: "Edit product", icon: Edit, variant: "edit", onClick: openEditProduct, mobile: false },
    { key: "transfer", label: "Transfer stock", icon: ArrowRightLeft, variant: "soft", onClick: (product) => openTransferForProduct(product), mobile: false },
    { key: "adjust", label: "Adjust stock", icon: SlidersHorizontal, variant: "soft", onClick: (product) => openAdjustForProduct(product), mobile: false },
    {
      key: "delete",
      label: "Delete product",
      icon: Trash2,
      variant: "danger-soft",
      onClick: (product) => setProductToDelete(product),
      mobile: false,
    },
  ]

  const movementColumns: AdminTableColumn<StockMovement>[] = [
    {
      key: "movement",
      header: "Movement",
      render: (movement) => (
        <AdminPrimaryCell
          icon={ArrowRightLeft}
          title={movement.movement_number}
          subtitle={new Date(movement.created_at).toLocaleString()}
        />
      ),
    },
    {
      key: "product",
      header: "Product",
      cellClassName: "font-semibold max-w-[180px] truncate",
      render: (movement) => movement.product_name,
    },
    {
      key: "type",
      header: "Type",
      hidden: "md",
      render: (movement) => <AdminPill>{movement.movement_type.replace(/_/g, " ")}</AdminPill>,
    },
    {
      key: "quantity",
      header: "Qty",
      align: "center",
      cellClassName: "font-mono font-bold",
      render: (movement) => `${movement.quantity > 0 ? "+" : ""}${movement.quantity}`,
    },
    {
      key: "reason",
      header: "Reason",
      hidden: "lg",
      cellClassName: "max-w-[220px] truncate",
      render: (movement) => movement.reason || "—",
    },
  ]

  const adjustmentColumns: AdminTableColumn<StockAdjustment>[] = [
    {
      key: "number",
      header: "Voucher",
      render: (adjustment) => (
        <AdminPrimaryCell
          icon={ClipboardList}
          title={adjustment.adjustment_number}
          subtitle={new Date(adjustment.created_at).toLocaleDateString()}
        />
      ),
    },
    {
      key: "product",
      header: "Product",
      cellClassName: "font-semibold max-w-[180px] truncate",
      render: (adjustment) => adjustment.product_name,
    },
    {
      key: "reason",
      header: "Reason",
      hidden: "md",
      render: (adjustment) => <AdminPill>{adjustment.reason}</AdminPill>,
    },
    {
      key: "delta",
      header: "Change",
      align: "center",
      cellClassName: "font-mono font-bold",
      render: (adjustment) => `${adjustment.quantity_adjusted > 0 ? "+" : ""}${adjustment.quantity_adjusted}`,
    },
    {
      key: "impact",
      header: "Value Impact",
      align: "right",
      cellClassName: "font-mono",
      render: (adjustment) => `TZS ${adjustment.total_value_impact.toLocaleString()}`,
    },
  ]

  const lowStockCount = products.filter((product) => product.stock >= 0 && product.stock <= 10).length
  const unlistedCount = products.filter((product) => product.notOnEpic).length
  const syncedCount = products.length - unlistedCount

  const filterTabs = [
    { key: "all", label: "All Products", count: products.length },
    { key: "synced", label: "Epic Synced", count: syncedCount, icon: CheckCircle },
    { key: "unlisted", label: "Unlisted", count: unlistedCount, icon: XCircle },
  ]

  const epicAddedColumns: AdminTableColumn<EpicSyncAddedRow>[] = [
    {
      key: "product",
      header: "Product",
      cellClassName: "font-semibold max-w-xs truncate",
      render: (row) => row.name,
    },
    {
      key: "category",
      header: "Category",
      render: (row) => row.category,
    },
    {
      key: "epicBase",
      header: "Epic Base",
      align: "right",
      cellClassName: "font-mono",
      render: (row) => `TZS ${(row.rawEpicPrice || 0).toLocaleString()}`,
    },
    {
      key: "shopPrice",
      header: "Shop Price (+20k)",
      align: "right",
      cellClassName: "font-bold text-emerald-600",
      render: (row) => `TZS ${row.price.toLocaleString()}`,
    },
    {
      key: "link",
      header: "Link",
      align: "center",
      render: (row) =>
        row.epicUrl ? (
          <a href={row.epicUrl} target="_blank" rel="noreferrer" title="View on Epic Computers">
            <ExternalLink className="h-3.5 w-3.5 inline" />
          </a>
        ) : null,
    },
  ]

  const epicUpdatedColumns: AdminTableColumn<EpicSyncUpdatedRow>[] = [
    {
      key: "product",
      header: "Product",
      cellClassName: "font-semibold max-w-xs truncate",
      render: (row) => row.name,
    },
    {
      key: "oldPrice",
      header: "Old Price",
      align: "right",
      cellClassName: "font-mono",
      render: (row) => `TZS ${row.oldPrice.toLocaleString()}`,
    },
    {
      key: "epicBase",
      header: "Epic Base",
      align: "right",
      cellClassName: "font-mono",
      render: (row) => `TZS ${(row.rawEpicPrice || 0).toLocaleString()}`,
    },
    {
      key: "newPrice",
      header: "New Price",
      align: "right",
      cellClassName: "font-bold",
      render: (row) => `TZS ${row.newPrice.toLocaleString()}`,
    },
    {
      key: "diff",
      header: "Diff",
      align: "right",
      cellClassName: "font-mono",
      render: (row) =>
        `${row.difference > 0 ? "+" : ""}${(row.percentageChange ?? 0).toFixed?.(1) ?? row.percentageChange}%`,
    },
  ]

  const epicUnlistedColumns: AdminTableColumn<EpicSyncUnlistedRow>[] = [
    {
      key: "product",
      header: "Product",
      cellClassName: "font-semibold max-w-xs truncate",
      render: (row) => row.name,
    },
    {
      key: "category",
      header: "Category",
      render: (row) => row.category,
    },
    {
      key: "lastPrice",
      header: "Last Price",
      align: "right",
      cellClassName: "font-mono",
      render: (row) => `TZS ${(row.price || 0).toLocaleString()}`,
    },
  ]

  const priceChangeColumns: AdminTableColumn<PriceSyncChangeRow>[] = [
    {
      key: "product",
      header: "Product",
      cellClassName: "font-medium max-w-[200px] truncate",
      render: (row) => <span title={row.name}>{row.name}</span>,
    },
    {
      key: "oldPrice",
      header: "Old Price",
      align: "right",
      cellClassName: "opacity-60 line-through",
      render: (row) => `TZS ${row.oldPrice.toLocaleString()}`,
    },
    {
      key: "epicBase",
      header: "Epic Base",
      align: "right",
      cellClassName: "font-mono opacity-70",
      render: (row) =>
        `TZS ${(row.rawEpicPrice ?? (row.newPrice > 20000 ? row.newPrice - 20000 : row.newPrice)).toLocaleString()}`,
    },
    {
      key: "newPrice",
      header: "New Price (+20k)",
      align: "right",
      cellClassName: "font-bold whitespace-nowrap",
      render: (row) => (
        <>
          TZS {row.newPrice.toLocaleString()}
          <span className="block text-[9px] text-emerald-600">incl. +20k cut</span>
        </>
      ),
    },
    {
      key: "change",
      header: "Change",
      align: "right",
      render: (row) => (
        <Badge
          className={cn(
            "text-[10px] font-bold",
            row.difference > 0 ? "bg-amber-500/15 text-amber-600" : "bg-emerald-500/15 text-emerald-600"
          )}
        >
          {row.difference > 0 ? "+" : ""}{row.percentageChange}%
        </Badge>
      ),
    },
    {
      key: "link",
      header: "Link",
      align: "center",
      render: (row) =>
        row.epicUrl ? (
          <a href={row.epicUrl} target="_blank" rel="noreferrer" title="View on Epic Computers">
            <ExternalLink className="h-3.5 w-3.5 inline" />
          </a>
        ) : null,
    },
  ]

  return (
    <div className="min-h-screen p-3 sm:p-6 space-y-4 sm:space-y-6">
      <AdminPageHeader
        title="Product"
        accent="Management"
        subtitle="Manage catalog products, Epic sync, sources and bulk operations"
        icon={Package}
        onRefresh={loadData}
        onAdd={openCreateProduct}
        addLabel="Add Product"
        refreshing={isLoading}
        actions={
          <>
            <Button
              type="button"
              onClick={() => openTransferForProduct()}
              className="flex-1 sm:flex-initial h-10 px-3 sm:px-4 rounded-xl border-2 border-teal/40 text-teal hover:bg-teal/10 font-bold text-xs sm:text-sm"
            >
              <ArrowRightLeft className="h-4 w-4 mr-1.5" />
              Transfer
            </Button>
            <Button
              type="button"
              onClick={() => openAdjustForProduct()}
              className="flex-1 sm:flex-initial h-10 px-3 sm:px-4 rounded-xl border-2 border-teal/40 text-teal hover:bg-teal/10 font-bold text-xs sm:text-sm"
            >
              <SlidersHorizontal className="h-4 w-4 mr-1.5" />
              Adjust
            </Button>
            <Button
              type="button"
              onClick={() => openLedger()}
              className="flex-1 sm:flex-initial h-10 px-3 sm:px-4 rounded-xl border-2 border-teal/40 text-teal hover:bg-teal/10 font-bold text-xs sm:text-sm"
            >
              <History className="h-4 w-4 mr-1.5" />
              Stock Ledger
            </Button>
            <Button
              type="button"
              onClick={() => setIsEpicSyncDialogOpen(true)}
              className="flex-1 sm:flex-initial h-10 px-3 sm:px-4 rounded-xl bg-teal text-navy hover:bg-teal-400 font-bold text-xs sm:text-sm"
            >
              <Sparkles className="h-4 w-4 mr-1.5" />
              Epic Sync
            </Button>
            <Button
              type="button"
              onClick={() => setIsPriceSyncDialogOpen(true)}
              className="flex-1 sm:flex-initial h-10 px-3 sm:px-4 rounded-xl border-2 border-teal/40 text-teal hover:bg-teal/10 font-bold text-xs sm:text-sm"
            >
              <RefreshCw className="h-4 w-4 mr-1.5" />
              Price Sync
            </Button>
            <Button
              type="button"
              onClick={() => setIsUrlScraperOpen(true)}
              className="flex-1 sm:flex-initial h-10 px-3 sm:px-4 rounded-xl border-2 border-teal/40 text-teal hover:bg-teal/10 font-bold text-xs sm:text-sm"
            >
              <Globe className="h-4 w-4 mr-1.5" />
              URL Scraper
            </Button>
            <Button
              type="button"
              onClick={handleExportExcel}
              disabled={isExporting}
              className="flex-1 sm:flex-initial h-10 px-3 sm:px-4 rounded-xl border-2 border-teal/40 text-teal hover:bg-teal/10 font-bold text-xs sm:text-sm"
            >
              {isExporting ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Download className="h-4 w-4 mr-1.5" />}
              Excel
            </Button>
          </>
        }
      />

      <AdminStats
        columns={4}
        items={[
          { title: "Total Products", value: products.length, icon: Boxes },
          { title: "Epic Synced", value: syncedCount, icon: CheckCircle },
          { title: "Unlisted", value: unlistedCount, icon: XCircle },
          { title: "Low Stock", value: lowStockCount, icon: AlertCircle },
        ]}
      />

      <AdminFilterBar
        tabs={filterTabs}
        tabValue={epicStatusFilter}
        onTabChange={(value) => setEpicStatusFilter(value as "all" | "synced" | "unlisted")}
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search products..."
        selects={[
          {
            value: categoryFilter,
            onValueChange: setCategoryFilter,
            placeholder: "All Categories",
            options: categories.map((category) => ({ value: category.name, label: category.name })),
          },
          {
            value: sourceFilter,
            onValueChange: setSourceFilter,
            placeholder: "Source eCommerce",
            options: availableSources.map((source) => ({ value: source.domain, label: `${source.name} (${source.count})` })),
          },
        ]}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider opacity-70">Categories</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={openCreateCategory}
              className="h-7 px-2 text-xs font-bold text-teal hover:underline"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              New
            </Button>
            {categories.map((category) => (
              <span key={category.id} className="inline-flex items-center gap-0.5 rounded-lg border border-navy/15 bg-navy/5 px-2 py-1 text-[11px] font-bold">
                {category.name}
                <button
                  type="button"
                  onClick={() => openEditCategory(category)}
                  title={`Edit ${category.name}`}
                  className="ml-1 rounded p-0.5 hover:bg-navy/10"
                >
                  <Edit className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryToDelete(category)}
                  title={`Delete ${category.name}`}
                  className="rounded p-0.5 text-brand-red hover:bg-red-500/10"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("grid")}
              className={cn("h-8 px-2 text-xs font-bold", viewMode === "grid" && "bg-navy text-white")}
            >
              <LayoutGrid className="h-4 w-4 mr-1" />
              Grid
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("list")}
              className={cn("h-8 px-2 text-xs font-bold", viewMode === "list" && "bg-navy text-white")}
            >
              <List className="h-4 w-4 mr-1" />
              List
            </Button>
            {viewMode === "grid" && (
              <ProductGridColumnsPicker
                value={gridColumns}
                onChange={setGridColumns}
                isDark={isDark}
                className="shrink-0"
              />
            )}
          </div>
        </div>
      </AdminFilterBar>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleSelectAllPage}
            className="flex items-center gap-2 text-xs font-bold cursor-pointer"
          >
            <span className={cn(
              "h-5 w-5 rounded-md border-2 flex items-center justify-center",
              isAllPageSelected ? "bg-navy text-white border-navy" : isDark ? "border-teal/40" : "border-navy/30"
            )}>
              {isAllPageSelected && <Check className="h-3 w-3" strokeWidth={3} />}
            </span>
            Select Page ({paginatedProducts.length})
          </button>
          {selectedIds.length > 0 && !isAllFilteredSelected && filteredProducts.length > paginatedProducts.length && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={selectAllFiltered}
              className="text-xs font-bold text-teal hover:underline h-7 px-2"
            >
              Select all {filteredProducts.length} matching filter
            </Button>
          )}
          {selectedIds.length > 0 && (
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-navy text-white">
              {selectedIds.length} Selected
            </span>
          )}
          {selectedIds.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="text-xs font-bold hover:underline h-7 px-2"
            >
              Clear
            </Button>
          )}
        </div>
        <span className="text-xs font-semibold opacity-70">
          Showing {paginatedProducts.length} of {filteredProducts.length} products
        </span>
      </div>

      {selectedIds.length > 0 && (
        <div className={cn(
          "flex flex-wrap items-center gap-2 rounded-2xl border-2 p-3",
          isDark ? "bg-[#0a1033] border-teal/30" : "bg-white border-navy/20"
        )}>
          <span className="text-xs font-black mr-1">Bulk Actions:</span>
          <Button type="button" size="sm" onClick={() => setIsBulkCategoryOpen(true)} className="h-8 text-xs font-bold rounded-xl">
            <Tag className="h-3.5 w-3.5 mr-1" />
            Change Category
          </Button>
          <Button type="button" size="sm" onClick={() => setIsBulkStockOpen(true)} className="h-8 text-xs font-bold rounded-xl">
            <Boxes className="h-3.5 w-3.5 mr-1" />
            Update Stock
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => setIsBulkDeleteConfirmOpen(true)}
            className="h-8 text-xs font-bold rounded-xl bg-brand-red text-white hover:bg-red-600"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Delete {selectedIds.length}
          </Button>
        </div>
      )}

      {viewMode === "list" ? (
        <AdminTable
          columns={productColumns}
          data={paginatedProducts}
          rowKey={(product) => product.id}
          actions={productActions}
          emptyIcon={Package}
          emptyTitle="No products found"
          emptyDescription="Try adjusting your filters or search keyword"
        />
      ) : (
        <>
          {categoryFilter !== "all" && filteredProducts.length === 0 && (
            <p className="text-brand-red font-bold">No products found in &quot;{categoryFilter}&quot; category.</p>
          )}
          <div className={cn("grid gap-3 sm:gap-6", GRID_COLUMN_CLASSES[gridColumns])}>
            {paginatedProducts.map((product) => (
              <div key={product.id} className="group relative h-full">
                <div className={cn(
                  "relative h-full rounded-2xl border-2 overflow-hidden transition-all duration-300 hover:shadow-lg flex flex-col justify-between",
                  isDark ? "bg-[#0a1033] border-teal/30" : "bg-white border-navy/20"
                )}>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => openViewProduct(product)}
                      className={cn("w-full overflow-hidden cursor-pointer", cardScale.image)}
                      title={`View ${product.name}`}
                    >
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-navy/5">
                          <Package className={cn("opacity-40", cardScale.icon)} />
                        </div>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => openViewProduct(product)}
                      className="absolute inset-0 flex items-center justify-center bg-navy/50 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="View details"
                    >
                      <Eye className={cn("text-white", cardScale.icon)} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => toggleSelectProduct(product.id, e)}
                      className="absolute top-2 left-2 z-10"
                      title={selectedIds.includes(product.id) ? "Deselect" : "Select"}
                    >
                      <span className={cn(
                        "flex items-center justify-center rounded-full border-2 bg-white/90 shadow",
                        cardScale.circle,
                        selectedIds.includes(product.id) ? "bg-navy border-navy text-white" : "border-navy/30"
                      )}>
                        {selectedIds.includes(product.id) && <Check className={cardScale.check} strokeWidth={3} />}
                      </span>
                    </button>
                    {product.notOnEpic && (
                      <span className={cn("absolute top-2 right-2 rounded-full bg-amber-500 text-white font-bold", cardScale.badge)}>
                        Unlisted
                      </span>
                    )}
                  </div>
                  <div className={cn("space-y-1", cardScale.detailPad)}>
                    <h3 className={cn("font-black truncate", cardScale.title)}>{product.name}</h3>
                    <p className={cn("font-bold text-teal", cardScale.price)}>TZS {product.price.toLocaleString()}</p>
                    <div className="flex flex-wrap items-center gap-1">
                      <AdminPill className={cardScale.badge}>{product.category}</AdminPill>
                      <AdminMutedText className="text-[10px]">{formatSourceName(product.sourceDomain)}</AdminMutedText>
                    </div>
                  </div>
                  <div className={cn("flex items-center justify-between gap-1", cardScale.actionPad)}>
                    <Button type="button" size="sm" onClick={() => openEditProduct(product)} className={cn("flex-1 rounded-xl font-bold", cardScale.button)}>
                      <Edit className={cn("mr-1", cardScale.icon)} />
                      Edit
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" size="sm" variant="outline" className={cn("rounded-xl font-bold px-2", cardScale.button)}>
                          •••
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Product Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => openViewProduct(product)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => openTransferForProduct(product)}>
                          <ArrowRightLeft className="h-4 w-4 mr-2" />
                          Transfer stock
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => openAdjustForProduct(product)}>
                          <SlidersHorizontal className="h-4 w-4 mr-2" />
                          Adjust stock
                        </DropdownMenuItem>
                        {product.epicUrl && (
                          <DropdownMenuItem asChild>
                            <a href={product.epicUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View on Epic
                            </a>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onSelect={() => setProductToDelete(product)} className="text-brand-red">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="rounded-xl">
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} className="rounded-xl">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs font-bold px-3">Page {currentPage} of {totalPages}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} className="rounded-xl">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="rounded-xl">
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <AdminFormModal
        open={isProductDialogOpen}
        onOpenChange={(open) => {
          setIsProductDialogOpen(open)
          if (!open) setEditingProduct(null)
        }}
        icon={editingProduct ? Edit : Plus}
        title={editingProduct ? "Edit Product" : "Create Product"}
        description={editingProduct ? "Update product details, pricing and media." : "Add a new product to the catalog."}
        onSubmit={submitProductForm}
        isSubmitting={isSavingProduct}
        isEdit={Boolean(editingProduct)}
        createLabel="Create Product"
        editLabel="Update Product"
        size="lg"
        footerExtra={
          <Button
            type="button"
            variant="outline"
            onClick={fetchEpicProductData}
            disabled={isFetchingProduct || (!productForm.name.trim() && !epicFetchUrl.trim())}
            className="rounded-xl border-2 font-bold h-10 sm:h-11 px-4 text-xs sm:text-sm"
          >
            {isFetchingProduct ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Auto-Fetch Specs
          </Button>
        }
      >
        <AdminFormGrid className="sm:grid-cols-2">
          <AdminFormField label="Product Name" required>
            <AdminInput
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              placeholder="Product name"
              required
            />
          </AdminFormField>
          <AdminFormField label="Category" required>
            <AdminSelect
              value={productForm.category}
              onValueChange={(value) => setProductForm({ ...productForm, category: value })}
              placeholder="Select category"
              options={categories.map((category) => ({ value: category.name, label: category.name }))}
            />
          </AdminFormField>
        </AdminFormGrid>

        <AdminFormField label="Description">
          <AdminTextarea
            value={productForm.description}
            onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
            rows={3}
            placeholder="Product description"
          />
        </AdminFormField>

        <AdminFormGrid className="sm:grid-cols-3">
          <AdminFormField label="Price" required>
            <AdminInput
              type="number"
              step="0.01"
              min="0"
              value={productForm.price}
              onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
              required
            />
          </AdminFormField>
          <AdminFormField label="Stock" required>
            <AdminInput
              type="number"
              min="0"
              value={productForm.stock}
              onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
              required
            />
          </AdminFormField>
          <AdminFormField label="Rating (1-5)" required>
            <AdminInput
              type="number"
              step="0.1"
              min="1"
              max="5"
              value={productForm.rating}
              onChange={(e) => setProductForm({ ...productForm, rating: e.target.value })}
              required
            />
          </AdminFormField>
        </AdminFormGrid>

        <AdminFormField
          label="Auto-Sync Product Specs URL"
          hint="Paste a product URL to auto-fetch specs and images before saving."
        >
          <AdminInput
            value={epicFetchUrl}
            onChange={(e) => setEpicFetchUrl(e.target.value)}
            placeholder="https://example.com/product/..."
          />
        </AdminFormField>

        <AdminFormGrid className="sm:grid-cols-2">
          <AdminFormField label="Image URL">
            <AdminInput
              value={productForm.image}
              onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </AdminFormField>
          <AdminFormField label="Product Type">
            <AdminSelect
              value={productForm.type}
              onValueChange={(value) => setProductForm({ ...productForm, type: value as "physical" | "service" })}
              options={[
                { value: "physical", label: "Physical" },
                { value: "service", label: "Service" },
              ]}
            />
          </AdminFormField>
        </AdminFormGrid>

        <AdminFormField label="Swatch Image URLs" hint="Comma separated URLs">
          <AdminInput
            value={productForm.swatchImages}
            onChange={(e) => setProductForm({ ...productForm, swatchImages: e.target.value })}
            placeholder="https://example.com/swatch1.jpg, https://example.com/swatch2.jpg"
          />
        </AdminFormField>

        <AdminFormField label="Features" hint="Comma separated features">
          <AdminTextarea
            value={productForm.features}
            onChange={(e) => setProductForm({ ...productForm, features: e.target.value })}
            rows={2}
            placeholder="Feature 1, Feature 2, Feature 3"
          />
        </AdminFormField>
      </AdminFormModal>

      <AdminFormModal
        open={isCategoryDialogOpen}
        onOpenChange={(open) => {
          setIsCategoryDialogOpen(open)
          if (!open) {
            setEditingCategory(null)
            setCategoryName("")
          }
        }}
        icon={Tag}
        title={editingCategory ? "Edit Category" : "Create Category"}
        description="Categories organize the product catalog and bulk updates."
        onSubmit={submitCategoryForm}
        isEdit={Boolean(editingCategory)}
        createLabel="Create Category"
        editLabel="Update Category"
        size="sm"
      >
        <AdminFormField label="Category Name" required>
          <AdminInput
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="Category name"
            required
          />
        </AdminFormField>
      </AdminFormModal>

      <AdminFormModal
        open={isBulkCategoryOpen}
        onOpenChange={setIsBulkCategoryOpen}
        icon={Tag}
        title="Bulk Update Category"
        description={`Move ${selectedIds.length} selected products to another category.`}
        onSubmit={async (e) => {
          e.preventDefault()
          await handleBulkUpdateCategory()
        }}
        submitLabel="Update Category"
        size="sm"
      >
        <AdminFormField label="Target Category" required>
          <AdminSelect
            value={targetCategory}
            onValueChange={setTargetCategory}
            placeholder="Select target category"
            options={categories.map((category) => ({ value: category.name, label: category.name }))}
          />
        </AdminFormField>
      </AdminFormModal>

      <AdminFormModal
        open={isBulkStockOpen}
        onOpenChange={setIsBulkStockOpen}
        icon={Boxes}
        title="Bulk Update Stock"
        description={`Set the stock level for ${selectedIds.length} selected products.`}
        onSubmit={async (e) => {
          e.preventDefault()
          await handleBulkUpdateStock()
        }}
        submitLabel="Update Stock"
        size="sm"
      >
        <AdminFormField label="Stock Level" required>
          <AdminInput
            type="number"
            min="0"
            value={targetStock}
            onChange={(e) => setTargetStock(Math.max(0, parseInt(e.target.value) || 0))}
            required
          />
        </AdminFormField>
      </AdminFormModal>

      <AdminDetailModal
        open={isViewDialogOpen}
        onOpenChange={(open) => {
          setIsViewDialogOpen(open)
          if (!open) setViewingProduct(null)
        }}
        icon={Package}
        title={viewingProduct?.name || "Product Details"}
        subtitle={viewingProduct ? `${viewingProduct.category} · ${formatSourceName(viewingProduct.sourceDomain)}` : undefined}
        badge={viewingProduct?.notOnEpic ? <AdminPill>Unlisted</AdminPill> : <AdminStatusBadge status="synced" label="Epic Synced" />}
        headerActions={
          viewingProduct?.epicUrl ? (
            <Button asChild variant="outline" size="sm" className="rounded-xl font-bold">
              <a href={viewingProduct.epicUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" />
                Epic
              </a>
            </Button>
          ) : undefined
        }
        sections={
          viewingProduct
            ? [
                {
                  key: "media",
                  title: "Product Media",
                  icon: Eye,
                  span: 1,
                  content: activeModalImage ? (
                    <img src={activeModalImage} alt={viewingProduct.name} className="w-full rounded-xl object-cover max-h-52" />
                  ) : (
                    <AdminMutedText>No image available</AdminMutedText>
                  ),
                },
                {
                  key: "overview",
                  title: "Overview",
                  icon: Boxes,
                  span: 2,
                  fields: [
                    { label: "Product ID", value: viewingProduct.id },
                    { label: "Price", value: `TZS ${viewingProduct.price.toLocaleString()}` },
                    { label: "Stock", value: viewingProduct.stock },
                    { label: "Rating", value: `${viewingProduct.rating} / 5` },
                    { label: "Type", value: viewingProduct.type || "physical" },
                    { label: "Condition", value: viewingProduct.condition || "—" },
                  ],
                },
                {
                  key: "features",
                  title: "Features",
                  icon: Star,
                  span: 2,
                  content:
                    viewingProduct.features.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {viewingProduct.features.map((feature, index) => (
                          <AdminTag key={`${feature}-${index}`} title={feature}>{feature}</AdminTag>
                        ))}
                      </div>
                    ) : (
                      <AdminMutedText>No features recorded</AdminMutedText>
                    ),
                },
                {
                  key: "swatches",
                  title: "Swatch Images",
                  icon: Package,
                  span: 1,
                  content:
                    viewingProduct.swatchImages && viewingProduct.swatchImages.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {viewingProduct.swatchImages.map((url, index) => (
                          <img key={`${url}-${index}`} src={url} alt={`Swatch ${index + 1}`} className="h-12 w-12 rounded-lg object-cover border" />
                        ))}
                      </div>
                    ) : (
                      <AdminMutedText>No swatch images</AdminMutedText>
                    ),
                },
              ]
            : []
        }
        fields={viewingProduct ? [{ label: "Description", value: viewingProduct.description || "—" }] : undefined}
        onEdit={() => {
          if (viewingProduct) openEditProduct(viewingProduct)
        }}
        editLabel="Edit Product"
        onDelete={() => {
          if (viewingProduct) setProductToDelete(viewingProduct)
        }}
        deleteLabel="Delete Product"
      />

      <AdminConfirmDialog
        open={Boolean(productToDelete)}
        onOpenChange={(open) => {
          if (!open) setProductToDelete(null)
        }}
        title="Delete product?"
        description={productToDelete ? `“${productToDelete.name}” will be removed from the catalog.` : undefined}
        onConfirm={handleDeleteProduct}
        isSubmitting={false}
      />
      <AdminConfirmDialog
        open={Boolean(categoryToDelete)}
        onOpenChange={(open) => {
          if (!open) setCategoryToDelete(null)
        }}
        title="Delete category?"
        description={categoryToDelete ? `“${categoryToDelete.name}” will be removed. Products in this category may be affected.` : undefined}
        onConfirm={handleDeleteCategory}
      />
      <AdminConfirmDialog
        open={isBulkDeleteConfirmOpen}
        onOpenChange={setIsBulkDeleteConfirmOpen}
        title="Delete selected products?"
        description={`${selectedIds.length} products will be removed from the catalog.`}
        confirmLabel={`Delete ${selectedIds.length}`}
        onConfirm={handleBulkDelete}
        isSubmitting={isBulkDeleting}
      />

      <AdminModalShell
        open={isUrlScraperOpen}
        onOpenChange={setIsUrlScraperOpen}
        icon={Globe}
        title="Universal E-Commerce Scraper"
        description="Paste any e-commerce store link. The scraper discovers products, extracts prices, images and specifications, and applies the +20,000 TZS cut."
        size="lg"
        footer={
          <div className="pt-2 flex flex-wrap gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setIsUrlScraperOpen(false)} disabled={isUrlScraping} className="rounded-xl font-bold">
              Close
            </Button>
            <Button
              type="button"
              onClick={handleUniversalUrlScrape}
              disabled={isUrlScraping || !scrapeUrlInput.trim()}
              className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl"
            >
              {isUrlScraping ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              {isUrlScraping ? "Extracting & Updating..." : "Start Extraction Now"}
            </Button>
          </div>
        }
      >
        <AdminFormField label="E-Commerce Shop or Product Link" required>
          <AdminInput
            value={scrapeUrlInput}
            onChange={(e) => setScrapeUrlInput(e.target.value)}
            placeholder="https://laptopcitystore.co.tz/collections/ or https://maishacomputers.com/shop"
            disabled={isUrlScraping}
          />
        </AdminFormField>
        <AdminFormField label="Maximum Products to Extract" hint="Accepts collections directories, shop pages, category URLs or direct product URLs.">
          <AdminInput
            type="number"
            min={1}
            max={1000}
            value={scrapeLimit}
            onChange={(e) => setScrapeLimit(Math.max(1, parseInt(e.target.value) || 50))}
            disabled={isUrlScraping}
          />
        </AdminFormField>
        <div className={cn(
          "p-3.5 rounded-xl border text-xs space-y-1.5",
          isDark ? "bg-teal/10 border-teal/30" : "bg-teal/10 border-navy/15"
        )}>
          <div className="font-bold flex items-center gap-1.5">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
            Automated Profit Cut & Categorization
          </div>
          <p className="opacity-80">
            Your constant <strong>+20,000 TZS</strong> profit margin cut is added automatically, and products are classified into QuardCube categories.
          </p>
        </div>
        {urlScrapeResult && (
          <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs space-y-2">
            <div className="font-bold flex items-center justify-between">
              <span>Scrape Complete ({urlScrapeResult.domain})</span>
              <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-full">
                +{(urlScrapeResult.priceCutAppliedTzs || 0).toLocaleString()} TZS cut
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border bg-white/70 dark:bg-slate-900 p-2">
                <span className="block text-[10px] opacity-70">Discovered</span>
                <span className="font-black">{urlScrapeResult.totalDiscovered || 0}</span>
              </div>
              <div className="rounded-lg border bg-white/70 dark:bg-slate-900 p-2">
                <span className="block text-[10px] text-emerald-600 font-bold">New Added</span>
                <span className="font-black text-emerald-600">{urlScrapeResult.created || 0}</span>
              </div>
              <div className="rounded-lg border bg-white/70 dark:bg-slate-900 p-2">
                <span className="block text-[10px] text-blue-600 font-bold">Updated</span>
                <span className="font-black text-blue-600">{urlScrapeResult.updated || 0}</span>
              </div>
            </div>
          </div>
        )}
      </AdminModalShell>

      <AdminModalShell
        open={isEpicSyncDialogOpen}
        onOpenChange={(open) => {
          setIsEpicSyncDialogOpen(open)
          if (!open) setEpicSyncStep("idle")
        }}
        icon={Sparkles}
        title="Epic Computers Catalog Sync"
        description="Synchronize the shop catalog with Epic Computers, including the +20,000 TZS cut and automatic unlisting."
        size="xl"
        footer={
          <div className="pt-2 flex flex-wrap gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setIsEpicSyncDialogOpen(false)} disabled={isBulkFetching} className="rounded-xl font-bold">
              Close
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSyncEpicCatalog(true)}
              disabled={isBulkFetching}
              className="rounded-xl font-bold"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview Changes
            </Button>
            <Button
              type="button"
              onClick={() => handleSyncEpicCatalog(false)}
              disabled={isBulkFetching}
              className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl"
            >
              {isBulkFetching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Run Full Sync
            </Button>
          </div>
        }
      >
        {epicSyncStep === "syncing" && (
          <div className="p-6 rounded-xl border border-teal/30 bg-teal/10 text-center">
            <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin text-teal" />
            <h4 className="font-bold">Synchronizing Catalog with Epic Computers...</h4>
            <p className="text-xs opacity-75 mt-1">Fetching live listings, applying price cuts and checking for unlisted products.</p>
          </div>
        )}

        {epicSyncStep === "idle" && (
          <>
            <div className="p-4 rounded-xl border border-teal/30 bg-teal/10 text-xs space-y-2">
              <h4 className="font-bold flex items-center gap-2"><Sparkles className="h-4 w-4" /> How Full Catalog Synchronization Works</h4>
              <ul className="list-disc pl-5 space-y-1 opacity-80">
                <li>Fetches live products from Epic Computers.</li>
                <li>Adds new products to the shop with the +20,000 TZS cut.</li>
                <li>Updates prices for products already in the catalog.</li>
                <li>Unlists products no longer available on Epic Computers.</li>
              </ul>
            </div>
            <AdminFormGrid>
              <AdminFormField label="Epic Category" required>
                <AdminSelect
                  value={selectedEpicCategory}
                  onValueChange={setSelectedEpicCategory}
                  placeholder="Select Epic category"
                  options={EPIC_CATEGORIES.map((category) => ({
                    value: category.value,
                    label: `${category.group} — ${category.label}`,
                  }))}
                />
              </AdminFormField>
              <AdminFormField label="Maximum Products" hint="Used for targeted imports from a selected Epic category.">
                <AdminInput
                  type="number"
                  min={1}
                  value={epicProductCount}
                  onChange={(e) => setEpicProductCount(Math.max(1, parseInt(e.target.value) || 60))}
                />
              </AdminFormField>
            </AdminFormGrid>
            <div className="flex justify-end">
              <Button type="button" onClick={handleImportFromEpic} disabled={isBulkFetching} className="bg-teal text-navy hover:bg-teal-400 font-bold rounded-xl">
                <Download className="h-4 w-4 mr-2" />
                Import Selected Category
              </Button>
            </div>
          </>
        )}

        {epicSyncStep === "results" && epicSyncResult && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: "Added", value: epicSyncResult.summary?.added || 0 },
                { label: "Updated", value: epicSyncResult.summary?.updated || 0 },
                { label: "Unlisted", value: epicSyncResult.summary?.unlisted || 0 },
                { label: "Matched", value: epicSyncResult.summary?.matched || 0 },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded-xl border text-center">
                  <span className="block text-[10px] uppercase font-bold opacity-70">{item.label}</span>
                  <span className="text-xl font-black">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center">
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: "added", label: `Added (${epicSyncResult.addedProducts?.length || 0})` },
                  { key: "updated", label: `Price Updates (${epicSyncResult.updatedProducts?.length || 0})` },
                  { key: "unlisted", label: `Unlisted (${epicSyncResult.unlistedProducts?.length || 0})` },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setEpicActiveTab(tab.key as "added" | "updated" | "unlisted")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold",
                      epicActiveTab === tab.key ? "bg-navy text-white" : "bg-navy/5 hover:bg-navy/10"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <AdminInput
                placeholder="Search items..."
                value={epicSearchFilter}
                onChange={(e) => setEpicSearchFilter(e.target.value)}
                className="h-8 w-full sm:w-48"
              />
            </div>

            {epicActiveTab === "added" && (
              <AdminTable
                inline
                columns={epicAddedColumns}
                data={(epicSyncResult.addedProducts || []).filter((p: EpicSyncAddedRow) => !epicSearchFilter || p.name.toLowerCase().includes(epicSearchFilter.toLowerCase())) as EpicSyncAddedRow[]}
                rowKey={(row: EpicSyncAddedRow) => row.id || row.name}
                className="max-h-[280px] overflow-y-auto text-xs"
                emptyTitle="No added products found"
                emptyDescription="Try adjusting your search keyword"
              />
            )}
            {epicActiveTab === "updated" && (
              <AdminTable
                inline
                columns={epicUpdatedColumns}
                data={(epicSyncResult.updatedProducts || []).filter((p: EpicSyncUpdatedRow) => !epicSearchFilter || p.name.toLowerCase().includes(epicSearchFilter.toLowerCase())) as EpicSyncUpdatedRow[]}
                rowKey={(row: EpicSyncUpdatedRow) => row.id}
                className="max-h-[280px] overflow-y-auto text-xs"
                emptyTitle="No price updates found"
                emptyDescription="Try adjusting your search keyword"
              />
            )}
            {epicActiveTab === "unlisted" && (
              <AdminTable
                inline
                columns={epicUnlistedColumns}
                data={(epicSyncResult.unlistedProducts || []).filter((p: EpicSyncUnlistedRow) => !epicSearchFilter || p.name.toLowerCase().includes(epicSearchFilter.toLowerCase())) as EpicSyncUnlistedRow[]}
                rowKey={(row: EpicSyncUnlistedRow) => row.id || row.name}
                className="max-h-[280px] overflow-y-auto text-xs"
                emptyTitle="No unlisted products found"
                emptyDescription="Try adjusting your search keyword"
              />
            )}
          </div>
        )}
      </AdminModalShell>

      <AdminModalShell
        open={isPriceSyncDialogOpen}
        onOpenChange={(open) => {
          setIsPriceSyncDialogOpen(open)
          if (!open) setPriceSyncStep("idle")
        }}
        icon={RefreshCw}
        title="Epic Live Price Sync"
        description="Compare catalog prices against Epic Computers and apply the constant +20,000 TZS cut."
        size="xl"
        footer={
          <div className="pt-2 flex flex-wrap gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setIsPriceSyncDialogOpen(false)} disabled={isSyncingPrices} className="rounded-xl font-bold">
              Close
            </Button>
            <Button type="button" variant="outline" onClick={() => handleSyncPrices(true)} disabled={isSyncingPrices} className="rounded-xl font-bold">
              <Eye className="h-4 w-4 mr-2" />
              Preview Changes
            </Button>
            <Button type="button" onClick={() => handleSyncPrices(false)} disabled={isSyncingPrices} className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl">
              {isSyncingPrices ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Apply Price Updates
            </Button>
          </div>
        }
      >
        {priceSyncStep === "syncing" && (
          <div className="p-6 rounded-xl border border-teal/30 bg-teal/10 text-center">
            <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin text-teal" />
            <h4 className="font-bold">Fetching Live Prices...</h4>
          </div>
        )}

        {priceSyncStep === "idle" && (
          <div className="p-4 rounded-xl border border-teal/30 bg-teal/10 text-xs space-y-2">
            <h4 className="font-bold flex items-center gap-2"><RefreshCw className="h-4 w-4" /> How Live Price Sync Works</h4>
            <ul className="list-disc pl-5 space-y-1 opacity-80">
              <li>Matches catalog products with live Epic Computers listings.</li>
              <li>Shows old price, Epic base price and the new +20,000 TZS cut price.</li>
              <li>Preview first, then apply updates to the database.</li>
            </ul>
            <a href="https://epiccomputers.co.tz" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-teal hover:underline">
              Open Epic Computers <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}

        {priceSyncStep === "results" && priceSyncResult && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: "Matched", value: priceSyncResult.summary?.matched || 0 },
                { label: "Updated", value: priceSyncResult.summary?.updated || 0 },
                { label: "Unchanged", value: priceSyncResult.summary?.unchanged || 0 },
                { label: "Failed", value: priceSyncResult.summary?.failed || 0 },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded-xl border text-center">
                  <span className="block text-[10px] uppercase font-bold opacity-70">{item.label}</span>
                  <span className="text-xl font-black">{item.value}</span>
                </div>
              ))}
            </div>

            <div className={cn(
              "p-3 rounded-xl border text-xs font-semibold",
              priceSyncResult.dryRun
                ? "border-amber-500/40 bg-amber-500/10"
                : "border-emerald-500/40 bg-emerald-500/10"
            )}>
              {priceSyncResult.dryRun ? (
                <span><strong>Preview Mode:</strong> {priceSyncResult.summary?.updated || 0} products have updated prices on Epic Computers. Database has NOT been modified.</span>
              ) : (
                <span><strong>Success:</strong> {priceSyncResult.summary?.updated || 0} product prices were updated in your database and synced with Epic Computers.</span>
              )}
            </div>

            {priceSyncResult.updatedProducts?.length > 0 ? (
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center">
                  <h5 className="text-xs font-bold uppercase tracking-wider opacity-70">
                    Price Changes ({priceSyncResult.updatedProducts.length})
                  </h5>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <AdminInput
                      placeholder="Search changed products..."
                      value={priceDiffSearch}
                      onChange={(e) => setPriceDiffSearch(e.target.value)}
                      className="h-8 w-full sm:w-48"
                    />
                    <AdminSelect
                      value={priceDiffFilter}
                      onValueChange={(value) => setPriceDiffFilter(value as "all" | "increased" | "decreased")}
                      className="h-8 w-36"
                      options={[
                        { value: "all", label: "All Changes" },
                        { value: "increased", label: "Increases ↑" },
                        { value: "decreased", label: "Decreases ↓" },
                      ]}
                    />
                  </div>
                </div>
                <AdminTable
                  inline
                  columns={priceChangeColumns}
                  data={priceSyncResult.updatedProducts
                    .filter((p: PriceSyncChangeRow) => {
                      if (priceDiffFilter === "increased" && p.difference <= 0) return false
                      if (priceDiffFilter === "decreased" && p.difference >= 0) return false
                      if (priceDiffSearch && !p.name.toLowerCase().includes(priceDiffSearch.toLowerCase())) return false
                      return true
                    }) as PriceSyncChangeRow[]}
                  rowKey={(row: PriceSyncChangeRow) => row.id}
                  className="max-h-[280px] overflow-y-auto text-xs"
                  emptyTitle="No price changes found"
                  emptyDescription="Try adjusting your filters or search keyword"
                />
              </div>
            ) : (
              <div className="p-6 text-center rounded-xl border">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                <h4 className="font-bold">All Product Prices Are Up To Date!</h4>
                <p className="text-xs opacity-70 mt-1">
                  All {priceSyncResult.summary?.matched || 0} matched products already match Epic Computers prices.
                </p>
              </div>
            )}
          </div>
        )}
      </AdminModalShell>

      {/* WAREHOUSE STOCK TRANSFER */}
      <AdminFormModal
        open={isTransferOpen}
        onOpenChange={setIsTransferOpen}
        icon={ArrowRightLeft}
        title="Warehouse Stock Transfer"
        description="Move authenticated product inventory between physical hubs and branch locations. Total company stock is preserved."
        onSubmit={handleExecuteTransfer}
        isSubmitting={isTransferring}
        size="md"
        createLabel="Execute Transfer"
      >
        <AdminFormGrid>
          <AdminFormField label="Select Product" required className="sm:col-span-2">
            <AdminSelect
              value={transferProductId ? String(transferProductId) : ""}
              onValueChange={(value) => setTransferProductId(Number(value))}
              placeholder="Choose product..."
              options={products.map((product) => ({
                value: String(product.id),
                label: `${product.name} (Stock: ${product.stock} units)`,
              }))}
            />
          </AdminFormField>
          <AdminFormField label="Source Warehouse" required>
            <AdminSelect
              value={transferSourceWh}
              onValueChange={setTransferSourceWh}
              placeholder="Source..."
              options={warehouses.map((warehouse) => ({ value: warehouse.id, label: warehouse.name }))}
            />
          </AdminFormField>
          <AdminFormField label="Destination Warehouse" required>
            <AdminSelect
              value={transferDestWh}
              onValueChange={setTransferDestWh}
              placeholder="Destination..."
              options={warehouses.map((warehouse) => ({ value: warehouse.id, label: warehouse.name }))}
            />
          </AdminFormField>
          <AdminFormField label="Transfer Quantity" required>
            <AdminInput
              monospace
              type="number"
              min="1"
              value={transferQty}
              onChange={(event) => setTransferQty(Math.max(1, parseInt(event.target.value) || 1))}
            />
          </AdminFormField>
          <AdminFormField label="Transfer Notes / Reason">
            <AdminInput
              placeholder="e.g. Showroom restocking or client allocation"
              value={transferReason}
              onChange={(event) => setTransferReason(event.target.value)}
            />
          </AdminFormField>
        </AdminFormGrid>
      </AdminFormModal>

      {/* STOCK ADJUSTMENT — quick ledger movement or audited voucher */}
      <AdminFormModal
        open={isAdjustOpen}
        onOpenChange={setIsAdjustOpen}
        icon={SlidersHorizontal}
        title={adjustMode === "quick" ? "Quick Stock Adjustment" : "Stocktake Adjustment Voucher"}
        description={
          adjustMode === "quick"
            ? "Audited quantity adjustment written to the stock movement ledger."
            : "Physical count variance with valuation impact and automatic General Ledger write-down journal."
        }
        onSubmit={handleExecuteAdjustment}
        isSubmitting={isAdjusting}
        size="md"
        createLabel={adjustMode === "quick" ? "Save Adjustment" : "Record Voucher"}
      >
        <AdminFormGrid>
          <AdminFormField label="Adjustment Mode" className="sm:col-span-2">
            <AdminSelect
              value={adjustMode}
              onValueChange={(value) => setAdjustMode(value as "quick" | "voucher")}
              options={[
                { value: "quick", label: "Quick Adjustment (movement ledger)" },
                { value: "voucher", label: "Stocktake Voucher (GL posted)" },
              ]}
            />
          </AdminFormField>
          <AdminFormField label="Select Product" required className="sm:col-span-2">
            <AdminSelect
              value={adjustProductId ? String(adjustProductId) : ""}
              onValueChange={(value) => {
                setAdjustProductId(Number(value))
                const selected = products.find((product) => product.id === Number(value))
                if (selected) setAdjustUnitCost(Number(selected.price) || 0)
              }}
              placeholder="Choose product..."
              options={products.map((product) => ({
                value: String(product.id),
                label: `${product.name} (Current Stock: ${product.stock} units)`,
              }))}
            />
          </AdminFormField>
          {adjustMode === "quick" ? (
            <AdminFormField label="Adjustment Type">
              <AdminSelect
                value={adjustType}
                onValueChange={(value) => setAdjustType(value as StockMovementType)}
                options={ADJUSTMENT_TYPE_OPTIONS}
              />
            </AdminFormField>
          ) : (
            <AdminFormField label="Reason Code" required>
              <AdminSelect
                value={adjustReason}
                onValueChange={(value) => setAdjustReason(value as StockAdjustmentReason)}
                options={STOCKTAKE_REASONS.map((reason) => ({ value: reason, label: reason }))}
              />
            </AdminFormField>
          )}
          <AdminFormField label="Warehouse">
            <AdminSelect
              value={adjustWh || warehouses[0]?.id || ""}
              onValueChange={setAdjustWh}
              placeholder="Choose warehouse..."
              options={warehouses.map((warehouse) => ({ value: warehouse.id, label: warehouse.name }))}
            />
          </AdminFormField>
          <AdminFormField label="Quantity Change (+ to add, - to subtract)" required>
            <AdminInput
              monospace
              type="number"
              value={adjustQty}
              onChange={(event) => setAdjustQty(parseInt(event.target.value) || 0)}
            />
          </AdminFormField>
          {adjustMode === "voucher" && (
            <AdminFormField label="Unit Cost (TZS)" hint="Defaults to the catalog price. Used to value the stock variance.">
              <AdminInput
                monospace
                type="number"
                min="0"
                value={adjustUnitCost}
                onChange={(event) => setAdjustUnitCost(Math.max(0, Number(event.target.value) || 0))}
              />
            </AdminFormField>
          )}
          <AdminFormField label={adjustMode === "quick" ? "Reason" : "Notes"} required={adjustMode === "quick"}>
            <AdminInput
              placeholder={adjustMode === "quick" ? "e.g. Physical inventory count discrepancy resolved" : "e.g. Counted 2 units fewer on physical stocktake"}
              value={adjustNotes}
              onChange={(event) => setAdjustNotes(event.target.value)}
            />
          </AdminFormField>
        </AdminFormGrid>
      </AdminFormModal>

      {/* AUDITABLE STOCK LEDGER */}
      <AdminModalShell
        open={isLedgerOpen}
        onOpenChange={setIsLedgerOpen}
        icon={History}
        title="Stock Ledger"
        description="Auditable stock movements and physical stocktake vouchers."
        size="xl"
        footer={
          <div className="pt-2 flex justify-end">
            <Button type="button" variant="outline" onClick={() => setIsLedgerOpen(false)} className="rounded-xl font-bold">
              Close
            </Button>
          </div>
        }
      >
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setLedgerTab("movements")}
            className={cn("h-8 px-3 text-xs font-bold", ledgerTab === "movements" && "bg-navy text-white")}
          >
            Movements ({movements.length})
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setLedgerTab("adjustments")}
            className={cn("h-8 px-3 text-xs font-bold", ledgerTab === "adjustments" && "bg-navy text-white")}
          >
            Stocktake Vouchers ({adjustments.length})
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={loadLedger} disabled={isLedgerLoading} className="h-8 px-2 text-xs font-bold text-teal">
            <RefreshCw className={cn("h-3.5 w-3.5 mr-1", isLedgerLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
        {isLedgerLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm font-bold">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading stock ledger...
          </div>
        ) : ledgerTab === "movements" ? (
          <AdminTable
            inline
            columns={movementColumns}
            data={movements}
            rowKey={(movement) => movement.id}
            className="max-h-[340px] overflow-y-auto text-xs"
            emptyTitle="No stock movements recorded"
            emptyDescription="Transfers and adjustments will appear here."
          />
        ) : (
          <AdminTable
            inline
            columns={adjustmentColumns}
            data={adjustments}
            rowKey={(adjustment) => adjustment.id}
            className="max-h-[340px] overflow-y-auto text-xs"
            emptyTitle="No stocktake vouchers recorded"
            emptyDescription="Physical count adjustments will appear here."
          />
        )}
      </AdminModalShell>
    </div>
  )
}

