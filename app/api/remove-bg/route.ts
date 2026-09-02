import { NextRequest, NextResponse } from "next/server"
import OpenAI, { toFile } from "openai"

// Server-side in-memory cache for processed images
const imageCache = new Map<string, string>()

export async function POST(req: NextRequest) {
  try {
    const { imageUrl } = await req.json()

    if (!imageUrl || imageUrl === "/placeholder.svg") {
      return NextResponse.json({ error: "No valid image URL", processedImage: imageUrl || "/placeholder.svg" }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      // Graceful fallback when OpenAI API key is not configured: return the original image URL
      return NextResponse.json({ processedImage: imageUrl })
    }

    // Check server-side cache
    if (imageCache.has(imageUrl)) {
      return NextResponse.json({ processedImage: imageCache.get(imageUrl) })
    }

    // Download the original image
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      return NextResponse.json({ error: "Failed to download image", processedImage: imageUrl }, { status: 200 })
    }

    const buffer = Buffer.from(await imageResponse.arrayBuffer())
    const file = await toFile(buffer, "product.png", { type: "image/png" })

    // Only instantiate OpenAI when API key is guaranteed to exist
    const openai = new OpenAI({ apiKey })

    // Call OpenAI to remove background
    const result = await openai.images.edit({
      model: "gpt-image-1",
      image: file,
      prompt:
        "Remove the background completely from this product image. Keep only the product itself with a fully transparent background. Do not modify the product in any way - preserve its exact appearance, colors, and details.",
    })

    // Extract the processed image
    const imageData = result.data?.[0]
    let processedImage: string | undefined

    if (imageData && "b64_json" in imageData && imageData.b64_json) {
      processedImage = `data:image/png;base64,${imageData.b64_json}`
    } else if (imageData && "url" in imageData && imageData.url) {
      // Download from temporary URL and convert to base64 for persistence
      const processedResponse = await fetch(imageData.url)
      const processedBuffer = Buffer.from(await processedResponse.arrayBuffer())
      processedImage = `data:image/png;base64,${processedBuffer.toString("base64")}`
    }

    if (processedImage) {
      imageCache.set(imageUrl, processedImage)
      return NextResponse.json({ processedImage })
    }

    return NextResponse.json({ processedImage: imageUrl })
  } catch (error: any) {
    console.error("Background removal error:", error?.message || error)
    // Graceful fallback with HTTP 200 so product rendering never fails
    return NextResponse.json({ error: "Background removal skipped", processedImage: null }, { status: 200 })
  }
}
