"use client"

import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"

export function adminControlClass(isDark: boolean, monospace = false) {
  return cn(
    "h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm",
    monospace && "font-mono font-bold",
    isDark
      ? "bg-[#080d2a] border-teal/30 text-white placeholder:text-slate-500"
      : "bg-white border-navy/20 text-navy placeholder:text-navy/40"
  )
}

/** Canonical admin form input (Projects page field styling). */
export function AdminInput({
  className,
  monospace = false,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { monospace?: boolean }) {
  const { isDark } = useAdminTheme()
  return (
    <Input
      className={cn(adminControlClass(isDark, monospace), className)}
      {...props}
    />
  )
}

/** Canonical admin form textarea. */
export function AdminTextarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { isDark } = useAdminTheme()
  return (
    <Textarea
      className={cn(
        "rounded-xl border-2 font-medium text-xs sm:text-sm",
        isDark
          ? "bg-[#080d2a] border-teal/30 text-white placeholder:text-slate-500"
          : "bg-white border-navy/20 text-navy placeholder:text-navy/40",
        className
      )}
      {...props}
    />
  )
}

/** Canonical admin form select. */
export function AdminSelect({
  value,
  onValueChange,
  options,
  placeholder,
  className,
  disabled,
}: {
  value: string
  onValueChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
  className?: string
  disabled?: boolean
}) {
  const { isDark } = useAdminTheme()
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        className={cn(
          "h-10 sm:h-11 rounded-xl border-2 font-bold text-xs sm:text-sm",
          isDark
            ? "bg-[#080d2a] border-teal/30 text-white"
            : "bg-white border-navy/20 text-navy",
          className
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
