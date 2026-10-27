/**
 * QuardCube Labs Extended Inventory Types (Zoho Inventory equivalent)
 * Serial number & warranty tracking, physical stocktaking adjustments, and hardware bundles.
 */

export type SerialWarrantyStatus = 
  | "in_stock" 
  | "reserved" 
  | "allocated"
  | "sold" 
  | "under_warranty" 
  | "warranty_expired" 
  | "under_repair"
  | "rma"
  | "rma_returned" 
  | "defective"
  | "decommissioned"

export interface HardwareSerial {
  id: string
  product_id: number
  product_name: string
  serial_number: string
  mac_address?: string
  warehouse_id: string
  warehouse_name: string
  status: SerialWarrantyStatus
  supplier_id?: string
  supplier_name?: string
  purchase_date?: string
  invoice_id?: string
  invoice_number?: string
  customer_name?: string
  customer_phone?: string
  warranty_months: number
  warranty_start_date?: string
  warranty_end_date?: string
  notes?: string
  created_at: string
  updated_at: string
}

export type StockAdjustmentReason = 
  | "Damaged in Transit"
  | "Breakage / Shop Loss"
  | "Stocktake Count Discrepancy"
  | "Physical Stocktake Count Discrepancy"
  | "Damage / Breakage"
  | "Theft / Shrinkage"
  | "Demonstration / Internal Lab Use"
  | "Supplier Return / RMA"
  | "Obsolete / Deprecated"
  | "Customer Return Correction"
  | "Initial Physical Inventory"

export interface StockAdjustment {
  id: string
  adjustment_number: string
  product_id: number
  product_name: string
  warehouse_id: string
  warehouse_name: string
  previous_quantity: number
  quantity_adjusted: number // e.g. -2 or +5
  new_quantity: number
  unit_cost: number
  total_value_impact: number // quantity_adjusted * unit_cost
  reason: StockAdjustmentReason
  notes?: string
  performed_by: string
  created_at: string
}
