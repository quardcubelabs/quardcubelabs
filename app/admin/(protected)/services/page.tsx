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
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"
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
  const { isDark } = useAdminTheme()
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
    category: "web-development",
    status: "active",
    features: [""],
    image_url: "",
    icon: "code",
    order_index: 0,
    meta_title: "",
    meta_description: ""
  })

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await getServices()
      if (error) throw new Error(error)
      setServices(data || [])
    } catch (error: any) {
      console.error("Error fetching services:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to fetch services. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      short_description: "",
      price_range: "",
      category: "web-development",
      status: "active",
      features: [""],
      image_url: "",
      icon: "code",
      order_index: 0,
      meta_title: "",
      meta_description: ""
    })
    setEditingService(null)
  }

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setFormData({
      title: service.title,
      description: service.description || "",
      short_description: service.short_description || "",
      price_range: service.price_range || "",
      category: service.category || "web-development",
      status: service.status || "active",
      features: service.features && service.features.length > 0 ? service.features : [""],
      image_url: service.image_url || "",
      icon: service.icon || "code",
      order_index: service.order_index || 0,
      meta_title: service.meta_title || "",
      meta_description: service.meta_description || ""
    })
    setIsCreateModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return

    try {
      const { error } = await deleteService(id)
      if (error) throw new Error(error)
      setServices(services.filter(s => s.id !== id))
      toast({
        title: "Success",
        description: "Service deleted successfully."
      })
    } catch (error: any) {
      console.error("Error deleting service:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete service. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const cleanedFeatures = formData.features.filter(f => f.trim() !== "")

      if (editingService) {
        const { data, error } = await updateService(editingService.id, {
          ...formData,
          features: cleanedFeatures
        })
        if (error) throw new Error(error)
        if (data) {
          setServices(services.map(s => s.id === editingService.id ? data : s))
        }
        toast({
          title: "Success",
          description: "Service updated successfully."
        })
      } else {
        const { data, error } = await createService({
          ...formData,
          features: cleanedFeatures
        })
        if (error) throw new Error(error)
        if (data) {
          setServices([...services, data])
        }
        toast({
          title: "Success",
          description: "Service created successfully."
        })
      }

      setIsCreateModalOpen(false)
      resetForm()
    } catch (error: any) {
      console.error("Error saving service:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save service. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...formData.features]
    newFeatures[index] = value
    setFormData({ ...formData, features: newFeatures })
  }

  const updateFeature = handleFeatureChange

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ""] })
  }

  const removeFeature = (index: number) => {
    const newFeatures = formData.features.filter((_, i) => i !== index)
    setFormData({ ...formData, features: newFeatures.length > 0 ? newFeatures : [""] })
  }

  const categories = Array.from(new Set(services.map(s => s.category).filter(Boolean)))

  const filteredServices = services.filter(service => {
    const matchesSearch = searchQuery === "" ||
      service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.category?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || service.status === statusFilter
    const matchesCategory = categoryFilter === "all" || service.category === categoryFilter

    return matchesSearch && matchesStatus && matchesCategory
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold"
      case "draft": return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold"
      case "inactive": return "bg-brand-red/15 text-brand-red border-brand-red/30 font-bold"
      default: return "bg-gray-500/15 text-gray-700 dark:text-gray-300 font-bold"
    }
  }

  if (isLoading) {
    return <AdminLoading />
  }

  return (
    <div className="w-full space-y-6">
      {/* 1. Page Header Card in Teal with website theme */}
      <div className={cn(
        "p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-0 shadow-md transition-all duration-300",
        isDark ? "bg-[#0a1033] border-teal/20 text-white" : "bg-teal text-navy"
      )}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black mb-1">
              Services <span className="text-white drop-shadow-sm">Management</span>
            </h1>
            <p className={cn("text-sm sm:text-base font-semibold", isDark ? "text-teal-300" : "text-navy/90")}>
              Manage and configure your company IT services catalog and solutions
            </p>
          </div>
          <Button 
            onClick={() => { resetForm(); setIsCreateModalOpen(true) }} 
            className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 px-4 shadow-md transition-all active:scale-95"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
        </div>
      </div>

      {/* 2. Stats Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
        {[
          { title: "Total Services", value: services.length.toString(), icon: Briefcase },
          { title: "Active", value: services.filter(s => s.status === 'active').length.toString(), icon: CheckCircle },
          { title: "Draft", value: services.filter(s => s.status === 'draft').length.toString(), icon: Clock },
          { title: "Inactive", value: services.filter(s => s.status === 'inactive').length.toString(), icon: XCircle },
          { title: "Categories", value: categories.length.toString(), icon: Layers }
        ].map((stat, idx) => (
          <Card
            key={idx}
            className={cn(
              "rounded-2xl transition-all duration-300 border-2 hover:-translate-y-1 group cursor-pointer",
              isDark 
                ? "bg-[#0a1033] border-teal/20 shadow-lg shadow-black/20 hover:border-teal-400 hover:shadow-teal-950/40" 
                : "bg-white border-navy/20 shadow-md hover:border-navy hover:shadow-xl",
              idx === 4 ? "col-span-2 sm:col-span-1" : ""
            )}
          >
            <CardContent className="p-3.5 sm:p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className={cn("text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1 truncate", isDark ? "text-teal-400/80" : "text-navy/70")}>
                    {stat.title}
                  </p>
                  <span className={cn("text-base sm:text-lg md:text-xl lg:text-2xl font-black whitespace-nowrap tracking-tight", isDark ? "text-white" : "text-navy")}>
                    {stat.value}
                  </span>
                </div>
                <div className={cn(
                  "p-2 sm:p-2.5 rounded-xl border-2 flex-shrink-0 transition-transform duration-200 group-hover:scale-110",
                  isDark 
                    ? "bg-teal-400/10 border-teal-400/30 text-teal-300 group-hover:bg-teal-400/20" 
                    : "bg-teal-100 border-navy/10 text-navy group-hover:bg-teal-200"
                )}>
                  <stat.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 3. Category Filter & Search Bar */}
      <Card className={cn(
        "rounded-2xl border-2 p-4 transition-all duration-300 space-y-3",
        isDark ? "bg-[#0a1033] border-teal/20" : "bg-white border-navy/20 shadow-sm"
      )}>
        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setCategoryFilter("all")}
            className={cn(
              "px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200",
              categoryFilter === "all"
                ? "bg-navy text-white shadow-md"
                : isDark 
                  ? "text-slate-300 hover:bg-teal-400/10 hover:text-teal-300" 
                  : "text-navy/70 hover:bg-teal-50 hover:text-navy"
            )}
          >
            All Services
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setCategoryFilter(category)}
              className={cn(
                "px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 capitalize",
                categoryFilter === category
                  ? "bg-navy text-white shadow-md"
                  : isDark 
                    ? "text-slate-300 hover:bg-teal-400/10 hover:text-teal-300" 
                    : "text-navy/70 hover:bg-teal-50 hover:text-navy"
              )}
            >
              {category.replace("-", " ")}
            </button>
          ))}
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal" />
            <Input
              placeholder="Search services by title, description or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "pl-10 h-10 rounded-xl border border-teal text-sm font-medium",
                isDark ? "bg-[#0c1438] text-white" : "bg-white text-navy"
              )}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className={cn("w-full sm:w-[180px] h-10 rounded-xl border border-teal font-bold text-xs", isDark ? "bg-[#0c1438] text-white" : "bg-white text-navy")}>
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
      </Card>

      {/* 4. Services Table */}
      {filteredServices.length === 0 ? (
        <div className={cn(
          "rounded-2xl border-2 border-dashed p-12 text-center",
          isDark ? "border-teal/20 bg-[#0a1033]/50 text-slate-300" : "border-navy/20 bg-white/50 text-navy"
        )}>
          <Briefcase className="h-12 w-12 text-teal opacity-60 mx-auto mb-3" />
          <h3 className="text-lg font-bold">No services found</h3>
          <p className={cn("text-xs mt-1 mb-4", isDark ? "text-slate-400" : "text-navy/70")}>
            {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
              ? "Try adjusting your search criteria or category filter"
              : "Get started by creating your first service offering"}
          </p>
          {!(searchQuery || statusFilter !== "all" || categoryFilter !== "all") && (
            <Button onClick={() => setIsCreateModalOpen(true)} className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl shadow-md">
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          )}
        </div>
      ) : (
        <Card className={cn(
          "rounded-2xl border-2 overflow-hidden transition-all duration-300",
          isDark ? "bg-[#0a1033] border-teal/20 shadow-lg" : "bg-white border-navy/20 shadow-md"
        )}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={cn(
                  "border-b text-xs uppercase tracking-wider font-extrabold",
                  isDark ? "bg-[#080d2a] border-teal/20 text-teal-300" : "bg-teal/10 border-navy/15 text-navy"
                )}>
                  <th className="text-left py-3.5 px-4">Service</th>
                  <th className="text-left py-3.5 px-4">Category</th>
                  <th className="text-left py-3.5 px-4">Status</th>
                  <th className="text-left py-3.5 px-4">Price Range</th>
                  <th className="text-left py-3.5 px-4">Features</th>
                  <th className="text-right py-3.5 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className={cn("divide-y", isDark ? "divide-slate-800/80" : "divide-slate-100")}>
                {filteredServices.map((service) => (
                  <tr key={service.id} className={cn("transition-colors", isDark ? "hover:bg-slate-900/60" : "hover:bg-slate-50/80")}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className={cn("p-1.5 rounded-lg border", isDark ? "bg-teal-400/10 border-teal-400/30 text-teal-300" : "bg-teal-100 border-navy/10 text-navy")}>
                          <Briefcase className="h-4 w-4 shrink-0" />
                        </div>
                        <span className={cn("font-bold", isDark ? "text-white" : "text-navy")}>{service.title}</span>
                      </div>
                    </td>
                    <td className={cn("py-3 px-4 capitalize font-semibold", isDark ? "text-slate-300" : "text-navy/80")}>
                      {service.category?.replace("-", " ")}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className={cn("text-xs capitalize px-2 py-0.5 rounded-full border", getStatusColor(service.status))}>
                        {service.status}
                      </Badge>
                    </td>
                    <td className={cn("py-3 px-4 font-black", isDark ? "text-teal-300" : "text-navy")}>
                      {service.price_range || "—"}
                    </td>
                    <td className={cn("py-3 px-4 font-semibold text-xs", isDark ? "text-slate-400" : "text-navy/70")}>
                      {service.features?.length || 0} feature(s)
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild className={cn("h-8 w-8 p-0 rounded-lg", isDark ? "hover:bg-teal-400/15 text-teal-300" : "hover:bg-teal-100 text-navy")}>
                          <a href="/services" target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(service)} className={cn("h-8 w-8 p-0 rounded-lg", isDark ? "hover:bg-teal-400/15 text-teal-300" : "hover:bg-teal-100 text-navy")}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(service.id)} className="h-8 w-8 p-0 rounded-lg hover:bg-brand-red/10 text-brand-red">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
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
