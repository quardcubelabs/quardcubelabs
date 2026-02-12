# Setup Products and Categories System
# Run this script to initialize the database tables and test the system

Write-Host "Setting up products and categories system..." -ForegroundColor Green

Write-Host "`n1. Database Migration:" -ForegroundColor Yellow
Write-Host "   - You need to run the migration file in your Supabase SQL Editor"
Write-Host "   - File: db/migrations/0010_create_products_and_categories.sql"
Write-Host "   - This will create the products and categories tables"

Write-Host "`n2. API Endpoints Created:" -ForegroundColor Yellow
Write-Host "   - GET/POST /api/products - List all products / Create product"
Write-Host "   - GET/PUT/DELETE /api/products/[id] - Get/Update/Delete specific product"
Write-Host "   - GET/POST /api/categories - List all categories / Create category"

Write-Host "`n3. Testing Steps:" -ForegroundColor Yellow
Write-Host "   a. Run migration in Supabase SQL Editor"
Write-Host "   b. Start your development server: npm run dev"
Write-Host "   c. Go to /admin/products to create a new product"
Write-Host "   d. Go to /shop to view products on the store page"

Write-Host "`n4. Common Issues & Solutions:" -ForegroundColor Yellow
Write-Host "   - Shop page not loading: Make sure Supabase connection is working"
Write-Host "   - Can't create products: Check user permissions (admin role required)"
Write-Host "   - Images not showing: Ensure image URLs are valid and accessible"

Write-Host "`n5. Admin User Setup:" -ForegroundColor Yellow
Write-Host "   - To access admin features, your user needs admin role"
Write-Host "   - In Supabase Auth > Users, add user_metadata: { ""role"": ""admin"" }"

Write-Host "`nReady to test! Run the migration first, then test the admin dashboard and shop page." -ForegroundColor Green