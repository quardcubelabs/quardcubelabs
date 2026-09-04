"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"
import AdminLoading from "@/components/admin/admin-loading"
import { Plus, Edit, Trash2, Search, Filter, Eye, PenTool, Calendar, ExternalLink, FileText, BarChart3, Clock, CheckCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getBlogs, createBlog, updateBlog, deleteBlog } from "@/lib/blogs-actions"
import type { Blog } from "@/types/database"

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

export default function BlogsManagement() {
  const { isDark } = useAdminTheme()
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [filteredBlogs, setFilteredBlogs] = useState<Blog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const { toast } = useToast()

  const [formData, setFormData] = useState<BlogFormData>({
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
  })

  const resetForm = () => {
    setFormData({
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
    })
  }

  const loadBlogs = async () => {
    setIsLoading(true)
    try {
      const result = await getBlogs()
      if (result.error) {
        throw new Error(result.error)
      }
      setBlogs(result.data || [])
      setFilteredBlogs(result.data || [])
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

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
  }

  const handleCreateBlog = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const result = await createBlog({
        ...formData,
        slug: formData.slug || generateSlug(formData.title),
        reading_time: 0,
        view_count: 0
      } as any)
      if (result.error) throw new Error(result.error)
      
      toast({ title: "Success", description: "Blog created successfully" })
      setIsAddDialogOpen(false)
      resetForm()
      loadBlogs()
    } catch (error) {
      toast({ title: "Error", description: "Failed to create blog", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateBlog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBlog) return
    setIsSubmitting(true)

    try {
      const result = await updateBlog(selectedBlog.id, {
        ...formData,
        slug: formData.slug || generateSlug(formData.title)
      })
      if (result.error) throw new Error(result.error)

      toast({ title: "Success", description: "Blog updated successfully" })
      setIsEditDialogOpen(false)
      setSelectedBlog(null)
      resetForm()
      loadBlogs()
    } catch (error) {
      toast({ title: "Error", description: "Failed to update blog", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = handleUpdateBlog

  const handleDeleteBlog = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog?")) return

    try {
      await deleteBlog(id)
      toast({ title: "Success", description: "Blog deleted successfully" })
      loadBlogs()
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete blog", variant: "destructive" })
    }
  }

  const handleDelete = handleDeleteBlog

  const openEditDialog = (blog: Blog) => {
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
    setIsEditDialogOpen(true)
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'published': return 'default'
      case 'draft': return 'secondary'
      case 'scheduled': return 'outline'
      default: return 'secondary'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (isLoading) return <AdminLoading />

  const totalViews = blogs.reduce((sum, b) => sum + (b.view_count || 0), 0)

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
        isDark ? "bg-[#0a1033] border-none text-white shadow-none" : "bg-teal text-navy"
      )}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black mb-1">
              Blog <span className="text-white drop-shadow-sm">Management</span>
            </h1>
            <p className={cn("text-sm sm:text-base font-semibold", isDark ? "text-teal-300" : "text-navy/90")}>
              Create, publish, edit, and organize insights, articles, and blog content
            </p>
          </div>
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 px-4 shadow-md transition-all active:scale-95"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </div>
      </div>

      {/* 2. Stats Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        {[
          { title: "Total Posts", value: formatStatNumber(blogs.length), icon: FileText },
          { title: "Published", value: formatStatNumber(blogs.filter(b => b.status === 'published').length), icon: CheckCircle },
          { title: "Drafts", value: formatStatNumber(blogs.filter(b => b.status === 'draft').length), icon: Edit },
          { title: "Scheduled", value: formatStatNumber(blogs.filter(b => b.status === 'scheduled').length), icon: Clock },
          { 
            title: "Total Views", 
            value: formatStatNumber(totalViews),
            icon: BarChart3 
          }
        ].map((stat, idx) => (
          <Card
            key={idx}
            className={cn(
              "rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer overflow-hidden",
              isDark 
                ? "bg-[#0a1033] border-none shadow-md hover:bg-[#0c1438]" 
                : "bg-white border-2 border-navy/20 shadow-sm hover:border-navy hover:shadow-md",
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
                "w-9 h-9 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
                isDark 
                  ? "bg-navy border-teal/30 text-teal group-hover:bg-navy/80" 
                  : "bg-teal-100/80 border-navy/15 text-navy group-hover:bg-teal-200"
              )}>
                <stat.icon className={cn("h-4 w-4 sm:h-5 sm:w-5 shrink-0", isDark ? "text-teal" : "")} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 3. Category & Search Filters Bar */}
      <Card className={cn(
        "rounded-2xl p-4 transition-all duration-300 space-y-3",
        isDark ? "bg-[#0a1033] border-none shadow-none" : "bg-white border-2 border-navy/20 shadow-sm"
      )}>
        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {["All Posts", ...Array.from(new Set(blogs.map(b => b.category).filter(Boolean)))].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat === "All Posts" ? "all" : cat)}
              className={cn(
                "px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200",
                (cat === "All Posts" && categoryFilter === "all") || categoryFilter === cat
                  ? "bg-navy text-white shadow-md"
                  : isDark 
                    ? "text-slate-300 hover:bg-teal-400/10 hover:text-teal-300" 
                    : "text-navy/70 hover:bg-teal-50 hover:text-navy"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal" />
            <Input
              placeholder="Search posts by title, author, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                "pl-10 h-10 rounded-xl border border-teal text-sm font-medium",
                isDark ? "bg-[#0c1438] text-white" : "bg-white text-navy"
              )}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className={cn("w-full sm:w-[160px] h-10 rounded-xl border border-teal font-bold text-xs", isDark ? "bg-[#0c1438] text-white" : "bg-white text-navy")}>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Header Row */}
      <div className="flex justify-between items-center">
        <h2 className={cn("text-base sm:text-lg font-bold", isDark ? "text-white" : "text-navy")}>
          All Posts <span className={cn("font-semibold text-xs sm:text-sm", isDark ? "text-teal-400" : "text-navy/70")}>({filteredBlogs.length})</span>
        </h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-9 px-3.5 shadow-sm" size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              New Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Blog Post</DialogTitle>
              <DialogDescription>
                Write and publish a new blog post
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => {
                      const title = e.target.value
                      setFormData({
                        ...formData, 
                        title,
                        slug: formData.slug || generateSlug(title)
                      })
                    }}
                    placeholder="Enter blog post title"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({...formData, slug: e.target.value})}
                    placeholder="url-friendly-slug"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                  placeholder="Brief description of the blog post..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="content">Content (Markdown) *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  placeholder="Write your blog post content in Markdown..."
                  rows={10}
                  className="font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="author">Author *</Label>
                  <Input
                    id="author"
                    value={formData.author}
                    onChange={(e) => setFormData({...formData, author: e.target.value})}
                    placeholder="Author name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData({...formData, category: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Development">Development</SelectItem>
                      <SelectItem value="Mobile Development">Mobile Development</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                      <SelectItem value="Tutorial">Tutorial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value: any) => setFormData({...formData, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags.join(", ")}
                  onChange={(e) => setFormData({
                    ...formData, 
                    tags: e.target.value.split(",").map(tag => tag.trim()).filter(tag => tag)
                  })}
                  placeholder="web development, react, javascript"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="featured_image">Featured Image URL</Label>
                  <Input
                    id="featured_image"
                    value={formData.featured_image}
                    onChange={(e) => setFormData({...formData, featured_image: e.target.value})}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div>
                  <Label htmlFor="scheduled_at">Scheduled Date</Label>
                  <Input
                    id="scheduled_at"
                    type="datetime-local"
                    value={formData.scheduled_at}
                    onChange={(e) => setFormData({...formData, scheduled_at: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="featured"
                    checked={formData.featured}
                    onCheckedChange={(checked) => setFormData({...formData, featured: !!checked})}
                  />
                  <Label htmlFor="featured">Featured Post</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="allow_comments"
                    checked={formData.allow_comments}
                    onCheckedChange={(checked) => setFormData({...formData, allow_comments: !!checked})}
                  />
                  <Label htmlFor="allow_comments">Allow Comments</Label>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">SEO Settings</h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="meta_title">Meta Title</Label>
                    <Input
                      id="meta_title"
                      value={formData.meta_title}
                      onChange={(e) => setFormData({...formData, meta_title: e.target.value})}
                      placeholder="SEO optimized title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="meta_description">Meta Description</Label>
                    <Textarea
                      id="meta_description"
                      value={formData.meta_description}
                      onChange={(e) => setFormData({...formData, meta_description: e.target.value})}
                      placeholder="SEO meta description"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="meta_keywords">Meta Keywords</Label>
                    <Input
                      id="meta_keywords"
                      value={formData.meta_keywords}
                      onChange={(e) => setFormData({...formData, meta_keywords: e.target.value})}
                      placeholder="keyword1, keyword2, keyword3"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="bg-navy hover:bg-navy/90">
                  Create Post
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Posts Table */}
      <Card className={cn(
        "rounded-2xl overflow-hidden shadow-sm transition-all duration-300",
        isDark ? "bg-[#060a22] border-none text-white shadow-none" : "bg-white border-2 border-navy/20 text-navy"
      )}>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 text-xs uppercase tracking-wider font-black bg-navy text-white border-navy/30">
                <th className="text-left px-4 py-3 font-black text-white">POST</th>
                <th className="text-left px-4 py-3 font-black text-white">AUTHOR</th>
                <th className="text-left px-4 py-3 font-black text-white">CATEGORY</th>
                <th className="text-left px-4 py-3 font-black text-white">STATUS</th>
                <th className="text-left px-4 py-3 font-black text-white">DATE</th>
                <th className="text-left px-4 py-3 font-black text-white">VIEWS</th>
                <th className="text-right px-4 py-3 font-black text-white">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/10 dark:divide-teal/15">
              {filteredBlogs.map((blog) => (
                <tr key={blog.id} className={cn("transition-colors duration-150 cursor-pointer", isDark ? "hover:bg-teal/30 hover:text-white" : "hover:bg-teal/50 hover:text-navy")}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border",
                        isDark ? "bg-navy text-teal border-teal/30" : "bg-navy text-teal border-navy/20"
                      )}>
                        <PenTool className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal" />
                      </div>
                      <div className="min-w-0">
                        <p className={cn("font-bold text-sm line-clamp-1", isDark ? "text-white" : "text-navy")}>{blog.title}</p>
                        <p className={cn("text-xs font-medium", isDark ? "text-slate-300" : "text-navy/60")}>/{blog.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className={cn("px-4 py-3 text-xs font-semibold", isDark ? "text-white" : "text-navy")}>{blog.author}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={cn("text-xs font-bold border", isDark ? "border-white/20 text-white bg-white/10" : "border-navy/20 text-navy bg-navy/5")}>{blog.category}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={getStatusBadgeVariant(blog.status)} className="font-bold text-xs">{blog.status}</Badge>
                  </td>
                  <td className={cn("px-4 py-3 text-xs font-medium whitespace-nowrap", isDark ? "text-slate-300" : "text-navy/70")}>
                    {blog.published_at ? formatDate(blog.published_at) : formatDate(blog.created_at)}
                  </td>
                  <td className={cn("px-4 py-3 text-xs font-black", isDark ? "text-white" : "text-navy")}>{blog.view_count || 0}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {blog.status === 'published' && blog.slug && (
                        <a 
                          href={`/blog/${blog.slug}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={cn(
                            "p-1.5 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer inline-flex items-center justify-center",
                            isDark ? "bg-white/10 text-white hover:bg-white hover:text-navy" : "bg-navy/10 text-navy hover:bg-navy hover:text-white"
                          )}
                          title="View published post"
                        >
                          <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </a>
                      )}
                      <button 
                        className={cn(
                          "p-1.5 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer",
                          isDark ? "bg-white/10 text-white hover:bg-white hover:text-navy" : "bg-navy/10 text-navy hover:bg-navy hover:text-white"
                        )}
                        onClick={() => openEditDialog(blog)}
                        title="Edit post"
                      >
                        <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                      <button 
                        className={cn(
                          "p-1.5 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer",
                          isDark ? "bg-teal/15 text-white hover:bg-teal hover:text-navy" : "bg-red-50 text-brand-red hover:bg-red-500 hover:text-white"
                        )} 
                        onClick={() => handleDelete(blog.id)}
                        title="Delete post"
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

      {filteredBlogs.length === 0 && (
        <Card className={cn("rounded-2xl transition-all duration-300", isDark ? "bg-[#0a1033] border-none text-white" : "bg-white border-2 border-navy/20 text-navy")}>
          <CardContent className="text-center py-10">
            <PenTool className="h-12 w-12 text-teal/40 mx-auto mb-3" />
            <h3 className={cn("text-base font-bold mb-1", isDark ? "text-white" : "text-navy")}>No blog posts found</h3>
            <p className={cn("text-xs font-medium mb-4 max-w-sm mx-auto", isDark ? "text-slate-400" : "text-navy/70")}>
              {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
                ? "Try adjusting your search query, status, or category filters."
                : "Get started by publishing your first blog article."}
            </p>
            {(!searchTerm && statusFilter === "all" && categoryFilter === "all") && (
              <Button onClick={() => setIsAddDialogOpen(true)} className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-9 px-4">
                <Plus className="h-4 w-4 mr-2" />
                Write Your First Post
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Blog Post</DialogTitle>
            <DialogDescription>
              Update blog post content and settings
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-title">Title *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Enter blog post title"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-slug">URL Slug</Label>
                <Input
                  id="edit-slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({...formData, slug: e.target.value})}
                  placeholder="url-friendly-slug"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-excerpt">Excerpt</Label>
              <Textarea
                id="edit-excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                placeholder="Brief description of the blog post..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit-content">Content (Markdown) *</Label>
              <Textarea
                id="edit-content"
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                placeholder="Write your blog post content in Markdown..."
                rows={10}
                className="font-mono"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-author">Author *</Label>
                <Input
                  id="edit-author"
                  value={formData.author}
                  onChange={(e) => setFormData({...formData, author: e.target.value})}
                  placeholder="Author name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Category *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData({...formData, category: value})}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Development">Development</SelectItem>
                    <SelectItem value="Mobile Development">Mobile Development</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Tutorial">Tutorial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: any) => setFormData({...formData, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
              <Input
                id="edit-tags"
                value={formData.tags.join(", ")}
                onChange={(e) => setFormData({
                  ...formData, 
                  tags: e.target.value.split(",").map(tag => tag.trim()).filter(tag => tag)
                })}
                placeholder="web development, react, javascript"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-featured_image">Featured Image URL</Label>
                <Input
                  id="edit-featured_image"
                  value={formData.featured_image}
                  onChange={(e) => setFormData({...formData, featured_image: e.target.value})}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div>
                <Label htmlFor="edit-scheduled_at">Scheduled Date</Label>
                <Input
                  id="edit-scheduled_at"
                  type="datetime-local"
                  value={formData.scheduled_at}
                  onChange={(e) => setFormData({...formData, scheduled_at: e.target.value})}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData({...formData, featured: !!checked})}
                />
                <Label htmlFor="edit-featured">Featured Post</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-allow_comments"
                  checked={formData.allow_comments}
                  onCheckedChange={(checked) => setFormData({...formData, allow_comments: !!checked})}
                />
                <Label htmlFor="edit-allow_comments">Allow Comments</Label>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">SEO Settings</h4>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="edit-meta_title">Meta Title</Label>
                  <Input
                    id="edit-meta_title"
                    value={formData.meta_title}
                    onChange={(e) => setFormData({...formData, meta_title: e.target.value})}
                    placeholder="SEO optimized title"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-meta_description">Meta Description</Label>
                  <Textarea
                    id="edit-meta_description"
                    value={formData.meta_description}
                    onChange={(e) => setFormData({...formData, meta_description: e.target.value})}
                    placeholder="SEO meta description"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-meta_keywords">Meta Keywords</Label>
                  <Input
                    id="edit-meta_keywords"
                    value={formData.meta_keywords}
                    onChange={(e) => setFormData({...formData, meta_keywords: e.target.value})}
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="bg-navy hover:bg-navy/90">
                Update Post
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
