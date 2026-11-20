"use client"

import { useState, useEffect } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import AdminLoading from "@/components/admin/admin-loading"
import {
  AdminPageHeader,
  AdminStats,
  AdminFilterBar,
  AdminTable,
  AdminPrimaryCell,
  AdminPill,
  AdminTag,
  AdminMutedText,
  AdminStatusBadge,
  AdminBooleanBadge,
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
  type AdminStatItem,
  type AdminFilterTab,
  type AdminSelectFilter,
  type AdminDetailSectionData,
} from "@/components/admin/ui"
import { getBlogs, createBlog, updateBlog, deleteBlog } from "@/lib/blogs-actions"
import type { Blog } from "@/types/database"
import {
  PenTool,
  FileText,
  CheckCircle,
  Edit,
  Clock,
  BarChart3,
  Eye,
  ExternalLink,
  Trash2,
  Plus,
} from "lucide-react"

interface BlogFormData {
  title: string
  content: string
  excerpt: string
  author: string
  category: string
  tags: string[]
  status: "draft" | "published" | "scheduled"
  featured_image: string
  scheduled_at: string
  featured: boolean
  allow_comments: boolean
  meta_title: string
  meta_description: string
  meta_keywords: string
  slug?: string
}

const CATEGORIES = [
  "Technology",
  "Design",
  "Development",
  "Mobile Development",
  "Business",
  "Tutorial"
]

const STATUSES: Array<{ value: BlogFormData["status"]; label: string }> = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "scheduled", label: "Scheduled" }
]

const EMPTY_FORM: BlogFormData = {
  title: "",
  content: "",
  excerpt: "",
  author: "",
  category: "",
  tags: [],
  status: "draft",
  featured_image: "",
  scheduled_at: "",
  featured: false,
  allow_comments: true,
  meta_title: "",
  meta_description: "",
  meta_keywords: "",
  slug: ""
}

export default function BlogsManagement() {
  const { toast } = useToast()

  const [blogs, setBlogs] = useState<Blog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null)
  const [selectedViewBlog, setSelectedViewBlog] = useState<Blog | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Blog | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")

  const [formData, setFormData] = useState<BlogFormData>(EMPTY_FORM)

  const loadBlogs = async () => {
    setIsLoading(true)
    try {
      const result = await getBlogs()
      if (result.error) {
        throw new Error(result.error)
      }
      setBlogs(result.data || [])
    } catch (error) {
      console.error("Error fetching blogs:", error)
      toast({
        title: "Error",
        description: "Failed to load blogs",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadBlogs()
  }, [])

  const generateSlug = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")

  const resetForm = () => setFormData({ ...EMPTY_FORM, tags: [] })

  const handleCreateBlog = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const result = await createBlog({
        ...formData,
        slug: formData.slug || generateSlug(formData.title),
        reading_time: 0,
        view_count: 0
      })
      if (result.error) throw new Error(result.error)

      toast({ title: "Success", description: "Blog created successfully" })
      setIsCreateOpen(false)
      resetForm()
      loadBlogs()
    } catch {
      toast({ title: "Error", description: "Failed to create blog", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateBlog = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedBlog) return
    setIsSubmitting(true)

    try {
      const result = await updateBlog(selectedBlog.id, {
        ...formData,
        slug: formData.slug || generateSlug(formData.title)
      })
      if (result.error) throw new Error(result.error)

      toast({ title: "Success", description: "Blog updated successfully" })
      setIsEditOpen(false)
      setSelectedBlog(null)
      resetForm()
      loadBlogs()
    } catch {
      toast({ title: "Error", description: "Failed to update blog", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePublish = async (blog: Blog) => {
    try {
      const result = await updateBlog(blog.id, { status: "published" })
      if (result.error) throw new Error(result.error)
      toast({ title: "Success", description: "Blog published successfully" })
      setSelectedViewBlog((current) =>
        current?.id === blog.id ? { ...current, status: "published" } : current
      )
      loadBlogs()
    } catch {
      toast({ title: "Error", description: "Failed to publish blog", variant: "destructive" })
    }
  }

  const handleDelete = async () => {
    const blog = deleteTarget
    if (!blog) return
    setIsDeleting(true)

    try {
      await deleteBlog(blog.id)
      toast({ title: "Success", description: "Blog deleted successfully" })
      setDeleteTarget(null)
      setSelectedViewBlog((current) => (current?.id === blog.id ? null : current))
      setSelectedBlog((current) => (current?.id === blog.id ? null : current))
      loadBlogs()
    } catch {
      toast({ title: "Error", description: "Failed to delete blog", variant: "destructive" })
    } finally {
      setIsDeleting(false)
    }
  }

  const openEditDialog = (blog: Blog) => {
    setSelectedViewBlog(null)
    setSelectedBlog(blog)
    setFormData({
      title: blog.title,
      content: blog.content || "",
      excerpt: blog.excerpt || "",
      author: blog.author,
      category: blog.category,
      tags: blog.tags || [],
      status: blog.status,
      featured_image: blog.featured_image || "",
      scheduled_at: blog.scheduled_at || "",
      featured: blog.featured,
      allow_comments: blog.allow_comments,
      meta_title: blog.meta_title || "",
      meta_description: blog.meta_description || "",
      meta_keywords: blog.meta_keywords || "",
      slug: blog.slug || ""
    })
    setIsEditOpen(true)
  }

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString()

  const formatStatNumber = (num: number) => {
    const value = Number(num) || 0
    if (value >= 1_000_000) {
      const m = value / 1_000_000
      return m % 1 === 0 ? `${m.toFixed(0)}M` : `${m.toFixed(1)}M`
    }
    if (value >= 1_000) {
      const k = value / 1_000
      return k % 1 === 0 ? `${k.toFixed(0)}K` : `${k.toFixed(1)}K`
    }
    return value.toLocaleString()
  }

  const filteredBlogs = blogs.filter((blog) => {
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      blog.title.toLowerCase().includes(q) ||
      blog.author.toLowerCase().includes(q) ||
      (blog.tags || []).some((tag) => tag.toLowerCase().includes(q))
    const matchesStatus = statusFilter === "all" || blog.status === statusFilter
    const matchesCategory = categoryFilter === "all" || blog.category === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  })

  const totalViews = blogs.reduce((sum, blog) => sum + (blog.view_count || 0), 0)

  const stats: AdminStatItem[] = [
    { title: "Total Posts", value: formatStatNumber(blogs.length), icon: FileText },
    { title: "Published", value: formatStatNumber(blogs.filter((b) => b.status === "published").length), icon: CheckCircle },
    { title: "Drafts", value: formatStatNumber(blogs.filter((b) => b.status === "draft").length), icon: Edit },
    { title: "Scheduled", value: formatStatNumber(blogs.filter((b) => b.status === "scheduled").length), icon: Clock },
    { title: "Total Views", value: formatStatNumber(totalViews), icon: BarChart3 }
  ]

  const categories = Array.from(new Set(blogs.map((blog) => blog.category).filter(Boolean)))
  const categoryTabs: AdminFilterTab[] = [
    { key: "all", label: "All Posts", icon: FileText, count: blogs.length },
    ...categories.map((category) => ({
      key: category,
      label: category,
      count: blogs.filter((blog) => blog.category === category).length
    }))
  ]

  const statusSelect: AdminSelectFilter = {
    value: statusFilter,
    onValueChange: setStatusFilter,
    placeholder: "Status",
    allLabel: "All Status",
    options: STATUSES
  }

  const columns: AdminTableColumn<Blog>[] = [
    {
      key: "post",
      header: "Post",
      render: (blog) => (
        <AdminPrimaryCell
          icon={PenTool}
          title={blog.title}
          subtitle={<span className="font-mono">/{blog.slug}</span>}
        />
      )
    },
    {
      key: "author",
      header: "Author",
      hidden: "md",
      render: (blog) => <span className="text-xs font-semibold">{blog.author}</span>
    },
    {
      key: "category",
      header: "Category",
      hidden: "sm",
      render: (blog) => <AdminPill title={blog.category}>{blog.category}</AdminPill>
    },
    {
      key: "status",
      header: "Status",
      render: (blog) => <AdminStatusBadge status={blog.status} />
    },
    {
      key: "date",
      header: "Date",
      hidden: "md",
      render: (blog) => (
        <span className="text-xs font-medium whitespace-nowrap">
          {formatDate(blog.published_at || blog.created_at)}
        </span>
      )
    },
    {
      key: "views",
      header: "Views",
      hidden: "sm",
      align: "center",
      render: (blog) => <span className="text-xs font-black">{blog.view_count || 0}</span>
    }
  ]

  const actions: AdminTableAction<Blog>[] = [
    {
      key: "view",
      label: "View Post Details",
      icon: Eye,
      variant: "view",
      onClick: (blog) => setSelectedViewBlog(blog)
    },
    {
      key: "published",
      label: "View published post",
      icon: ExternalLink,
      variant: "soft",
      mobile: false,
      hide: (blog) => blog.status !== "published" || !blog.slug,
      href: (blog) => `/blog/${blog.slug}`
    },
    {
      key: "publish",
      label: "Publish Post",
      icon: CheckCircle,
      variant: "soft",
      hide: (blog) => blog.status === "published",
      onClick: (blog) => handlePublish(blog)
    },
    {
      key: "edit",
      label: "Edit post",
      icon: Edit,
      variant: "edit",
      onClick: (blog) => openEditDialog(blog)
    },
    {
      key: "delete",
      label: "Delete post",
      icon: Trash2,
      variant: "danger-soft",
      onClick: (blog) => setDeleteTarget(blog)
    }
  ]

  const detailSections = (blog: Blog): AdminDetailSectionData[] => [
    {
      key: "metadata",
      title: "Post Metadata",
      icon: FileText,
      span: 1,
      fields: [
        { label: "Title", value: blog.title },
        { label: "URL Slug", value: <span className="font-mono">/{blog.slug}</span> },
        { label: "Author", value: blog.author },
        { label: "Category", value: blog.category },
        { label: "Status", value: <AdminStatusBadge status={blog.status} /> },
        { label: "Featured", value: <AdminBooleanBadge value={blog.featured} /> },
        { label: "Comments", value: <AdminBooleanBadge value={blog.allow_comments} /> },
        { label: "Reading Time", value: `${blog.reading_time || 0} min` },
        { label: "Views", value: formatStatNumber(blog.view_count || 0) }
      ]
    },
    {
      key: "publishing",
      title: "Publishing & SEO",
      icon: CheckCircle,
      span: 1,
      fields: [
        { label: "Published", value: blog.published_at ? formatDate(blog.published_at) : "—" },
        { label: "Scheduled", value: blog.scheduled_at ? formatDate(blog.scheduled_at) : "—" },
        { label: "Created", value: formatDate(blog.created_at) },
        { label: "Updated", value: formatDate(blog.updated_at) },
        { label: "Meta Title", value: blog.meta_title || "—" },
        { label: "Meta Description", value: blog.meta_description || "—" }
      ]
    },
    {
      key: "summary",
      title: "Excerpt & Tags",
      icon: PenTool,
      span: 1,
      content: (
        <div className="space-y-2">
          <p className="text-xs leading-relaxed whitespace-pre-wrap">
            {blog.excerpt || "No excerpt provided for this post."}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(blog.tags || []).length > 0 ? (
              blog.tags!.map((tag) => <AdminTag key={tag} title={tag}>{tag}</AdminTag>)
            ) : (
              <AdminMutedText>No tags assigned</AdminMutedText>
            )}
          </div>
        </div>
      )
    },
    {
      key: "content",
      title: "Post Content",
      icon: FileText,
      span: 3,
      content: (
        <pre className="text-xs leading-relaxed whitespace-pre-wrap font-sans max-h-72 overflow-y-auto">
          {blog.content || "No content has been written for this post yet."}
        </pre>
      )
    }
  ]

  const renderFormFields = () => (
    <>
      <AdminFormGrid>
        <AdminFormField label="Title" required>
          <AdminInput
            required
            placeholder="Enter blog post title"
            value={formData.title}
            onChange={(event) => {
              const title = event.target.value
              setFormData((current) => ({
                ...current,
                title,
                slug: !selectedBlog && !current.slug ? generateSlug(title) : current.slug
              }))
            }}
          />
        </AdminFormField>
        <AdminFormField label="URL Slug">
          <AdminInput
            monospace
            placeholder="url-friendly-slug"
            value={formData.slug || ""}
            onChange={(event) => setFormData((current) => ({ ...current, slug: event.target.value }))}
          />
        </AdminFormField>
      </AdminFormGrid>

      <AdminFormField label="Excerpt">
        <AdminTextarea
          rows={3}
          placeholder="Brief description of the blog post..."
          value={formData.excerpt}
          onChange={(event) => setFormData((current) => ({ ...current, excerpt: event.target.value }))}
        />
      </AdminFormField>

      <AdminFormField label="Content (Markdown)" required>
        <AdminTextarea
          required
          rows={10}
          className="font-mono"
          placeholder="Write your blog post content in Markdown..."
          value={formData.content}
          onChange={(event) => setFormData((current) => ({ ...current, content: event.target.value }))}
        />
      </AdminFormField>

      <AdminFormGrid>
        <AdminFormField label="Author" required>
          <AdminInput
            required
            placeholder="Author name"
            value={formData.author}
            onChange={(event) => setFormData((current) => ({ ...current, author: event.target.value }))}
          />
        </AdminFormField>
        <AdminFormField label="Category" required>
          <AdminSelect
            value={formData.category}
            onValueChange={(value) => setFormData((current) => ({ ...current, category: value }))}
            placeholder="Select category"
            options={CATEGORIES.map((category) => ({ value: category, label: category }))}
          />
        </AdminFormField>
        <AdminFormField label="Status">
          <AdminSelect
            value={formData.status}
            onValueChange={(value) =>
              setFormData((current) => ({ ...current, status: value as BlogFormData["status"] }))
            }
            options={STATUSES}
          />
        </AdminFormField>
      </AdminFormGrid>

      <AdminFormField label="Tags (comma-separated)">
        <AdminInput
          placeholder="web development, react, javascript"
          value={formData.tags.join(", ")}
          onChange={(event) =>
            setFormData((current) => ({
              ...current,
              tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean)
            }))
          }
        />
      </AdminFormField>

      <AdminFormGrid>
        <AdminFormField label="Featured Image URL">
          <AdminInput
            placeholder="https://example.com/image.jpg"
            value={formData.featured_image}
            onChange={(event) =>
              setFormData((current) => ({ ...current, featured_image: event.target.value }))
            }
          />
        </AdminFormField>
        <AdminFormField label="Scheduled Date">
          <AdminInput
            type="datetime-local"
            value={formData.scheduled_at}
            onChange={(event) =>
              setFormData((current) => ({ ...current, scheduled_at: event.target.value }))
            }
          />
        </AdminFormField>
      </AdminFormGrid>

      <AdminFormField label="Visibility Options">
        <div className="flex flex-wrap gap-5 pt-1">
          <label className="flex items-center gap-2 text-xs font-bold">
            <Checkbox
              checked={formData.featured}
              onCheckedChange={(checked) =>
                setFormData((current) => ({ ...current, featured: !!checked }))
              }
            />
            Featured Post
          </label>
          <label className="flex items-center gap-2 text-xs font-bold">
            <Checkbox
              checked={formData.allow_comments}
              onCheckedChange={(checked) =>
                setFormData((current) => ({ ...current, allow_comments: !!checked }))
              }
            />
            Allow Comments
          </label>
        </div>
      </AdminFormField>

      <div className="space-y-3 border-t border-navy/10 dark:border-teal/20 pt-4">
        <h4 className="text-xs font-black uppercase tracking-wider">SEO Settings</h4>
        <AdminFormField label="Meta Title">
          <AdminInput
            placeholder="SEO optimized title"
            value={formData.meta_title}
            onChange={(event) =>
              setFormData((current) => ({ ...current, meta_title: event.target.value }))
            }
          />
        </AdminFormField>
        <AdminFormField label="Meta Description">
          <AdminTextarea
            rows={2}
            placeholder="SEO meta description"
            value={formData.meta_description}
            onChange={(event) =>
              setFormData((current) => ({ ...current, meta_description: event.target.value }))
            }
          />
        </AdminFormField>
        <AdminFormField label="Meta Keywords">
          <AdminInput
            placeholder="keyword1, keyword2, keyword3"
            value={formData.meta_keywords}
            onChange={(event) =>
              setFormData((current) => ({ ...current, meta_keywords: event.target.value }))
            }
          />
        </AdminFormField>
      </div>
    </>
  )

  if (isLoading) {
    return <AdminLoading />
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6 overflow-hidden">
      <AdminPageHeader
        title="Blog"
        accent="Management"
        subtitle="Create, publish, edit, and organize insights, articles, and blog content"
        icon={PenTool}
        onRefresh={loadBlogs}
        refreshing={isLoading}
        onAdd={() => setIsCreateOpen(true)}
        addLabel="New Post"
      />

      <AdminStats items={stats} columns={5} />

      <AdminFilterBar
        tabs={categoryTabs}
        tabValue={categoryFilter}
        onTabChange={setCategoryFilter}
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search posts by title, author, or tags..."
        selects={[statusSelect]}
      />

      <AdminTable
        columns={columns}
        data={filteredBlogs}
        rowKey={(blog) => blog.id}
        actions={actions}
        emptyIcon={PenTool}
        emptyTitle="No blog posts found"
        emptyDescription={
          searchTerm || statusFilter !== "all" || categoryFilter !== "all"
            ? "Try adjusting your search query, status, or category filters."
            : "Get started by publishing your first blog article."
        }
      />

      <AdminDetailModal
        open={!!selectedViewBlog}
        onOpenChange={(open) => !open && setSelectedViewBlog(null)}
        icon={PenTool}
        title={selectedViewBlog ? selectedViewBlog.title : ""}
        badge={selectedViewBlog && <AdminStatusBadge status={selectedViewBlog.status} />}
        subtitle={
          selectedViewBlog &&
          `/${selectedViewBlog.slug} • by ${selectedViewBlog.author} • ${selectedViewBlog.category}`
        }
        sections={selectedViewBlog ? detailSections(selectedViewBlog) : []}
        size="xl"
        onEdit={selectedViewBlog ? () => openEditDialog(selectedViewBlog) : undefined}
        editLabel="Edit Post"
        footerActions={
          selectedViewBlog?.status === "published" && selectedViewBlog.slug ? (
            <a
              href={`/blog/${selectedViewBlog.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 px-5 gap-1.5 shadow-md inline-flex items-center text-xs"
            >
              <ExternalLink className="w-4 h-4 text-teal" />
              View Published Post
            </a>
          ) : undefined
        }
      />

      <AdminFormModal
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open)
          if (!open) resetForm()
        }}
        icon={Plus}
        title="Create New Blog Post"
        description="Write and publish a new blog post"
        onSubmit={handleCreateBlog}
        isSubmitting={isSubmitting}
        createLabel="Create Post"
        size="lg"
      >
        {renderFormFields()}
      </AdminFormModal>

      <AdminFormModal
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open)
          if (!open) {
            setSelectedBlog(null)
            resetForm()
          }
        }}
        icon={Edit}
        title="Edit Blog Post"
        description="Update blog post content and settings"
        onSubmit={handleUpdateBlog}
        isSubmitting={isSubmitting}
        isEdit
        editLabel="Update Post"
        size="lg"
      >
        {renderFormFields()}
      </AdminFormModal>

      <AdminConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete blog post?"
        description={
          deleteTarget
            ? `This will permanently delete “${deleteTarget.title}”. This action cannot be undone.`
            : undefined
        }
        confirmLabel="Delete Post"
        onConfirm={handleDelete}
        isSubmitting={isDeleting}
      />
    </div>
  )
}
