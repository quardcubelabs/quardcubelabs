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
import { Plus, Search, Edit, Trash2, Briefcase, Eye, CheckCircle, XCircle, Clock, Layers, Sparkles, ExternalLink, ShieldCheck, Tag } from "lucide-react"
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
  const [viewingService, setViewingService] = useState<Service | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
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

  const handleViewService = (service: Service) => {
    setViewingService(service)
    setIsViewModalOpen(true)
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

  const formatStatNumber = (num: number) => {
    const n = Number(num) || 0
    if (n >= 1_000_000) {
      const m = n / 1_000_000
      return m % 1 === 0 ? `${m.toFixed(0)}M` : `${m.toFixed(1)}M`
    }
    if (n >= 1_000) {
      const k = n / 1_000
      return k % 1 === 0 ? `${k.toFixed(0)}K` : `${k.toFixed(1)}K`
    }
    return n.toLocaleString()
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
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        {[
          { title: "Total Services", value: formatStatNumber(services.length), icon: Briefcase },
          { title: "Active", value: formatStatNumber(services.filter(s => s.status === 'active').length), icon: CheckCircle },
          { title: "Draft", value: formatStatNumber(services.filter(s => s.status === 'draft').length), icon: Clock },
          { title: "Inactive", value: formatStatNumber(services.filter(s => s.status === 'inactive').length), icon: XCircle },
          { title: "Categories", value: formatStatNumber(categories.length), icon: Layers }
        ].map((stat, idx) => (
          <Card
            key={idx}
            className={cn(
              "rounded-2xl transition-all duration-300 border-2 hover:-translate-y-0.5 group cursor-pointer overflow-hidden",
              isDark 
                ? "bg-[#0a1033] border-teal/20 shadow-md hover:border-teal-400" 
                : "bg-white border-navy/20 shadow-sm hover:border-navy hover:shadow-md",
              idx === 4 ? "col-span-2 sm:col-span-1" : ""
            )}
          >
            <CardContent className="p-3.5 sm:p-4 flex items-center justify-between gap-2.5 sm:gap-3">
              <div className="min-w-0 flex-1">
                <p className={cn("text-[11px] font-bold uppercase tracking-wider mb-1 truncate block", isDark ? "text-teal-400/80" : "text-navy/70")}>
                  {stat.title}
                </p>
                <span className={cn("text-base sm:text-lg xl:text-xl font-black truncate block leading-tight tracking-tight", isDark ? "text-white" : "text-navy")}>
                  {stat.value}
                </span>
              </div>
              <div className={cn(
                "w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
                isDark 
                  ? "bg-teal-400/10 border-teal-400/30 text-teal-300 group-hover:bg-teal-400/20" 
                  : "bg-teal-100/80 border-navy/15 text-navy group-hover:bg-teal-200"
              )}>
                <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
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
                <tr className="border-b-2 text-xs uppercase tracking-wider font-black bg-navy text-white border-navy/30">
                  <th className="text-left py-3.5 px-4 text-white font-black">Service</th>
                  <th className="text-left py-3.5 px-4 text-white font-black">Category</th>
                  <th className="text-left py-3.5 px-4 text-white font-black">Status</th>
                  <th className="text-left py-3.5 px-4 text-white font-black">Price Range</th>
                  <th className="text-left py-3.5 px-4 text-white font-black">Features</th>
                  <th className="text-right py-3.5 px-4 text-white font-black">Actions</th>
                </tr>
              </thead>
              <tbody className={cn("divide-y", isDark ? "divide-slate-800/80" : "divide-slate-100")}>
                {filteredServices.map((service) => (
                  <tr 
                    key={service.id} 
                    className={cn("transition-colors duration-150 cursor-pointer group", isDark ? "hover:bg-teal/30 hover:text-white" : "hover:bg-teal/50 hover:text-navy")}
                    onClick={() => handleViewService(service)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-navy text-white flex items-center justify-center flex-shrink-0 shadow-xs border border-navy/20">
                          <Briefcase className="h-4 w-4 text-white" />
                        </div>
                        <span className={cn("font-bold text-sm", isDark ? "text-white" : "text-navy")}>{service.title}</span>
                      </div>
                    </td>
                    <td className={cn("py-3.5 px-4 capitalize font-semibold text-sm", isDark ? "text-slate-300" : "text-navy/80")}>
                      {service.category?.replace("-", " ")}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="outline" className={cn("text-xs capitalize px-2 py-0.5 rounded-full border font-bold", getStatusColor(service.status))}>
                        {service.status}
                      </Badge>
                    </td>
                    <td className={cn("py-3.5 px-4 font-black text-sm", isDark ? "text-teal-300" : "text-navy")}>
                      {service.price_range || "—"}
                    </td>
                    <td className={cn("py-3.5 px-4 font-semibold text-xs", isDark ? "text-slate-400" : "text-navy/70")}>
                      {service.features?.length || 0} feature(s)
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button 
                          className="p-1.5 sm:p-2 rounded-lg bg-navy/10 text-navy dark:bg-teal/15 dark:text-teal hover:bg-navy hover:text-white dark:hover:bg-teal dark:hover:text-navy transition-all duration-150 shadow-xs active:scale-95 cursor-pointer"
                          title="View Service Details"
                          onClick={() => handleViewService(service)}
                        >
                          <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                        <button 
                          onClick={() => handleEdit(service)} 
                          className="p-1.5 sm:p-2 rounded-lg bg-navy/10 text-navy dark:bg-teal/15 dark:text-teal hover:bg-navy hover:text-white dark:hover:bg-teal dark:hover:text-navy transition-all duration-150 shadow-xs active:scale-95 cursor-pointer"
                          title="Edit Service"
                        >
                          <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(service.id)} 
                          className="p-1.5 sm:p-2 rounded-lg bg-red-50 text-brand-red dark:bg-red-950/30 dark:text-red-400 hover:bg-red-500 hover:text-white dark:hover:bg-red-600 dark:hover:text-white transition-all duration-150 shadow-xs active:scale-95 cursor-pointer"
                          title="Delete Service"
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 1. Service Details Preview Modal (Matching Orders & Invoices Style) */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className={cn(
          "max-w-4xl max-h-[92vh] overflow-y-auto p-4 sm:p-7 rounded-3xl border-2 shadow-2xl",
          isDark ? "bg-[#0a1033] border-teal/20 text-white" : "bg-slate-50 border-navy/20 text-navy"
        )}>
          <DialogHeader className="sr-only">
            <DialogTitle>{viewingService?.title || "Service Details"}</DialogTitle>
            <DialogDescription>Service configuration and feature deliverables</DialogDescription>
          </DialogHeader>

          {viewingService && (
            <div className="space-y-6">
              {/* Top Bar Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-navy/10 dark:border-teal/20 pb-4">
                <div className="flex items-center gap-4">
                  <img 
                    src="/turquoise.png" 
                    alt="QuardCubeLabs Logo" 
                    className="w-16 h-16 sm:w-20 sm:h-20 object-contain flex-shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className={cn("text-xl sm:text-2xl font-black tracking-tight", isDark ? "text-white" : "text-navy")}>
                        {viewingService.title}
                      </h2>
                      <Badge className={cn("text-xs uppercase tracking-wider font-black px-3 py-1 shadow-xs", getStatusColor(viewingService.status))}>
                        {viewingService.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize font-bold border-navy/30 dark:border-teal/30">
                        {viewingService.category?.replace("-", " ")}
                      </Badge>
                    </div>
                    <p className={cn("text-xs sm:text-sm font-medium mt-1", isDark ? "text-teal-400/80" : "text-navy/70")}>
                      Service ID: #{viewingService.id.slice(0, 12)} • Order Index: {viewingService.order_index ?? 0}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setIsViewModalOpen(false)
                      handleEdit(viewingService)
                    }}
                    className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5 h-10 px-4"
                  >
                    <Edit className="h-4 w-4 text-white" />
                    Edit Service
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                    className={cn("rounded-xl font-bold h-10 px-4 border-2", isDark ? "border-teal/30 text-teal-300 hover:bg-white/10" : "border-navy/20 text-navy hover:bg-navy/10")}
                  >
                    <a href="/services" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-1.5" />
                      View on Site
                    </a>
                  </Button>
                </div>
              </div>

              {/* 2-Column Responsive Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Columns: Description & Features */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Overview Card */}
                  <Card className={cn(
                    "rounded-2xl sm:rounded-3xl border-2 p-5 shadow-lg space-y-4",
                    isDark ? "bg-[#060a22] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
                  )}>
                    <div className="border-b border-navy/10 dark:border-teal/20 pb-3 flex items-center justify-between">
                      <h3 className="text-base font-black flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-navy dark:text-white" />
                        Service Overview
                      </h3>
                      {viewingService.price_range && (
                        <span className="text-sm font-black text-navy dark:text-teal-300">
                          {viewingService.price_range}
                        </span>
                      )}
                    </div>

                    {viewingService.short_description && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1">Summary</h4>
                        <p className="text-sm font-semibold opacity-90 leading-relaxed">
                          {viewingService.short_description}
                        </p>
                      </div>
                    )}

                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1">Detailed Description</h4>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap opacity-85">
                        {viewingService.description || "No full description provided for this service."}
                      </p>
                    </div>
                  </Card>

                  {/* Included Features Card */}
                  <Card className={cn(
                    "rounded-2xl sm:rounded-3xl border-2 p-5 shadow-lg space-y-4",
                    isDark ? "bg-[#060a22] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
                  )}>
                    <div className="border-b border-navy/10 dark:border-teal/20 pb-3 flex items-center justify-between">
                      <h3 className="text-base font-black flex items-center gap-2">
                        <Layers className="h-5 w-5 text-navy dark:text-white" />
                        Included Features & Scope ({viewingService.features?.length || 0})
                      </h3>
                    </div>

                    {viewingService.features && viewingService.features.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {viewingService.features.map((feature, idx) => (
                          <div 
                            key={idx} 
                            className={cn(
                              "p-3 rounded-xl border flex items-start gap-2.5 text-xs font-semibold",
                              isDark ? "bg-[#080d2a] border-teal/20 text-slate-200" : "bg-teal-50/60 border-navy/10 text-navy"
                            )}
                          >
                            <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs opacity-60 italic">No features defined yet.</p>
                    )}
                  </Card>

                  {/* SEO & Metadata Card */}
                  {(viewingService.meta_title || viewingService.meta_description) && (
                    <Card className={cn(
                      "rounded-2xl sm:rounded-3xl border-2 p-5 shadow-lg space-y-3",
                      isDark ? "bg-[#060a22]/80 border-teal/20 text-slate-300" : "bg-teal-50/70 border-navy/10 text-navy/90"
                    )}>
                      <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-teal" />
                        SEO & Metadata Details
                      </h4>
                      {viewingService.meta_title && (
                        <p className="text-xs font-semibold">
                          <strong className="text-navy dark:text-white">Meta Title:</strong> {viewingService.meta_title}
                        </p>
                      )}
                      {viewingService.meta_description && (
                        <p className="text-xs opacity-80">
                          <strong className="text-navy dark:text-white">Meta Description:</strong> {viewingService.meta_description}
                        </p>
                      )}
                    </Card>
                  )}
                </div>

                {/* Right Column: Key Details & Management */}
                <div className="space-y-6">
                  {/* Service Metrics Card */}
                  <Card className={cn(
                    "rounded-2xl sm:rounded-3xl border-2 p-5 shadow-lg space-y-4",
                    isDark ? "bg-[#060a22] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
                  )}>
                    <div className="border-b border-navy/10 dark:border-teal/20 pb-3">
                      <h3 className="text-base font-black flex items-center gap-2">
                        <Clock className="h-5 w-5 text-navy dark:text-white" />
                        Configuration Details
                      </h3>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center opacity-80">
                        <span>Category</span>
                        <span className="font-bold capitalize">{viewingService.category?.replace("-", " ")}</span>
                      </div>
                      <div className="flex justify-between items-center opacity-80">
                        <span>Status</span>
                        <Badge className={cn("text-xs uppercase font-bold", getStatusColor(viewingService.status))}>
                          {viewingService.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center opacity-80">
                        <span>Price Range</span>
                        <span className="font-bold text-navy dark:text-teal-300">{viewingService.price_range || "Flexible"}</span>
                      </div>
                      <div className="flex justify-between items-center opacity-80 border-t border-navy/10 dark:border-teal/20 pt-2.5">
                        <span>Icon Identifier</span>
                        <code className="text-xs font-mono bg-navy/10 dark:bg-white/10 px-2 py-0.5 rounded">{viewingService.icon || "code"}</code>
                      </div>
                      <div className="flex justify-between items-center opacity-80">
                        <span>Display Order</span>
                        <span className="font-bold">{viewingService.order_index ?? 0}</span>
                      </div>
                    </div>
                  </Card>

                  {/* Quick Action Card */}
                  <Card className={cn(
                    "rounded-2xl sm:rounded-3xl border-2 p-5 shadow-lg space-y-3",
                    isDark ? "bg-[#060a22] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
                  )}>
                    <h3 className="text-sm font-black uppercase tracking-wider opacity-70">
                      Manage Service
                    </h3>
                    <div className="space-y-2 pt-1">
                      <Button
                        onClick={() => {
                          setIsViewModalOpen(false)
                          handleEdit(viewingService)
                        }}
                        className="w-full bg-teal text-navy font-black hover:bg-teal-400 rounded-xl shadow-md h-10 flex items-center justify-center gap-2"
                      >
                        <Edit className="h-4 w-4 text-navy" />
                        Edit Configuration
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setIsViewModalOpen(false)
                          handleDelete(viewingService.id)
                        }}
                        className="w-full text-brand-red hover:bg-brand-red/10 rounded-xl font-bold h-10 flex items-center justify-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Service
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 2. Create/Edit Service Modal (Styled to Dashboard Theme) */}
      <Dialog open={isCreateModalOpen || !!editingService} onOpenChange={(open) => {
        if (!open) {
          setIsCreateModalOpen(false)
          setEditingService(null)
          resetForm()
        }
      }}>
        <DialogContent className={cn(
          "max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-3xl border-2 shadow-2xl",
          isDark ? "bg-[#0a1033] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
        )}>
          <DialogHeader className="border-b border-navy/10 dark:border-teal/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-navy text-white flex items-center justify-center shadow-xs border border-navy/20">
                <Briefcase className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className={cn("text-xl sm:text-2xl font-black", isDark ? "text-white" : "text-navy")}>
                  {editingService ? "Edit Service" : "Create New Service"}
                </DialogTitle>
                <DialogDescription className={cn("text-xs sm:text-sm font-medium mt-0.5", isDark ? "text-teal-400/80" : "text-navy/70")}>
                  {editingService ? "Update service details, deliverables and pricing" : "Add a new digital service offering to your portfolio"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider">Service Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  placeholder="e.g., Custom Web Application"
                  className={cn("h-11 rounded-xl border-2 font-medium", isDark ? "bg-[#060a22] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-xs font-bold uppercase tracking-wider">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger className={cn("h-11 rounded-xl border-2 font-medium", isDark ? "bg-[#060a22] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1).replace("-", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="short_description" className="text-xs font-bold uppercase tracking-wider">Short Summary</Label>
              <Input
                id="short_description"
                value={formData.short_description}
                onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                placeholder="Brief one-line summary for cards and search"
                className={cn("h-11 rounded-xl border-2 font-medium", isDark ? "bg-[#060a22] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider">Detailed Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                placeholder="Comprehensive service description and workflow breakdown..."
                className={cn("rounded-xl border-2 font-medium", isDark ? "bg-[#060a22] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="price_range" className="text-xs font-bold uppercase tracking-wider">Price Range / Estimate</Label>
                <Input
                  id="price_range"
                  value={formData.price_range}
                  onChange={(e) => setFormData(prev => ({ ...prev, price_range: e.target.value }))}
                  placeholder="e.g., TZS 500,000 - 2,000,000"
                  className={cn("h-11 rounded-xl border-2 font-medium", isDark ? "bg-[#060a22] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-xs font-bold uppercase tracking-wider">Status</Label>
                <Select value={formData.status} onValueChange={(value: 'active' | 'inactive' | 'draft') => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className={cn("h-11 rounded-xl border-2 font-medium", isDark ? "bg-[#060a22] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
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
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider">Service Deliverables / Features</Label>
                <span className="text-xs opacity-60 font-semibold">{formData.features.length} item(s)</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto p-1">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      placeholder="e.g., Responsive Design, SEO Optimization, 1 Year Support"
                      className={cn("h-10 rounded-xl border-2 font-medium text-sm", isDark ? "bg-[#060a22] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFeature(index)}
                      className="h-10 w-10 p-0 rounded-xl text-brand-red hover:bg-brand-red/10 shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={addFeature}
                className={cn("w-full rounded-xl border-2 font-bold h-10 border-dashed", isDark ? "border-teal/30 text-teal-300 hover:bg-white/10" : "border-navy/25 text-navy hover:bg-navy/5")}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Feature Deliverable
              </Button>
            </div>

            <DialogFooter className="border-t border-navy/10 dark:border-teal/20 pt-4 gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsCreateModalOpen(false)
                  setEditingService(null)
                  resetForm()
                }}
                className={cn("rounded-xl border-2 font-bold h-11 px-5", isDark ? "border-teal/30 text-teal-300 hover:bg-white/10" : "border-navy/20 text-navy hover:bg-navy/10")}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-teal text-navy font-black hover:bg-teal-400 rounded-xl shadow-md h-11 px-6 transition-colors"
              >
                {isSubmitting ? "Saving..." : editingService ? "Update Service" : "Create Service"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
