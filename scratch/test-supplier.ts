import { getSuppliers } from "../lib/supplier-actions"
import { getSupplierDetail } from "../lib/detail-actions"

async function main() {
  const suppliers = await getSuppliers()
  console.log("Suppliers count:", suppliers.length)
  if (suppliers.length > 0) {
    for (const sup of suppliers.slice(0, 3)) {
      console.log(`Testing supplier ${sup.id} (${sup.name})...`)
      try {
        const detail = await getSupplierDetail(sup.id)
        console.log(`Supplier ${sup.id} detail success:`, {
          hasSupplier: !!detail?.supplier,
          totals: detail?.totals,
          monthlyCount: detail?.monthly?.length,
          dailyCount: detail?.daily?.length,
          weeklyCount: detail?.weekly?.length,
        })
      } catch (err: any) {
        console.error(`Supplier ${sup.id} ERROR:`, err)
      }
    }
  }
}

main().catch(console.error)
