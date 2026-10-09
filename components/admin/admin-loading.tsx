"use client"

import React from "react"
import {
  AdminHeaderSkeleton,
  AdminMetricsSkeleton,
  AdminTableSkeleton,
  AdminCardsGridSkeleton,
  AdminFormSkeleton,
  AdminDetailSkeleton,
  AdminCctvSkeleton,
  AdminReportsSkeleton,
  AdminRolesSkeleton,
  AdminDashboardSkeleton,
  AdminAnalyticsSkeleton,
} from "./skeletons"

export type AdminLoadingType =
  | "dashboard"
  | "analytics"
  | "cctv"
  | "reports"
  | "roles"
  | "settings"
  | "form"
  | "detail"
  | "cards"
  | "products"
  | "services"
  | "blogs"
  | "branches"
  | "table"
  | "invoices"
  | "proforma-invoices"
  | "purchases"
  | "expenses"
  | "inventory"
  | "orders"
  | "quotations"
  | "receipts"
  | "suppliers"
  | "staff"
  | "users"
  | "bonds"
  | "positions"
  | "applications"
  | "projects"
  | "default"

interface AdminLoadingProps {
  type?: AdminLoadingType
  message?: string
  size?: "sm" | "md" | "lg"
  fullScreen?: boolean
}

export default function AdminLoading({
  type = "default",
}: AdminLoadingProps) {
  switch (type) {
    case "dashboard":
      return <AdminDashboardSkeleton />

    case "analytics":
      return <AdminAnalyticsSkeleton />

    case "cctv":
      return <AdminCctvSkeleton />

    case "reports":
      return <AdminReportsSkeleton />

    case "roles":
      return <AdminRolesSkeleton />

    case "settings":
    case "form":
      return (
        <div className="w-full space-y-6 animate-in fade-in duration-300">
          <AdminHeaderSkeleton actionsCount={1} />
          <AdminFormSkeleton tabsCount={5} sectionsCount={2} />
        </div>
      )

    case "detail":
      return (
        <div className="w-full space-y-6 animate-in fade-in duration-300">
          <AdminDetailSkeleton />
        </div>
      )

    case "products":
      return (
        <div className="w-full space-y-6 animate-in fade-in duration-300">
          <AdminHeaderSkeleton actionsCount={3} />
          <AdminMetricsSkeleton count={4} columns={4} />
          <AdminCardsGridSkeleton count={6} columns={3} hasImage={true} />
        </div>
      )

    case "services":
    case "blogs":
    case "branches":
    case "cards":
    case "projects":
      return (
        <div className="w-full space-y-6 animate-in fade-in duration-300">
          <AdminHeaderSkeleton actionsCount={2} />
          <AdminMetricsSkeleton count={type === "branches" ? 4 : 3} columns={type === "branches" ? 4 : 3} />
          <AdminCardsGridSkeleton count={6} columns={3} hasImage={type !== "branches"} />
        </div>
      )

    case "invoices":
    case "proforma-invoices":
    case "quotations":
    case "receipts":
    case "orders":
    case "bonds":
      return (
        <div className="w-full space-y-6 animate-in fade-in duration-300">
          <AdminHeaderSkeleton actionsCount={3} />
          <AdminMetricsSkeleton count={4} columns={4} />
          <AdminTableSkeleton columns={6} rows={7} hasFilterBar={true} hasPagination={true} />
        </div>
      )

    case "purchases":
      return (
        <div className="w-full space-y-6 animate-in fade-in duration-300">
          <AdminHeaderSkeleton actionsCount={3} />
          <AdminMetricsSkeleton count={4} columns={4} />
          <AdminTableSkeleton columns={7} rows={7} hasTabs={true} tabsCount={2} hasFilterBar={true} />
        </div>
      )

    case "expenses":
      return (
        <div className="w-full space-y-6 animate-in fade-in duration-300">
          <AdminHeaderSkeleton actionsCount={2} />
          <AdminMetricsSkeleton count={4} columns={4} />
          <AdminTableSkeleton columns={6} rows={8} hasTabs={true} tabsCount={5} hasFilterBar={true} />
        </div>
      )

    case "inventory":
      return (
        <div className="w-full space-y-6 animate-in fade-in duration-300">
          <AdminHeaderSkeleton actionsCount={3} />
          <AdminMetricsSkeleton count={4} columns={4} />
          <AdminTableSkeleton columns={7} rows={8} hasFilterBar={true} />
        </div>
      )

    case "staff":
    case "suppliers":
    case "users":
    case "positions":
    case "applications":
      return (
        <div className="w-full space-y-6 animate-in fade-in duration-300">
          <AdminHeaderSkeleton actionsCount={2} />
          <AdminMetricsSkeleton count={type === "staff" ? 4 : 3} columns={type === "staff" ? 4 : 3} />
          <AdminTableSkeleton columns={6} rows={6} hasFilterBar={true} />
        </div>
      )

    case "table":
    case "default":
    default:
      return (
        <div className="w-full space-y-6 animate-in fade-in duration-300">
          <AdminHeaderSkeleton actionsCount={2} />
          <AdminMetricsSkeleton count={4} columns={4} />
          <AdminTableSkeleton columns={5} rows={6} hasFilterBar={true} />
        </div>
      )
  }
}
