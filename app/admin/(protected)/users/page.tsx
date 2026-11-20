"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import {
  getAuthUsers,
  getUserStats,
  deleteAuthUser,
  updateAuthUserMetadata,
  inviteUser,
  resendConfirmation,
  type AuthUser,
  type UserStats,
} from "@/lib/auth-users-actions"
import AdminLoading from "@/components/admin/admin-loading"
import {
  Users,
  Plus,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Calendar,
  Mail,
  RefreshCw,
  Eye,
  Shield,
  IdCard,
} from "lucide-react"
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
  AdminSelect,
  AdminConfirmDialog,
  type AdminTableColumn,
  type AdminTableAction,
} from "@/components/admin/ui"

const ROLE_OPTIONS = [
  { value: "customer", label: "Customer" },
  { value: "admin", label: "Administrator" },
  { value: "staff", label: "Staff / Moderator" },
]

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AuthUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<AuthUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null)
  const [viewingUser, setViewingUser] = useState<AuthUser | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<AuthUser | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const { toast } = useToast()

  // Form states
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteMetadata, setInviteMetadata] = useState({
    firstName: "",
    lastName: "",
    role: "customer",
  })
  const [isUpdating, setIsUpdating] = useState(false)
  const [editMetadata, setEditMetadata] = useState({
    firstName: "",
    lastName: "",
    role: "customer",
  })

  const loadUsers = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [usersResult, statsResult] = await Promise.all([
        getAuthUsers(),
        getUserStats(),
      ])

      if (usersResult.error) {
        throw new Error(usersResult.error)
      }

      setUsers(usersResult.users)
      setFilteredUsers(usersResult.users)
      setUserStats(statsResult.stats)
    } catch (err: any) {
      console.error("Error loading users:", err)
      setError(err.message || "Failed to load users")
      toast({
        title: "Error",
        description: "Failed to load users from database",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  // Filter users based on search term and status
  useEffect(() => {
    let filtered = users

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (user) =>
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.user_metadata?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.user_metadata?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.user_metadata?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.user_metadata?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((user) => {
        const isVerified = Boolean(user.email_confirmed_at)
        if (statusFilter === "verified") return isVerified
        if (statusFilter === "unverified") return !isVerified
        return true
      })
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, statusFilter])

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail) return

    try {
      const result = await inviteUser(inviteEmail, inviteMetadata)

      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: "Success",
        description: `Invitation sent to ${inviteEmail}`,
      })

      setIsInviteDialogOpen(false)
      setInviteEmail("")
      setInviteMetadata({ firstName: "", lastName: "", role: "customer" })
      loadUsers() // Refresh list
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to invite user",
        variant: "destructive",
      })
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    try {
      setIsUpdating(true)
      const fullName = `${editMetadata.firstName} ${editMetadata.lastName}`.trim()

      const result = await updateAuthUserMetadata(selectedUser.id, {
        user_metadata: {
          ...selectedUser.user_metadata,
          firstName: editMetadata.firstName,
          lastName: editMetadata.lastName,
          full_name: fullName,
          role: editMetadata.role,
        },
        app_metadata: {
          ...selectedUser.app_metadata,
          role: editMetadata.role,
        },
      })

      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: "Success",
        description: `User updated successfully (Role: ${editMetadata.role})`,
      })

      // Immediately update local state optimistically
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === selectedUser.id) {
            return {
              ...u,
              role: editMetadata.role,
              user_metadata: {
                ...u.user_metadata,
                firstName: editMetadata.firstName,
                lastName: editMetadata.lastName,
                full_name: fullName,
                role: editMetadata.role,
              },
              app_metadata: {
                ...u.app_metadata,
                role: editMetadata.role,
              },
            }
          }
          return u
        })
      )

      setIsEditDialogOpen(false)
      loadUsers() // Refresh list in background
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update user",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const performDeleteUser = async (userId: string) => {
    setIsDeleting(true)
    try {
      const result = await deleteAuthUser(userId)

      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: "Success",
        description: `User deleted successfully`,
      })

      setUserToDelete(null)
      setIsViewOpen(false)
      loadUsers() // Refresh list
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete user",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleResendConfirmation = async (userId: string) => {
    try {
      const result = await resendConfirmation(userId)

      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: "Success",
        description: `Confirmation email sent successfully`,
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to resend confirmation",
        variant: "destructive",
      })
    }
  }

  const getDisplayName = (user: AuthUser) => {
    if (user.user_metadata?.firstName && user.user_metadata?.lastName) {
      return `${user.user_metadata.firstName} ${user.user_metadata.lastName}`
    }
    if (user.user_metadata?.full_name) {
      return user.user_metadata.full_name
    }
    return user.email || "Unknown User"
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleDateString()
  }

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

  const getRole = (user: AuthUser) =>
    user.role || user.app_metadata?.role || user.user_metadata?.role || "customer"

  const openEditDialog = (user: AuthUser) => {
    setSelectedUser(user)
    setEditMetadata({
      firstName: user.user_metadata?.firstName || "",
      lastName: user.user_metadata?.lastName || "",
      role: getRole(user),
    })
    setIsEditDialogOpen(true)
  }

  if (isLoading) {
    return <AdminLoading />
  }

  if (error) {
    return (
      <div className="w-full space-y-6">
        <AdminPageHeader
          title="Users"
          accent="Management"
          subtitle="Manage customer accounts, roles, access permissions, and profiles"
          icon={Users}
        />
        <Alert className="border-2 border-brand-red bg-brand-red/10 text-brand-red rounded-xl">
          <AlertDescription className="font-bold">{error}</AlertDescription>
        </Alert>
        <Button onClick={loadUsers} className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  const columns: AdminTableColumn<AuthUser>[] = [
    {
      key: "user",
      header: "User",
      render: (user) => (
        <AdminPrimaryCell
          icon={Users}
          title={getDisplayName(user)}
          subtitle={user.email}
        />
      ),
    },
    {
      key: "provider",
      header: "Provider",
      hidden: "sm",
      render: (user) => (
        <span className="font-semibold capitalize text-xs">{user.app_metadata?.provider || "email"}</span>
      ),
    },
    {
      key: "verified",
      header: "Verified",
      hidden: "sm",
      render: (user) => (
        <AdminStatusBadge
          status={user.email_confirmed_at ? "verified" : "unverified"}
          label={user.email_confirmed_at ? "Verified" : "Unverified"}
        />
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (user) => <AdminPill className="capitalize">{getRole(user)}</AdminPill>,
    },
    {
      key: "joined",
      header: "Joined",
      hidden: "md",
      render: (user) => <span className="font-semibold text-xs">{formatDate(user.created_at)}</span>,
    },
  ]

  const actions: AdminTableAction<AuthUser>[] = [
    {
      key: "view",
      label: "View User Details",
      icon: Eye,
      variant: "view",
      onClick: (user) => {
        setViewingUser(user)
        setIsViewOpen(true)
      },
    },
    {
      key: "edit",
      label: "Edit user",
      icon: Edit,
      variant: "edit",
      onClick: openEditDialog,
    },
    {
      key: "resend",
      label: "Resend confirmation",
      icon: Mail,
      variant: "soft",
      hide: (user) => !!user.email_confirmed_at,
      onClick: (user) => handleResendConfirmation(user.id),
    },
    {
      key: "delete",
      label: "Delete user",
      icon: Trash2,
      variant: "delete",
      onClick: (user) => setUserToDelete(user),
    },
  ]

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6 overflow-hidden">
      <AdminPageHeader
        title="Users"
        accent="Management"
        subtitle="Manage customer accounts, roles, access permissions, and profiles"
        icon={Users}
        onRefresh={loadUsers}
        onAdd={() => setIsInviteDialogOpen(true)}
        addLabel="Invite User"
      />

      {userStats && (
        <AdminStats
          columns={4}
          items={[
            { title: "Total Users", value: formatNumber(userStats.totalUsers), icon: Users },
            { title: "Verified Users", value: formatNumber(userStats.verifiedUsers), icon: UserCheck },
            { title: "Unverified Users", value: formatNumber(userStats.unverifiedUsers), icon: UserX },
            { title: "Recent Signups", value: formatNumber(userStats.recentSignups), icon: Calendar },
          ]}
        />
      )}

      <AdminFilterBar
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by name, email, or role..."
        selects={[
          {
            value: statusFilter,
            onValueChange: setStatusFilter,
            placeholder: "Filter by status",
            allLabel: "All Users",
            options: [
              { value: "verified", label: "Verified Only" },
              { value: "unverified", label: "Unverified Only" },
            ],
          },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold">All Users</h2>
          <p className="text-sm font-semibold text-navy/70 dark:text-teal-400">{filteredUsers.length} users</p>
        </div>
      </div>

      <AdminTable
        columns={columns}
        data={filteredUsers}
        rowKey={(user) => user.id}
        actions={actions}
        onRowClick={(user) => {
          setViewingUser(user)
          setIsViewOpen(true)
        }}
        emptyIcon={Users}
        emptyTitle="No users found"
        emptyDescription={
          searchTerm || statusFilter !== "all"
            ? "Try adjusting your search or filter criteria"
            : "No users have been created yet"
        }
      />

      <AdminFormModal
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        icon={Users}
        title="Invite New User"
        description="Send an invitation email with a pre-configured account role"
        onSubmit={handleInviteUser}
        size="md"
        createLabel="Send Invitation"
        submitLabel="Send Invitation"
      >
        <AdminFormField label="Email Address" required>
          <AdminInput
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="user@example.com"
          />
        </AdminFormField>
        <AdminFormGrid>
          <AdminFormField label="First Name">
            <AdminInput
              value={inviteMetadata.firstName}
              onChange={(e) => setInviteMetadata((prev) => ({ ...prev, firstName: e.target.value }))}
              placeholder="John"
            />
          </AdminFormField>
          <AdminFormField label="Last Name">
            <AdminInput
              value={inviteMetadata.lastName}
              onChange={(e) => setInviteMetadata((prev) => ({ ...prev, lastName: e.target.value }))}
              placeholder="Doe"
            />
          </AdminFormField>
        </AdminFormGrid>
        <AdminFormField label="Account Role">
          <AdminSelect
            value={inviteMetadata.role}
            onValueChange={(value) => setInviteMetadata((prev) => ({ ...prev, role: value }))}
            options={ROLE_OPTIONS}
          />
        </AdminFormField>
      </AdminFormModal>

      <AdminFormModal
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        icon={Edit}
        title="Edit User Profile"
        description="Update user details, display name, and system authorization role"
        onSubmit={handleUpdateUser}
        isSubmitting={isUpdating}
        isEdit
        size="md"
        editLabel="Save User Changes"
      >
        {selectedUser && (
          <div className="p-3.5 rounded-xl border flex items-center justify-between gap-2">
            <div className="space-y-0.5 min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider opacity-75">User Account</p>
              <p className="text-sm font-black truncate">{selectedUser.email}</p>
            </div>
            <AdminPill className="capitalize">{getRole(selectedUser)}</AdminPill>
          </div>
        )}
        <AdminFormGrid>
          <AdminFormField label="First Name">
            <AdminInput
              value={editMetadata.firstName}
              onChange={(e) => setEditMetadata((prev) => ({ ...prev, firstName: e.target.value }))}
              placeholder="John"
            />
          </AdminFormField>
          <AdminFormField label="Last Name">
            <AdminInput
              value={editMetadata.lastName}
              onChange={(e) => setEditMetadata((prev) => ({ ...prev, lastName: e.target.value }))}
              placeholder="Doe"
            />
          </AdminFormField>
        </AdminFormGrid>
        <AdminFormField label="Authorization Role">
          <AdminSelect
            value={editMetadata.role}
            onValueChange={(value) => setEditMetadata((prev) => ({ ...prev, role: value }))}
            options={ROLE_OPTIONS}
          />
        </AdminFormField>
      </AdminFormModal>

      <AdminDetailModal
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        icon={Users}
        title={viewingUser ? getDisplayName(viewingUser) : "User Details"}
        subtitle={viewingUser?.email}
        badge={viewingUser && <AdminStatusBadge status={viewingUser.email_confirmed_at ? "verified" : "unverified"} label={viewingUser.email_confirmed_at ? "Verified" : "Unverified"} />}
        size="lg"
        headerActions={
          viewingUser && (
            <AdminPill className="capitalize">{getRole(viewingUser)}</AdminPill>
          )
        }
        sections={[
          {
            key: "account",
            title: "Account Identity",
            icon: IdCard,
            span: 2,
            fields: [
              { label: "Display Name", value: viewingUser ? getDisplayName(viewingUser) : "—" },
              { label: "Email", value: viewingUser?.email || "—" },
              { label: "User ID", value: <AdminMutedText className="font-mono">{viewingUser?.id || "—"}</AdminMutedText> },
              {
                label: "Authorization Role",
                value: viewingUser ? <AdminPill className="capitalize">{getRole(viewingUser)}</AdminPill> : "—",
              },
            ],
          },
          {
            key: "auth",
            title: "Authentication",
            icon: Shield,
            fields: [
              {
                label: "Email Verified",
                value: viewingUser?.email_confirmed_at ? "Verified" : "Unverified",
              },
              { label: "Provider", value: viewingUser?.app_metadata?.provider || "email" },
              { label: "Last Sign In", value: formatDate(viewingUser?.last_sign_in_at) },
              { label: "Created", value: formatDate(viewingUser?.created_at) },
            ],
          },
          {
            key: "meta",
            title: "Profile Metadata",
            icon: Calendar,
            fields: [
              { label: "First Name", value: viewingUser?.user_metadata?.firstName || "—" },
              { label: "Last Name", value: viewingUser?.user_metadata?.lastName || "—" },
              { label: "Full Name", value: viewingUser?.user_metadata?.full_name || "—" },
              { label: "Metadata Role", value: viewingUser?.user_metadata?.role || "—" },
            ],
          },
        ]}
        onEdit={() => {
          if (viewingUser) {
            setIsViewOpen(false)
            openEditDialog(viewingUser)
          }
        }}
        editLabel="Edit User"
        onDelete={() => {
          if (viewingUser) setUserToDelete(viewingUser)
        }}
        deleteLabel="Delete User"
      />

      <AdminConfirmDialog
        open={!!userToDelete}
        onOpenChange={(open) => {
          if (!open) setUserToDelete(null)
        }}
        title="Delete User"
        description={
          <>
            Are you sure you want to delete <span className="font-bold text-rose-400">{userToDelete?.email}</span>?
            This action cannot be undone.
          </>
        }
        confirmLabel="Delete User"
        isSubmitting={isDeleting}
        onConfirm={() => {
          if (userToDelete) performDeleteUser(userToDelete.id)
        }}
      />
    </div>
  )
}
