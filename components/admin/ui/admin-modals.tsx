"use client"

import type { FormEvent, ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { AlertTriangle, CheckCircle, List, RefreshCw } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"

export type AdminModalSize = "sm" | "md" | "lg" | "xl"

const SIZE_CLASS: Record<AdminModalSize, string> = {
  sm: "sm:max-w-md",
  md: "sm:max-w-2xl",
  lg: "sm:max-w-4xl",
  xl: "sm:max-w-6xl",
}

function modalContentClass(isDark: boolean, size: AdminModalSize, className?: string) {
  return cn(
    "w-[95vw] max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-3xl border-2 shadow-2xl p-4 sm:p-6",
    SIZE_CLASS[size],
    isDark
      ? "bg-[#0a1033] border-teal/30 text-white"
      : "bg-white border-navy/20 text-navy",
    className
  )
}

function ModalHeading({
  icon: Icon,
  title,
  description,
  badge,
  className,
}: {
  icon: LucideIcon
  title: ReactNode
  description?: ReactNode
  badge?: ReactNode
  className?: string
}) {
  const { isDark } = useAdminTheme()
  return (
    <DialogHeader
      className={cn("border-b border-navy/10 dark:border-teal/20 pb-4", className)}
    >
      <DialogTitle className="text-lg sm:text-xl font-black flex items-center gap-2.5">
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border",
            isDark
              ? "bg-navy text-teal border-teal/30"
              : "bg-teal text-navy border-teal/40"
          )}
        >
          <Icon className={cn("h-4 w-4", isDark ? "text-teal" : "text-navy")} />
        </div>
        <span className="min-w-0 flex-1 truncate text-left">{title}</span>
        {badge}
      </DialogTitle>
      {description && (
        <DialogDescription
          className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/70")}
        >
          {description}
        </DialogDescription>
      )}
    </DialogHeader>
  )
}

/** Shared Dialog shell used by the detail and custom modals. */
export function AdminModalShell({
  open,
  onOpenChange,
  icon,
  title,
  description,
  badge,
  size = "md",
  bodyClassName,
  contentClassName,
  footer,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  icon: LucideIcon
  title: ReactNode
  description?: ReactNode
  badge?: ReactNode
  size?: AdminModalSize
  bodyClassName?: string
  contentClassName?: string
  footer?: ReactNode
  children: ReactNode
}) {
  const { isDark } = useAdminTheme()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={modalContentClass(isDark, size, contentClassName)}>
        <ModalHeading
          icon={icon}
          title={title}
          description={description}
          badge={badge}
        />
        <div className={cn("space-y-4 pt-2", bodyClassName)}>{children}</div>
        {footer}
      </DialogContent>
    </Dialog>
  )
}

export interface AdminDetailField {
  label: string
  value: ReactNode
}

export interface AdminDetailSectionData {
  key?: string
  title: string
  icon?: LucideIcon
  content?: ReactNode
  fields?: AdminDetailField[]
  /** Grid columns on large screens (default: 1) */
  span?: 1 | 2 | 3
}

/** Teal-tinted content card used inside detail modals. */
export function AdminDetailSection({
  title,
  icon: Icon = List,
  content,
  fields,
  span = 1,
  className,
}: AdminDetailSectionData & { className?: string }) {
  const { isDark } = useAdminTheme()
  return (
    <div
      className={cn(
        "p-5 rounded-2xl border transition-all space-y-3",
        span === 2 && "lg:col-span-2",
        span === 3 && "lg:col-span-3",
        isDark
          ? "bg-teal/15 border-teal/40 text-white"
          : "bg-teal/15 border-2 border-navy text-navy",
        className
      )}
    >
      {title && (
        <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {title}
        </h3>
      )}
      {content}
      {fields && <AdminDetailFieldList fields={fields} />}
    </div>
  )
}

export function AdminDetailFieldList({ fields }: { fields: AdminDetailField[] }) {
  return (
    <div className="space-y-3 text-xs font-medium">
      {fields.map((field) => (
        <div
          key={field.label}
          className="flex justify-between items-start gap-4"
        >
          <span className="opacity-70 shrink-0">{field.label}</span>
          <span className="font-bold text-right min-w-0 break-words">{field.value ?? "—"}</span>
        </div>
      ))}
    </div>
  )
}

/** Canonical "view details" modal — one of these is opened by every table row. */
export function AdminDetailModal({
  open,
  onOpenChange,
  icon: Icon,
  title,
  subtitle,
  badge,
  sections = [],
  fields,
  headerActions,
  children,
  footerActions,
  onEdit,
  editLabel = "Edit Record",
  onDelete,
  deleteLabel = "Delete",
  size = "lg",
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  icon: LucideIcon
  title: ReactNode
  subtitle?: ReactNode
  badge?: ReactNode
  sections?: AdminDetailSectionData[]
  fields?: AdminDetailField[]
  headerActions?: ReactNode
  children?: ReactNode
  footerActions?: ReactNode
  onEdit?: () => void
  editLabel?: string
  onDelete?: () => void
  deleteLabel?: string
  size?: AdminModalSize
}) {
  const { isDark } = useAdminTheme()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={modalContentClass(isDark, size)}>
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-navy/10 dark:border-teal/20 pb-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-inner",
                  isDark ? "bg-teal/20 text-teal" : "bg-navy text-white"
                )}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2
                    className={cn(
                      "text-xl sm:text-2xl font-black tracking-tight",
                      isDark ? "text-white" : "text-navy"
                    )}
                  >
                    {title}
                  </h2>
                  {badge}
                </div>
                {subtitle && (
                  <p
                    className={cn(
                      "text-xs sm:text-sm font-medium mt-0.5",
                      isDark ? "text-slate-300" : "text-navy/70"
                    )}
                  >
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            {headerActions && (
              <div className="flex items-center gap-2 shrink-0">{headerActions}</div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {sections.map((section, index) => (
              <AdminDetailSection key={section.key ?? `section-${index}`} {...section} />
            ))}
            {fields && (
              <AdminDetailSection
                key="record-fields"
                title="Record Details"
                icon={List}
                fields={fields}
                span={1}
              />
            )}
            {children}
          </div>

          <DialogFooter className="border-t border-navy/10 dark:border-teal/20 pt-4 flex flex-row flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className={cn(
                "rounded-xl font-bold h-10 px-5",
                isDark
                  ? "border-teal/30 text-white hover:bg-white/10"
                  : "border-navy/20 text-navy hover:bg-slate-100"
              )}
            >
              Close
            </Button>
            {footerActions}
            {onEdit && (
              <Button
                type="button"
                onClick={onEdit}
                className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 px-5 gap-1.5 shadow-md"
              >
                {editLabel}
              </Button>
            )}
            {onDelete && (
              <Button
                type="button"
                onClick={onDelete}
                className="bg-red-500/15 text-brand-red hover:bg-red-500 hover:text-white font-bold rounded-xl h-10 px-5 gap-1.5"
              >
                <AlertTriangle className="w-4 h-4" />
                {deleteLabel}
              </Button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** Canonical create/edit modal. The form wraps the body and the footer. */
export function AdminFormModal({
  open,
  onOpenChange,
  icon,
  title,
  description,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Save",
  createLabel,
  editLabel,
  isEdit = false,
  size = "md",
  children,
  footerExtra,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  icon: LucideIcon
  title: string
  description?: string
  onSubmit: (event: FormEvent) => void | Promise<void>
  isSubmitting?: boolean
  submitLabel?: string
  createLabel?: string
  editLabel?: string
  isEdit?: boolean
  size?: AdminModalSize
  children: ReactNode
  footerExtra?: ReactNode
}) {
  const { isDark } = useAdminTheme()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={modalContentClass(isDark, size)}>
        <ModalHeading
          icon={icon}
          title={title}
          description={description}
        />
        <form onSubmit={onSubmit} className="space-y-4 pt-2">
          <div className="space-y-4">{children}</div>
          <DialogFooter className="border-t border-navy/10 dark:border-teal/20 pt-4 flex gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className={cn(
                "rounded-xl border-2 font-bold h-10 sm:h-11 px-4 sm:px-5 text-xs sm:text-sm",
                isDark
                  ? "border-teal/30 text-white hover:bg-white/10"
                  : "border-navy/20 text-navy hover:bg-slate-100"
              )}
            >
              Cancel
            </Button>
            {footerExtra}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-teal text-navy font-black hover:bg-teal-400 rounded-xl h-10 sm:h-11 px-5 sm:px-6 shadow-md transition-all active:scale-95 text-xs sm:text-sm"
            >
              {isSubmitting ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              {isEdit ? (editLabel ?? "Update Record") : (createLabel ?? submitLabel)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function AdminFormField({
  label,
  required = false,
  hint,
  children,
  className,
}: {
  label: string
  required?: boolean
  hint?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label
        className={cn(
          "text-xs font-bold uppercase tracking-wider",
          required && "text-rose-500"
        )}
      >
        {label}
        {required && " *"}
      </Label>
      {children}
      {hint && <p className="text-[11px] font-medium opacity-70">{hint}</p>}
    </div>
  )
}

export function AdminFormGrid({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4", className)}>
      {children}
    </div>
  )
}

/** Consistent delete/status-change confirmation dialog. */
export function AdminConfirmDialog({
  open,
  onOpenChange,
  title = "Are you sure?",
  description,
  confirmLabel = "Delete",
  onConfirm,
  isSubmitting = false,
  destructive = true,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: ReactNode
  confirmLabel?: string
  onConfirm: () => void | Promise<void>
  isSubmitting?: boolean
  destructive?: boolean
}) {
  const { isDark } = useAdminTheme()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={modalContentClass(isDark, "sm")}>
        <ModalHeading
          icon={AlertTriangle}
          title={title}
          description={description}
        />
        <DialogFooter className="pt-2 flex gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className={cn(
              "rounded-xl border-2 font-bold h-10 px-5",
              isDark
                ? "border-teal/30 text-white hover:bg-white/10"
                : "border-navy/20 text-navy hover:bg-slate-100"
            )}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
            className={cn(
              "font-bold rounded-xl h-10 px-5 text-white",
              destructive
                ? "bg-brand-red hover:bg-red-600"
                : "bg-navy hover:bg-navy/90"
            )}
          >
            {isSubmitting && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
