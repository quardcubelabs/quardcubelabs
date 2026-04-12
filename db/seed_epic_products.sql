-- Epic Computers Categories and Products Seed Data
-- Run this script in your Supabase SQL Editor

-- First, delete existing categories
DELETE FROM categories;

-- Insert new categories from Epic Computers
INSERT INTO categories (name) VALUES
('Laptops'),
('Desktops'),
('Monitors'),
('Storage'),
('Components'),
('Peripherals'),
('Networking'),
('Gadgets & Accessories'),
('Gaming');

-- Delete existing products
DELETE FROM products;

-- Insert new products from Epic Computers (with sample data)
INSERT INTO products (name, category, price, image, description, features, stock, rating) VALUES

-- LAPTOPS
('HP Envy 14 x360 Laptop', 'Laptops', 2599000, 'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/11/HP-Envy-14-x360.png?fit=1000%2C1000&ssl=1', 
'Premium 2-in-1 convertible laptop with Intel Core i7-13th Gen processor, 16GB RAM and 1TB SSD. Features a stunning 14-inch touchscreen display perfect for creative professionals and business users who need versatility and power.', 
ARRAY['Intel Core i7-13th Gen Processor', '16GB DDR5 RAM', '1TB NVMe SSD Storage', '14" FHD Touchscreen Display', '360° Convertible Design', 'Windows 11 Pro'], 
15, 4.8),

('Dell Latitude 3440 Intel Core i5-13th', 'Laptops', 1890000, 'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/07/Dell-Latitude-3440-600x600-1.webp?fit=600%2C600&ssl=1',
'Business-class laptop designed for productivity with Intel Core i5-13th Gen, 16GB RAM. Built for professionals who need reliability, security, and performance for everyday business tasks.',
ARRAY['Intel Core i5-13th Gen Processor', '16GB DDR4 RAM', '256GB SSD Storage', '14" FHD Anti-Glare Display', 'Windows 11 Pro', 'Dell Business Support'],
20, 4.6),

('HP Victus 15-FA Gaming Laptop', 'Laptops', 2099000, 'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2025/02/Untitled-design-4.png?fit=1080%2C1350&ssl=1',
'Powerful gaming laptop featuring Intel Core i5-13th Gen processor and NVIDIA RTX 4050 6GB graphics. Experience smooth gaming and content creation with this performance-focused machine.',
ARRAY['Intel Core i5-13th Gen Processor', '16GB DDR5 RAM', '512GB NVMe SSD', 'NVIDIA GeForce RTX 4050 6GB', '15.6" FHD 144Hz Display', 'Windows 11 Home'],
12, 4.7),

('Dell Vostro 3530 Intel Core i5-13th', 'Laptops', 1349000, 'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2025/04/Vostro-1.png?fit=1000%2C1000&ssl=1',
'Affordable business laptop with Intel Core i5-13th Gen for small businesses and entrepreneurs. Offers excellent value with essential features for office productivity and remote work.',
ARRAY['Intel Core i5-13th Gen Processor', '8GB DDR4 RAM', '256GB SSD Storage', '15.6" FHD Display', 'Windows 11 Home', 'Anti-Glare Screen'],
25, 4.5),

('HP OMEN Laptop 16 RTX 4060', 'Laptops', 3228000, 'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/05/HP-OMEN-Laptop-16-WD-Core-i7-13th-Gen-NVIDIA-GeForce-RTX-4060-8GB.jpg?fit=1000%2C1000&ssl=1',
'High-performance gaming laptop with Intel Core i7-13th Gen and NVIDIA RTX 4060 8GB. Designed for serious gamers and content creators who demand the best graphics performance.',
ARRAY['Intel Core i7-13th Gen Processor', '16GB DDR5 RAM', '1TB NVMe SSD', 'NVIDIA GeForce RTX 4060 8GB', '16.1" QHD 165Hz Display', 'OMEN Gaming Hub'],
8, 4.9),

('ASUS FX608J F16 TUF Gaming Laptop', 'Laptops', 3699000, 'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2025/05/Asus-FX608J-F16-TUF-Gaming-Laptop.webp?fit=1000%2C1000&ssl=1',
'Military-grade durability meets gaming performance with the ASUS TUF Gaming series. Built to withstand extreme conditions while delivering exceptional gaming experiences.',
ARRAY['Intel Core i7-13th Gen Processor', '16GB DDR5 RAM', '1TB NVMe SSD', 'NVIDIA GeForce RTX 4070 8GB', '16" FHD 165Hz Display', 'MIL-STD-810H Certified'],
6, 4.8),

-- DESKTOPS
('HP OMEN 25L Gaming Desktop', 'Desktops', 3610000, 'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/05/HP-OMEN-40L-GT21-Gaming-Desktop-PC-Intel-Core-i5-12th-32GB-Ram.webp?fit=1000%2C1000&ssl=1',
'Powerful gaming desktop featuring Intel Core i5-12th Gen with 16GB RAM. Experience desktop gaming performance with expandable storage and upgradeable components.',
ARRAY['Intel Core i5-12th Gen Processor', '16GB DDR4 RAM', '512GB NVMe SSD', 'NVIDIA Graphics', 'RGB Lighting', 'Tool-less Access Panel'],
5, 4.7),

-- MONITORS  
('Dell E2216HV 22 Inch Full HD Monitor', 'Monitors', 338000, 'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2023/12/61mmM7UUzfL-1.jpg?fit=1000%2C1000&ssl=1',
'Professional 22-inch Full HD monitor with anti-glare screen. Perfect for office environments and home workstations requiring clear, comfortable viewing all day.',
ARRAY['22" Full HD Display (1920x1080)', 'Anti-Glare Coating', 'VGA Connectivity', 'Tilt Adjustment', 'Energy Star Certified', '3-Year Warranty'],
30, 4.4),

('HP Series 3 Pro-322pv Monitor', 'Monitors', 290000, 'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2025/01/HP-Series-3-Pro-322pv-Monitor.webp?fit=1000%2C1000&ssl=1',
'Reliable HP business monitor with crystal-clear display. Ideal for professional use with excellent color accuracy and comfortable viewing angles.',
ARRAY['21.5" Full HD Display', 'IPS Panel Technology', 'HDMI & VGA Ports', 'Low Blue Light Mode', 'Flicker-Free Technology', 'Adjustable Stand'],
22, 4.5),

-- COMPONENTS
('ASUS Dual GeForce RTX 3060 12GB', 'Components', 1056000, 'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/02/ASUS-Dual-GeForce-RTX-3060-OC-Edition-12GB-Graphics-Card.png?fit=1000%2C1000&ssl=1',
'High-performance graphics card with 12GB GDDR6 memory. Perfect for 1080p and 1440p gaming with ray tracing support and DLSS technology for enhanced performance.',
ARRAY['12GB GDDR6 Memory', 'Ray Tracing Support', 'DLSS Technology', 'Dual Fan Cooling', 'PCIe 4.0 Interface', '3-Year Warranty'],
10, 4.8),

('ASUS PRIME B760-PLUS DDR4 Motherboard', 'Components', 525000, 'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/04/ASUS-PRIME-B760-PLUS-DDR4-ATX-Motherboard.webp?fit=1000%2C1000&ssl=1',
'Feature-rich ATX motherboard supporting Intel 12th/13th Gen processors. Reliable foundation for building a powerful desktop system with DDR4 memory support.',
ARRAY['Intel LGA 1700 Socket', 'DDR4 Memory Support', 'PCIe 4.0 Ready', 'USB 3.2 Gen 2 Ports', 'Realtek Audio', '2.5Gb Ethernet'],
15, 4.6),

('4GB DDR4-2666 SODIMM RAM', 'Components', 60000, 'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2023/11/SODIMM-4GB-DDR4-RAM.png?fit=1000%2C1000&ssl=1',
'Laptop memory upgrade module for enhanced multitasking. Compatible with most DDR4 laptops and small form factor systems for improved performance.',
ARRAY['4GB Capacity', 'DDR4-2666 Speed', 'SODIMM Form Factor', 'Low Power Consumption', 'Plug and Play', 'Lifetime Warranty'],
50, 4.3),

-- PERIPHERALS
('Logitech H390 USB Headset', 'Peripherals', 115000, 'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2022/09/logitech-h390.jpg?fit=1000%2C1000&ssl=1',
'Comfortable USB headset with noise-canceling microphone. Ideal for video calls, online meetings, and remote work with crystal-clear audio quality.',
ARRAY['USB Plug-and-Play', 'Noise-Canceling Microphone', 'In-Line Audio Controls', 'Padded Headband', 'Adjustable Mic Boom', '2-Year Warranty'],
40, 4.5),

('Extended Mouse Pad', 'Peripherals', 45000, 'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2023/03/Extended-Mouse-Pad.png?fit=1000%2C1000&ssl=1',
'Large extended mouse pad for gaming and productivity. Provides ample space for mouse and keyboard with smooth surface for precise tracking.',
ARRAY['Extended Size Design', 'Non-Slip Rubber Base', 'Smooth Cloth Surface', 'Stitched Edges', 'Machine Washable', 'Universal Compatibility'],
60, 4.4),

-- STORAGE
('2.5" HDD External Case USB 2.0', 'Storage', 30000, 'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2022/09/2.5-External-HDD-Case.png?fit=1000%2C1000&ssl=1',
'Portable external hard drive enclosure for 2.5-inch drives. Convert your internal drive to external storage for easy data backup and transfer.',
ARRAY['2.5" SATA HDD/SSD Support', 'USB 2.0 Interface', 'Tool-Free Installation', 'LED Activity Indicator', 'Hot-Swappable', 'Compact Design'],
80, 4.2),

-- NETWORKING
('TP-Link Archer AX23 WiFi 6 Router', 'Networking', 185000, 'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2023/06/TP-Link-Archer-AX23.webp?fit=1000%2C1000&ssl=1',
'Next-generation WiFi 6 router with faster speeds and better coverage. Ideal for homes with multiple devices requiring stable, high-speed connectivity.',
ARRAY['WiFi 6 Technology', 'Dual-Band AX1800', '4 High-Gain Antennas', 'Gigabit Ethernet Ports', 'OFDMA Technology', 'Easy App Setup'],
18, 4.6),

-- GADGETS & ACCESSORIES
('Samsung Galaxy Tab A8 10.5" 64GB', 'Gadgets & Accessories', 575000, 'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2023/08/Samsung-Galaxy-Tab-A8.webp?fit=1000%2C1000&ssl=1',
'Versatile Android tablet with 10.5-inch display. Perfect for entertainment, education, and light productivity tasks with long battery life.',
ARRAY['10.5" TFT Display', '64GB Internal Storage', 'Expandable via microSD', 'Quad Speakers', '7040mAh Battery', 'Android OS'],
14, 4.5),

('ASUS SLATEOLED 13 Tablet', 'Gadgets & Accessories', 1499000, 'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/11/ASUS-T3300K-Intel-Pentium.png?fit=1000%2C1000&ssl=1',
'Windows 11 tablet with stunning OLED display and detachable keyboard. Premium productivity tablet with ASUS Pen 2.0 support for creative professionals.',
ARRAY['13.3" OLED Display', '8GB RAM', '256GB Storage', 'Detachable Keyboard', 'ASUS Pen 2.0 Included', 'Windows 11 Home'],
7, 4.7),

('Anker Premium 5-in-1 USB-C Hub', 'Gadgets & Accessories', 78000, 'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2023/06/Anker-Premium-5-in-1-USB-C-Hub.webp?fit=1000%2C1000&ssl=1',
'Essential USB-C hub for modern laptops. Expand your connectivity with HDMI, USB-A, and SD card reader in a compact aluminum design.',
ARRAY['USB-C Power Delivery', 'HDMI 4K Output', '2x USB-A 3.0 Ports', 'SD Card Reader', 'Aluminum Body', 'Compact Design'],
35, 4.6),

-- GAMING
('Cougar Armor One V2 Gaming Chair', 'Gaming', 695000, 'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2025/02/Armor-One-V2-Gold-1-1.jpg?fit=1500%2C1500&ssl=1',
'Ergonomic gaming chair with premium PVC leather. Designed for long gaming sessions with adjustable armrests and lumbar support for ultimate comfort.',
ARRAY['PVC Leather Material', '180° Reclining Backrest', '2D Adjustable Armrests', 'Class 4 Gas Lift', 'Steel Frame', 'Up to 120kg Capacity'],
12, 4.6),

('Cougar Fusion S Gaming Chair', 'Gaming', 595000, 'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/01/Cougar-Fusion-S-Gaming-Chair.webp?fit=1000%2C1000&ssl=1',
'Comfortable gaming chair with breathable mesh design. Perfect balance of style and ergonomics for gamers and professionals alike.',
ARRAY['Breathable Mesh Design', '150° Reclining', 'Adjustable Lumbar Support', 'Class 4 Gas Lift', 'Nylon Base', '120kg Max Weight'],
10, 4.5),

('DXRacer Drifting Gaming Chair', 'Gaming', 1100000, 'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/04/DXRacer-Drifting-Gaming-Chair.webp?fit=1000%2C1000&ssl=1',
'Premium racing-style gaming chair from DXRacer. Professional-grade comfort and durability for esports athletes and dedicated gamers.',
ARRAY['Racing-Style Design', 'Premium PU Leather', '135° Reclining', '4D Armrests', 'Memory Foam Pillows', '5-Year Frame Warranty'],
6, 4.8),

('Ergonomic RGB Gaming Desk 120x60cm', 'Gaming', 530000, 'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/04/Ergonomic-Gaming-Desk-120x60cm-Computer-Table.webp?fit=1000%2C1000&ssl=1',
'Spacious gaming desk with RGB lighting effects. Features cable management and cup holder for the ultimate gaming station setup.',
ARRAY['120x60cm Surface Area', 'RGB LED Lighting', 'Carbon Fiber Texture', 'Cable Management System', 'Cup Holder', 'Headphone Hook'],
8, 4.5),

('Cougar HotRod Gaming Chair', 'Gaming', 849000, 'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/04/Cougar-HotRod-Gaming-Chair.webp?fit=1000%2C1000&ssl=1',
'High-end gaming chair with premium features. Combines racing aesthetics with ergonomic design for maximum comfort during extended gaming sessions.',
ARRAY['Premium PVC Leather', '180° Reclining', '3D Adjustable Armrests', 'Aluminum Base', 'Class 4 Gas Lift', '150kg Max Weight'],
5, 4.7),

-- Additional Products
('APC Back-UPS 650VA UPS', 'Components', 165000, 'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2022/09/apc-back-ups-bv-650va-avr.png?fit=1000%2C1000&ssl=1',
'Essential power protection for your computer and electronics. Protects against power surges, spikes, and outages with battery backup.',
ARRAY['650VA/360W Capacity', 'Automatic Voltage Regulation', '4 Outlets', 'Surge Protection', 'Battery Backup', 'LED Status Indicators'],
25, 4.4),

('Kaspersky Premium Total Security', 'Gadgets & Accessories', 95000, 'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/12/Kaspersky-Premium-New-Total-Security-5-Devices-1-Year.webp?fit=1000%2C1000&ssl=1',
'Comprehensive security suite protecting 5 devices for 1 year. Includes antivirus, VPN, password manager, and identity protection features.',
ARRAY['5 Device License', '1 Year Subscription', 'Real-Time Protection', 'VPN Included', 'Password Manager', 'Parental Controls'],
100, 4.7),

('HP ProBook 460 G11 Ultra 7', 'Laptops', 2099000, 'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2025/01/HP-ProBook-460-G11-Intel-Core-Ultra-7-16GB-Ram.webp?fit=1000%2C1000&ssl=1',
'Premium business laptop with Intel Core Ultra 7 processor and 16GB RAM. Built for modern professionals with AI-enhanced performance and security features.',
ARRAY['Intel Core Ultra 7 Processor', '16GB DDR5 RAM', '512GB NVMe SSD', '14" FHD Display', 'AI-Enhanced Performance', 'Windows 11 Pro'],
10, 4.8),

('HP Elitebook 845 G8 Ryzen 5', 'Laptops', 725000, 'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2025/01/HP-Elitebook-845-G8-Ryzen-5-Ram-16GB-256GB-SSD.webp?fit=1000%2C1000&ssl=1',
'Reliable refurbished business laptop with AMD Ryzen 5 processor. Excellent value for professionals seeking enterprise-grade features at an affordable price.',
ARRAY['AMD Ryzen 5 Processor', '16GB DDR4 RAM', '256GB SSD Storage', '14" FHD Display', 'Refurbished Grade A', 'Windows 11 Pro'],
18, 4.4),

('ACER X1326AWH DLP Projector', 'Gadgets & Accessories', 1000000, 'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/04/ACER-X1326AWH-DLP-Projector.webp?fit=1000%2C1000&ssl=1',
'Bright DLP projector for presentations and home entertainment. Features 4000 lumens brightness for clear images even in well-lit rooms.',
ARRAY['4000 Lumens Brightness', 'WXGA Resolution', 'DLP Technology', 'HDMI & VGA Inputs', '10000:1 Contrast Ratio', '3-Year Warranty'],
8, 4.6);

-- Verify the data
SELECT 'Categories inserted:' as info, COUNT(*) as count FROM categories;
SELECT 'Products inserted:' as info, COUNT(*) as count FROM products;
