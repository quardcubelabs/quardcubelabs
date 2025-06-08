import { config } from "dotenv"
import { resolve } from "path"
import { updateProducts } from "../lib/product-actions"

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") })

async function main() {
  try {
    await updateProducts()
    console.log("Products updated successfully")
    process.exit(0)
  } catch (error) {
    console.error("Error updating products:", error)
    process.exit(1)
  }
}

main() 