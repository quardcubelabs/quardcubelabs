"use client"

import { useState, useEffect } from "react"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Check, 
  RotateCcw,
  Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"

interface ThemedDatePickerProps {
  label?: string
  value: string // YYYY-MM-DD
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  minDate?: string
  maxDate?: string
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

export function ThemedDatePicker({
  label,
  value,
  onChange,
  placeholder = "Select Date",
  className,
  minDate,
  maxDate
}: ThemedDatePickerProps) {
  const { isDark } = useAdminTheme()
  const [isOpen, setIsOpen] = useState(false)

  // Calendar navigation state
  const initialDate = value ? new Date(value) : new Date()
  const [currentMonth, setCurrentMonth] = useState(
    isNaN(initialDate.getTime()) ? new Date().getMonth() : initialDate.getMonth()
  )
  const [currentYear, setCurrentYear] = useState(
    isNaN(initialDate.getTime()) ? new Date().getFullYear() : initialDate.getFullYear()
  )
  const [tempSelected, setTempSelected] = useState(value)

  // Sync tempSelected with incoming value
  useEffect(() => {
    setTempSelected(value)
    if (value) {
      const d = new Date(value)
      if (!isNaN(d.getTime())) {
        setCurrentMonth(d.getMonth())
        setCurrentYear(d.getFullYear())
      }
    }
  }, [value, isOpen])

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(prev => prev - 1)
    } else {
      setCurrentMonth(prev => prev - 1)
    }
  }

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(prev => prev + 1)
    } else {
      setCurrentMonth(prev => prev + 1)
    }
  }

  // Format YYYY-MM-DD
  const formatYMD = (y: number, m: number, d: number) => {
    const mm = String(m + 1).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    return `${y}-${mm}-${dd}`
  }

  // Format display string
  const formatDisplay = (val: string) => {
    if (!val) return placeholder
    const parts = val.split('-')
    if (parts.length === 3) {
      const y = parseInt(parts[0])
      const m = parseInt(parts[1]) - 1
      const d = parseInt(parts[2])
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return `${MONTH_NAMES[m].slice(0, 3)} ${d}, ${y}`
      }
    }
    return val
  }

  // Generate calendar days
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay()
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate()

  const handleSelectDay = (day: number) => {
    const selected = formatYMD(currentYear, currentMonth, day)
    setTempSelected(selected)
  }

  const handleApply = () => {
    onChange(tempSelected)
    setIsOpen(false)
  }

  const handleClear = () => {
    setTempSelected("")
    onChange("")
    setIsOpen(false)
  }

  const handleToday = () => {
    const now = new Date()
    const todayStr = formatYMD(now.getFullYear(), now.getMonth(), now.getDate())
    setCurrentMonth(now.getMonth())
    setCurrentYear(now.getFullYear())
    setTempSelected(todayStr)
    onChange(todayStr)
    setIsOpen(false)
  }

  const todayStr = formatYMD(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate()
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "w-full h-10 px-3 rounded-xl border flex items-center justify-between text-xs sm:text-sm font-medium transition-all text-left shadow-xs",
            isDark 
              ? "bg-[#0c1438] border-teal/40 text-white hover:border-teal hover:bg-[#0e1945]" 
              : "bg-white border-navy/20 text-navy hover:border-navy hover:bg-slate-50",
            className
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <CalendarIcon className="h-4 w-4 text-teal shrink-0" />
            <span className={cn("truncate", !value && (isDark ? "text-slate-400" : "text-navy/50"))}>
              {formatDisplay(value)}
            </span>
          </div>
          {value && (
            <span 
              onClick={(e) => {
                e.stopPropagation()
                onChange("")
              }}
              className="p-1 rounded-md hover:bg-teal/20 text-teal transition-colors"
            >
              <X className="h-3 w-3" />
            </span>
          )}
        </button>
      </DialogTrigger>

      <DialogContent className={cn(
        "p-5 rounded-3xl border-2 shadow-2xl max-w-sm sm:max-w-md w-full",
        isDark ? "bg-[#0a1033] border-teal/30 text-white" : "bg-white border-navy/20 text-navy"
      )}>
        <DialogHeader className="pb-2 border-b border-navy/10 dark:border-teal/20">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-teal" />
              {label || "Select Date"}
            </DialogTitle>
            {tempSelected && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-teal/20 text-teal">
                {formatDisplay(tempSelected)}
              </span>
            )}
          </div>
        </DialogHeader>

        {/* Month / Year Navigator */}
        <div className="py-2">
          <div className="flex items-center justify-between px-1 mb-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={prevMonth}
              className={cn(
                "h-8 w-8 rounded-full border transition-all",
                isDark 
                  ? "bg-[#0c1438] border-teal/30 text-teal-300 hover:bg-teal hover:text-navy" 
                  : "bg-white border-navy/20 text-navy hover:bg-teal-50"
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2 font-black text-sm">
              <span className="text-teal font-extrabold">
                {MONTH_NAMES[currentMonth]}
              </span>
              <span>{currentYear}</span>
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={nextMonth}
              className={cn(
                "h-8 w-8 rounded-full border transition-all",
                isDark 
                  ? "bg-[#0c1438] border-teal/30 text-teal-300 hover:bg-teal hover:text-navy" 
                  : "bg-white border-navy/20 text-navy hover:bg-teal-50"
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {DAY_NAMES.map((d) => (
              <div 
                key={d} 
                className={cn(
                  "text-[11px] font-black uppercase py-1",
                  isDark ? "text-teal-400/80" : "text-navy/70"
                )}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Previous month filler days */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => {
              const dayNum = daysInPrevMonth - firstDayIndex + idx + 1
              return (
                <div
                  key={`prev-${idx}`}
                  className={cn(
                    "h-9 w-9 mx-auto flex items-center justify-center text-xs font-medium rounded-full opacity-30 cursor-not-allowed select-none",
                    isDark ? "text-slate-400" : "text-navy/40"
                  )}
                >
                  {dayNum}
                </div>
              )
            })}

            {/* Current month days */}
            {Array.from({ length: daysInCurrentMonth }).map((_, idx) => {
              const dayNum = idx + 1
              const dateStr = formatYMD(currentYear, currentMonth, dayNum)
              const isSelected = tempSelected === dateStr
              const isToday = todayStr === dateStr

              return (
                <button
                  key={`day-${dayNum}`}
                  type="button"
                  onClick={() => handleSelectDay(dayNum)}
                  className={cn(
                    "h-9 w-9 mx-auto flex items-center justify-center text-xs font-bold rounded-full transition-all select-none active:scale-95",
                    isSelected
                      ? "bg-teal text-navy font-black shadow-md scale-105"
                      : isToday
                        ? isDark 
                          ? "border border-teal text-teal-300 hover:bg-teal/20" 
                          : "border border-navy text-navy hover:bg-teal-50"
                        : isDark
                          ? "text-slate-200 hover:bg-teal/20 hover:text-white"
                          : "text-navy hover:bg-teal-50"
                  )}
                >
                  {dayNum}
                </button>
              )
            })}
          </div>
        </div>

        {/* Quick Presets & Action Footer */}
        <DialogFooter className="pt-3 border-t border-navy/10 dark:border-teal/20 flex flex-col sm:flex-row justify-between gap-2">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleToday}
              className={cn(
                "h-8 text-xs font-bold rounded-xl flex-1 sm:flex-initial",
                isDark 
                  ? "border-teal/30 text-teal-300 hover:bg-teal/15" 
                  : "border-navy/20 text-navy hover:bg-teal-50"
              )}
            >
              Today
            </Button>
            {tempSelected && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-8 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl"
              >
                Clear
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
              className={cn(
                "h-9 text-xs font-bold rounded-xl flex-1 sm:flex-initial",
                isDark ? "border-teal/20 text-slate-300" : "border-navy/20 text-navy"
              )}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleApply}
              className="h-9 text-xs font-black rounded-xl bg-teal text-navy hover:bg-teal-400 shadow-md flex-1 sm:flex-initial"
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Apply Date
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
