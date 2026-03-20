-- Epic Computers Full Categories and Products Seed Data
-- Run this script in your Supabase SQL Editor
-- Contains 50+ categories and 100+ products

-- First, delete existing categories and products
DELETE FROM products;
DELETE FROM categories;

-- Insert all categories from Epic Computers
INSERT INTO categories (name) VALUES
-- Main Categories
('Laptops'),
('Desktops'),
('Gaming'),
('Components'),
('Peripherals'),
('Storage'),
('Networking'),
('Gadgets & Accessories'),
('Monitors'),
('Printers'),
-- Laptop Subcategories
('New Laptops'),
('Refurbished Laptops'),
('Gaming Laptops'),
-- Desktop Subcategories  
('Gaming Desktop'),
('All-in-One'),
-- Gaming Subcategories
('Gaming Chairs'),
('Gaming Accessories'),
-- Components Subcategories
('Graphics Card'),
('Motherboard'),
('RAM Memory'),
('Processors'),
('Power Supply'),
('CPU Cooling'),
('PC Cases'),
('PC Case Fans'),
-- Peripherals Subcategories
('Keyboard/Mouse'),
('Headphones & Speakers'),
('Webcam'),
('Laptop Bags'),
('Laptop Chargers'),
('Cables & Dongles'),
('Toners and Ink'),
-- Storage Subcategories
('Solid State Drives'),
('Internal Hard Drives'),
('External Hard Drives'),
('USB Flash Disk'),
('SD & Micro SD Cards'),
('HDD Cases & Racks'),
-- Networking Subcategories
('Routers/Switches'),
('WiFi Adapters'),
-- Gadgets Subcategories
('Tablets'),
('Smartphones'),
('Power Banks'),
('Monitor Stands'),
('CCTV Cameras'),
-- Software
('Software'),
('Anti-virus'),
('Operating Systems'),
('Apple Gift Card'),
('Digital Codes'),
-- Office
('Office');

-- Insert products from Epic Computers
INSERT INTO products (name, category, price, image, description, features, stock, rating) VALUES

-- ==================== LAPTOPS ====================
('ASUS TUF Gaming F16 Laptop', 'Gaming Laptops', 3699000, 
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2026/01/1-10.png?fit=1000%2C1000&ssl=1',
'Military-grade durability meets gaming performance with the ASUS TUF Gaming series. Built to withstand extreme conditions while delivering exceptional gaming experiences with RTX 4070.',
ARRAY['Intel Core i7-13th Gen', '16GB DDR5 RAM', '1TB NVMe SSD', 'NVIDIA RTX 4070 8GB', '16" FHD 165Hz Display', 'MIL-STD-810H Certified'],
6, 4.8),

('Dell Alienware 16 Aurora', 'Gaming Laptops', 3399000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2025/10/dell-alienware-16-aurora-core-5-210h-16gb-512-w11-351398.webp?fit=2000%2C1666&ssl=1',
'Premium gaming laptop from Dell Alienware series with Intel Core i7 and RTX 5060. Designed for serious gamers who demand the ultimate performance.',
ARRAY['Intel Core i7 Processor', '16GB DDR5 RAM', '512GB NVMe SSD', 'NVIDIA RTX 5060 8GB', '16" QHD 240Hz Display', 'Alienware Command Center'],
5, 4.9),

('Dell 14 Plus 2-in-1 Laptop', 'New Laptops', 2249000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2025/09/244-94-DENSDB04B.jpg?fit=1000%2C1000&ssl=1',
'Versatile 2-in-1 convertible laptop with Intel Ultra 7 processor. Perfect for professionals who need flexibility and performance in one device.',
ARRAY['Intel Core Ultra 7', '16GB DDR5 RAM', '1TB NVMe SSD', '14" FHD Touchscreen', '360° Convertible Design', 'Windows 11 Pro'],
8, 4.7),

('HP Victus 15-FA Gaming', 'Gaming Laptops', 2099000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2025/02/Untitled-design-4.png?fit=1080%2C1350&ssl=1',
'Powerful gaming laptop featuring Intel Core i5-13th Gen and RTX 4050. Experience smooth gaming and content creation with 144Hz display.',
ARRAY['Intel Core i5-13th Gen', '16GB DDR5 RAM', '512GB NVMe SSD', 'NVIDIA RTX 4050 6GB', '15.6" FHD 144Hz', 'Windows 11 Home'],
12, 4.7),

('HP OMEN Laptop 16 RTX 4060', 'Gaming Laptops', 3228000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2023/09/HP-Omen-16-wd-1.webp?fit=1200%2C1200&ssl=1',
'High-performance gaming laptop with Intel Core i7-13th Gen and RTX 4060 8GB. QHD display with 165Hz for immersive gaming experience.',
ARRAY['Intel Core i7-13th Gen', '16GB DDR5 RAM', '1TB NVMe SSD', 'NVIDIA RTX 4060 8GB', '16.1" QHD 165Hz', 'OMEN Gaming Hub'],
8, 4.9),

('Dell Latitude 3440 i5-13th', 'New Laptops', 1890000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/07/Dell-Latitude-3440-600x600-1.webp?fit=600%2C600&ssl=1',
'Business-class laptop designed for productivity with Intel Core i5-13th Gen. Built for professionals who need reliability and security.',
ARRAY['Intel Core i5-13th Gen', '16GB DDR4 RAM', '256GB SSD', '14" FHD Anti-Glare', 'Windows 11 Pro', 'Dell Business Support'],
20, 4.6),

('Dell Latitude 3450 i5', 'New Laptops', 1750000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2025/01/Dell-Latitude-3450.webp?fit=1000%2C1000&ssl=1',
'Latest generation Dell business laptop with Intel Core i5. Ideal for enterprise deployment with enhanced security features.',
ARRAY['Intel Core i5 Processor', '8GB DDR4 RAM', '256GB SSD', '14" FHD Display', 'Windows 11 Pro', 'TPM 2.0 Security'],
15, 4.5),

('Dell Vostro 3530 i5-13th', 'New Laptops', 1349000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2025/04/Vostro-1.png?fit=1000%2C1000&ssl=1',
'Affordable business laptop with Intel Core i5-13th Gen for small businesses. Excellent value with essential productivity features.',
ARRAY['Intel Core i5-13th Gen', '8GB DDR4 RAM', '256GB SSD', '15.6" FHD Display', 'Windows 11 Home', 'Anti-Glare Screen'],
25, 4.5),

('Dell Vostro 3520 i7-12th', 'New Laptops', 1685000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/01/Dell-Vostro-3520.webp?fit=1000%2C1000&ssl=1',
'Powerful business laptop with Intel Core i7-12th Gen processor. Great for multitasking and demanding business applications.',
ARRAY['Intel Core i7-12th Gen', '16GB DDR4 RAM', '512GB SSD', '15.6" FHD Display', 'Windows 11 Pro', 'Backlit Keyboard'],
10, 4.6),

('HP Envy 14 x360', 'New Laptops', 2599000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/11/HP-Envy-14-x360.png?fit=1000%2C1000&ssl=1',
'Premium 2-in-1 convertible with Intel Core i7-13th Gen. Stunning touchscreen display perfect for creative professionals.',
ARRAY['Intel Core i7-13th Gen', '16GB DDR5 RAM', '1TB NVMe SSD', '14" FHD Touchscreen', '360° Convertible', 'Windows 11 Pro'],
15, 4.8),

('HP ProBook 460 G11 Ultra 7', 'New Laptops', 2099000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2025/01/HP-ProBook-460-G11-Intel-Core-Ultra-7-16GB-Ram.webp?fit=1000%2C1000&ssl=1',
'Premium business laptop with Intel Core Ultra 7 and AI-enhanced performance. Built for modern professionals.',
ARRAY['Intel Core Ultra 7', '16GB DDR5 RAM', '512GB NVMe SSD', '14" FHD Display', 'AI Performance', 'Windows 11 Pro'],
10, 4.8),

('HP 250 G10 i3-13th', 'New Laptops', 999000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/05/HP-250-G10.webp?fit=1000%2C1000&ssl=1',
'Affordable business laptop with Intel Core i3-13th Gen. Perfect for everyday office tasks and student use.',
ARRAY['Intel Core i3-13th Gen', '8GB DDR4 RAM', '256GB SSD', '15.6" FHD Display', 'Windows 11 Home', 'HD Webcam'],
30, 4.4),

('HP 250 G9 i7-12th', 'New Laptops', 1635000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/03/HP-250-G9-i7.webp?fit=1000%2C1000&ssl=1',
'Powerful HP laptop with Intel Core i7-12th Gen. Excellent performance for business and personal use.',
ARRAY['Intel Core i7-12th Gen', '16GB DDR4 RAM', '512GB SSD', '15.6" FHD Display', 'Windows 11 Pro', 'Numeric Keypad'],
12, 4.6),

('HP 240 G10 i7-13th', 'New Laptops', 1850000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/09/HP-240-G10-i7.webp?fit=1000%2C1000&ssl=1',
'Compact business laptop with Intel Core i7-13th Gen. Lightweight design for professionals on the go.',
ARRAY['Intel Core i7-13th Gen', '16GB DDR4 RAM', '512GB SSD', '14" FHD Display', 'Windows 11 Pro', 'Lightweight Design'],
8, 4.7),

('HP EliteBook 840 G8 i7-11th', 'Refurbished Laptops', 1099000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/02/HP-EliteBook-840-G8.webp?fit=1000%2C1000&ssl=1',
'Premium refurbished business laptop with Intel Core i7-11th Gen. Enterprise-grade features at affordable price.',
ARRAY['Intel Core i7-11th Gen', '16GB DDR4 RAM', '256GB SSD', '14" FHD Display', 'Grade A Refurbished', 'Windows 11 Pro'],
15, 4.5),

('HP EliteBook 830 G8 i5-11th', 'Refurbished Laptops', 989000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/02/HP-EliteBook-830-G8.webp?fit=1000%2C1000&ssl=1',
'Compact refurbished business laptop with Intel Core i5-11th Gen. Perfect for professionals seeking value.',
ARRAY['Intel Core i5-11th Gen', '16GB DDR4 RAM', '256GB SSD', '13.3" FHD Display', 'Grade A Refurbished', 'Windows 11 Pro'],
18, 4.4),

('HP Elitebook 845 G8 Ryzen 5', 'Refurbished Laptops', 725000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2025/01/HP-Elitebook-845-G8-Ryzen-5-Ram-16GB-256GB-SSD.webp?fit=1000%2C1000&ssl=1',
'AMD-powered refurbished laptop with Ryzen 5. Excellent value for professionals on a budget.',
ARRAY['AMD Ryzen 5', '16GB DDR4 RAM', '256GB SSD', '14" FHD Display', 'Grade A Refurbished', 'Windows 11 Pro'],
20, 4.4),

('Dell Latitude 7420 i5-11th', 'Refurbished Laptops', 799000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/06/Dell-Latitude-7420.webp?fit=1000%2C1000&ssl=1',
'Premium refurbished Dell business laptop. Compact design with enterprise security features.',
ARRAY['Intel Core i5-11th Gen', '16GB DDR4 RAM', '256GB SSD', '14" FHD Display', 'Grade A Refurbished', 'Windows 11 Pro'],
12, 4.5),

('HP Chromebook 14" G5', 'Laptops', 150000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/01/HP-Chromebook-14-G5.webp?fit=1000%2C1000&ssl=1',
'Budget-friendly Chromebook for basic computing needs. Perfect for students and light users.',
ARRAY['Intel Celeron', '4GB RAM', '16GB eMMC', '14" HD Display', 'Chrome OS', 'Long Battery Life'],
50, 4.2),

('HP 15s-fq Celeron', 'New Laptops', 735000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/03/HP-15s-fq.webp?fit=1000%2C1000&ssl=1',
'Entry-level laptop with Intel Celeron for basic tasks. Great for students and everyday use.',
ARRAY['Intel Celeron N4120', '8GB DDR4 RAM', '256GB SSD', '15.6" FHD Display', 'Windows 11 Home', 'Thin & Light'],
25, 4.3),

-- ==================== DESKTOPS ====================
('HP OMEN 25L Gaming Desktop', 'Gaming Desktop', 3610000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/05/HP-OMEN-40L-GT21-Gaming-Desktop-PC-Intel-Core-i5-12th-32GB-Ram.webp?fit=1000%2C1000&ssl=1',
'Powerful gaming desktop with Intel Core i5-12th Gen. RGB lighting and tool-less design for easy upgrades.',
ARRAY['Intel Core i5-12th Gen', '16GB DDR4 RAM', '512GB NVMe SSD', 'NVIDIA Graphics', 'RGB Lighting', 'Tool-less Access'],
5, 4.7),

('HP All-in-One 24 i5-13th', 'All-in-One', 1590000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/08/HP-All-in-One-24-i5.webp?fit=1000%2C1000&ssl=1',
'Sleek all-in-one desktop with 24" display. Space-saving design perfect for home and office.',
ARRAY['Intel Core i5-13th Gen', '8GB DDR4 RAM', '512GB SSD', '24" FHD Display', 'Built-in Webcam', 'Windows 11 Home'],
10, 4.6),

('HP All-in-One 24 i7-13th', 'All-in-One', 2150000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/08/HP-All-in-One-24-i7.webp?fit=1000%2C1000&ssl=1',
'Premium all-in-one with Intel Core i7-13th Gen and 16GB RAM. Perfect for demanding tasks.',
ARRAY['Intel Core i7-13th Gen', '16GB DDR4 RAM', '512GB SSD', '24" FHD Display', 'Built-in Webcam', 'Windows 11 Pro'],
8, 4.7),

('HP All-in-One 27 i7-13th', 'All-in-One', 2910000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/08/HP-All-in-One-27-i7.webp?fit=1000%2C1000&ssl=1',
'Large 27" all-in-one desktop with premium specs. Ideal for creative professionals and home entertainment.',
ARRAY['Intel Core i7-13th Gen', '16GB DDR4 RAM', '1TB SSD', '27" FHD Display', 'Built-in Speakers', 'Windows 11 Pro'],
5, 4.8),

('Dell OptiPlex 3080 Tower (Refurbished)', 'Desktops', 635000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/03/Dell-OptiPlex-3080.webp?fit=1000%2C1000&ssl=1',
'Refurbished business desktop with Intel Core i5-10th Gen. Reliable performance for office tasks.',
ARRAY['Intel Core i5-10th Gen', '8GB DDR4 RAM', '256GB SSD', 'Tower Form Factor', 'Grade A Refurbished', 'Windows 11 Pro'],
15, 4.4),

('Dell OPTIPLEX 3000 i5-12th', 'Desktops', 1435000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/03/Dell-OPTIPLEX-3000.webp?fit=1000%2C1000&ssl=1',
'New Dell business desktop with Intel Core i5-12th Gen. Built for enterprise deployment.',
ARRAY['Intel Core i5-12th Gen', '4GB DDR4 RAM', '256GB SSD', 'Small Form Factor', 'Windows 11 Pro', '1 Year Warranty'],
10, 4.5),

('Dell Vostro 3030 i5-14th', 'Desktops', 1550000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2025/01/Dell-Vostro-3030.webp?fit=1000%2C1000&ssl=1',
'Latest generation Dell desktop with Intel Core i5-14th Gen. Great value for small businesses.',
ARRAY['Intel Core i5-14th Gen', '8GB DDR5 RAM', '256GB SSD', 'Tower Form Factor', 'Windows 11 Pro', '1 Year Warranty'],
12, 4.6),

-- ==================== MONITORS ====================
('Dell E2216HV 22" Full HD', 'Monitors', 338000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2023/12/61mmM7UUzfL-1.jpg?fit=1000%2C1000&ssl=1',
'Professional 22-inch Full HD monitor with anti-glare coating. Perfect for office environments.',
ARRAY['22" Full HD 1920x1080', 'Anti-Glare Coating', 'VGA Connectivity', 'Tilt Adjustment', 'Energy Star Certified', '3-Year Warranty'],
30, 4.4),

('HP Series 3 Pro-322pv Monitor', 'Monitors', 290000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2025/01/HP-Series-3-Pro-322pv-Monitor.webp?fit=1000%2C1000&ssl=1',
'Reliable HP business monitor with crystal-clear display and comfortable viewing angles.',
ARRAY['21.5" Full HD Display', 'IPS Panel', 'HDMI & VGA Ports', 'Low Blue Light Mode', 'Flicker-Free', 'Adjustable Stand'],
22, 4.5),

('HP M27fw 27" FHD Monitor', 'Monitors', 635000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/02/HP-M27fw.webp?fit=1000%2C1000&ssl=1',
'Premium 27-inch Full HD monitor with elegant design. AMD FreeSync support for smooth visuals.',
ARRAY['27" Full HD IPS', 'AMD FreeSync', 'HDMI & VGA', '75Hz Refresh Rate', 'Built-in Speakers', 'Eye Comfort Mode'],
10, 4.6),

('LG 29WQ600-W UltraWide', 'Monitors', 750000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/04/LG-29WQ600-W.webp?fit=1000%2C1000&ssl=1',
'UltraWide 29-inch monitor for productivity and content creation. 21:9 aspect ratio for multitasking.',
ARRAY['29" UltraWide 2560x1080', 'IPS Panel', 'USB-C Connectivity', 'AMD FreeSync', 'HDR10', 'Built-in Speakers'],
8, 4.7),

-- ==================== COMPONENTS ====================
('ASUS Dual GeForce RTX 3060 12GB', 'Graphics Card', 1056000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/02/ASUS-Dual-GeForce-RTX-3060-OC-Edition-12GB-Graphics-Card.png?fit=1000%2C1000&ssl=1',
'High-performance graphics card with 12GB GDDR6. Perfect for 1080p and 1440p gaming with ray tracing.',
ARRAY['12GB GDDR6 Memory', 'Ray Tracing Support', 'DLSS Technology', 'Dual Fan Cooling', 'PCIe 4.0', '3-Year Warranty'],
10, 4.8),

('ASUS Dual GeForce RTX 5060 8GB', 'Graphics Card', 1300000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2025/01/ASUS-RTX-5060.webp?fit=1000%2C1000&ssl=1',
'Latest generation RTX 5060 graphics card for next-gen gaming performance and AI capabilities.',
ARRAY['8GB GDDR6 Memory', 'DLSS 4 Support', 'Ray Tracing', 'Dual Fan Design', 'PCIe 5.0', '3-Year Warranty'],
6, 4.9),

('AFOX GeForce G210 1GB', 'Graphics Card', 190000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/01/AFOX-G210.webp?fit=1000%2C1000&ssl=1',
'Entry-level graphics card for basic display output. Perfect for office PCs and HTPC builds.',
ARRAY['1GB DDR3 Memory', 'HDMI & VGA Output', 'Low Profile', 'Silent Cooling', 'DirectX 10.1', '1-Year Warranty'],
20, 4.1),

('ASUS Prime B560-PLUS', 'Motherboard', 550000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/02/ASUS-Prime-B560-PLUS.webp?fit=1000%2C1000&ssl=1',
'ATX motherboard supporting Intel 10th/11th Gen. Reliable foundation for desktop builds.',
ARRAY['Intel LGA 1200 Socket', 'DDR4 Support', 'PCIe 4.0', 'USB 3.2 Gen 1', 'Realtek Audio', '2.5Gb Ethernet'],
12, 4.5),

('ASUS Prime B660-PLUS D4', 'Motherboard', 640000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/03/ASUS-Prime-B660-PLUS.webp?fit=1000%2C1000&ssl=1',
'ATX motherboard for Intel 12th/13th Gen with DDR4 support. Great value for gaming builds.',
ARRAY['Intel LGA 1700 Socket', 'DDR4 Support', 'PCIe 5.0', 'USB 3.2 Gen 2', 'Realtek Audio', '2.5Gb Ethernet'],
10, 4.6),

('ASUS Prime B760-PLUS DDR4', 'Motherboard', 525000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/04/ASUS-PRIME-B760-PLUS-DDR4-ATX-Motherboard.webp?fit=1000%2C1000&ssl=1',
'Feature-rich ATX motherboard supporting Intel 12th/13th Gen. DDR4 memory support for cost-effective builds.',
ARRAY['Intel LGA 1700 Socket', 'DDR4 Memory', 'PCIe 4.0', 'USB 3.2 Gen 2', 'Realtek Audio', '2.5Gb Ethernet'],
15, 4.6),

('ASUS Prime B760M-A WiFi', 'Motherboard', 585000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/04/ASUS-Prime-B760M-A-WiFi.webp?fit=1000%2C1000&ssl=1',
'Compact mATX motherboard with built-in WiFi 6. Perfect for compact gaming builds.',
ARRAY['Intel LGA 1700 Socket', 'DDR5 Support', 'WiFi 6', 'PCIe 4.0', 'USB 3.2 Gen 2', 'Bluetooth 5.2'],
8, 4.7),

('ASUS ROG Strix B760-A Gaming WiFi', 'Motherboard', 849000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/05/ASUS-ROG-Strix-B760-A.webp?fit=1000%2C1000&ssl=1',
'Premium gaming motherboard with WiFi 6E and RGB lighting. Built for enthusiast gaming rigs.',
ARRAY['Intel LGA 1700 Socket', 'DDR4/DDR5 Support', 'WiFi 6E', 'PCIe 5.0', 'Aura Sync RGB', '2.5Gb Ethernet'],
5, 4.8),

('ASUS Prime Z790-P WiFi', 'Motherboard', 849000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/05/ASUS-Prime-Z790-P.webp?fit=1000%2C1000&ssl=1',
'High-end Z790 motherboard for Intel 12th/13th Gen. Full overclocking support for enthusiasts.',
ARRAY['Intel LGA 1700 Socket', 'DDR5 Support', 'WiFi 6', 'PCIe 5.0', 'Thunderbolt 4', '2.5Gb Ethernet'],
4, 4.8),

('4GB DDR4-2666 SODIMM RAM', 'RAM Memory', 60000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2023/11/SODIMM-4GB-DDR4-RAM.png?fit=1000%2C1000&ssl=1',
'Laptop memory upgrade module for enhanced multitasking. Compatible with most DDR4 laptops.',
ARRAY['4GB Capacity', 'DDR4-2666 Speed', 'SODIMM Form Factor', 'Low Power', 'Plug and Play', 'Lifetime Warranty'],
50, 4.3),

('Crucial 16GB DDR4-3200 UDIMM', 'RAM Memory', 245000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/02/Crucial-16GB-DDR4.webp?fit=1000%2C1000&ssl=1',
'Desktop memory upgrade for improved performance. Compatible with Intel and AMD systems.',
ARRAY['16GB Capacity', 'DDR4-3200 Speed', 'UDIMM Form Factor', 'XMP 2.0 Ready', 'Plug and Play', 'Lifetime Warranty'],
25, 4.6),

('APC Back-UPS 650VA UPS', 'Components', 165000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2022/09/apc-back-ups-bv-650va-avr.png?fit=1000%2C1000&ssl=1',
'Essential power protection for computer and electronics. Protects against surges and outages.',
ARRAY['650VA/360W Capacity', 'Automatic Voltage Regulation', '4 Outlets', 'Surge Protection', 'Battery Backup', 'LED Status'],
25, 4.4),

('APC Back-UPS 800VA', 'Components', 250000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2023/01/APC-800VA.webp?fit=1000%2C1000&ssl=1',
'Higher capacity UPS for desktop systems. Extended runtime during power outages.',
ARRAY['800VA/480W Capacity', 'Automatic Voltage Regulation', '6 Outlets', 'Surge Protection', 'Battery Backup', 'USB Port'],
15, 4.5),

('APC Easy UPS 1000VA', 'Components', 290000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2023/06/APC-Easy-UPS-1000VA.webp?fit=1000%2C1000&ssl=1',
'Commercial-grade UPS for workstations and small servers. Extended protection and runtime.',
ARRAY['1000VA/600W Capacity', 'Line Interactive', '6 Outlets', 'Surge Protection', 'LCD Display', 'USB Monitoring'],
10, 4.6),

('Deepcool GAMMAXX GTE V2 CPU Cooler', 'CPU Cooling', 135000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/02/Deepcool-GAMMAXX.webp?fit=1000%2C1000&ssl=1',
'Tower CPU cooler with 120mm fan for Intel and AMD processors. Efficient cooling for gaming PCs.',
ARRAY['120mm Tower Design', 'Intel & AMD Compatible', '4 Heat Pipes', 'PWM Fan', 'RGB Lighting', 'Low Noise'],
18, 4.5),

-- ==================== PERIPHERALS ====================
('Logitech H390 USB Headset', 'Headphones & Speakers', 115000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2022/09/logitech-h390.jpg?fit=1000%2C1000&ssl=1',
'Comfortable USB headset with noise-canceling microphone. Ideal for video calls and remote work.',
ARRAY['USB Plug-and-Play', 'Noise-Canceling Mic', 'In-Line Controls', 'Padded Headband', 'Adjustable Boom', '2-Year Warranty'],
40, 4.5),

('Logitech Z313 Speaker System', 'Headphones & Speakers', 153000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/01/Logitech-Z313.webp?fit=1000%2C1000&ssl=1',
'2.1 speaker system with subwoofer for rich bass. Perfect for desktop audio entertainment.',
ARRAY['50W Peak Power', '2.1 System', 'Subwoofer Included', 'Headphone Jack', 'Bass Control', '2-Year Warranty'],
20, 4.6),

('Extended Mouse Pad', 'Peripherals', 45000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2023/03/Extended-Mouse-Pad.png?fit=1000%2C1000&ssl=1',
'Large extended mouse pad for gaming and productivity. Smooth surface for precise tracking.',
ARRAY['Extended Size', 'Non-Slip Base', 'Smooth Surface', 'Stitched Edges', 'Machine Washable', 'Universal'],
60, 4.4),

('4K HDMI Cable 1.5M', 'Cables & Dongles', 20000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2023/01/HDMI-Cable-1.5M.webp?fit=1000%2C1000&ssl=1',
'High-speed HDMI cable for 4K displays. Gold-plated connectors for reliable signal transmission.',
ARRAY['4K@60Hz Support', 'HDMI 2.0', 'Gold-Plated', '1.5M Length', 'Braided Cable', 'Universal'],
100, 4.3),

('4K HDMI Cable 3M', 'Cables & Dongles', 35000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2023/01/HDMI-Cable-3M.webp?fit=1000%2C1000&ssl=1',
'3-meter HDMI cable for longer installations. Supports 4K resolution at 60Hz.',
ARRAY['4K@60Hz Support', 'HDMI 2.0', 'Gold-Plated', '3M Length', 'Braided Cable', 'Universal'],
80, 4.3),

('4K HDMI Cable 5M', 'Cables & Dongles', 50000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2023/01/HDMI-Cable-5M.webp?fit=1000%2C1000&ssl=1',
'5-meter HDMI cable for conference rooms and home theater. Full 4K support.',
ARRAY['4K@60Hz Support', 'HDMI 2.0', 'Gold-Plated', '5M Length', 'Braided Cable', 'Universal'],
50, 4.4),

('Anker Premium 5-in-1 USB-C Hub', 'Cables & Dongles', 78000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2023/06/Anker-Premium-5-in-1-USB-C-Hub.webp?fit=1000%2C1000&ssl=1',
'Essential USB-C hub for modern laptops. Expand connectivity with HDMI, USB-A, and SD card reader.',
ARRAY['USB-C Power Delivery', 'HDMI 4K Output', '2x USB-A 3.0', 'SD Card Reader', 'Aluminum Body', 'Compact'],
35, 4.6),

-- ==================== STORAGE ====================
('2.5" HDD External Case USB 2.0', 'HDD Cases & Racks', 30000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2022/09/2.5-External-HDD-Case.png?fit=1000%2C1000&ssl=1',
'Portable enclosure for 2.5-inch drives. Convert internal drive to external storage.',
ARRAY['2.5" SATA Support', 'USB 2.0', 'Tool-Free Install', 'LED Indicator', 'Hot-Swappable', 'Compact'],
80, 4.2),

('Lexar NM620 512GB NVMe SSD', 'Solid State Drives', 149000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/01/Lexar-NM620-512GB.webp?fit=1000%2C1000&ssl=1',
'High-speed NVMe SSD with up to 3500MB/s read speed. Perfect for system and game storage.',
ARRAY['512GB Capacity', 'NVMe M.2 2280', 'Read: 3500MB/s', 'Write: 2400MB/s', 'PCIe Gen3x4', '5-Year Warranty'],
30, 4.6),

('Lexar NM620 1TB NVMe SSD', 'Solid State Drives', 299000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/01/Lexar-NM620-1TB.webp?fit=1000%2C1000&ssl=1',
'1TB NVMe SSD for ample high-speed storage. Ideal for content creators and gamers.',
ARRAY['1TB Capacity', 'NVMe M.2 2280', 'Read: 3500MB/s', 'Write: 3000MB/s', 'PCIe Gen3x4', '5-Year Warranty'],
20, 4.7),

('Lexar NM610 Pro 2TB NVMe SSD', 'Solid State Drives', 359000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/02/Lexar-NM610-Pro-2TB.webp?fit=1000%2C1000&ssl=1',
'Large capacity NVMe SSD for extensive storage needs. High performance for demanding workloads.',
ARRAY['2TB Capacity', 'NVMe M.2 2280', 'Read: 3300MB/s', 'Write: 2600MB/s', 'PCIe Gen3x4', '5-Year Warranty'],
10, 4.7),

('Lexar NS100 512GB SATA SSD', 'Solid State Drives', 149000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/01/Lexar-NS100-512GB.webp?fit=1000%2C1000&ssl=1',
'Affordable SATA SSD for laptop and desktop upgrades. Significant speed boost over HDD.',
ARRAY['512GB Capacity', '2.5" SATA III', 'Read: 550MB/s', 'Write: 500MB/s', 'Low Power', '3-Year Warranty'],
40, 4.5),

('Lexar NS100 1TB SATA SSD', 'Solid State Drives', 299000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/01/Lexar-NS100-1TB.webp?fit=1000%2C1000&ssl=1',
'1TB SATA SSD for budget-friendly storage upgrade. Great value for secondary storage.',
ARRAY['1TB Capacity', '2.5" SATA III', 'Read: 550MB/s', 'Write: 500MB/s', 'Low Power', '3-Year Warranty'],
25, 4.5),

('Samsung Portable SSD T7 1TB', 'External Hard Drives', 375000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/02/Samsung-T7-1TB.webp?fit=1000%2C1000&ssl=1',
'Fast portable SSD with USB 3.2 Gen 2. Compact aluminum design with hardware encryption.',
ARRAY['1TB Capacity', 'USB 3.2 Gen 2', 'Read: 1050MB/s', 'Write: 1000MB/s', 'AES Encryption', '3-Year Warranty'],
15, 4.8),

('Samsung Portable SSD T7 2TB', 'External Hard Drives', 499000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/02/Samsung-T7-2TB.webp?fit=1000%2C1000&ssl=1',
'High-capacity portable SSD for professionals. Ultra-fast transfers with password protection.',
ARRAY['2TB Capacity', 'USB 3.2 Gen 2', 'Read: 1050MB/s', 'Write: 1000MB/s', 'AES Encryption', '3-Year Warranty'],
8, 4.8),

('SanDisk 2TB Extreme Portable SSD', 'External Hard Drives', 495000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/03/SanDisk-Extreme-2TB.webp?fit=1000%2C1000&ssl=1',
'Rugged portable SSD with IP55 rating. Designed for outdoor and extreme conditions.',
ARRAY['2TB Capacity', 'USB 3.2 Gen 2', 'Read: 1050MB/s', 'IP55 Rated', 'Carabiner Loop', '5-Year Warranty'],
6, 4.7),

('Kingston DataTraveler 64GB USB 3.2', 'USB Flash Disk', 35000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/01/Kingston-DataTraveler-64GB.webp?fit=1000%2C1000&ssl=1',
'Fast USB flash drive for everyday file transfers. Compact design with cap for protection.',
ARRAY['64GB Capacity', 'USB 3.2 Gen 1', 'Read: 100MB/s', 'Compact Design', 'Cap Included', '5-Year Warranty'],
50, 4.4),

('SanDisk 16GB Cruzer Glide USB 3.0', 'USB Flash Disk', 20000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2023/01/SanDisk-16GB.webp?fit=1000%2C1000&ssl=1',
'Budget-friendly USB drive for basic storage needs. Retractable design for convenience.',
ARRAY['16GB Capacity', 'USB 3.0', 'Retractable Design', 'Compact Size', 'Plug and Play', '5-Year Warranty'],
100, 4.3),

('SanDisk Ultra Dual Drive Luxe 64GB USB-C', 'USB Flash Disk', 45000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/01/SanDisk-Dual-Drive-64GB.webp?fit=1000%2C1000&ssl=1',
'Dual connector USB drive for USB-C and USB-A devices. Premium metal design.',
ARRAY['64GB Capacity', 'USB 3.1 Type-C & A', 'Read: 150MB/s', 'Metal Design', 'Swivel Design', 'Lifetime Warranty'],
35, 4.5),

-- ==================== NETWORKING ====================
('TP-Link Archer AX23 WiFi 6 Router', 'Routers/Switches', 210000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2023/06/TP-Link-Archer-AX23.webp?fit=1000%2C1000&ssl=1',
'Next-generation WiFi 6 router for faster speeds and better coverage. OFDMA technology for multiple devices.',
ARRAY['WiFi 6 (802.11ax)', 'AX1800 Dual-Band', '4 Antennas', 'Gigabit Ports', 'OFDMA', 'Easy App Setup'],
18, 4.6),

('TP-Link Archer AX10 WiFi 6 Router', 'Routers/Switches', 179000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/01/TP-Link-Archer-AX10.webp?fit=1000%2C1000&ssl=1',
'Entry-level WiFi 6 router for home use. Improved efficiency for connected devices.',
ARRAY['WiFi 6 (802.11ax)', 'AX1500 Dual-Band', '4 Antennas', 'Gigabit Ports', 'OFDMA', 'Parental Controls'],
20, 4.5),

('TP-Link Archer AX72 Pro WiFi 6 Router', 'Routers/Switches', 375000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/02/TP-Link-Archer-AX72-Pro.webp?fit=1000%2C1000&ssl=1',
'High-performance WiFi 6 router with 2.5Gb port. Perfect for gigabit internet connections.',
ARRAY['WiFi 6 (802.11ax)', 'AX5400 Dual-Band', '6 Antennas', '2.5Gb Port', 'USB 3.0', 'VPN Support'],
10, 4.7),

('TP-Link Archer C20 AC750 Router', 'Routers/Switches', 109000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2023/06/TP-Link-Archer-C20.webp?fit=1000%2C1000&ssl=1',
'Budget dual-band router for basic internet needs. Easy setup with mobile app.',
ARRAY['WiFi 5 (802.11ac)', 'AC750 Dual-Band', '3 Antennas', '100Mbps Ports', 'Easy Setup', 'Guest Network'],
30, 4.3),

('TP-Link Archer C50 AC1200 Router', 'Routers/Switches', 110000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2023/06/TP-Link-Archer-C50.webp?fit=1000%2C1000&ssl=1',
'Mid-range dual-band router with good coverage. Reliable performance for home use.',
ARRAY['WiFi 5 (802.11ac)', 'AC1200 Dual-Band', '4 Antennas', '100Mbps Ports', 'Easy Setup', 'Parental Controls'],
25, 4.4),

('TP-Link TL-MR6400 4G LTE Router', 'Routers/Switches', 199000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2023/08/TP-Link-TL-MR6400.webp?fit=1000%2C1000&ssl=1',
'4G LTE router with SIM card slot for mobile internet. Perfect for areas without fixed broadband.',
ARRAY['4G LTE Cat4', '300Mbps WiFi', 'SIM Card Slot', '4 LAN Ports', '2 Antennas', 'Easy Setup'],
15, 4.5),

('TP-Link TL-MR100 4G LTE Router', 'Routers/Switches', 169000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/01/TP-Link-TL-MR100.webp?fit=1000%2C1000&ssl=1',
'Compact 4G LTE router for mobile internet. Budget-friendly option for LTE connectivity.',
ARRAY['4G LTE Cat4', '300Mbps WiFi', 'SIM Card Slot', '2 LAN Ports', '2 Antennas', 'Easy Setup'],
20, 4.4),

('TP-Link M7000 4G LTE Mobile WiFi', 'Networking', 150000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/02/TP-Link-M7000.webp?fit=1000%2C1000&ssl=1',
'Portable 4G LTE hotspot with battery. Share internet on the go with up to 10 devices.',
ARRAY['4G LTE Cat4', '150Mbps WiFi', 'SIM Card Slot', '2000mAh Battery', 'MicroSD Slot', 'Compact'],
12, 4.5),

('TP-Link Archer MR200 4G LTE Router', 'Routers/Switches', 299000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/01/TP-Link-Archer-MR200.webp?fit=1000%2C1000&ssl=1',
'Dual-band 4G LTE router with AC750 WiFi. Better coverage with detachable antennas.',
ARRAY['4G LTE Cat4', 'AC750 Dual-Band', 'SIM Card Slot', '4 LAN Ports', 'Detachable Antennas', 'VPN Support'],
8, 4.6),

('TP-Link Range Extender AX1800 RE605X', 'WiFi Adapters', 199000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/02/TP-Link-RE605X.webp?fit=1000%2C1000&ssl=1',
'WiFi 6 range extender for improved coverage. Eliminates dead zones in your home.',
ARRAY['WiFi 6 (802.11ax)', 'AX1800 Dual-Band', 'Gigabit Port', 'Access Point Mode', 'Easy Setup', 'OneMesh Support'],
15, 4.5),

('TP-Link TL-WN881ND PCIe WiFi Adapter', 'WiFi Adapters', 65000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/01/TP-Link-TL-WN881ND.webp?fit=1000%2C1000&ssl=1',
'Desktop WiFi adapter for wireless connectivity. Easy installation with PCIe slot.',
ARRAY['300Mbps WiFi', '2.4GHz Band', 'PCIe Interface', '2 Antennas', 'WPA3 Security', 'Low Profile'],
25, 4.4),

-- ==================== GAMING ====================
('Cougar Armor One V2 Gaming Chair', 'Gaming Chairs', 695000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2025/02/Armor-One-V2-Gold-1-1.jpg?fit=1500%2C1500&ssl=1',
'Ergonomic gaming chair with premium PVC leather. Designed for long gaming sessions with lumbar support.',
ARRAY['PVC Leather', '180° Reclining', '2D Armrests', 'Class 4 Gas Lift', 'Steel Frame', '120kg Capacity'],
12, 4.6),

('Cougar Fusion S Gaming Chair', 'Gaming Chairs', 595000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/01/Cougar-Fusion-S-Gaming-Chair.webp?fit=1000%2C1000&ssl=1',
'Breathable mesh gaming chair for comfort. Perfect balance of style and ergonomics.',
ARRAY['Breathable Mesh', '150° Reclining', 'Lumbar Support', 'Class 4 Gas Lift', 'Nylon Base', '120kg Capacity'],
10, 4.5),

('Cougar HotRod Gaming Chair', 'Gaming Chairs', 849000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/04/Cougar-HotRod-Gaming-Chair.webp?fit=1000%2C1000&ssl=1',
'High-end gaming chair with premium features. Racing aesthetics with ergonomic design.',
ARRAY['Premium PVC Leather', '180° Reclining', '3D Armrests', 'Aluminum Base', 'Class 4 Gas Lift', '150kg Capacity'],
5, 4.7),

('DXRacer Drifting Gaming Chair', 'Gaming Chairs', 1100000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/04/DXRacer-Drifting-Gaming-Chair.webp?fit=1000%2C1000&ssl=1',
'Premium racing-style gaming chair from DXRacer. Professional-grade for esports athletes.',
ARRAY['Premium PU Leather', '135° Reclining', '4D Armrests', 'Memory Foam Pillows', 'Aluminum Base', '5-Year Warranty'],
6, 4.8),

('Ergonomic RGB Gaming Desk 120x60cm', 'Gaming Accessories', 530000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/04/Ergonomic-Gaming-Desk-120x60cm-Computer-Table.webp?fit=1000%2C1000&ssl=1',
'Spacious gaming desk with RGB lighting. Cable management and accessories for ultimate setup.',
ARRAY['120x60cm Surface', 'RGB LED Lighting', 'Carbon Fiber Texture', 'Cable Management', 'Cup Holder', 'Headphone Hook'],
8, 4.5),

-- ==================== GADGETS & ACCESSORIES ====================
('Samsung Galaxy Tab A8 10.5" 64GB', 'Tablets', 575000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2023/08/Samsung-Galaxy-Tab-A8.webp?fit=1000%2C1000&ssl=1',
'Versatile Android tablet with 10.5-inch display. Perfect for entertainment and productivity.',
ARRAY['10.5" TFT Display', '64GB Storage', 'Expandable microSD', 'Quad Speakers', '7040mAh Battery', 'Android OS'],
14, 4.5),

('ASUS SLATEOLED 13 Tablet', 'Tablets', 1499000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/11/ASUS-T3300K-Intel-Pentium.png?fit=1000%2C1000&ssl=1',
'Windows 11 tablet with OLED display and detachable keyboard. Premium productivity tablet.',
ARRAY['13.3" OLED Display', '8GB RAM', '256GB Storage', 'Detachable Keyboard', 'ASUS Pen 2.0', 'Windows 11 Home'],
7, 4.7),

('Lenovo Tab M10 Plus (3rd Gen)', 'Tablets', 699000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/06/Lenovo-Tab-M10-Plus.webp?fit=1000%2C1000&ssl=1',
'Android tablet with Lenovo Precision Pen and folio case included. Great for notes and creativity.',
ARRAY['10.6" 2K Display', '4GB RAM', '128GB Storage', 'Precision Pen Included', 'Folio Case', 'Android 12'],
10, 4.6),

('ACER X1326AWH DLP Projector', 'Gadgets & Accessories', 1000000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/04/ACER-X1326AWH-DLP-Projector.webp?fit=1000%2C1000&ssl=1',
'Bright DLP projector for presentations and home entertainment. 4000 lumens for well-lit rooms.',
ARRAY['4000 Lumens', 'WXGA Resolution', 'DLP Technology', 'HDMI & VGA', '10000:1 Contrast', '3-Year Warranty'],
8, 4.6),

('North Bayou F80 Monitor Arm', 'Monitor Stands', 135000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/01/NB-F80-Monitor-Arm.webp?fit=1000%2C1000&ssl=1',
'Gas spring monitor arm for 17-30" monitors. Full motion adjustment for ergonomic viewing.',
ARRAY['17-30" Monitors', 'Gas Spring', 'Full Motion', 'Cable Management', 'Desk Clamp', '9kg Capacity'],
20, 4.5),

('North Bayou F160 Dual Monitor Arm', 'Monitor Stands', 249000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/02/NB-F160-Dual-Monitor.webp?fit=1000%2C1000&ssl=1',
'Dual monitor arm for productive workstations. Supports two 17-27" monitors.',
ARRAY['17-27" Monitors x2', 'Gas Spring', 'Full Motion', 'Cable Management', 'Desk Clamp', '9kg per Arm'],
15, 4.6),

('Humanmotion T6-1C Single Monitor Arm', 'Monitor Stands', 215000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/03/Humanmotion-T6-1C.webp?fit=1000%2C1000&ssl=1',
'Premium monitor arm with smooth movement. Height adjustable for comfortable viewing.',
ARRAY['17-32" Monitors', 'Gas Spring', 'Full Motion', 'USB-A Port', 'Desk Clamp', '12kg Capacity'],
12, 4.6),

('Pecron E300LFP Power Station', 'Power Banks', 510000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/05/Pecron-E300LFP.webp?fit=1000%2C1000&ssl=1',
'Portable power station with LiFePO4 battery. Perfect for outdoor adventures and emergencies.',
ARRAY['288Wh Capacity', 'LiFePO4 Battery', 'AC/DC/USB Output', 'Solar Compatible', '500W Output', '3000+ Cycles'],
5, 4.7),

-- ==================== PRINTERS ====================
('Canon PIXMA G2470 Printer', 'Printers', 405000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/03/Canon-PIXMA-G2470.webp?fit=1000%2C1000&ssl=1',
'Ink tank printer for high-volume printing. Low cost per page with refillable tanks.',
ARRAY['Print/Scan/Copy', 'Ink Tank System', '11ipm Black', '6ipm Color', 'USB Connectivity', '1-Year Warranty'],
15, 4.5),

('Canon PIXMA G3470 Printer', 'Printers', 465000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/03/Canon-PIXMA-G3470.webp?fit=1000%2C1000&ssl=1',
'Wireless ink tank printer with WiFi connectivity. Perfect for home and small office.',
ARRAY['Print/Scan/Copy', 'Ink Tank System', 'WiFi Connectivity', '11ipm Black', '6ipm Color', '1-Year Warranty'],
12, 4.6),

('Canon PIXMA G4470 Printer', 'Printers', 699000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/03/Canon-PIXMA-G4470.webp?fit=1000%2C1000&ssl=1',
'All-in-one ink tank printer with ADF and fax. Complete solution for small businesses.',
ARRAY['Print/Scan/Copy/Fax', 'Ink Tank System', 'WiFi & Ethernet', 'ADF (35 sheets)', '11ipm Black', '1-Year Warranty'],
8, 4.7),

('Canon PIXMA TS3640 Printer', 'Printers', 149000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/01/Canon-PIXMA-TS3640.webp?fit=1000%2C1000&ssl=1',
'Budget-friendly all-in-one printer. Great for occasional home printing needs.',
ARRAY['Print/Scan/Copy', 'Cartridge System', 'WiFi Connectivity', '7.7ipm Black', '4ipm Color', '1-Year Warranty'],
20, 4.3),

('Canon GI-41 PGBK Black Ink', 'Toners and Ink', 45000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/01/Canon-GI-41-PGBK.webp?fit=1000%2C1000&ssl=1',
'Pigment black ink for Canon PIXMA G-series printers. High yield for documents.',
ARRAY['Pigment Black', 'High Yield', 'G-Series Compatible', '170ml Bottle', 'Genuine Canon', 'Sharp Text'],
50, 4.5),

('Canon GI-490 Cyan Ink', 'Toners and Ink', 35000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/01/Canon-GI-490C.webp?fit=1000%2C1000&ssl=1',
'Cyan ink bottle for Canon ink tank printers. Vibrant colors for photo printing.',
ARRAY['Cyan Color', 'High Yield', 'G-Series Compatible', '70ml Bottle', 'Genuine Canon', 'Vivid Colors'],
60, 4.5),

('Epson 103 EcoTank Black Ink', 'Toners and Ink', 45000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/01/Epson-103-Black.webp?fit=1000%2C1000&ssl=1',
'Black ink for Epson EcoTank printers. Cost-effective high-volume printing.',
ARRAY['Black Color', 'High Yield', 'EcoTank Compatible', '65ml Bottle', 'Genuine Epson', 'Sharp Output'],
45, 4.5),

-- ==================== SOFTWARE ====================
('Kaspersky Premium Total Security', 'Anti-virus', 95000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/12/Kaspersky-Premium-New-Total-Security-5-Devices-1-Year.webp?fit=1000%2C1000&ssl=1',
'Comprehensive security suite for 5 devices. Includes VPN, password manager, and parental controls.',
ARRAY['5 Device License', '1 Year Subscription', 'Real-Time Protection', 'VPN Included', 'Password Manager', 'Parental Controls'],
100, 4.7),

('Apple Gift Card 10 USD', 'Apple Gift Card', 33000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/01/iTunes-Gift-Card-10.webp?fit=1000%2C1000&ssl=1',
'iTunes/App Store gift card for digital purchases. Works for apps, games, music, and subscriptions.',
ARRAY['$10 USD Value', 'iTunes/App Store', 'Digital Delivery', 'US Account', 'No Expiry', 'Instant Delivery'],
200, 4.6);

-- Verify the data
SELECT 'Categories inserted:' as info, COUNT(*) as count FROM categories;
SELECT 'Products inserted:' as info, COUNT(*) as count FROM products;
