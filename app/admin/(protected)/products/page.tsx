"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Edit, Trash2, Eye, Package, Search, Filter } from "lucide-react"

interface Product {
  id: string
  name: string
  description: string
  price: number
  sale_price?: number
  category: string
  stock: number
  sku: string
  status: "active" | "inactive" | "out-of-stock"
  images: string[]
  features: string[]
  specifications: Record<string, string>
  tags: string[]
  weight?: number
  dimensions?: string
  seo_title?: string
  seo_description?: string
  created_at: string
  updated_at: string
}

interface ProductFormData {
  name: string
  description: string
  price: string
  sale_price: string
  category: string
  stock: string
  sku: string
  status: "active" | "inactive" | "out-of-stock"
  images: string
  features: string
  specifications: string
  tags: string
  weight: string
  dimensions: string
  seo_title: string
  seo_description: string
}

function ProductForm({ 
  initialData, 
  onSubmit, 
  onCancel 
}: { 
  initialData?: Product
  onSubmit: (data: ProductFormData) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    price: initialData?.price.toString() || "",
    sale_price: initialData?.sale_price?.toString() || "",
    category: initialData?.category || "",
    stock: initialData?.stock.toString() || "",
    sku: initialData?.sku || "",
    status: initialData?.status || "active",
    images: initialData?.images.join(', ') || "",
    features: initialData?.features.join(', ') || "",
    specifications: initialData ? Object.entries(initialData.specifications).map(([k, v]) => `${k}: ${v}`).join(', ') : "",
    tags: initialData?.tags.join(', ') || "",
    weight: initialData?.weight?.toString() || "",
    dimensions: initialData?.dimensions || "",
    seo_title: initialData?.seo_title || "",
    seo_description: initialData?.seo_description || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
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
          <Label htmlFor="sku">SKU *</Label>
          <Input
            id="sku"
            value={formData.sku}
            onChange={(e) => setFormData({...formData, sku: e.target.value})}
            required
          />
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
            value={formData.price}
            onChange={(e) => setFormData({...formData, price: e.target.value})}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sale_price">Sale Price</Label>
          <Input
            id="sale_price"
            type="number"
            step="0.01"
            value={formData.sale_price}
            onChange={(e) => setFormData({...formData, sale_price: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stock">Stock *</Label>
          <Input
            id="stock"
            type="number"
            value={formData.stock}
            onChange={(e) => setFormData({...formData, stock: e.target.value})}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Web Development">Web Development</SelectItem>
              <SelectItem value="Mobile Development">Mobile Development</SelectItem>
              <SelectItem value="UI/UX Design">UI/UX Design</SelectItem>
              <SelectItem value="Digital Marketing">Digital Marketing</SelectItem>
              <SelectItem value="E-commerce">E-commerce</SelectItem>
              <SelectItem value="Consulting">Consulting</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value: "active" | "inactive" | "out-of-stock") => setFormData({...formData, status: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="out-of-stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="images">Images (comma separated URLs)</Label>
        <Input
          id="images"
          value={formData.images}
          onChange={(e) => setFormData({...formData, images: e.target.value})}
          placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
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
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-navy hover:bg-navy/90">
          {initialData ? "Update Product" : "Create Product"}
        </Button>
      </DialogFooter>
    </form>
  )
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const { toast } = useToast()

  // Mock product data
  const mockProducts: Product[] = [
    {
      id: "1",
      name: "Professional Web Development Package",
      description: "Complete web development solution including frontend, backend, and database setup with modern technologies.",
      price: 2999.99,
      sale_price: 2499.99,
      category: "Web Development",
      stock: 25,
      sku: "WEB-DEV-001",
      status: "active",
      images: ["/placeholder.jpg"],
      features: ["Responsive Design", "SEO Optimized", "CMS Integration", "SSL Certificate", "1 Year Support"],
      specifications: { "Timeline": "4-6 weeks", "Technologies": "React, Node.js, MongoDB", "Pages": "Up to 10" },
      tags: ["web", "development", "react", "nodejs"],
      weight: 0,
      dimensions: "Digital Service",
      seo_title: "Professional Web Development Services",
      seo_description: "Get a modern, responsive website built with the latest technologies",
      created_at: "2024-01-15T00:00:00Z",
      updated_at: "2024-01-20T00:00:00Z"
    },
    {
      id: "2",
      name: "Mobile App Development (iOS & Android)",
      description: "Native mobile application development for both iOS and Android platforms with cross-platform compatibility.",
      price: 4999.99,
      category: "Mobile Development",
      stock: 15,
      sku: "MOB-DEV-001",
      status: "active",
      images: ["/placeholder.jpg"],
      features: ["Native Performance", "Push Notifications", "Offline Support", "App Store Deployment", "6 Months Support"],
      specifications: { "Timeline": "8-12 weeks", "Platforms": "iOS, Android", "Features": "Custom UI/UX" },
      tags: ["mobile", "ios", "android", "app"],
      created_at: "2024-01-10T00:00:00Z",
      updated_at: "2024-01-18T00:00:00Z"
    },
    {
      id: "3",
      name: "E-commerce Store Setup",
      description: "Complete e-commerce solution with payment integration, inventory management, and admin dashboard.",
      price: 3499.99,
      sale_price: 2999.99,
      category: "E-commerce",
      stock: 8,
      sku: "ECOM-001",
      status: "active",
      images: ["/placeholder.jpg"],
      features: ["Payment Gateway", "Inventory Management", "Order Tracking", "Customer Dashboard", "Analytics"],
      specifications: { "Timeline": "6-8 weeks", "Products": "Unlimited", "Payment": "Multiple Gateways" },
      tags: ["ecommerce", "store", "payment", "inventory"],
      created_at: "2024-01-12T00:00:00Z",
      updated_at: "2024-01-19T00:00:00Z"
    },
    {
      id: "4",
      name: "UI/UX Design Package",
      description: "Comprehensive UI/UX design service including user research, wireframing, prototyping, and final designs.",
      price: 1999.99,
      category: "UI/UX Design",
      stock: 0,
      sku: "DESIGN-001",
      status: "out-of-stock",
      images: ["/placeholder.jpg"],
      features: ["User Research", "Wireframing", "Prototyping", "Visual Design", "Design System"],
      specifications: { "Timeline": "3-4 weeks", "Deliverables": "Figma Files, Assets", "Revisions": "3 rounds" },
      tags: ["design", "ui", "ux", "figma"],
      created_at: "2024-01-08T00:00:00Z",
      updated_at: "2024-01-16T00:00:00Z"
    },
    {
      id: "5",
      name: "Digital Marketing Campaign",
      description: "Complete digital marketing strategy including SEO, social media marketing, and PPC advertising.",
      price: 1499.99,
      category: "Digital Marketing",
      stock: 30,
      sku: "MARKETING-001",
      status: "inactive",
      images: ["/placeholder.jpg"],
      features: ["SEO Optimization", "Social Media Management", "PPC Campaigns", "Analytics Reports", "Content Strategy"],
      specifications: { "Duration": "3 months", "Platforms": "Google, Facebook, LinkedIn", "Reports": "Monthly" },
      tags: ["marketing", "seo", "ppc", "social"],
      created_at: "2024-01-05T00:00:00Z",
      updated_at: "2024-01-14T00:00:00Z"
    }
  ]

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true)
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        setProducts(mockProducts)
        setFilteredProducts(mockProducts)
      } catch (error) {
        console.error("Error fetching products:", error)
        toast({
          title: "Error",
          description: "Failed to load products",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [toast])

  useEffect(() => {
    let filtered = [...products]

    // Filter by search term
    if (searchTerm) {
      const query = searchTerm.toLowerCase()
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query)
      )
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(product => product.status === statusFilter)
    }

    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter(product => product.category === categoryFilter)
    }

    setFilteredProducts(filtered)
  }, [products, searchTerm, statusFilter, categoryFilter])

  const handleCreateProduct = async (data: ProductFormData) => {
    try {
      const newProduct: Product = {
        id: Date.now().toString(),
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        sale_price: data.sale_price ? parseFloat(data.sale_price) : undefined,
        category: data.category,
        stock: parseInt(data.stock),
        sku: data.sku,
        status: data.status,
        images: data.images.split(',').map(img => img.trim()).filter(Boolean),
        features: data.features.split(',').map(feature => feature.trim()).filter(Boolean),
        specifications: {},
        tags: data.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        weight: data.weight ? parseFloat(data.weight) : undefined,
        dimensions: data.dimensions || undefined,
        seo_title: data.seo_title || undefined,
        seo_description: data.seo_description || undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      setProducts([...products, newProduct])
      setIsAddDialogOpen(false)
      
      toast({
        title: "Product Created",
        description: `${data.name} has been added to your catalog.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create product",
        variant: "destructive",
      })
    }
  }

  const handleUpdateProduct = async (id: string, data: ProductFormData) => {
    try {
      const updatedProducts = products.map(product => {
        if (product.id === id) {
          return {
            ...product,
            name: data.name,
            description: data.description,
            price: parseFloat(data.price),
            sale_price: data.sale_price ? parseFloat(data.sale_price) : undefined,
            category: data.category,
            stock: parseInt(data.stock),
            sku: data.sku,
            status: data.status,
            images: data.images.split(',').map(img => img.trim()).filter(Boolean),
            features: data.features.split(',').map(feature => feature.trim()).filter(Boolean),
            tags: data.tags.split(',').map(tag => tag.trim()).filter(Boolean),
            updated_at: new Date().toISOString()
          }
        }
        return product
      })

      setProducts(updatedProducts)
      
      toast({
        title: "Product Updated",
        description: `${data.name} has been updated successfully.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      })
    }
  }

  const handleDeleteProduct = async (id: string) => {
    try {
      const productToDelete = products.find(p => p.id === id)
      setProducts(products.filter(product => product.id !== id))
      
      toast({
        title: "Product Deleted",
        description: `${productToDelete?.name} has been removed from your catalog.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      })
    }
  }

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: "Out of Stock", color: "bg-red-100 text-red-800" }
    if (stock <= 5) return { label: "Low Stock", color: "bg-yellow-100 text-yellow-800" }
    return { label: "In Stock", color: "bg-green-100 text-green-800" }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products Management</h1>
          <p className="text-gray-600">Loading products...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-32 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products Management</h1>
          <p className="text-gray-600">Manage your product catalog and inventory</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-navy hover:bg-navy/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>
                Create a new product in your catalog
              </DialogDescription>
            </DialogHeader>
            <ProductForm
              onSubmit={handleCreateProduct}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="out-of-stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Web Development">Web Development</SelectItem>
              <SelectItem value="Mobile Development">Mobile Development</SelectItem>
              <SelectItem value="UI/UX Design">UI/UX Design</SelectItem>
              <SelectItem value="Digital Marketing">Digital Marketing</SelectItem>
              <SelectItem value="E-commerce">E-commerce</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => {
          const stockStatus = getStockStatus(product.stock)
          return (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                <img 
                  src={product.images[0] || "/placeholder.jpg"} 
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
                <Badge 
                  className={`absolute top-2 right-2 ${stockStatus.color}`}
                >
                  {stockStatus.label}
                </Badge>
              </div>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-1">{product.name}</CardTitle>
                    <Badge variant="outline" className="mt-1">
                      {product.category}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-navy">
                      ${product.price.toLocaleString()}
                    </div>
                    {product.sale_price && (
                      <div className="text-sm text-red-600 font-medium">
                        Sale: ${product.sale_price.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                  {product.description}
                </p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">SKU:</span>
                    <span className="font-medium">{product.sku}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Stock:</span>
                    <span className="font-medium">{product.stock} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    <Badge 
                      variant={product.status === 'active' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {product.status}
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Product Details</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <img 
                          src={product.images[0] || "/placeholder.jpg"} 
                          alt={product.name}
                          className="w-full h-64 object-cover rounded-lg"
                        />
                        <div>
                          <h3 className="text-xl font-bold">{product.name}</h3>
                          <p className="text-gray-600 mt-2">{product.description}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Price:</span>
                            <span className="ml-2 font-medium">${product.price}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Category:</span>
                            <span className="ml-2 font-medium">{product.category}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Stock:</span>
                            <span className="ml-2 font-medium">{product.stock}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">SKU:</span>
                            <span className="ml-2 font-medium">{product.sku}</span>
                          </div>
                        </div>
                        {product.features.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Features:</h4>
                            <ul className="list-disc list-inside text-sm text-gray-600">
                              {product.features.map((feature, idx) => (
                                <li key={idx}>{feature}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Edit Product</DialogTitle>
                        <DialogDescription>
                          Update product information
                        </DialogDescription>
                      </DialogHeader>
                      <ProductForm
                        initialData={product}
                        onSubmit={(data) => handleUpdateProduct(product.id, data)}
                        onCancel={() => {}}
                      />
                    </DialogContent>
                  </Dialog>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteProduct(product.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredProducts.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== "all" || categoryFilter !== "all" 
                ? "Try adjusting your search criteria or filters" 
                : "Get started by adding your first product to the catalog"
              }
            </p>
            {!searchTerm && statusFilter === "all" && categoryFilter === "all" && (
              <Button onClick={() => setIsAddDialogOpen(true)} className="bg-navy hover:bg-navy/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Product
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
