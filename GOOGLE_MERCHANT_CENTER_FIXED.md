# Google Merchant Center - Product Feed Setup Guide

## ✅ What's Been Fixed

Your product feed is now properly configured and ready for Google Merchant Center!

### Issues Resolved:
1. ✅ **Static XML file created** - Google can now find your products at `/products.xml`
2. ✅ **Currency fixed** - Changed from USD to TZS (Tanzanian Shillings)
3. ✅ **Country corrected** - Set to Tanzania (TZ) instead of US
4. ✅ **Robots.txt updated** - Google can now crawl the product feed
5. ✅ **292 valid products** included in the feed

## 🌐 Your Product Feed URL

```
https://quardcube.vercel.app/products.xml
```

## 📋 Google Merchant Center Setup Steps

### Step 1: Access Google Merchant Center

1. Go to [merchants.google.com](https://merchants.google.com)
2. Sign in with your Google account
3. Create a new Merchant Center account if you haven't already
4. **Important**: Select **Tanzania (TZ)** as your target country
5. Set currency to **TZS (Tanzanian Shilling)**

### Step 2: Verify Your Website

1. In Merchant Center, go to **"Tools & Settings"** → **"Business information"**
2. Add your website: `https://quardcube.vercel.app`
3. Choose a verification method:
   - **HTML tag** (recommended - add to your website's `<head>`)
   - **HTML file upload**
   - **Google Analytics**
   - **Google Tag Manager**
4. Complete verification

### Step 3: Add Product Feed

1. In Merchant Center, click **"Products"** → **"Feeds"**
2. Click the **"+"** button to create a new feed
3. Select **"Primary feed"**
4. Configure feed settings:
   - **Country**: Tanzania
   - **Language**: English
   - **Destinations**: Select "Free listings" (and/or "Shopping ads" if running ads)
   - **Name**: "QuadCube Labs Products"

### Step 4: Set Up Feed Fetch

1. Choose **"Scheduled fetch"** method
2. Enter feed URL: `https://quardcube.vercel.app/products.xml`
3. Set fetch schedule:
   - **Frequency**: Daily
   - **Time**: 2:00 AM (or your preferred time)
   - **Time zone**: Tanzania
4. Click **"Create feed"**

### Step 5: Wait for Initial Processing

1. Google will fetch your feed (may take a few minutes to hours)
2. Check the **"Processing"** tab to see progress
3. Once processed, check the **"Diagnostics"** tab for any issues

## 🔄 Updating Products

### When You Add/Update Products in Database

Run one of these commands to regenerate the feed:

```bash
# Using npm
npm run generate-feed

# Using PowerShell script
.\update-products.ps1

# Using Node directly
node scripts/generate-product-feed.js
```

### Deployment Steps

1. **Commit changes**:
   ```bash
   git add public/products.xml
   git commit -m "Update product feed"
   git push
   ```

2. **Auto-deploy**: Vercel will automatically deploy the updated feed

3. **Google updates**: Google will fetch the updated feed on the next scheduled time

## 🎯 Product Feed Requirements Met

Your feed now meets all Google Merchant Center requirements:

### Required Fields ✅
- ✅ **id** - Unique product ID (QCL_XXX)
- ✅ **title** - Product name
- ✅ **description** - Product details
- ✅ **link** - Product page URL
- ✅ **image_link** - Main product image
- ✅ **availability** - In stock / Out of stock
- ✅ **price** - Price in TZS
- ✅ **condition** - New
- ✅ **brand** - QuadCube Labs

### Recommended Fields ✅
- ✅ **additional_image_link** - Extra product images (up to 10)
- ✅ **product_type** - Category (Laptops, Desktops, etc.)
- ✅ **google_product_category** - Electronics
- ✅ **mpn** - Manufacturer Part Number
- ✅ **shipping** - Shipping info for Tanzania
- ✅ **product_highlight** - Key features
- ✅ **custom_labels** - Product organization (Top Rated, In Stock, etc.)

## 🔍 Troubleshooting

### Feed Not Found Error
If Google still shows "File not found":
1. Verify the feed is live: Visit `https://quardcube.vercel.app/products.xml` in browser
2. Check if the file was deployed to Vercel (commit and push)
3. Wait 5-10 minutes after deployment before retesting
4. Use "Fetch now" button in Google Merchant Center

### Invalid Currency
- ✅ **Fixed**: Feed now uses TZS instead of USD
- Your prices are in Tanzanian Shillings (e.g., 3,996,000 TZS)

### Invalid Country
- ✅ **Fixed**: Feed now targets Tanzania (TZ)
- Shipping configured for Tanzania

### Image Issues
If images aren't loading:
1. Check that images are publicly accessible
2. Images must be HTTPS URLs
3. Minimum 100x100 pixels, recommended 800x800+

### Product Disapprovals
Common reasons and fixes:
- **Missing GTIN**: ✅ Set to `identifier_exists: false` (correct for unique products)
- **Invalid price**: ✅ Using proper TZS format
- **Missing shipping**: ✅ Shipping info included
- **Image quality**: Ensure product images are clear and high-quality

## 📊 Monitoring Your Feed

### Check Feed Status
1. Go to **"Products"** → **"Feeds"**
2. Click on "QuadCube Labs Products"
3. Check the **"Diagnostics"** tab for:
   - Total products uploaded
   - Active products
   - Errors or warnings
   - Product disapprovals

### View Products in Google Search
After approval (1-3 business days):
1. Search for your products on Google
2. Look for the "Free listings" tab in Google Search
3. Your products should appear in search results

## 🎉 Expected Timeline

- **Feed fetch**: Immediate (on schedule or manual fetch)
- **Processing**: 5-30 minutes
- **Initial review**: 1-3 business days
- **Products live on Google**: After approval

## 🔗 Useful Links

- [Google Merchant Center](https://merchants.google.com)
- [Product Feed Specifications](https://support.google.com/merchants/answer/7052112)
- [Feed Troubleshooting](https://support.google.com/merchants/answer/160591)
- [Product Data Specification](https://support.google.com/merchants/answer/7052112)

## 📝 Quick Reference

| Action | Command |
|--------|---------|
| Generate feed | `npm run generate-feed` |
| Update products | `.\update-products.ps1` |
| View feed | `https://quardcube.vercel.app/products.xml` |
| Feed location | `public/products.xml` |
| Products in feed | 292 |
| Currency | TZS (Tanzanian Shillings) |
| Target country | Tanzania (TZ) |

---

## 🚀 Next Steps

1. ✅ Product feed generated (292 products)
2. ✅ robots.txt updated to allow Google access
3. ⏳ **Deploy to Vercel** - Commit and push changes
4. ⏳ **Configure Google Merchant Center** - Follow steps above
5. ⏳ **Add feed URL** - Use `https://quardcube.vercel.app/products.xml`
6. ⏳ **Wait for approval** - 1-3 business days

Your product feed is now ready for Google! 🎯
