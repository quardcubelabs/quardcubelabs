import { getSuppliers } from "../lib/supplier-actions"
import { getSupplierDetail } from "../lib/detail-actions"

async function main() {
  const suppliers = await getSuppliers()
  console.log("Suppliers count:", suppliers.length)
  if (suppliers.length > 0) {
  for (const sup of suppliers) {
    console.log(`Testing supplier ${sup.id} (${sup.name})...`)
    try {
      const detail = await getSupplierDetail(sup.id)
      const serialized = JSON.stringify(detail)
      console.log(`Supplier ${sup.id} OK, serialized len: ${serialized.length}`)
    } catch (err: any) {
      console.error(`Supplier ${sup.id} ERROR:`, err)
    }
  }
  }
}

main().catch(console.error)
