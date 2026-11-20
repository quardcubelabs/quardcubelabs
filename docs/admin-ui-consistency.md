# Admin UI consistency specification

The **Projects** page is the visual reference for every admin management screen.
All shared primitives live in `components/admin/ui/` (barrel: `@/components/admin/ui`).
Do not edit those primitives when migrating a page — if something is missing, report it.

## Canonical structure of a list page

```tsx
<div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6 overflow-hidden">
  <AdminPageHeader ... />
  <AdminStats ... />
  <AdminFilterBar ... />
  <AdminTable ... />

  {/* one detail modal, opened by the Eye action on every row */}
  <AdminDetailModal ... />

  {/* create / edit modal */}
  <AdminFormModal ... />

  {/* delete confirmation */}
  <AdminConfirmDialog ... />
</div>
```

## Component rules

| Concern | Use |
|---|---|
| Header banner, title, subtitle, Refresh / Add buttons | `AdminPageHeader` |
| KPI cards | `AdminStats` (2/3/4/5/6 columns) |
| Filter chips, search field, dropdown filters | `AdminFilterTabs` / `AdminFilterBar` (custom chips, **not** Radix Tabs on list pages) |
| Table shell, header row, cells, hover, actions, empty state | `AdminTable<T>` with a typed `columns` array and `actions` array. Use `inline` for nested line-item tables inside detail sections/modals. |
| First cell (icon + title + subtitle + link) | `AdminPrimaryCell`, `AdminIconBubble` |
| Client / code / category pills | `AdminPill`, `AdminTag`, `AdminMutedText` |
| Status colours | `AdminStatusBadge` — never invent a new status colour |
| Per-row detail dialog | `AdminDetailModal` + `AdminDetailSection` / `AdminDetailFieldList` |
| Create / edit dialog | `AdminFormModal` + `AdminFormGrid` + `AdminFormField` + `AdminInput` / `AdminTextarea` / `AdminSelect` |
| Delete / status confirmation | `AdminConfirmDialog` |
| Loading | `<AdminLoading />` |

`AdminTable` actions in this order: **view (Eye)**, optional external/link action,
**edit (Pencil/Edit)**, **delete (Trash2)**. Variants: `"view" | "edit" | "delete" | "soft" | "danger-soft"`.
Set `mobile: false` for secondary actions that should be hidden on small screens.

## Migration checklist (every list page)

1. Keep all existing data loading, filtering, pagination, permissions and business logic.
2. Replace bespoke header/stats/filter/table markup with the shared components. Do not
   change the meaning of any column — only its layout and styling.
3. Give **every row a detail modal**: add an Eye action that stores the selected row and
   opens `AdminDetailModal`. Show all meaningful fields of that record in sections/fields.
   Read-only pages (external API, statements, reports, CCTV) still get a detail modal.
4. Ensure full CRUD where the data layer supports it:
   - **Create / Update** through `AdminFormModal`, calling the page's existing server actions.
   - **Delete** through `AdminConfirmDialog` (never `window.confirm`).
   - If an action is genuinely missing, check `lib/*-actions.ts` and the Supabase schema
     in `types/database.ts` before adding one; follow the existing auth/audit/revalidate
     pattern. If it cannot be done safely, report the gap instead of faking persistence.
5. Use `useToast` from `@/hooks/use-toast`, with `variant: "destructive"` on errors.
6. Use `useAdminTheme()` only where a page needs `isDark` for a custom element; the shared
   components handle theming internally.
7. Remove now-unused imports (Card, old Dialog imports, unused icons) to keep typecheck clean.
8. Run `npx tsc --noEmit --pretty false`; fix all errors in files you touched. Ignore errors
   reported in files owned by other migrations.

## Text scale (enforced by the shared components)

- Table header: `text-[10px] sm:text-xs font-black uppercase tracking-wider`
- Table body: `text-xs sm:text-sm`; secondary text `text-[11px] sm:text-xs`
- Badges: `text-xs font-bold`
- Form labels: `text-xs font-bold uppercase tracking-wider`
- Modal title: `text-lg sm:text-xl font-black`; detail title `text-xl sm:text-2xl font-black`
- Page title: `text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black`
