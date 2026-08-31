"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import AdminLoading from "@/components/admin/admin-loading"
import { Plus, Search, Edit, Trash2, Briefcase, Eye, CheckCircle, XCircle, Clock, Layers } from "lucide-react"
import { getServices, createService, updateService, deleteService } from "@/lib/services-actions"
import type { Service } from "@/types/database"

interface ServiceFormData {
  title: string
  description: string
  short_description: string
  price_range: string
  category: string
  status: 'active' | 'inactive' | 'draft'
  features: string[]
  image_url: string
  icon: string
  order_index: number
  meta_title: string
  meta_description: string
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState<ServiceFormData>({
    title: "",
    description: "",
    short_description: "",
    price_range: "",
    category: "development",
    status: "active",
    features: [],
    image_url: "",
    icon: "",
    order_index: 0,
    meta_title: "",
    meta_description: ""
  })

  const categories = [
    "development",
    "design", 
    "marketing",
    "consulting",
    "support"
  ]

  const loadServices = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await getServices()
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive"
        })
      } else {
        setServices(data || [])
      }
    } catch (error) {
      console.error("Error loading services:", error)
      toast({
        title: "Error",
        description: "Failed to load services",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadServices()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const serviceData = {
        ...formData,
        features: formData.features.filter(f => f.trim() !== "")
      }

      let result
      if (editingService) {
        result = await updateService(editingService.id, serviceData)
      } else {
        result = await createService(serviceData)
      }

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        })
      } else {
        toast({
          title: "Success",
          description: `Service ${editingService ? "updated" : "created"} successfully!`
        })
        
        await loadServices()
        resetForm()
        setIsCreateModalOpen(false)
        setEditingService(null)
      }
    } catch (error) {
      console.error("Error submitting service:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (service: Service) => {
    setFormData({
      title: service.title,
      description: service.description || "",
      short_description: service.short_description || "",
      price_range: service.price_range || "",
      category: service.category,
      status: service.status,
      features: service.features || [],
      image_url: service.image_url || "",
      icon: service.icon || "",
      order_index: service.order_index,
      meta_title: service.meta_title || "",
      meta_description: service.meta_description || ""
    })
    setEditingService(service)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return

    try {
      const { error } = await deleteService(id)
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive"
        })
      } else {
        toast({
          title: "Success",
          description: "Service deleted successfully!"
        })
        await loadServices()
      }
    } catch (error) {
      console.error("Error deleting service:", error)
      toast({
        title: "Error",
        description: "Failed to delete service",
        variant: "destructive"
      })
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      short_description: "",
      price_range: "",
      category: "development",
      status: "active",
      features: [],
      image_url: "",
      icon: "",
      order_index: 0,
      meta_title: "",
      meta_description: ""
    })
  }

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, ""]
    }))
  }

  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((f, i) => i === index ? value : f)
    }))
  }

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }))
  }

  const filteredServices = services.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || service.status === statusFilter
    const matchesCategory = categoryFilter === "all" || service.category === categoryFilter
    
    return matchesSearch && matchesStatus && matchesCategory
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-red-100 text-red-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header Card in Teal without borders */}
      <div className="bg-teal p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-1 text-navy">
              Services <span className="text-white drop-shadow-sm">Management</span>
            </h1>
            <p className="text-sm sm:text-base text-navy/90 font-semibold">
              Manage and configure your company IT services catalog
            </p>
          </div>
          <Button onClick={() => { resetForm(); setIsCreateModalOpen(true) }} className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 px-4 shadow-md" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 rounded-full p-2">
              <Briefcase className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Services</p>
              <p className="text-2xl font-bold text-blue-900">{services.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 rounded-full p-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-green-600 font-medium">Active</p>
              <p className="text-2xl font-bold text-green-900">{services.filter(s => s.status === 'active').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 rounded-full p-2">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-yellow-600 font-medium">Draft</p>
              <p className="text-2xl font-bold text-yellow-900">{services.filter(s => s.status === 'draft').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-pink-50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-pink-100 rounded-full p-2">
              <XCircle className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <p className="text-sm text-pink-600 font-medium">Inactive</p>
              <p className="text-2xl font-bold text-pink-900">{services.filter(s => s.status === 'inactive').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 rounded-full p-2">
              <Layers className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-purple-600 font-medium">Categories</p>
              <p className="text-2xl font-bold text-purple-900">{[...new Set(services.map(s => s.category))].length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1 border-b overflow-x-auto">
        <button
          onClick={() => setCategoryFilter("all")}
          className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
            categoryFilter === "all"
              ? "border-red-500 text-red-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          All Services
        </button>
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setCategoryFilter(category)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors capitalize ${
              categoryFilter === category
                ? "border-red-500 text-red-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Search & Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal" />
          <Input
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border border-teal focus:border-teal focus:ring-1 focus:ring-teal"
          />
        </div>
        <Button variant="outline">
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-navy">All Services</h2>
          <p className="text-sm text-gray-500">{filteredServices.length} service{filteredServices.length !== 1 ? "s" : ""} found</p>
        </div>
        <Button onClick={() => { resetForm(); setIsCreateModalOpen(true) }} className="bg-navy hover:bg-navy/90" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </Button>
      </div>

      {/* Services Table */}
      {isLoading ? (
        <AdminLoading message="Loading services..." size="lg" />
      ) : filteredServices.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No services found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
                ? "Try adjusting your filters"
                : "Get started by creating your first service"}
            </p>
            {!(searchQuery || statusFilter !== "all" || categoryFilter !== "all") && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50/50">
                <th className="text-left px-4 py-3 font-medium text-gray-500 uppercase text-xs">Service</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 uppercase text-xs">Category</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 uppercase text-xs">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 uppercase text-xs">Price Range</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 uppercase text-xs">Features</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 uppercase text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map((service) => (
                <tr key={service.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-navy shrink-0" />
                      <span className="font-medium text-gray-900">{service.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-600">{service.category}</td>
                  <td className="px-4 py-3">
                    <Badge className={getStatusColor(service.status)}>{service.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{service.price_range || "\u2014"}</td>
                  <td className="px-4 py-3 text-gray-600">{service.features?.length || 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <a href="/services" target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4 text-gray-500" />
                        </a>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(service)}>
                        <Edit className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(service.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateModalOpen || !!editingService} onOpenChange={(open) => {
        if (!open) {
          setIsCreateModalOpen(false)
          setEditingService(null)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingService ? "Edit Service" : "Create New Service"}</DialogTitle>
            <DialogDescription>
              {editingService ? "Update service information" : "Add a new service to your offerings"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Service Title*</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category*</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="short_description">Short Description</Label>
              <Input
                id="short_description"
                value={formData.short_description}
                onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                placeholder="Brief service description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Detailed Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                placeholder="Detailed service description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price_range">Price Range</Label>
                <Input
                  id="price_range"
                  value={formData.price_range}
                  onChange={(e) => setFormData(prev => ({ ...prev, price_range: e.target.value }))}
                  placeholder="e.g., $500 - $2000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value: 'active' | 'inactive' | 'draft') => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Service Features</Label>
              <div className="space-y-2">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      placeholder="Feature description"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeFeature(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addFeature}
                  className="w-full"
                >
                  Add Feature
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setIsCreateModalOpen(false)
                setEditingService(null)
                resetForm()
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : editingService ? "Update Service" : "Create Service"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
