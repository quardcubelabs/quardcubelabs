# Google Business Profile Product Integration Guide

This guide explains how to display your QuadCube Labs products directly in Google Business Profile and Google Search results.

## 🎯 What's Been Set Up

Your existing product structure is perfect for Google integration! We've created:

1. **Google Merchant Center Feed** (`/api/google-merchant-feed`)
2. **Business Messages Handler** (`/api/google-business-messages`) 
3. **Product Structured Data** component for SEO
4. **Rich product information** utilizing your existing data structure

## 📋 Setup Steps

### 1. Google Merchant Center Setup

1. **Create Google Merchant Center Account**
   - Go to [merchants.google.com](https://merchants.google.com)
   - Sign in with your business Google account
   - Complete business information verification

2. **Add Product Feed**
   - In Merchant Center, go to "Products" → "Feeds"
   - Click "+" to add new feed
   - Choose "Scheduled fetch"
   - Feed URL: `https://yourdomain.com/api/google-merchant-feed`
   - Set fetch frequency: Daily at 2 AM
   - Name: "QuadCube Labs Product Feed"

3. **Configure Feed Settings**
   - Target country: United States
   - Currency: USD
   - Feed language: English
   - Click "Create Feed"

### 2. Google Business Profile Setup

1. **Verify Your Business Profile** 
   - Go to [business.google.com](https://business.google.com)
   - Claim/verify your business listing
   - Complete all business information fields

2. **Link Merchant Center**
   - In Google Business Profile, go to "Info" tab
   - Add your website URL (must match Merchant Center)
   - In Merchant Center, go to "Growth" → "Manage Programs"
   - Enable "Local inventory ads" if you have physical store

3. **Enable Business Messages**
   - In Business Profile, go to "Messages"
   - Turn on messaging feature
   - Set up welcome message
   - Configure webhook URL: `https://yourdomain.com/api/google-business-messages`

### 3. Website Requirements

#### A. Add Structured Data to Product Pages

Add this to your product detail pages:

```tsx
import ProductStructuredData from '@/components/ProductStructuredData'
import { BusinessStructuredData } from '@/components/ProductStructuredData'

export default function ProductPage({ product }) {
  return (
    <>
      <ProductStructuredData product={product} />
      {/* Your existing product page content */}
    </>
  )
}
```

#### B. Update Business Information

Edit [`components/ProductStructuredData.tsx`](components/ProductStructuredData.tsx) and replace:

- `Your Street Address` → Your actual business address
- `Your City`, `Your State`, `Your ZIP` → Your location details  
- `+1-XXX-XXX-XXXX` → Your business phone number
- Social media URLs → Your actual social profiles

#### C. Environment Variables

Add to your `.env.local`:

```env
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
GOOGLE_BUSINESS_MESSAGES_SECRET=your_webhook_secret_key
```

### 4. Product Requirements ✅

Your products already meet Google's requirements:

- ✅ **High-quality images** (minimum 100x100px)
- ✅ **Accurate pricing** in USD
- ✅ **Detailed descriptions** 
- ✅ **Stock availability** tracking
- ✅ **Product categories** properly organized
- ✅ **Multiple product images** (swatch_images)
- ✅ **Product features** and specifications
- ✅ **Valid SKUs** and product IDs

### 5. Policy Compliance

Ensure your website has:

- ✅ **HTTPS enabled** (already implemented)
- ✅ **Clear return/refund policy** 
- ✅ **Privacy policy**
- ✅ **Terms of service**
- ✅ **Contact information** clearly displayed
- ✅ **Secure checkout process**

## 📊 Testing & Validation

### Test Your Feed
1. Visit: `https://yourdomain.com/api/google-merchant-feed`
2. Verify XML structure is valid
3. Check product data completeness

### Google Merchant Center Validation
1. In Merchant Center, check "Diagnostics" tab
2. Review any feed processing errors
3. Monitor "Products" tab for approved items

### Structured Data Testing
1. Use [Google's Rich Results Test](https://search.google.com/test/rich-results)
2. Test individual product URLs
3. Verify Product schema appears correctly

## 🚀 Expected Results

After setup (typically 3-7 days for Google review):

### Google Business Profile
- **Product showcase** in your Business Profile
- **Visual product grid** with images and prices
- **Direct links** to your product pages
- **Customer messaging** about specific products

### Google Search Results  
- **Rich product snippets** with ratings, price, availability
- **Product images** in search results
- **Enhanced business information**

### Business Messages
- **Automated responses** to product inquiries
- **Smart product recommendations** 
- **Direct product links** in chat

## 📈 Optimization Tips

### Product Feed Optimization
- Keep product titles under 150 characters
- Use relevant keywords in descriptions
- Maintain accurate stock levels
- Update prices regularly

### Image Optimization  
- Use high-resolution product images (800x600 minimum)
- Include multiple angles in swatch_images
- Optimize file sizes for fast loading
- Use descriptive alt text

### Performance Monitoring
- Monitor Merchant Center diagnostics weekly
- Track click-through rates from Google
- Review Business Messages analytics
- Update feed immediately when products change

## 🔧 Technical Details

### Feed Update Frequency
- **Automatic updates**: Feed refreshes every 30 minutes via caching
- **Manual trigger**: Restart your application to force immediate refresh  
- **Google fetch**: Daily at 2 AM (configurable in Merchant Center)

### Business Messages Features
- **Product search**: Customers can search by name, category, features
- **Price inquiries**: Automatic price and availability responses
- **Smart suggestions**: Category-based product recommendations
- **Contact integration**: Direct connection to your business

### Monitoring & Analytics
- Check Google Merchant Center "Performance" tab
- Monitor Google Business Profile insights
- Track website traffic from Google Shopping
- Review message response rates and conversion

## 🆘 Troubleshooting

### Common Issues

**"Feed not processing"**
- Verify HTTPS certificate is valid
- Check XML syntax at feed URL
- Ensure all required product fields are present

**"Products not showing in Business Profile"**  
- Confirm Business Profile is verified
- Check Merchant Center account linking
- Verify local inventory ads program enrollment

**"Business Messages not working"**
- Test webhook endpoint manually
- Verify webhook secret configuration
- Check response format matches Google requirements

### Support Resources
- [Google Merchant Center Help](https://support.google.com/merchants)
- [Google Business Profile Help](https://support.google.com/business)
- [Business Messages Documentation](https://developers.google.com/business-messages)

---

## 📞 Next Steps

1. **Complete Google account setups** (Merchant Center + Business Profile)
2. **Update business information** in ProductStructuredData.tsx
3. **Add structured data** to your product pages
4. **Test all endpoints** and validate feeds
5. **Submit for Google review** and monitor diagnostics

Your robust product structure gives you a significant advantage - most of the hard work is already done! 🎉