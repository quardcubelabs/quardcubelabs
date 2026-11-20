"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import AdminLoading from "@/components/admin/admin-loading"
import {
  Plus,
  Edit,
  Trash2,
  Briefcase,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Layers,
  Sparkles,
  ExternalLink,
  FileText,
  Tag,
} from "lucide-react"
import { getServices, createService, updateService, deleteService } from "@/lib/services-actions"
import type { Service } from "@/types/database"
import {
  AdminPageHeader,
  AdminStats,
  AdminFilterBar,
  AdminTable,
  AdminPrimaryCell,
  AdminPill,
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

interface ServiceFormData {
  title: string
  description: string
  short_description: string
  price_range: string
  category: string
  status: "active" | "inactive" | "draft"
  features: string[]
  image_url: string
  icon: string
  order_index: number
  meta_title: string
  meta_description: string
}

const EMPTY_FORM: ServiceFormData = {
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
  meta_description: "",
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [viewingService, setViewingService] = useState<Service | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState<ServiceFormData>(EMPTY_FORM)

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
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData(EMPTY_FORM)
    setEditingService(null)
  }

  const closeForm = () => {
    setIsCreateModalOpen(false)
    resetForm()
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
      meta_description: service.meta_description || "",
    })
    setIsCreateModalOpen(true)
  }

  const performDelete = async (id: string) => {
    setIsDeleting(true)
    try {
      const { error } = await deleteService(id)
      if (error) throw new Error(error)
      setServices(services.filter((s) => s.id !== id))
      toast({
        title: "Success",
        description: "Service deleted successfully.",
      })
      setServiceToDelete(null)
      setIsViewModalOpen(false)
    } catch (error: any) {
      console.error("Error deleting service:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete service. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const cleanedFeatures = formData.features.filter((f) => f.trim() !== "")

      if (editingService) {
        const { data, error } = await updateService(editingService.id, {
          ...formData,
          features: cleanedFeatures,
        })
        if (error) throw new Error(error)
        if (data) {
          setServices(services.map((s) => (s.id === editingService.id ? data : s)))
        }
        toast({
          title: "Success",
          description: "Service updated successfully.",
        })
      } else {
        const { data, error } = await createService({
          ...formData,
          features: cleanedFeatures,
        })
        if (error) throw new Error(error)
        if (data) {
          setServices([...services, data])
        }
        toast({
          title: "Success",
          description: "Service created successfully.",
        })
      }

      closeForm()
    } catch (error: any) {
      console.error("Error saving service:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save service. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...formData.features]
    newFeatures[index] = value
    setFormData({ ...formData, features: newFeatures })
  }

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ""] })
  }

  const removeFeature = (index: number) => {
    const newFeatures = formData.features.filter((_, i) => i !== index)
    setFormData({ ...formData, features: newFeatures.length > 0 ? newFeatures : [""] })
  }

  const categories = Array.from(new Set(services.map((s) => s.category).filter(Boolean))) as string[]

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      searchQuery === "" ||
      service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.category?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || service.status === statusFilter
    const matchesCategory = categoryFilter === "all" || service.category === categoryFilter

    return matchesSearch && matchesStatus && matchesCategory
  })

  const formatNumber = (num: number) => {
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

  if (isLoading) {
    return <AdminLoading />
  }

  const columns: AdminTableColumn<Service>[] = [
    {
      key: "service",
      header: "Service",
      render: (service) => (
        <AdminPrimaryCell
          icon={Briefcase}
          title={service.title}
          subtitle={service.short_description || service.description}
        />
      ),
    },
    {
      key: "category",
      header: "Category",
      hidden: "sm",
      render: (service) => (
        <span className="capitalize font-semibold text-xs sm:text-sm">
          {service.category?.replace(/-/g, " ")}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (service) => <AdminStatusBadge status={service.status} />,
    },
    {
      key: "price",
      header: "Price Range",
      hidden: "md",
      render: (service) => (
        <span className="font-black text-xs sm:text-sm whitespace-nowrap">
          {service.price_range || "—"}
        </span>
      ),
    },
    {
      key: "features",
      header: "Features",
      hidden: "lg",
      render: (service) => (
        <AdminMutedText>{service.features?.length || 0} feature(s)</AdminMutedText>
      ),
    },
  ]

  const actions: AdminTableAction<Service>[] = [
    {
      key: "view",
      label: "View Service Details",
      icon: Eye,
      variant: "view",
      onClick: handleViewService,
    },
    {
      key: "site",
      label: "View on Site",
      icon: ExternalLink,
      variant: "soft",
      href: () => "/services",
      external: true,
      mobile: false,
    },
    {
      key: "edit",
      label: "Edit Service",
      icon: Edit,
      variant: "edit",
      onClick: handleEdit,
    },
    {
      key: "delete",
      label: "Delete Service",
      icon: Trash2,
      variant: "delete",
      onClick: (service) => setServiceToDelete(service.id),
    },
  ]

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6 overflow-hidden">
      <AdminPageHeader
        title="Services"
        accent="Management"
        subtitle="Manage and configure your company IT services catalog and solutions"
        icon={Briefcase}
        onAdd={() => {
          resetForm()
          setIsCreateModalOpen(true)
        }}
        addLabel="Add Service"
      />

      <AdminStats
        columns={5}
        items={[
          { title: "Total Services", value: formatNumber(services.length), icon: Briefcase },
          { title: "Active", value: formatNumber(services.filter((s) => s.status === "active").length), icon: CheckCircle },
          { title: "Draft", value: formatNumber(services.filter((s) => s.status === "draft").length), icon: Clock },
          { title: "Inactive", value: formatNumber(services.filter((s) => s.status === "inactive").length), icon: XCircle },
          { title: "Categories", value: formatNumber(categories.length), icon: Layers },
        ]}
      />

      <AdminFilterBar
        tabs={[
          { key: "all", label: "All Services", icon: Briefcase, count: services.length },
          ...categories.map((category) => ({
            key: category,
            label: category.replace(/-/g, " "),
            icon: Tag,
            count: services.filter((s) => s.category === category).length,
          })),
        ]}
        tabValue={categoryFilter}
        onTabChange={setCategoryFilter}
        search={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search services by title, description or category..."
        selects={[
          {
            value: statusFilter,
            onValueChange: setStatusFilter,
            placeholder: "Filter by status",
            allLabel: "All Statuses",
            options: [
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "draft", label: "Draft" },
            ],
          },
        ]}
      />

      <AdminTable
        columns={columns}
        data={filteredServices}
        rowKey={(service) => service.id}
        actions={actions}
        onRowClick={handleViewService}
        emptyIcon={Briefcase}
        emptyTitle="No services found"
        emptyDescription={
          searchQuery || statusFilter !== "all" || categoryFilter !== "all"
            ? "Try adjusting your search criteria or category filter"
            : "Get started by creating your first service offering"
        }
        footer={
          !searchQuery && statusFilter === "all" && categoryFilter === "all" && filteredServices.length === 0 ? (
            <tr>
              <td colSpan={columns.length + actions.length} className="py-4 text-center">
                <Button
                  onClick={() => {
                    resetForm()
                    setIsCreateModalOpen(true)
                  }}
                  className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl shadow-md"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </td>
            </tr>
          ) : undefined
        }
      />

      <AdminDetailModal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        icon={Briefcase}
        title={viewingService?.title || "Service Details"}
        subtitle={
          viewingService
            ? `Service ID: #${viewingService.id.slice(0, 12)} • Order Index: ${viewingService.order_index ?? 0}`
            : undefined
        }
        badge={viewingService && <AdminStatusBadge status={viewingService.status} />}
        size="xl"
        headerActions={
          viewingService && (
            <Button
              size="sm"
              variant="outline"
              asChild
              className="rounded-xl font-bold h-10 px-4 border-2"
            >
              <a href="/services" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1.5" />
                View on Site
              </a>
            </Button>
          )
        }
        sections={[
          {
            key: "overview",
            title: "Service Overview",
            icon: FileText,
            span: 2,
            content: viewingService && (
              <div className="space-y-3">
                {viewingService.price_range && (
                  <p className="text-sm font-black">{viewingService.price_range}</p>
                )}
                {viewingService.short_description && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1">Summary</p>
                    <p className="text-sm font-semibold leading-relaxed">{viewingService.short_description}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1">Detailed Description</p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap opacity-85">
                    {viewingService.description || "No full description provided for this service."}
                  </p>
                </div>
              </div>
            ),
          },
          {
            key: "features",
            title: `Included Features & Scope (${viewingService?.features?.length || 0})`,
            icon: Layers,
            span: 2,
            content:
              viewingService?.features && viewingService.features.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {viewingService.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs font-bold">
                      <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs opacity-60 italic">No features defined yet.</p>
              ),
          },
          ...(viewingService?.meta_title || viewingService?.meta_description
            ? [
                {
                  key: "seo",
                  title: "SEO & Metadata Details",
                  icon: Sparkles,
                  span: 2 as const,
                  content: (
                    <div className="space-y-2 text-xs">
                      {viewingService?.meta_title && (
                        <p className="font-semibold">
                          <strong>Meta Title:</strong> {viewingService.meta_title}
                        </p>
                      )}
                      {viewingService?.meta_description && (
                        <p className="opacity-80">
                          <strong>Meta Description:</strong> {viewingService.meta_description}
                        </p>
                      )}
                    </div>
                  ),
                },
              ]
            : []),
          {
            key: "configuration",
            title: "Configuration Details",
            icon: Clock,
            fields: [
              { label: "Category", value: <span className="capitalize">{viewingService?.category?.replace(/-/g, " ")}</span> },
              { label: "Status", value: <AdminStatusBadge status={viewingService?.status} /> },
              { label: "Price Range", value: viewingService?.price_range || "Flexible" },
              { label: "Icon Identifier", value: <AdminPill>{viewingService?.icon || "code"}</AdminPill> },
              { label: "Display Order", value: viewingService?.order_index ?? 0 },
            ],
          },
          {
            key: "identifiers",
            title: "Media & Search Identifiers",
            icon: Tag,
            fields: [
              { label: "Image URL", value: viewingService?.image_url || "—" },
              { label: "Meta Title", value: viewingService?.meta_title || "—" },
              { label: "Meta Description", value: viewingService?.meta_description || "—" },
            ],
          },
        ]}
        onEdit={() => {
          if (viewingService) {
            setIsViewModalOpen(false)
            handleEdit(viewingService)
          }
        }}
        editLabel="Edit Service"
        onDelete={() => {
          if (viewingService) {
            setServiceToDelete(viewingService.id)
          }
        }}
        deleteLabel="Delete Service"
      />

      <AdminFormModal
        open={isCreateModalOpen}
        onOpenChange={(open) => {
          if (!open) closeForm()
          else setIsCreateModalOpen(true)
        }}
        icon={Briefcase}
        title={editingService ? "Edit Service" : "Create New Service"}
        description={
          editingService
            ? "Update service details, deliverables and pricing"
            : "Add a new digital service offering to your portfolio"
        }
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        isEdit={!!editingService}
        createLabel="Create Service"
        editLabel="Update Service"
        size="lg"
      >
        <AdminFormGrid>
          <AdminFormField label="Service Title" required>
            <AdminInput
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              required
              placeholder="e.g., Custom Web Application"
            />
          </AdminFormField>
          <AdminFormField label="Category" required>
            <AdminSelect
              value={formData.category}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
              options={categories.map((category) => ({
                value: category,
                label: category.charAt(0).toUpperCase() + category.slice(1).replace("-", " "),
              }))}
            />
          </AdminFormField>
        </AdminFormGrid>

        <AdminFormField label="Short Summary">
          <AdminInput
            value={formData.short_description}
            onChange={(e) => setFormData((prev) => ({ ...prev, short_description: e.target.value }))}
            placeholder="Brief one-line summary for cards and search"
          />
        </AdminFormField>

        <AdminFormField label="Detailed Description">
          <AdminTextarea
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            rows={3}
            placeholder="Comprehensive service description and workflow breakdown..."
          />
        </AdminFormField>

        <AdminFormGrid>
          <AdminFormField label="Price Range / Estimate">
            <AdminInput
              value={formData.price_range}
              onChange={(e) => setFormData((prev) => ({ ...prev, price_range: e.target.value }))}
              placeholder="e.g., TZS 500,000 - 2,000,000"
            />
          </AdminFormField>
          <AdminFormField label="Status">
            <AdminSelect
              value={formData.status}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, status: value as ServiceFormData["status"] }))
              }
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
                { value: "draft", label: "Draft" },
              ]}
            />
          </AdminFormField>
        </AdminFormGrid>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider">Service Deliverables / Features</p>
            <span className="text-xs opacity-80 font-bold">{formData.features.length} item(s)</span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto p-1">
            {formData.features.map((feature, index) => (
              <div key={index} className="flex gap-2">
                <AdminInput
                  value={feature}
                  onChange={(e) => updateFeature(index, e.target.value)}
                  placeholder="e.g., Responsive Design, SEO Optimization, 1 Year Support"
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
            className="w-full rounded-xl border-2 font-bold h-10 border-dashed"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Feature Deliverable
          </Button>
        </div>

        <AdminFormGrid>
          <AdminFormField label="Image URL">
            <AdminInput
              value={formData.image_url}
              onChange={(e) => setFormData((prev) => ({ ...prev, image_url: e.target.value }))}
              placeholder="https://..."
            />
          </AdminFormField>
          <AdminFormField label="Icon Identifier">
            <AdminInput
              value={formData.icon}
              onChange={(e) => setFormData((prev) => ({ ...prev, icon: e.target.value }))}
              placeholder="code"
            />
          </AdminFormField>
          <AdminFormField label="Display Order">
            <AdminInput
              type="number"
              value={formData.order_index}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, order_index: Number(e.target.value) }))
              }
            />
          </AdminFormField>
          <AdminFormField label="Meta Title">
            <AdminInput
              value={formData.meta_title}
              onChange={(e) => setFormData((prev) => ({ ...prev, meta_title: e.target.value }))}
            />
          </AdminFormField>
        </AdminFormGrid>
        <AdminFormField label="Meta Description">
          <AdminTextarea
            value={formData.meta_description}
            onChange={(e) => setFormData((prev) => ({ ...prev, meta_description: e.target.value }))}
            rows={2}
          />
        </AdminFormField>
      </AdminFormModal>

      <AdminConfirmDialog
        open={!!serviceToDelete}
        onOpenChange={(open) => {
          if (!open) setServiceToDelete(null)
        }}
        title="Delete Service"
        description="Are you sure you want to delete this service? This action cannot be undone."
        confirmLabel="Delete Service"
        isSubmitting={isDeleting}
        onConfirm={() => {
          if (serviceToDelete) performDelete(serviceToDelete)
        }}
      />
    </div>
  )
}
