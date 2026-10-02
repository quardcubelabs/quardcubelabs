"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "relative z-10 flex items-end gap-1.5 overflow-x-auto pb-0 w-full bg-transparent px-0 -mb-[2px]",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "group relative inline-flex items-center justify-center gap-2 whitespace-nowrap px-4 py-2.5 text-xs sm:text-sm font-bold transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer rounded-t-xl sm:rounded-t-2xl",
      "first:data-[state=active]:rounded-tl-2xl sm:first:data-[state=active]:rounded-tl-3xl first:data-[state=active]:rounded-tr-xl sm:first:data-[state=active]:rounded-tr-2xl",
      "bg-transparent text-navy/70 hover:text-navy dark:text-slate-400 dark:hover:text-white border-0 hover:bg-teal-500/10",
      "data-[state=active]:bg-[#e6f7f5] data-[state=active]:text-navy data-[state=active]:font-black data-[state=active]:border-2 data-[state=active]:border-b-0 data-[state=active]:border-navy/20 data-[state=active]:z-20 data-[state=active]:shadow-none",
      "dark:data-[state=active]:bg-[#0c1833] dark:data-[state=active]:text-teal dark:data-[state=active]:border-teal/30",
      className
    )}
    {...props}
  >
    {/* Left concave fillet curve (hidden for first tab) */}
    <span className="hidden group-data-[state=active]:block group-first:!hidden absolute -bottom-[2px] -left-[12px] w-[12px] h-[12px] overflow-hidden pointer-events-none z-20">
      <svg className="w-[12px] h-[12px]" viewBox="0 0 12 12" fill="none">
        <path d="M12 0C12 6.627 6.627 12 0 12H12V0Z" className="fill-[#e6f7f5] dark:fill-[#0c1833]" />
        <path d="M0 12C6.627 12 12 6.627 12 0" stroke="currentColor" strokeWidth="2" className="text-navy/20 dark:text-teal/30" />
      </svg>
    </span>
    {/* Right concave fillet curve */}
    <span className="hidden group-data-[state=active]:block absolute -bottom-[2px] -right-[12px] w-[12px] h-[12px] overflow-hidden pointer-events-none z-20">
      <svg className="w-[12px] h-[12px]" viewBox="0 0 12 12" fill="none">
        <path d="M0 0C0 6.627 5.373 12 12 12H0V0Z" className="fill-[#e6f7f5] dark:fill-[#0c1833]" />
        <path d="M0 0C0 6.627 5.373 12 12 12" stroke="currentColor" strokeWidth="2" className="text-navy/20 dark:text-teal/30" />
      </svg>
    </span>
    {/* Bottom bridge to erase content card top border under active tab */}
    <span className="hidden group-data-[state=active]:block absolute -bottom-[3px] -left-[2px] -right-[2px] h-[6px] bg-[#e6f7f5] dark:bg-[#0c1833] z-30 pointer-events-none" />
    <span className="relative z-40 flex items-center gap-2">{children}</span>
  </TabsPrimitive.Trigger>
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-0 rounded-2xl sm:rounded-3xl border-2 border-navy/20 bg-[#e6f7f5] p-4 sm:p-6 shadow-sm transition-all focus-visible:outline-none dark:border-teal/30 dark:bg-[#0c1833] relative z-0",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }

