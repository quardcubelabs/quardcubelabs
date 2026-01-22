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
import { Plus, Edit, Trash2, Eye, Package, Search, Filter, Star } from "lucide-react"
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
}

function ProductForm({ 
  initialData, 
  categories,
  onSubmit, 
  onCancel 
}: { 
  initialData?: Product
  categories: Category[]
  onSubmit: (data: ProductFormData) => void
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
  })

  const [isLoading, setIsLoading] = useState(false)
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const productData: ProductFormData = {
      name: formData.name.trim(),
      category: formData.category,
      price: parseFloat(formData.price) || 0,
      image: formData.image.trim(),
      description: formData.description.trim(),
      features: formData.features.split(',').map(f => f.trim()).filter(f => f.length > 0),
      stock: parseInt(formData.stock) || 0,
      rating: parseFloat(formData.rating) || 5,
      type: initialData?.type || 'physical',
      swatchImages: formData.swatchImages.split(',').map(url => url.trim()).filter(url => url.length > 0),
    }
    onSubmit(productData)
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
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const { toast } = useToast()

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

  const handleBulkFetchProducts = async () => {
    if (!confirm("This will fetch all 98 products from Epic Computers and update your catalog. This may take a few minutes. Continue?")) return

    setIsBulkFetching(true)
    try {
      const response = await fetch('/api/bulk-extract-products', {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch products')
      }

      const data = await response.json()
      
      if (data.products && data.products.length > 0) {
        // For each fetched product, match it with existing products and update
        for (const fetchedProduct of data.products) {
          const existingProduct = products.find(p => 
            p.name.toLowerCase() === fetchedProduct.name.toLowerCase()
          )

          if (existingProduct) {
            const updateData: ProductFormData = {
              name: fetchedProduct.name,
              category: fetchedProduct.category || existingProduct.category,
              price: fetchedProduct.price || existingProduct.price,
              image: fetchedProduct.mainImage || existingProduct.image,
              description: fetchedProduct.description || existingProduct.description,
              features: existingProduct.features || [],
              stock: fetchedProduct.stock || existingProduct.stock,
              rating: existingProduct.rating || 4.5,
              swatchImages: fetchedProduct.swatchImages || [],
            }

            await updateProduct(existingProduct.id, updateData)
          }
        }

        toast({
          title: "Sync Completed!",
          description: `Successfully synced ${data.products.length} products from Epic Computers with their images, swatches, and descriptions.`,
          duration: 5000,
        })

        loadData()
      }
    } catch (error) {
      console.error('Error bulk fetching products:', error)
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync products from Epic Computers",
        variant: "destructive",
      })
    } finally {
      setIsBulkFetching(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-teal">
        <div className="container mx-auto p-6 space-y-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-navy">
              Products <span className="gradient-text">Management</span>
            </h1>
            <p className="text-navy/80">
              Manage your products and categories
            </p>
          </div>
          <AdminLoading message="Loading products and categories..." size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-teal">
      <div className="container mx-auto p-6 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-navy">
              Products <span className="gradient-text">Management</span>
            </h1>
            <p className="text-navy/80">
              Manage your products and categories
            </p>
          </div>
        <div className="flex gap-2">
          <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => setEditingCategory(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingCategory ? "Edit Category" : "Create New Category"}</DialogTitle>
                <DialogDescription>
                  {editingCategory ? "Update the category details." : "Add a new product category."}
                </DialogDescription>
              </DialogHeader>
              <CategoryForm
                initialData={editingCategory || undefined}
                onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}
                onCancel={() => {
                  setIsCategoryDialogOpen(false)
                  setEditingCategory(null)
                }}
              />
            </DialogContent>
          </Dialog>
          <Button 
            variant="outline" 
            onClick={handleBulkFetchProducts}
            disabled={isBulkFetching}
            className="text-brand-red border-brand-red hover:bg-brand-red hover:text-white"
          >
            {isBulkFetching ? "Syncing..." : "Sync from Epic Computers"}
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-navy hover:bg-navy/90">
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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-navy/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-navy">
              Total Products
            </CardTitle>
            <Package className="h-4 w-4 text-brand-red" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-navy">{products.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-navy/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-navy">
              Categories
            </CardTitle>
            <Filter className="h-4 w-4 text-brand-red" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-navy">{categories.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-navy/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-navy">
              In Stock
            </CardTitle>
            <Package className="h-4 w-4 text-brand-red" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-navy">
              {products.filter(p => p.stock > 0).length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-navy/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-navy">
              Average Rating
            </CardTitle>
            <Star className="h-4 w-4 text-brand-red" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-navy">
              {products.length > 0 
                ? (products.reduce((acc, p) => acc + p.rating, 0) / products.length).toFixed(1)
                : "0"
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-navy/10">
        <CardHeader>
          <CardTitle className="text-navy">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-navy/70" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
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

      {/* Categories Management */}
      <Card className="bg-navy/10">
        <CardHeader>
          <CardTitle className="text-navy">Categories</CardTitle>
          <CardDescription className="text-navy/70">
            Manage product categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center gap-2 p-2 border rounded text-white bg-navy">
                <span>{category.name}</span>
                <div className="flex gap-1 ">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingCategory(category)
                      setIsCategoryDialogOpen(true)
                    }}
                  >
                    <Edit className="h-3 w-3 bg-navy/20" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteCategory(category.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      <Card className="bg-teal">
        <CardHeader>
          <CardTitle>Products ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="group relative h-full"
              >
                <div className="relative h-full rounded-2xl border-2 border-navy/20 bg-navy/10 overflow-hidden transition-all duration-300 hover:border-navy hover:shadow-lg">
                  {/* Product Image */}
                  <div className="relative h-40 sm:h-48 overflow-hidden">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-navy/20 flex items-center justify-center">
                        <Package className="h-12 w-12 text-navy/50" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-brand-red text-white border-0">{product.category}</Badge>
                    </div>
                    <div className="absolute top-4 right-4">
                      <Badge variant="outline" className="bg-white/90 text-navy border-navy/20">
                        Stock: {product.stock}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-1 text-navy">
                      {product.name}
                    </h3>
                    <p className="text-navy/70 text-sm mb-3 line-clamp-2">
                      {product.description}
                    </p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-bold text-xl text-navy">TZS {Number(product.price).toLocaleString()}</span>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm ml-1 text-navy">{product.rating}</span>
                      </div>
                    </div>
                    
                    {/* Admin Action buttons */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-white bg-navy hover:bg-navy/30 hover:text-navy rounded-full"
                        onClick={() => {
                          setEditingProduct(product)
                          setIsEditDialogOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        className="text-white bg-red-600 hover:text-red-700 hover:bg-red-50 rounded-full"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
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
        </CardContent>
      </Card>

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
