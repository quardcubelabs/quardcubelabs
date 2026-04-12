import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(supabaseUrl, supabaseKey)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Handle Google Business Messages webhook
    if (body.message?.text) {
      const userMessage = body.message.text.toLowerCase()
      const supabase = getSupabaseClient()
      
      let responseText = ''
      const suggestions = []
      
      // Handle specific product searches
      if (userMessage.includes('laptop') || userMessage.includes('computer') || userMessage.includes('pc')) {
        const { data: products } = await supabase
          .from('products')
          .select('*')
          .ilike('category', '%computer%')
          .or('name.ilike.%laptop%,name.ilike.%computer%,name.ilike.%pc%')
          .gt('stock', 0)
          .order('rating', { ascending: false })
          .limit(3)
        
        if (products?.length) {
          responseText = `🖥️ Here are our featured computers/laptops:\n\n`
          products.forEach((product, index) => {
            responseText += `${index + 1}. ${product.name}\n`
            responseText += `   💰 $${product.price}\n`
            responseText += `   ⭐ ${product.rating}/5 rating\n`
            responseText += `   📦 ${product.stock} in stock\n\n`
          })
          
          suggestions.push(
            { type: "action", postbackData: "view_computers", text: "🖥️ View All Computers" },
            { type: "action", postbackData: "spec_help", text: "❓ Get Spec Help" }
          )
        }
      }
      // Handle price inquiries
      else if (userMessage.includes('price') || userMessage.includes('cost') || userMessage.includes('$')) {
        const { data: products } = await supabase
          .from('products')
          .select('name, price, category, rating')
          .gt('stock', 0)
          .order('rating', { ascending: false })
          .limit(5)
        
        responseText = `💰 Here are our popular products with prices:\n\n`
        products?.forEach((product, index) => {
          responseText += `${index + 1}. ${product.name}\n`
          responseText += `   ${product.category} - $${product.price}\n`
          responseText += `   ⭐ ${product.rating}/5\n\n`
        })
        
        suggestions.push(
          { type: "action", postbackData: "browse_categories", text: "📂 Browse Categories" },
          { type: "action", postbackData: "special_offers", text: "🔥 Special Offers" }
        )
      }
      // Handle general product search
      else {
        const searchTerms = userMessage.split(' ').filter((term: string) => term.length > 2)
        let searchQuery = searchTerms.join(' | ')
        
        const { data: products } = await supabase
          .from('products')
          .select('*')
          .or(`name.ilike.%${userMessage}%,description.ilike.%${userMessage}%,category.ilike.%${userMessage}%`)
          .gt('stock', 0)
          .limit(4)
        
        if (products?.length) {
          responseText = `Found ${products.length} product(s) for "${body.message.text}":\n\n`
          
          products.forEach((product, index) => {
            responseText += `${index + 1}. ${product.name}\n`
            responseText += `   💰 $${product.price} | ⭐ ${product.rating}/5\n`
            responseText += `   📦 ${product.stock} available\n`
            if (product.features?.length > 0) {
              responseText += `   🔧 ${product.features[0]}\n`
            }
            responseText += '\n'
            
            suggestions.push({
              type: "action",
              postbackData: `product_${product.id}`,
              text: `View ${product.name.substring(0, 25)}...`
            })
          })
        } else {
          // No products found - suggest categories
          const { data: categories } = await supabase
            .from('products')
            .select('category')
            .gt('stock', 0)
          
          const uniqueCategories = Array.from(new Set(categories?.map(c => c.category))).slice(0, 4)
          
          responseText = `Sorry, no products found for "${body.message.text}". Browse our categories:`
          
          uniqueCategories.forEach(category => {
            suggestions.push({
              type: "action",
              postbackData: `category_${category}`,
              text: `${getCategoryEmoji(category)} ${category}`
            })
          })
        }
      }
      
      // Add contact options
      suggestions.push({
        type: "action",
        postbackData: "contact_info",
        text: "📞 Contact Us"
      })
      
      return NextResponse.json({
        message: {
          text: responseText || "Hello! How can I help you find the perfect tech solution today?",
          suggestions
        }
      })
    }
    
    // Handle postback data (when user clicks suggestions)
    if (body.postbackData) {
      const postback = body.postbackData
      let responseText = ''
      
      if (postback === 'contact_info') {
        responseText = `📞 Contact QuadCube Labs:\n\n` +
                     `🏢 Visit us: [Your Address]\n` +
                     `📱 Phone: [Your Phone]\n` +
                     `📧 Email: info@quardcubelabs.com\n` +
                     `🕒 Hours: Mon-Fri 9AM-6PM\n\n` +
                     `💬 Or continue chatting here!`
      }
      
      return NextResponse.json({
        message: { text: responseText }
      })
    }
    
    return NextResponse.json({
      message: { 
        text: "Welcome to QuadCube Labs! 🚀\n\nWe specialize in premium electronics and tech solutions. How can I help you today?",
        suggestions: [
          { type: "action", postbackData: "view_computers", text: "🖥️ Computers" },
          { type: "action", postbackData: "view_accessories", text: "⚡ Accessories" },
          { type: "action", postbackData: "get_quote", text: "💼 Get Quote" },
          { type: "action", postbackData: "contact_info", text: "📞 Contact" }
        ]
      }
    })
    
  } catch (error) {
    console.error('Business Messages error:', error)
    return NextResponse.json(
      { error: 'Service temporarily unavailable. Please try again.' }, 
      { status: 500 }
    )
  }
}

// Helper function to get emoji for categories
function getCategoryEmoji(category: string): string {
  const emojiMap: { [key: string]: string } = {
    'computers': '🖥️',
    'laptops': '💻', 
    'phones': '📱',
    'accessories': '⚡',
    'gaming': '🎮',
    'audio': '🎧',
    'storage': '💾',
    'networking': '🌐',
  }
  
  const categoryLower = category.toLowerCase()
  for (const [key, emoji] of Object.entries(emojiMap)) {
    if (categoryLower.includes(key)) return emoji
  }
  return '📦'
}