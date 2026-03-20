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
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [filteredBlogs, setFilteredBlogs] = useState<Blog[]>([])
  const [isLoading, setIsLoading] = useState(true)
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

  useEffect(() => {
    loadBlogs()
  }, [])

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

  // Filter blogs based on search and filter criteria
  useEffect(() => {
    let filtered = blogs

    if (searchTerm) {
      filtered = filtered.filter(blog =>
        blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(blog => blog.status === statusFilter)
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(blog => blog.category === categoryFilter)
    }

    setFilteredBlogs(filtered)
  }, [blogs, searchTerm, statusFilter, categoryFilter])

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const submitData = {
        ...formData,
        slug: formData.slug || generateSlug(formData.title),
        reading_time: formData.content ? Math.ceil(formData.content.split(/\s+/).length / 200) : 0,
        view_count: 0
      }

      if (selectedBlog) {
        const result = await updateBlog(selectedBlog.id, submitData)
        if (result.error) {
          throw new Error(result.error)
        }
        toast({
          title: "Success",
          description: "Blog updated successfully"
        })
        setIsEditDialogOpen(false)
        setSelectedBlog(null)
      } else {
        const result = await createBlog(submitData)
        if (result.error) {
          throw new Error(result.error)
        }
        toast({
          title: "Success",
          description: "Blog created successfully"
        })
        setIsAddDialogOpen(false)
      }
      
      resetForm()
      await loadBlogs()
    } catch (error: any) {
      console.error("Error saving blog:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save blog",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog?")) return

    try {
      const result = await deleteBlog(id)
      if (result.error) {
        throw new Error(result.error)
      }
      toast({
        title: "Success",
        description: "Blog deleted successfully"
      })
      await loadBlogs()
    } catch (error: any) {
      console.error("Error deleting blog:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete blog",
        variant: "destructive"
      })
    }
  }

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

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Blog Management</h1>
          <p className="text-sm sm:text-base text-gray-600">Create and manage your blog content</p>
        </div>
        <AdminLoading message="Loading blogs..." size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Posts</p>
              <p className="text-2xl font-bold text-blue-700">{blogs.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-green-600 font-medium">Published</p>
              <p className="text-2xl font-bold text-green-700">{blogs.filter(b => b.status === 'published').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Edit className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-sm text-yellow-600 font-medium">Drafts</p>
              <p className="text-2xl font-bold text-yellow-700">{blogs.filter(b => b.status === 'draft').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-pink-50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-pink-500" />
            <div>
              <p className="text-sm text-pink-600 font-medium">Scheduled</p>
              <p className="text-2xl font-bold text-pink-700">{blogs.filter(b => b.status === 'scheduled').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-sm text-purple-600 font-medium">Total Views</p>
              <p className="text-2xl font-bold text-purple-700">{blogs.reduce((sum, b) => sum + (b.view_count || 0), 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b">
        {["All Posts", ...Array.from(new Set(blogs.map(b => b.category).filter(Boolean)))].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat === "All Posts" ? "all" : cat)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              (cat === "All Posts" && categoryFilter === "all") || categoryFilter === cat
                ? "text-red-500 border-red-500"
                : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search & Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="default">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Technology">Technology</SelectItem>
            <SelectItem value="Design">Design</SelectItem>
            <SelectItem value="Development">Development</SelectItem>
            <SelectItem value="Mobile Development">Mobile Development</SelectItem>
            <SelectItem value="Business">Business</SelectItem>
            <SelectItem value="Tutorial">Tutorial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Header Row */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          All Posts <span className="text-gray-400 font-normal">({filteredBlogs.length})</span>
        </h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-navy hover:bg-navy/90" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              + New Post
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
      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">POST</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">AUTHOR</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">CATEGORY</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">STATUS</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">DATE</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">VIEWS</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredBlogs.map((blog) => (
              <tr key={blog.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900 line-clamp-1">{blog.title}</p>
                    <p className="text-xs text-gray-400">/{blog.slug}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{blog.author}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline">{blog.category}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={getStatusBadgeVariant(blog.status)}>{blog.status}</Badge>
                </td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  {blog.published_at ? formatDate(blog.published_at) : formatDate(blog.created_at)}
                </td>
                <td className="px-4 py-3 text-gray-600">{blog.view_count}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    {blog.status === 'published' && blog.slug && (
                      <Button size="icon" variant="ghost" asChild className="h-8 w-8 text-gray-500 hover:text-blue-600">
                        <a href={`/blog/${blog.slug}`} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500 hover:text-amber-600" onClick={() => openEditDialog(blog)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500 hover:text-red-600" onClick={() => handleDelete(blog.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredBlogs.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <PenTool className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No blog posts found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
                ? "Try adjusting your filters to see more posts."
                : "Get started by creating your first blog post."}
            </p>
            {(!searchTerm && statusFilter === "all" && categoryFilter === "all") && (
              <Button onClick={() => setIsAddDialogOpen(true)} className="bg-navy hover:bg-navy/90">
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
