"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"
import { ArrowLeft, Save, Loader2, Package, Star, Eye, Image as ImageIcon } from "lucide-react"
import { Product, Category, ProductFormData } from "@/types/database"
import AdminLoading from "@/components/admin/admin-loading"
import { getProductById, getCategories, updateProduct } from "@/lib/product-actions"

interface EditProductPageProps {
  params: Promise<{ id: string }>
}

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
  type: 'physical' | 'service'
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const resolvedParams = use(params)
  const productId = parseInt(resolvedParams.id, 10)
  const router = useRouter()
  const { isDark } = useAdminTheme()
  const { toast } = useToast()

  const [product, setProduct] = useState<Product | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isFetchingEpic, setIsFetchingEpic] = useState(false)
  const [epicUrl, setEpicUrl] = useState("")

  const [formData, setFormData] = useState<ProductFormDataState>({
    name: "",
    category: "",
    price: "",
    image: "",
    description: "",
    features: "",
    stock: "",
    rating: "5",
    swatchImages: "",
    type: "physical",
  })

  useEffect(() => {
    async function loadData() {
      if (isNaN(productId)) {
        setIsLoading(false)
        return
      }

      try {
        const [productData, categoriesData] = await Promise.all([
          getProductById(productId),
          getCategories()
        ])

        if (productData) {
          setProduct(productData)
          setFormData({
            name: productData.name || "",
            category: productData.category || "",
            price: productData.price?.toString() || "",
            image: productData.image || "",
            description: productData.description || "",
            features: productData.features?.join(", ") || "",
            stock: productData.stock?.toString() || "0",
            rating: productData.rating?.toString() || "5",
            swatchImages: productData.swatchImages?.join(", ") || "",
            type: productData.type || "physical",
          })
        }
        setCategories(categoriesData || [])
      } catch (error) {
        toast({
          title: "Error loading product",
          description: "Failed to load product details.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [productId, toast])

  const handleFetchProductData = async () => {
    if (!formData.name.trim() && !epicUrl.trim()) {
      toast({
        title: "Input required",
        description: "Please enter a product name or Epic Computers product URL",
        variant: "destructive",
      })
      return
    }

    setIsFetchingEpic(true)
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
        toast({
          title: "Fetch Error",
          description: error.error || "Failed to fetch product data",
          variant: "destructive",
        })
        return
      }

      const data = await response.json()
      
      setFormData(prev => ({
        ...prev,
        name: data.name || prev.name,
        image: data.mainImage || prev.image,
        description: data.description || prev.description,
        swatchImages: (data.swatchImages || []).join(', '),
        price: data.price ? data.price.toString() : prev.price,
      }))

      toast({
        title: "Success",
        description: "Product data auto-filled from Epic Computers!",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch product data.",
        variant: "destructive",
      })
    } finally {
      setIsFetchingEpic(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return

    setIsSaving(true)
    const productData: ProductFormData = {
      name: formData.name.trim(),
      category: formData.category,
      price: parseFloat(formData.price) || 0,
      image: formData.image.trim(),
      description: formData.description.trim(),
      features: formData.features.split(',').map(f => f.trim()).filter(f => f.length > 0),
      stock: parseInt(formData.stock, 10) || 0,
      rating: parseFloat(formData.rating) || 5,
      swatchImages: formData.swatchImages.split(',').map(url => url.trim()).filter(url => url.length > 0),
      type: formData.type,
    }

    try {
      const result = await updateProduct(product.id, productData)
      if (result.success) {
        toast({
          title: "Product Updated",
          description: `"${formData.name}" has been updated successfully.`,
        })
        router.push("/admin/products")
      } else {
        toast({
          title: "Update Failed",
          description: result.error || "Could not update product.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <AdminLoading />
  }

  if (!product) {
    return (
      <div className="min-h-screen py-12 px-4 max-w-2xl mx-auto text-center">
        <div className={cn(
          "p-8 rounded-3xl border-2 shadow-lg",
          isDark ? "bg-[#0a1033] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
        )}>
          <Package className="h-16 w-16 mx-auto mb-4 text-brand-red opacity-80" />
          <h2 className="text-2xl font-black mb-2">Product Not Found</h2>
          <p className="text-sm opacity-80 mb-6">
            The product you are trying to edit does not exist or has been removed.
          </p>
          <Link href="/admin/products">
            <Button className="bg-navy hover:bg-navy/85 text-white font-bold rounded-xl">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-16">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Navigation & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin/products">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "rounded-xl h-10 px-3 font-bold transition-colors",
                  isDark 
                    ? "border-teal/30 text-white hover:bg-teal/20" 
                    : "border-navy/20 text-navy hover:bg-navy/10"
                )}
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Back to Products
              </Button>
            </Link>
            <div>
              <h1 className={cn(
                "text-xl sm:text-2xl lg:text-3xl font-black tracking-tight",
                isDark ? "text-white" : "text-navy"
              )}>
                Edit Product
              </h1>
              <p className={cn("text-xs sm:text-sm font-medium", isDark ? "text-teal-400/80" : "text-navy/70")}>
                ID: #{product.id} • Last updated in inventory
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-brand-red text-white border-0 font-bold px-3 py-1 rounded-full text-xs">
              {formData.category || "Uncategorized"}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-bold px-3 py-1 rounded-full",
                parseInt(formData.stock, 10) > 0
                  ? (isDark ? "bg-teal-400/10 text-teal-300 border-teal/40" : "bg-teal-50 text-navy border-navy/20")
                  : "bg-red-50 text-brand-red border-brand-red/30"
              )}
            >
              Stock: {formData.stock}
            </Badge>
          </div>
        </div>

        {/* Main Edit Form Card */}
        <Card className={cn(
          "border-2 rounded-2xl sm:rounded-3xl shadow-lg transition-all",
          isDark 
            ? "bg-[#0a1033] border-teal/20 text-white" 
            : "bg-white border-navy/20 text-navy"
        )}>
          <CardHeader className="border-b border-navy/10 pb-4">
            <CardTitle className={cn("text-lg font-bold", isDark ? "text-white" : "text-navy")}>
              Product Information
            </CardTitle>
            <CardDescription className={isDark ? "text-slate-400" : "text-navy/70"}>
              Modify product details, pricing, inventory stock, and specifications.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs sm:text-sm font-bold">
                    Product Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className={cn(
                      "h-11 rounded-xl",
                      isDark ? "bg-[#060a22] border-teal/30 text-white" : "bg-white border-navy/20 text-navy"
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="text-xs sm:text-sm font-bold">
                    Category *
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className={cn(
                      "h-11 rounded-xl",
                      isDark ? "bg-[#060a22] border-teal/30 text-white" : "bg-white border-navy/20 text-navy"
                    )}>
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

              {/* Price, Stock, Rating, and Type */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-xs sm:text-sm font-bold">
                    Price (TZS) *
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    className={cn(
                      "h-11 rounded-xl font-bold",
                      isDark ? "bg-[#060a22] border-teal/30 text-teal-300" : "bg-white border-navy/20 text-navy"
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock" className="text-xs sm:text-sm font-bold">
                    Stock Quantity *
                  </Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    required
                    className={cn(
                      "h-11 rounded-xl font-bold",
                      isDark ? "bg-[#060a22] border-teal/30 text-white" : "bg-white border-navy/20 text-navy"
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rating" className="text-xs sm:text-sm font-bold">
                    Rating (1-5) *
                  </Label>
                  <Input
                    id="rating"
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    required
                    className={cn(
                      "h-11 rounded-xl font-bold",
                      isDark ? "bg-[#060a22] border-teal/30 text-yellow-400" : "bg-white border-navy/20 text-navy"
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type" className="text-xs sm:text-sm font-bold">
                    Product Type
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(val: 'physical' | 'service') => setFormData({ ...formData, type: val })}
                  >
                    <SelectTrigger className={cn(
                      "h-11 rounded-xl",
                      isDark ? "bg-[#060a22] border-teal/30 text-white" : "bg-white border-navy/20 text-navy"
                    )}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="physical">Physical Product</SelectItem>
                      <SelectItem value="service">Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Epic Computers URL Fetcher Tool */}
              <div className={cn(
                "p-4 rounded-2xl border-2 space-y-2",
                isDark ? "bg-[#060a22]/60 border-teal/20" : "bg-teal-50/50 border-teal/20"
              )}>
                <Label htmlFor="epicUrl" className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                  Epic Computers Auto-Sync Tool (optional)
                </Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    id="epicUrl"
                    value={epicUrl}
                    onChange={(e) => setEpicUrl(e.target.value)}
                    placeholder="https://epiccomputers.co.tz/product/..."
                    className={cn(
                      "h-10 rounded-xl flex-1",
                      isDark ? "bg-[#060a22] border-teal/30 text-white" : "bg-white border-navy/20 text-navy"
                    )}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleFetchProductData}
                    disabled={isFetchingEpic || (!formData.name.trim() && !epicUrl.trim())}
                    className="h-10 rounded-xl font-bold bg-white text-navy hover:bg-navy hover:text-white border-navy/20"
                  >
                    {isFetchingEpic ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Fetching...</>
                    ) : (
                      "Fetch from Epic"
                    )}
                  </Button>
                </div>
                <p className="text-xs opacity-70">
                  Paste a product URL from Epic Computers to automatically update product specs and images.
                </p>
              </div>

              {/* Main Image URL & Live Preview */}
              <div className="space-y-2">
                <Label htmlFor="image" className="text-xs sm:text-sm font-bold">
                  Primary Image URL
                </Label>
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <Input
                    id="image"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    className={cn(
                      "h-11 rounded-xl flex-1",
                      isDark ? "bg-[#060a22] border-teal/30 text-white" : "bg-white border-navy/20 text-navy"
                    )}
                  />
                  {formData.image && (
                    <div className="w-16 h-16 rounded-xl border-2 border-navy/20 overflow-hidden bg-white flex items-center justify-center p-1 flex-shrink-0 shadow-sm">
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder.svg"
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Swatch / Extra Images */}
              <div className="space-y-2">
                <Label htmlFor="swatchImages" className="text-xs sm:text-sm font-bold">
                  Additional / Swatch Images (comma separated URLs)
                </Label>
                <Input
                  id="swatchImages"
                  value={formData.swatchImages}
                  onChange={(e) => setFormData({ ...formData, swatchImages: e.target.value })}
                  placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"
                  className={cn(
                    "h-11 rounded-xl",
                    isDark ? "bg-[#060a22] border-teal/30 text-white" : "bg-white border-navy/20 text-navy"
                  )}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs sm:text-sm font-bold">
                  Full Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className={cn(
                    "rounded-xl",
                    isDark ? "bg-[#060a22] border-teal/30 text-white" : "bg-white border-navy/20 text-navy"
                  )}
                />
              </div>

              {/* Features */}
              <div className="space-y-2">
                <Label htmlFor="features" className="text-xs sm:text-sm font-bold">
                  Key Features & Specifications (comma separated)
                </Label>
                <Textarea
                  id="features"
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  placeholder="Intel Core i7 10th Gen, 16GB RAM DDR4, 512GB NVMe SSD, 14-inch FHD IPS Display"
                  rows={3}
                  className={cn(
                    "rounded-xl",
                    isDark ? "bg-[#060a22] border-teal/30 text-white" : "bg-white border-navy/20 text-navy"
                  )}
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-navy/10 flex flex-col sm:flex-row justify-end gap-3">
                <Link href="/admin/products" className="w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full sm:w-auto rounded-xl font-bold h-11 px-6",
                      isDark ? "border-teal/30 text-white hover:bg-teal/20" : "border-navy/20 text-navy hover:bg-navy/10"
                    )}
                  >
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto bg-navy hover:bg-navy/85 text-white font-bold rounded-xl h-11 px-8 shadow-md flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 text-teal" />
                      <span>Save Changes</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
