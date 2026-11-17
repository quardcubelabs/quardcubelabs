import { Product } from '@/types/database'
import { getCanonicalSiteUrl } from '@/lib/site-config'

interface ProductStructuredDataProps {
  product: Product
}

export default function ProductStructuredData({ product }: ProductStructuredDataProps) {
  const baseUrl = getCanonicalSiteUrl()
  
  const structuredData = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": [product.image, ...(product.swatchImages?.slice(0, 4) || [])],
    "description": product.description || `${product.name} - Professional quality electronics from QuadCube Labs`,
    "sku": `QCL-${product.id}`,
    "mpn": `QCL-${product.id}`,
    "brand": {
      "@type": "Brand", 
      "name": "QuadCube Labs"
    },
    "manufacturer": {
      "@type": "Organization",
      "name": "QuardCube Labs",
      "url": baseUrl
    },
    "category": product.category,
    "offers": {
      "@type": "Offer",
      "url": `${baseUrl}/shop/${product.id}`,
      "priceCurrency": "TZS",
      "price": product.price,
      "priceValidUntil": new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
      "availability": product.stock > 0 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition",
      "seller": {
        "@type": "Organization",
        "name": "QuardCube Labs",
        "url": baseUrl,
        "telephone": "+255 652 540 496",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Kigamboni-Ferry State",
          "addressLocality": "Dar es Salaam",
          "addressRegion": "Dar es Salaam", 
          "postalCode": "17107",
          "addressCountry": "TZ"
        }
      },
      "hasMerchantReturnPolicy": {
        "@type": "MerchantReturnPolicy",
        "applicableCountry": "TZ",
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": 7,
        "returnMethod": "https://schema.org/ReturnInStore",
        "returnFees": "https://schema.org/FreeReturn"
      },
      "shippingDetails": {
        "@type": "OfferShippingDetails", 
        "shippingRate": {
          "@type": "MonetaryAmount",
          "currency": "TZS",
          "value": "20000"
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "handlingTime": {
            "@type": "QuantitativeValue",
            "minValue": 1,
            "maxValue": 2,
            "unitCode": "DAY"
          },
          "transitTime": {
            "@type": "QuantitativeValue", 
            "minValue": 3,
            "maxValue": 7,
            "unitCode": "DAY"
          }
        }
      }
    },
    "aggregateRating": product.rating ? {
      "@type": "AggregateRating",
      "ratingValue": product.rating,
      "bestRating": "5",
      "worstRating": "1",
      "ratingCount": "1" // You may want to track this separately
    } : undefined,
    "additionalProperty": product.features?.map(feature => ({
      "@type": "PropertyValue",
      "name": "Feature",
      "value": feature
    })) || [],
    "itemAvailability": product.stock > 0 
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock"
  }

  // Remove undefined properties
  const cleanStructuredData = JSON.parse(JSON.stringify(structuredData))

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(cleanStructuredData)
      }}
    />
  )
}

// Business organization structured data (use this on your homepage/about page)
export function BusinessStructuredData() {
  const baseUrl = getCanonicalSiteUrl()
  
  const businessData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "QuardCube Labs", 
    "url": baseUrl,
    "logo": `${baseUrl}/logo.png`,
    "description": "Professional electronics, computers, and innovative tech solutions provider",
    "foundingDate": "2023", // Replace with your actual founding year
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+255 652 540 496",
      "contactType": "customer service",
      "availableLanguage": ["English", "Swahili"],
      "areaServed": "TZ"
    },
    "address": {
      "@type": "PostalAddress", 
      "streetAddress": "Kigamboni-Ferry State",
      "addressLocality": "Dar es Salaam",
      "addressRegion": "Dar es Salaam",
      "postalCode": "17107", 
      "addressCountry": "TZ"
    },
    "sameAs": [
      "https://www.facebook.com/quardcubelabs",
      "https://www.instagram.com/quardcubelabs",
      "https://www.linkedin.com/company/quardcubelabs",
      "https://x.com/quardcubelabs"
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Electronics and Technology Products",
      "itemListElement": [
        {
          "@type": "OfferCatalog",
          "name": "Computers & Laptops",
          "itemListElement": {
            "@type": "Offer", 
            "itemOffered": {
              "@type": "Product",
              "category": "Electronics"
            }
          }
        }
      ]
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(businessData)
      }}
    />
  )
}