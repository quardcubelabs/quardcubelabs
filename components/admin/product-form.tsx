"use client"

import React, { useState, useEffect } from "react"
import { Product, Category, ProductFormData } from "@/types/database"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DialogFooter } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"

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

interface ProductFormProps {
  initialData?: Product
  categories: Category[]
  onSubmit: (data: ProductFormData) => void | Promise<void>
  onCancel: () => void
}

export default function ProductForm({ 
  initialData, 
  categories,
  onSubmit, 
  onCancel 
}: ProductFormProps) {
  const { isDark } = useAdminTheme()
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
      
      setFormData(prev => ({
        ...prev,
        name: data.name || prev.name,
        image: data.mainImage || prev.image,
        description: data.description || prev.description,
        swatchImages: (data.swatchImages || []).join(', '),
        price: data.price ? data.price.toString() : prev.price,
      }))

      alert(`Product data fetched successfully from Epic Computers! Added your constant 20,000 TZS cut (Epic Base: TZS ${(data.rawPrice || 0).toLocaleString()} → Catalog Price: TZS ${(data.price || 0).toLocaleString()}).`)
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
      <div className={cn(
        "p-4 rounded-xl space-y-4",
        isDark ? "bg-teal/15 border border-teal/40 text-white" : "bg-teal/15 border-2 border-navy text-navy"
      )}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="prod-form-name">Product Name *</Label>
            <Input
              id="prod-form-name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
              className={cn("h-10 text-xs rounded-xl", isDark ? "bg-[#060a22]/80 border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prod-form-category">Category *</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
              <SelectTrigger id="prod-form-category" className={cn("h-10 text-xs rounded-xl", isDark ? "bg-[#060a22]/80 border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
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
          <Label htmlFor="prod-form-desc">Description</Label>
          <Textarea
            id="prod-form-desc"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            rows={3}
            className={cn("text-xs rounded-xl", isDark ? "bg-[#060a22]/80 border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="prod-form-price">Price (TZS) *</Label>
            <Input
              id="prod-form-price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              required
              className={cn("h-10 text-xs rounded-xl", isDark ? "bg-[#060a22]/80 border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prod-form-stock">Stock Units *</Label>
            <Input
              id="prod-form-stock"
              type="number"
              min="0"
              value={formData.stock}
              onChange={(e) => setFormData({...formData, stock: e.target.value})}
              required
              className={cn("h-10 text-xs rounded-xl", isDark ? "bg-[#060a22]/80 border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prod-form-rating">Rating (1-5) *</Label>
            <Input
              id="prod-form-rating"
              type="number"
              step="0.1"
              min="1"
              max="5"
              value={formData.rating}
              onChange={(e) => setFormData({...formData, rating: e.target.value})}
              required
              className={cn("h-10 text-xs rounded-xl", isDark ? "bg-[#060a22]/80 border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="prod-form-epic">Epic Computers Product URL (optional)</Label>
          <Input
            id="prod-form-epic"
            value={epicUrl}
            onChange={(e) => setEpicUrl(e.target.value)}
            placeholder="https://epiccomputers.co.tz/product/..."
            className={cn("h-10 text-xs rounded-xl", isDark ? "bg-[#060a22]/80 border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
          />
          <p className="text-xs opacity-75">Paste a product URL from Epic Computers to auto-fetch data</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="prod-form-img">Image URL</Label>
          <div className="flex gap-2">
            <Input
              id="prod-form-img"
              value={formData.image}
              onChange={(e) => setFormData({...formData, image: e.target.value})}
              placeholder="https://example.com/image.jpg"
              className={cn("h-10 text-xs rounded-xl", isDark ? "bg-[#060a22]/80 border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleFetchProductData}
              disabled={isLoading || (!formData.name.trim() && !epicUrl.trim())}
              className={cn("font-bold rounded-xl", isDark ? "border-teal/30 text-teal hover:bg-teal/20" : "text-navy border-navy/20 hover:bg-navy hover:text-white")}
            >
              {isLoading ? "Fetching..." : "Fetch from Epic"}
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="prod-form-swatches">Swatch Image URLs (comma separated)</Label>
          <Input
            id="prod-form-swatches"
            value={formData.swatchImages}
            onChange={(e) => setFormData({...formData, swatchImages: e.target.value})}
            placeholder="https://example.com/swatch1.jpg, https://example.com/swatch2.jpg"
            className={cn("h-10 text-xs rounded-xl", isDark ? "bg-[#060a22]/80 border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="prod-form-features">Features (comma separated)</Label>
          <Textarea
            id="prod-form-features"
            value={formData.features}
            onChange={(e) => setFormData({...formData, features: e.target.value})}
            placeholder="Feature 1, Feature 2, Feature 3"
            rows={2}
            className={cn("text-xs rounded-xl", isDark ? "bg-[#060a22]/80 border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="rounded-xl font-bold">
          Cancel
        </Button>
        <Button 
          type="button" 
          className="bg-navy hover:bg-navy/90 text-white rounded-xl font-bold"
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
