import puppeteer from "puppeteer"

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  })
  const page = await browser.newPage()

  page.on("console", msg => {
    console.log(`[BROWSER CONSOLE ${msg.type().toUpperCase()}]:`, msg.text())
  })

  page.on("pageerror", err => {
    console.error("[BROWSER PAGE ERROR]:", err.message, err.stack)
  })

  try {
    console.log("Navigating to https://admin.quardcubelabs.co.tz/admin/suppliers ...")
    await page.goto("https://admin.quardcubelabs.co.tz/admin/suppliers", { waitUntil: "networkidle2", timeout: 30000 })
    console.log("Current URL:", page.url())

    // If redirected to login, login or report
    if (page.url().includes("/login")) {
      console.log("Page is on login. Attempting login...")
      await page.type("input[type='email']", "admin@quardcube.com")
      await page.type("input[type='password']", "Admin@1234")
      await page.click("button[type='submit']")
      await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {})
      console.log("After login URL:", page.url())
    }

    // Try navigating directly to a supplier details page
    const testSupplierUrl = "https://admin.quardcubelabs.co.tz/admin/suppliers/b89f6b4a-8534-439c-800a-8b524d521882"
    console.log(`Navigating to ${testSupplierUrl} ...`)
    await page.goto(testSupplierUrl, { waitUntil: "networkidle2", timeout: 30000 })
    console.log("Final URL:", page.url())

    const content = await page.content()
    if (content.includes("Application error")) {
      console.error(">>> CONFIRMED ON SCREEN: Application error: a client-side exception has occurred <<<")
    } else {
      console.log(">>> SUCCESS: No Application error found on page! <<<")
    }
  } catch (e: any) {
    console.error("Puppeteer script error:", e.message)
  } finally {
    await browser.close()
  }
}

run().catch(console.error)
