"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Edit, Trash2, Eye, Package, Search, Filter, Star, Download, Loader2, FileSpreadsheet } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Product, Category, ProductFormData } from "@/types/database"
import AdminLoading from "@/components/admin/admin-loading"
import { 
  getProducts, 
  getCategories, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  createCategory,
  updateCategory,
  deleteCategory
} from "@/lib/product-actions"

interface ProductFormDataState {
  name: string
  category: string
  price: string
  image: string
  description: string
  features: string
  stock: string
  rating: string
  swatchImages: string // comma separated URLs
  type: 'physical' | 'service'
}

function ProductForm({ 
  initialData, 
  categories,
  onSubmit, 
  onCancel 
}: { 
  initialData?: Product
  categories: Category[]
  onSubmit: (data: ProductFormData) => void | Promise<void>
  onCancel: () => void
}) {
  const [formData, setFormData] = useState<ProductFormDataState>({
    name: initialData?.name || "",
    category: initialData?.category || "",
    price: initialData?.price?.toString() || "",
    image: initialData?.image || "",
    description: initialData?.description || "",
    features: initialData?.features?.join(', ') || "",
    stock: initialData?.stock?.toString() || "",
    rating: initialData?.rating?.toString() || "5",
    swatchImages: initialData?.swatchImages?.join(', ') || "",
    type: initialData?.type || "physical",
  })

  // Update form data when initialData changes (e.g., when editing a different product)
  useEffect(() => {
    setFormData({
      name: initialData?.name || "",
      category: initialData?.category || "",
      price: initialData?.price?.toString() || "",
      image: initialData?.image || "",
      description: initialData?.description || "",
      features: initialData?.features?.join(', ') || "",
      stock: initialData?.stock?.toString() || "",
      rating: initialData?.rating?.toString() || "5",
      swatchImages: initialData?.swatchImages?.join(', ') || "",
      type: initialData?.type || "physical",
    })
  }, [initialData])

  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [epicUrl, setEpicUrl] = useState('')

  const handleFetchProductData = async () => {
    if (!formData.name.trim() && !epicUrl.trim()) {
      alert("Please enter a product name or Epic Computers product URL")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/extract-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          productName: formData.name.trim(),
          productUrl: epicUrl.trim() || undefined
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(`Error fetching product data: ${error.error}`)
        return
      }

      const data = await response.json()
      
      // Update form with fetched data
      setFormData(prev => ({
        ...prev,
        name: data.name || prev.name,
        image: data.mainImage || prev.image,
        description: data.description || prev.description,
        swatchImages: (data.swatchImages || []).join(', '),
        price: data.price ? data.price.toString() : prev.price,
      }))

      alert("Product data fetched successfully from Epic Computers!")
    } catch (error) {
      console.error('Error fetching product data:', error)
      alert("Failed to fetch product data. Please check the console for details.")
    } finally {
      setIsLoading(false)
    }
  }

  const submitForm = async () => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    const productData: ProductFormData = {
      name: formData.name.trim(),
      category: formData.category,
      price: parseFloat(formData.price) || 0,
      image: formData.image.trim(),
      description: formData.description.trim(),
      features: formData.features.split(',').map(f => f.trim()).filter(f => f.length > 0),
      stock: parseInt(formData.stock) || 0,
      rating: parseFloat(formData.rating) || 5,
      swatchImages: formData.swatchImages.split(',').map(url => url.trim()).filter(url => url.length > 0),
      type: formData.type,
    }
    try {
      await onSubmit(productData)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await submitForm()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.name}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Price *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData({...formData, price: e.target.value})}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stock">Stock *</Label>
          <Input
            id="stock"
            type="number"
            min="0"
            value={formData.stock}
            onChange={(e) => setFormData({...formData, stock: e.target.value})}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rating">Rating (1-5) *</Label>
          <Input
            id="rating"
            type="number"
            step="0.1"
            min="1"
            max="5"
            value={formData.rating}
            onChange={(e) => setFormData({...formData, rating: e.target.value})}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="epicUrl">Epic Computers Product URL (optional)</Label>
        <Input
          id="epicUrl"
          value={epicUrl}
          onChange={(e) => setEpicUrl(e.target.value)}
          placeholder="https://epiccomputers.co.tz/product/..."
        />
        <p className="text-xs text-gray-500">Paste a product URL from Epic Computers to auto-fetch data</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="image">Image URL</Label>
        <div className="flex gap-2">
          <Input
            id="image"
            value={formData.image}
            onChange={(e) => setFormData({...formData, image: e.target.value})}
            placeholder="https://example.com/image.jpg"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleFetchProductData}
            disabled={isLoading || (!formData.name.trim() && !epicUrl.trim())}
            className="text-navy border-navy/20 hover:bg-navy hover:text-white"
          >
            {isLoading ? "Fetching..." : "Fetch from Epic"}
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="swatchImages">Swatch Image URLs (comma separated)</Label>
        <Input
          id="swatchImages"
          value={formData.swatchImages}
          onChange={(e) => setFormData({...formData, swatchImages: e.target.value})}
          placeholder="https://example.com/swatch1.jpg, https://example.com/swatch2.jpg"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="features">Features (comma separated)</Label>
        <Textarea
          id="features"
          value={formData.features}
          onChange={(e) => setFormData({...formData, features: e.target.value})}
          placeholder="Feature 1, Feature 2, Feature 3"
          rows={2}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button 
          type="button" 
          className="bg-navy hover:bg-navy/90"
          disabled={isSubmitting}
          onClick={() => {
            submitForm()
          }}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Update Product" : "Create Product"}
        </Button>
      </DialogFooter>
    </form>
  )
}

function CategoryForm({ 
  initialData, 
  onSubmit, 
  onCancel 
}: { 
  initialData?: Category
  onSubmit: (data: { name: string }) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initialData?.name || "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ name: name.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="category-name">Category Name *</Label>
        <Input
          id="category-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-navy hover:bg-navy/90">
          {initialData ? "Update Category" : "Create Category"}
        </Button>
      </DialogFooter>
    </form>
  )
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isBulkFetching, setIsBulkFetching] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isEpicSyncDialogOpen, setIsEpicSyncDialogOpen] = useState(false)
  const [selectedEpicCategory, setSelectedEpicCategory] = useState<string>("")
  const [epicProductCount, setEpicProductCount] = useState<number>(60)
  const { toast } = useToast()

  // Epic Computers categories from epiccomputers.co.tz (matching your dashboard categories)
  const EPIC_CATEGORIES = [
    // All products
    { label: "All Products (Shop)", value: "__all__", group: "General" },
    // Laptops
    { label: "Laptops", value: "laptops", group: "Laptops" },
    { label: "New Laptops", value: "laptops/new-laptops", group: "Laptops" },
    { label: "Refurbished Laptops", value: "laptops/refurbished-laptops", group: "Laptops" },
    // Desktops
    { label: "Desktops", value: "desktops", group: "Desktops" },
    { label: "All-in-One", value: "desktops/all-in-one", group: "Desktops" },
    // Gaming
    { label: "Gaming", value: "gaming", group: "Gaming" },
    { label: "Gaming Laptops", value: "gaming/gaming-laptops", group: "Gaming" },
    { label: "Gaming Desktop", value: "gaming/gaming-desktop", group: "Gaming" },
    { label: "Gaming Chairs", value: "gaming/gaming-chairs", group: "Gaming" },
    { label: "Gaming Accessories", value: "gaming/gaming-accessories", group: "Gaming" },
    // Components
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
    // Peripherals
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
    // Storage
    { label: "Storage", value: "storage", group: "Storage" },
    { label: "Solid State Drives", value: "storage/solid-state-drives", group: "Storage" },
    { label: "Internal Hard Drives", value: "storage/internal-hard-drives", group: "Storage" },
    { label: "External Hard Drives", value: "storage/external-hard-drives", group: "Storage" },
    { label: "USB Flash Disk", value: "storage/usb-flash-disk", group: "Storage" },
    { label: "SD & Micro SD Cards", value: "storage/sd-micro-sd-cards", group: "Storage" },
    { label: "HDD Cases & Racks", value: "storage/hdd-cases-racks", group: "Storage" },
    // Networking
    { label: "Networking", value: "networking", group: "Networking" },
    { label: "Routers/Switches", value: "networking/routers-switches", group: "Networking" },
    { label: "WiFi Adapters", value: "networking/wifi-adapters", group: "Networking" },
    // Gadgets & Accessories 
    { label: "Gadgets & Accessories", value: "smart-gadgets-accessories", group: "Gadgets" },
    { label: "Smartphones", value: "smart-gadgets-accessories/smartphones", group: "Gadgets" },
    { label: "Tablets", value: "smart-gadgets-accessories/tablets", group: "Gadgets" },
    { label: "CCTV Cameras", value: "smart-gadgets-accessories/cctv-cameras", group: "Gadgets" },
    // Software & Digital
    { label: "Software", value: "software", group: "Software" },
    { label: "Anti-virus", value: "software/anti-virus", group: "Software" },
    { label: "Operating Systems", value: "software/operating-systems", group: "Software" },
    { label: "Office", value: "software/office", group: "Software" },
    { label: "Apple Gift Card", value: "digital-codes/apple-gift-card", group: "Software" },
    { label: "Digital Codes", value: "digital-codes", group: "Software" },
  ]

  // Load products and categories
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [productsData, categoriesData] = await Promise.all([
        getProducts(),
        getCategories()
      ])
      setProducts(productsData)
      setCategories(categoriesData)
      setFilteredProducts(productsData)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter products based on search and category
  useEffect(() => {
    let filtered = products

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(product => product.category === categoryFilter)
    }

    setFilteredProducts(filtered)
  }, [products, searchTerm, categoryFilter])

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

  const handleUpdateProduct = async (productData: ProductFormData) => {
    if (!editingProduct) return


    const result = await updateProduct(editingProduct.id, productData)
    
    if (result.success) {
      toast({
        title: "Success",
        description: "Product updated successfully",
      })
      setIsEditDialogOpen(false)
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

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return

    const result = await deleteProduct(id)
    
    if (result.success) {
      toast({
        title: "Success",
        description: "Product deleted successfully",
      })
      loadData()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete product",
        variant: "destructive",
      })
    }
  }

  const handleCreateCategory = async (categoryData: { name: string }) => {
    const result = await createCategory(categoryData)
    
    if (result.success) {
      toast({
        title: "Success",
        description: "Category created successfully",
      })
      setIsCategoryDialogOpen(false)
      loadData()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to create category",
        variant: "destructive",
      })
    }
  }

  const handleUpdateCategory = async (categoryData: { name: string }) => {
    if (!editingCategory) return

    const result = await updateCategory(editingCategory.id, categoryData)
    
    if (result.success) {
      toast({
        title: "Success",
        description: "Category updated successfully",
      })
      setIsCategoryDialogOpen(false)
      setEditingCategory(null)
      loadData()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update category",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCategory = async (id: number) => {
    if (!confirm("Are you sure you want to delete this category? This will affect all products in this category.")) return

    const result = await deleteCategory(id)
    
    if (result.success) {
      toast({
        title: "Success",
        description: "Category deleted successfully",
      })
      loadData()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete category",
        variant: "destructive",
      })
    }
  }

  const handleExportExcel = async () => {
    setIsExporting(true)
    try {
      const response = await fetch('/api/export-products-excel')
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Export failed')
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const disposition = response.headers.get('Content-Disposition')
      const fileName = disposition?.match(/filename="(.+)"/)?.[1] || `Products_${new Date().toISOString().split('T')[0]}.xlsx`
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
      console.error('Export error:', error)
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export products",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportFromEpic = async () => {
    setIsBulkFetching(true)
    setIsEpicSyncDialogOpen(false)
    
    const selectedCat = EPIC_CATEGORIES.find(c => c.value === selectedEpicCategory)
    const categoryLabel = selectedCat?.label || "All Products"
    // "__all__" means scrape the entire shop, so send empty slug
    const categorySlug = selectedEpicCategory === "__all__" ? "" : selectedEpicCategory
    
    try {
      toast({
        title: `Scraping ${categoryLabel}...`,
        description: `Fetching up to ${epicProductCount} products from Epic Computers. This may take several minutes. Please wait.`,
        duration: 300000,
      })

      const response = await fetch('/api/bulk-extract-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categorySlug: categorySlug || undefined,
          maxProducts: epicProductCount,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch products')
      }

      const data = await response.json()
      
      if (data.status === 'success') {
        const errorCount = data.errors?.length || 0

        toast({
          title: "Import Completed!",
          description: `Found ${data.listingsFound || 0} listings, scraped ${data.count} details from ${categoryLabel}. Saved ${data.saved || 0} new, skipped ${data.skipped || 0} existing. ${errorCount > 0 ? `${errorCount} errors.` : ''}`,
          duration: 10000,
        })

        loadData()
      } else {
        toast({
          title: "Import Failed",
          description: data.errors?.join(', ') || "Could not import products from Epic Computers website.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error importing products:', error)
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import products from Epic Computers",
        variant: "destructive",
      })
    } finally {
      setIsBulkFetching(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="space-y-4 sm:space-y-6 md:space-y-8">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2 text-navy">
              Products <span className="gradient-text">Management</span>
            </h1>
            <p className="text-sm sm:text-base text-navy/80">
              Manage your products and categories
            </p>
          </div>
          <AdminLoading message="Loading products and categories..." size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="space-y-4 sm:space-y-6 md:space-y-8">
        {/* Product Management Card in Teal without borders */}
        <div className="bg-teal p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-1 text-navy">
                Products <span className="text-white drop-shadow-sm">Management</span>
              </h1>
              <p className="text-sm sm:text-base text-navy/90 font-semibold">
                Manage your products and catalog inventory
              </p>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                disabled={isExporting || products.length === 0}
                className="bg-white text-green-700 border-2 border-green-600 hover:bg-green-600 hover:text-white font-bold rounded-xl flex-1 sm:flex-none h-10 px-4 shadow-sm"
              >
                {isExporting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Exporting...</>
                ) : (
                  <><FileSpreadsheet className="mr-2 h-4 w-4" />Export Excel</>
                )}
              </Button>
              <Dialog open={isEpicSyncDialogOpen} onOpenChange={setIsEpicSyncDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={isBulkFetching}
                    className="bg-white text-brand-red border-2 border-brand-red hover:bg-brand-red hover:text-white font-bold rounded-xl flex-1 sm:flex-none h-10 px-4 shadow-sm"
                  >
                    {isBulkFetching ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Importing...</>
                    ) : (
                      <><Download className="mr-2 h-4 w-4" />Sync Epic</>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[520px]">
                  <DialogHeader>
                    <DialogTitle>Import from Epic Computers</DialogTitle>
                    <DialogDescription>
                      Select a category and number of products to scrape from epiccomputers.co.tz
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    {/* Category Selection */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Category</Label>
                      <Select value={selectedEpicCategory} onValueChange={setSelectedEpicCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category to scrape" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {(() => {
                            const groups = EPIC_CATEGORIES.reduce((acc, cat) => {
                              if (!acc[cat.group]) acc[cat.group] = []
                              acc[cat.group].push(cat)
                              return acc
                            }, {} as Record<string, typeof EPIC_CATEGORIES>)
                            return Object.entries(groups).map(([group, cats]) => (
                              <SelectGroup key={group}>
                                <SelectLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{group}</SelectLabel>
                                {cats.map(cat => (
                                  <SelectItem key={cat.value} value={cat.value}>
                                    {cat.label}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            ))
                          })()}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Product Count */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Number of Products: {epicProductCount}</Label>
                      <Slider
                        value={[epicProductCount]}
                        onValueChange={(v) => setEpicProductCount(v[0])}
                        min={60}
                        max={200}
                        step={10}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">Minimum 60 products. More products will take longer to import.</p>
                    </div>

                    {/* Summary */}
                    <div className="rounded-lg border p-3 bg-muted/50">
                      <p className="text-sm">
                        <strong>Summary:</strong> Scrape up to <strong>{epicProductCount}</strong> products
                        from <strong>{EPIC_CATEGORIES.find(c => c.value === selectedEpicCategory)?.label || "All Products"}</strong>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Estimated time: ~{Math.ceil(epicProductCount / 5)} minutes</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEpicSyncDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      className="bg-brand-red hover:bg-brand-red/90 text-white"
                      disabled={!selectedEpicCategory}
                      onClick={handleImportFromEpic}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Start Import
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 px-4 shadow-md">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Product</DialogTitle>
                    <DialogDescription>
                      Add a new product to your catalog.
                    </DialogDescription>
                  </DialogHeader>
                  <ProductForm
                    categories={categories}
                    onSubmit={handleCreateProduct}
                    onCancel={() => setIsAddDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

      {/* Stats Cards - Solid White */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="bg-white border-2 border-navy/20 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 md:p-6">
            <CardTitle className="text-xs sm:text-sm font-bold text-navy">
              Total Products
            </CardTitle>
            <Package className="h-4 w-4 text-brand-red" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
            <div className="text-xl sm:text-2xl md:text-3xl font-black text-navy">{products.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-white border-2 border-navy/20 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 md:p-6">
            <CardTitle className="text-xs sm:text-sm font-bold text-navy">
              In Stock
            </CardTitle>
            <Package className="h-4 w-4 text-brand-red" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
            <div className="text-xl sm:text-2xl md:text-3xl font-black text-navy">
              {products.filter(p => p.stock > 0).length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-2 border-navy/20 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 md:p-6">
            <CardTitle className="text-xs sm:text-sm font-bold text-navy">
              Avg Rating
            </CardTitle>
            <Star className="h-4 w-4 text-brand-red fill-brand-red" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
            <div className="text-xl sm:text-2xl md:text-3xl font-black text-navy">
              {products.length > 0 
                ? (products.reduce((acc, p) => acc + p.rating, 0) / products.length).toFixed(1)
                : "0"
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters - Solid White */}
      <Card className="bg-white border-2 border-navy/20 shadow-md">
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="text-sm sm:text-base font-bold text-navy">Filters</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 sm:h-10 text-sm border border-teal focus:border-teal focus:ring-1 focus:ring-teal rounded-xl bg-white text-navy"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[200px] h-9 sm:h-10 text-sm font-semibold border-2 border-navy/20 bg-white text-navy rounded-xl">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products List - 100% White Cards with Shop-Size Action Buttons */}
      <div>
        {categoryFilter !== "all" && filteredProducts.length === 0 && (
          <p className="text-brand-red font-bold mb-4">
            ⚠️ No products found in "{categoryFilter}" category. 
            All your products are currently categorized as "Laptops". 
            Edit each product to assign the correct category.
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="group relative h-full"
              >
                {/* 70% Teal Product Card */}
                <div className="relative h-full rounded-2xl border-2 border-navy/20 bg-teal/70 overflow-hidden transition-all duration-300 hover:border-navy hover:shadow-xl shadow-md flex flex-col justify-between">
                  <div>
                    {/* Product Image */}
                    <div className="relative h-44 sm:h-52 bg-white overflow-hidden border-b-2 border-navy/10">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                          <Package className="h-12 w-12 text-navy/40" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-brand-red text-white border-0 font-bold px-2.5 py-0.5 rounded-full shadow-sm">{product.category}</Badge>
                      </div>
                      <div className="absolute top-3 right-3">
                        <Badge variant="outline" className="bg-white text-navy border-2 border-navy/30 font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                          Stock: {product.stock}
                        </Badge>
                      </div>
                    </div>

                    <div className="p-4 sm:p-5">
                      <h3 className="font-extrabold text-base sm:text-lg mb-1.5 line-clamp-1 text-navy">
                        {product.name}
                      </h3>
                      <p className="text-navy/85 text-xs sm:text-sm mb-3 line-clamp-2 leading-relaxed font-medium">
                        {product.description}
                      </p>
                      
                      <div className="flex items-center justify-between mb-4 pt-1">
                        <span className="font-black text-lg sm:text-xl text-navy">TZS {Number(product.price).toLocaleString()}</span>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-bold ml-1 text-navy">{product.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Admin Action buttons in Theme Colors */}
                  <div className="p-4 sm:p-5 pt-0">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-navy hover:bg-navy/85 text-white rounded-full text-xs sm:text-sm py-1 sm:py-2 font-bold shadow-md transition-all duration-200 border-none"
                        onClick={() => {
                          setEditingProduct(product)
                          setIsEditDialogOpen(true)
                        }}
                      >
                        <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0 text-teal" />
                        <span>Edit</span>
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-brand-red hover:bg-red-700 text-white rounded-full text-xs sm:text-sm py-1 sm:py-2 font-bold border-none transition-all duration-200 shadow-md"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                        <span>Delete</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center py-8">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || categoryFilter !== "all" 
                    ? "Try adjusting your filters" 
                    : "Get started by creating your first product"
                  }
                </p>
              </div>
            )}
          </div>
      </div>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update the product details.
            </DialogDescription>
          </DialogHeader>
          {editingProduct && (
            <ProductForm
              initialData={editingProduct}
              categories={categories}
              onSubmit={handleUpdateProduct}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setEditingProduct(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
