# Google Maps Integration Setup Guide

This guide explains how to set up Google Maps on the contact page to replace the live location functionality.

## What Was Changed

### ✅ Removed:
- Live geolocation tracking
- Dynamic location fetching
- User location permission requests
- OpenStreetMap fallback iframe

### ✅ Added:
- Professional Google Maps component
- Fixed company location (Dar es Salaam, Tanzania)
- Custom map styling with company branding
- Interactive map with company marker and info window

## Setup Instructions

### 1. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Maps JavaScript API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Maps JavaScript API"
   - Click "Enable"

4. Create API credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy your API key

5. Restrict your API key (recommended):
   - Click on your API key to edit
   - Under "Application restrictions", select "HTTP referrers"
   - Add your domain: `localhost:3000/*` for development
   - Under "API restrictions", select "Restrict key"
   - Choose "Maps JavaScript API"

### 2. Configure Environment Variables

Add your API key to `.env.local`:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-actual-api-key-here
```

**Important**: The API key must be prefixed with `NEXT_PUBLIC_` to be accessible in the browser.

### 3. Customize Map Settings

You can customize the map by editing `components/google-map.tsx`:

```tsx
// Change company location
center={{ lat: -6.8001, lng: 39.2834 }} // Current: Dar es Salaam

// Adjust zoom level
zoom={15} // Higher = closer view

// Modify map styling
styles: [
  // Add your custom map styles here
]
```

### 4. Update Company Information

In `app/contact/page.tsx`, update the company details:

```tsx
// In the GoogleMap component
<GoogleMap
  center={{ lat: YOUR_LAT, lng: YOUR_LNG }}
  zoom={15}
  className="w-full h-96"
/>

// In the info section
<p className="text-sm text-navy/70 mb-2">
  <span className="font-medium">Address:</span> Your Company Address
</p>
```

## Features

### 🗺️ Interactive Map
- Zoom in/out controls
- Street view access
- Full-screen mode
- Map type switching (satellite, terrain)

### 📍 Company Marker
- Custom styled marker for company location
- Info window with company details
- Click to show company information

### 🎨 Custom Styling
- Company brand colors
- Professional appearance
- Responsive design
- Smooth animations

### 📱 Mobile Responsive
- Touch-friendly controls
- Optimized for mobile devices
- Maintains functionality across screen sizes

## Troubleshooting

### Map Not Loading
1. **Check API Key**: Ensure `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set correctly
2. **API Restrictions**: Verify your domain is allowed in API key restrictions
3. **Billing**: Ensure Google Cloud billing is enabled (required for Maps API)
4. **Console Errors**: Check browser console for specific error messages

### Common Errors

**"This page can't load Google Maps correctly"**
- Solution: Check API key and billing setup

**"RefererNotAllowedMapError"**
- Solution: Add your domain to API key restrictions

**"ApiNotActivatedMapError"**
- Solution: Enable Maps JavaScript API in Google Cloud Console

### Fallback Content
If the map fails to load, users will see:
- Loading spinner with message
- Error message with troubleshooting hint
- Company address information still displayed

## Cost Considerations

Google Maps JavaScript API pricing (as of 2024):
- **Free tier**: 28,000 map loads per month
- **Cost**: $7 per 1,000 additional map loads
- **Recommendation**: Set up billing alerts and usage limits

## Development vs Production

### Development
```env
# .env.local
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-development-key
```

### Production
```env
# Production environment
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-production-key
```

Make sure to use different API keys with appropriate domain restrictions for each environment.

## Privacy & Performance

### Privacy Improvements
- ✅ No user location tracking
- ✅ No geolocation permissions required
- ✅ No third-party location APIs
- ✅ GDPR compliant (no personal data collection)

### Performance Benefits
- ✅ Faster page load (no geolocation delays)
- ✅ Reliable map display
- ✅ No fallback complexity
- ✅ Cached map resources

## Testing

1. **Local Testing**:
   ```bash
   npm run dev
   # Visit http://localhost:3000/contact
   ```

2. **API Key Validation**:
   - Map should load without errors
   - Marker should be visible
   - Info window should work on click

3. **Mobile Testing**:
   - Test on various screen sizes
   - Verify touch controls work
   - Check responsive layout

## Alternative Solutions

If you prefer not to use Google Maps:

### Option 1: OpenStreetMap (Free)
```tsx
// Replace GoogleMap component with iframe
<iframe
  src="https://www.openstreetmap.org/export/embed.html?bbox=39.263,6.815,39.303,-6.785&marker=-6.8001,39.2834"
  className="w-full h-96"
/>
```

### Option 2: Static Map Image
```tsx
<img
  src={`https://maps.googleapis.com/maps/api/staticmap?center=-6.8001,39.2834&zoom=15&size=800x400&markers=-6.8001,39.2834&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
  alt="QuardCube Labs Location"
  className="w-full h-96 object-cover rounded-lg"
/>
```

---

The Google Maps integration is now ready! Users can easily find your company location without any privacy concerns or complex geolocation setup.
