-- Comprehensive Epic Computers Product Seed with VERIFIED Image URLs
-- All URLs verified from actual product pages
-- Generated: January 22, 2026

-- Clear existing products first
DELETE FROM products;

-- Reset sequence
ALTER SEQUENCE products_id_seq RESTART WITH 1;

-- Insert verified products with working images

-- ==================== GAMING LAPTOPS ====================
INSERT INTO products (name, category, price, image, description, features, stock, rating) VALUES
('ASUS TUF Gaming F16 Intel Core i7-13th Gen', 'Gaming Laptops', 2190000, 
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2026/01/1-10.png?fit=1000%2C1000&ssl=1',
'16" FHD 165Hz gaming laptop with Intel Core i7-13th Gen, RTX 4050 6GB, 16GB RAM, 512GB SSD',
'["16-inch FHD 165Hz Display", "Intel Core i7-13th Generation", "NVIDIA RTX 4050 6GB", "16GB DDR5 RAM", "512GB NVMe SSD", "Windows 11 Home", "RGB Backlit Keyboard"]',
8, 4.8),

('Dell Alienware 16 Intel Core i9-13th Gen', 'Gaming Laptops', 5850000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/01/Alienware-m16-r2-3.jpg?fit=1000%2C1000&ssl=1',
'16" QHD 240Hz gaming laptop with Intel Core i9-13th Gen, RTX 4080 12GB, 32GB RAM, 1TB SSD',
'["16-inch QHD 240Hz Display", "Intel Core i9-13th Generation", "NVIDIA RTX 4080 12GB", "32GB DDR5 RAM", "1TB NVMe SSD", "Windows 11 Pro", "Alienware Cryo-tech Cooling"]',
4, 4.9),

('HP OMEN 16-am i7-14th RTX 5060 8GB', 'Gaming Laptops', 3890000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2025/10/Untitled-diimimimimesign.png?fit=1000%2C1000&ssl=1',
'16" FHD 165Hz gaming laptop with Intel Core i7-14th Gen, RTX 5060 8GB, 16GB DDR5, 1TB SSD',
'["16-inch FHD 165Hz IPS Display", "Intel Core i7 14th Generation", "NVIDIA RTX 5060 8GB GDDR6", "16GB DDR5 RAM", "1TB PCIe NVMe SSD", "Windows 11 Home", "OMEN Tempest Cooling", "Bang & Olufsen Audio"]',
6, 4.9),

('HP Victus 15-FA Intel Core i5-12th Gen', 'Gaming Laptops', 1290000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2023/11/Untitled-design-2-1.png?fit=1080%2C1080&ssl=1',
'15.6" FHD 144Hz gaming laptop with Intel Core i5-12th Gen, GTX 1650 4GB, 8GB RAM, 512GB SSD',
'["15.6-inch FHD 144Hz Display", "Intel Core i5-12th Generation", "NVIDIA GTX 1650 4GB", "8GB DDR4 RAM", "512GB NVMe SSD", "Windows 11 Home", "Backlit Keyboard"]',
10, 4.6);

-- ==================== BUSINESS LAPTOPS ====================
INSERT INTO products (name, category, price, image, description, features, stock, rating) VALUES
('HP ProBook 450 G10 i7-13th 15.6 inch', 'Business Laptops', 2099000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2023/10/832p6pa-myshop-pk-3.jpg?fit=1000%2C1000&ssl=1',
'15.6" FHD professional laptop with Intel Core i7-13th Gen, 8GB RAM, 512GB SSD',
'["15.6-inch FHD Display", "Intel Core i7-1355U 13th Gen", "8GB DDR4 RAM", "512GB PCIe NVMe SSD", "FreeDOS", "USB-C, HDMI Ports", "Fingerprint Reader"]',
12, 4.7),

('HP EliteBook 840 G6 Intel Core i5-8th Gen', 'Business Laptops', 595000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2023/01/hp-840-G6-03.png?fit=900%2C900&ssl=1',
'14" FHD business laptop with Intel Core i5-8th Gen, 8GB RAM, 256GB SSD, refurbished',
'["14-inch FHD Display", "Intel Core i5-8365U vPro", "8GB DDR4 RAM", "256GB SSD", "Windows 10 Pro", "Bang & Olufsen Audio", "720p HD Webcam"]',
15, 4.5),

('HP EliteBook 840 G6 Intel Core i7-8th Gen', 'Business Laptops', 795000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2023/01/hp-840-G6-03.png?fit=900%2C900&ssl=1',
'14" FHD business laptop with Intel Core i7-8th Gen, 16GB RAM, 256GB SSD, refurbished',
'["14-inch FHD Display", "Intel Core i7-8365U vPro", "16GB DDR4 RAM", "256GB SSD", "Windows 10 Pro", "Bang & Olufsen Audio", "720p HD Webcam"]',
10, 4.6),

('HP EliteBook 830 G7 i5-10th 16GB Ram 256GB SSD', 'Business Laptops', 690000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2023/11/Artboard-1-copy%40300x-100-98.jpg?fit=1000%2C1000&ssl=1',
'13.3" FHD ultralight business laptop with Intel Core i5-10th Gen, 16GB RAM, 256GB SSD',
'["13.3-inch FHD Display", "Intel Core i5-10th Generation", "16GB DDR4 RAM", "256GB SSD", "Windows 10 Pro", "Ultra-lightweight Design", "Long Battery Life"]',
8, 4.7),

('HP EliteBook 1040 G8 Intel Core i5-11th Gen 16GB Ram', 'Business Laptops', 990000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/11/HP-EliteBook-x360-1040-G8-Notebook-PC-Intel-Core-i7-11th-Gen-16GB-RAM-512GB-SSD-14-Inches-FHD-Multi-Touch-Display-5.jpg?fit=1200%2C1200&ssl=1',
'14" FHD convertible laptop with Intel Core i5-11th Gen, 16GB RAM, 256GB SSD',
'["14-inch FHD LCD 1000 nits", "Intel Core i5-11th Generation", "16GB LPDDR4x RAM", "256GB PCIe NVMe SSD", "Windows 11 Pro", "HP Sure View Privacy Screen", "Thunderbolt 4 Ports"]',
6, 4.8),

('Dell Vostro 3520 Intel Core i7-12th', 'Business Laptops', 1685000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2023/11/Untitled-design-15.png?fit=1080%2C1080&ssl=1',
'15.6" FHD business laptop with Intel Core i7-12th Gen, 8GB RAM, 512GB SSD',
'["15.6-inch FHD Anti-glare Display", "Intel Core i7-1255U 12th Gen", "8GB DDR4 RAM", "512GB NVMe SSD", "Windows 10 Pro", "Intel Iris Xe Graphics", "Full-size Keyboard with Numpad"]',
10, 4.6),

('Dell Latitude 3440 Intel Core i7-13th Gen', 'Business Laptops', 1850000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/05/Dell-Latitude-3440-03.png?fit=1920%2C1920&ssl=1',
'14" FHD business laptop with Intel Core i7-13th Gen, 8GB RAM, 512GB SSD',
'["14-inch FHD Display", "Intel Core i7-1355U 13th Gen", "8GB DDR4 RAM", "512GB PCIe NVMe SSD", "Windows 11 Pro", "Intel Iris Xe Graphics", "Dell Express Sign-in"]',
7, 4.7);

-- ==================== CONSUMER LAPTOPS ====================
INSERT INTO products (name, category, price, image, description, features, stock, rating) VALUES
('HP Pavilion Laptop 15-eg Intel Core i7-13th Gen', 'Laptops', 2250000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2023/09/Pavilion-15-eg-1111.png?fit=1000%2C1000&ssl=1',
'15.6" FHD IPS touchscreen laptop with Intel Core i7-13th Gen, 8GB RAM, 512GB SSD',
'["15.6-inch FHD IPS Touchscreen", "Intel Core i7-1355U 10 Cores", "8GB DDR4 RAM", "512GB PCIe NVMe SSD", "FreeDOS", "Wi-Fi 6 and Bluetooth 5.3", "Full-size Backlit Keyboard"]',
9, 4.7),

('HP 250 G9 Intel Core i7-12th Gen 1TB SSD', 'Laptops', 1790000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2023/03/hp-250-G9-02.png?fit=960%2C960&ssl=1',
'15.6" FHD laptop with Intel Core i7-12th Gen, 8GB RAM, 1TB SSD',
'["15.6-inch FHD SVA Display", "Intel Core i7-1255U 12th Gen", "8GB DDR4 RAM", "1TB PCIe NVMe SSD", "FreeDOS", "Wi-Fi 6 and Bluetooth 5.2", "Backlit Keyboard"]',
11, 4.6),

('HP Laptop 15-dw Intel Core i5-10th Gen', 'Laptops', 1550000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2021/12/hp-15-dw.png?fit=700%2C700&ssl=1',
'15.6" HD touchscreen laptop with Intel Core i5-10th Gen, 12GB RAM, 1TB HDD',
'["15.6-inch HD Touchscreen", "Intel Core i5-10210U", "12GB DDR4 RAM", "1TB HDD", "FreeDOS", "Wi-Fi and Bluetooth 4.2", "720p HD Webcam"]',
8, 4.5),

('HP Laptop 14-cf Intel Core i7-10th Gen', 'Laptops', 1965000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2021/07/hp-14-cf-01.png?fit=1000%2C1000&ssl=1',
'14" HD laptop with Intel Core i7-10th Gen, 8GB RAM, 1TB HDD, AMD Radeon graphics',
'["14-inch HD Anti-glare Display", "Intel Core i7-10510U", "8GB DDR4 RAM", "1TB HDD", "FreeDOS", "AMD Radeon 530 2GB Graphics", "10+ Hours Battery"]',
7, 4.5),

('HP Laptop 15-dw Intel Celeron N4020', 'Laptops', 735000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2022/07/HP-15-dw-black-02.png?fit=872%2C872&ssl=1',
'15.6" HD entry-level laptop with Intel Celeron, 4GB RAM, 1TB HDD',
'["15.6-inch HD Anti-glare Display", "Intel Celeron N4020", "4GB DDR4 RAM", "1TB HDD", "FreeDOS", "Wi-Fi and Bluetooth 4.2", "Up to 10 Hours Battery"]',
20, 4.3),

('HP Envy x360 15-FE Core i7-13th Generation', 'Premium Laptops', 2690000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2023/08/HP-ENVY-15-FE-11.png?fit=1246%2C1246&ssl=1',
'15.6" FHD IPS 2-in-1 convertible with Intel Core i7-13th Gen, 16GB RAM, 512GB SSD',
'["15.6-inch FHD IPS Multitouch", "Intel Core i7-1355U", "16GB LPDDR5 RAM", "512GB PCIe NVMe SSD", "Windows 11 Home", "Intel Iris Xe Graphics", "Thunderbolt 4, Bang & Olufsen Audio"]',
5, 4.9);

-- ==================== DESKTOPS ====================
INSERT INTO products (name, category, price, image, description, features, stock, rating) VALUES
('Dell OptiPlex 3080 SFF Intel Core i5-10th Gen', 'Desktops', 785000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/12/Untitled-design-20.png?fit=1000%2C1000&ssl=1',
'Small form factor desktop with Intel Core i5-10th Gen, 8GB RAM, 256GB SSD',
'["Intel Core i5-10500 10th Gen", "8GB DDR4 RAM", "256GB SSD", "Windows 10 Pro", "Intel UHD Graphics 630", "USB 3.2, DisplayPort, HDMI", "Energy Efficient Design"]',
8, 4.6),

('HP All-in-One 24-Cr Intel Core i5-1335U', 'Desktops', 1350000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2025/10/hp-all-in-one-24-cr-234234.png?fit=1000%2C1000&ssl=1',
'23.8" FHD All-in-One PC with Intel Core i5-13th Gen, 8GB RAM, 512GB SSD',
'["23.8-inch FHD IPS Display", "Intel Core i5-1335U 13th Gen", "8GB DDR4 RAM", "512GB PCIe NVMe SSD", "Windows 11 Home", "Built-in Webcam and Speakers", "Wireless Keyboard and Mouse"]',
6, 4.7);

-- ==================== COMPONENTS - GRAPHICS CARDS ====================
INSERT INTO products (name, category, price, image, description, features, stock, rating) VALUES
('ASUS Dual GeForce RTX 3060 V2 OC 12GB', 'Graphics Cards', 850000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2022/05/ASUS-RTX-3060-3-removebg-preview.png?fit=1000%2C1000&ssl=1',
'High-performance graphics card with 12GB GDDR6, dual fans, PCIe 4.0',
'["12GB GDDR6 Memory", "192-bit Memory Interface", "Dual Axial-tech Fans", "PCIe 4.0 Interface", "HDMI 2.1, DisplayPort 1.4a", "DirectX 12 Ultimate", "Ray Tracing Support"]',
5, 4.8);

-- ==================== COMPONENTS - COOLING ====================
INSERT INTO products (name, category, price, image, description, features, stock, rating) VALUES
('Deepcool GAMMAXX GTE V2 CPU Cooler', 'Components', 75000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2022/09/gammax-GTE-V2-01.jpg?fit=1000%2C1000&ssl=1',
'Tower CPU cooler with 4 heatpipes and 120mm PWM fan, RGB lighting',
'["4 Direct Contact Heatpipes", "120mm PWM Fan", "RGB LED Lighting", "Intel LGA1700/1200/1151 Support", "AMD AM5/AM4 Support", "Max TDP 180W", "Silent Operation"]',
15, 4.5);

-- ==================== COMPONENTS - RAM ====================
INSERT INTO products (name, category, price, image, description, features, stock, rating) VALUES
('Crucial 16GB DDR4-3200 Kit (2x8GB)', 'Memory (RAM)', 145000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2022/10/663ba0cc8ae9d2359223b438-used-crucial-16gb2x8gb-288-pin-pc-ram.jpg?fit=1000%2C1000&ssl=1',
'High-performance DDR4 RAM kit, 16GB (2x8GB), 3200MHz',
'["16GB Total (2x8GB)", "DDR4-3200 Speed", "288-pin DIMM", "1.2V Operating Voltage", "Intel XMP 2.0 Support", "Lifetime Warranty", "Compatible with Most Motherboards"]',
20, 4.7),

('4GB DDR4 RAM Module', 'Memory (RAM)', 35000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2021/12/4GB-RAM.jpg?fit=1000%2C1000&ssl=1',
'4GB DDR4 desktop memory module, 2666MHz',
'["4GB Capacity", "DDR4-2666 Speed", "288-pin DIMM", "1.2V Operating Voltage", "Plug and Play", "Compatible with DDR4 Systems"]',
30, 4.4);

-- ==================== STORAGE ====================
INSERT INTO products (name, category, price, image, description, features, stock, rating) VALUES
('Samsung T7 Portable SSD 1TB', 'External Storage', 385000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/06/samsung-t7-2.png?fit=800%2C800&ssl=1',
'Ultra-fast portable SSD with USB 3.2 Gen 2, hardware encryption',
'["1TB Capacity", "USB 3.2 Gen 2 (10Gbps)", "Up to 1050MB/s Read Speed", "Up to 1000MB/s Write Speed", "Hardware Encryption (AES 256-bit)", "Compact Metal Design", "Shock Resistant"]',
12, 4.9);

-- ==================== PERIPHERALS - MICE ====================
INSERT INTO products (name, category, price, image, description, features, stock, rating) VALUES
('Logitech M185 Wireless Mouse', 'Peripherals', 55000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2023/04/logitech-M185.jpg?fit=2000%2C2000&ssl=1',
'Reliable wireless mouse with 12-month battery life, plug-and-play',
'["2.4GHz Wireless Connection", "1000 DPI Optical Tracking", "12-Month Battery Life", "Plug-and-Play Nano Receiver", "Ambidextrous Design", "Works with Windows, Mac, Chrome OS"]',
25, 4.5),

('Logitech M170 Wireless Mouse', 'Peripherals', 40000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2020/09/1586780034186181.jpg?fit=800%2C800&ssl=1',
'Compact wireless mouse with reliable connection, budget-friendly',
'["2.4GHz Wireless Connection", "Optical Tracking", "10m Wireless Range", "Ambidextrous Design", "Compact and Portable", "AA Battery Included"]',
30, 4.4);

-- ==================== PERIPHERALS - SPEAKERS ====================
INSERT INTO products (name, category, price, image, description, features, stock, rating) VALUES
('Logitech Z313 2.1 Speaker System', 'Audio', 185000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/01/Untitled-design-3.png?fit=1000%2C1000&ssl=1',
'2.1 speaker system with subwoofer, 25W RMS power, control pod',
'["25W RMS Total Power", "2.1 Channel System", "Compact Subwoofer", "Wired Control Pod", "Headphone Jack", "3.5mm Audio Input", "Rich Bass Response"]',
10, 4.6);

-- ==================== GAMING ACCESSORIES ====================
INSERT INTO products (name, category, price, image, description, features, stock, rating) VALUES
('Cougar Armor One Gaming Chair', 'Gaming Accessories', 450000,
'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2023/02/cougar-armor-one-04.jpg?fit=1000%2C1000&ssl=1',
'Professional gaming chair with ergonomic design, adjustable armrests',
'["Ergonomic Racing Design", "180° Reclining Backrest", "Adjustable Armrests", "Height Adjustable", "Lumbar and Headrest Pillows", "Class 4 Gas Lift", "Maximum Load 120kg"]',
6, 4.7);

-- Verify insertion
SELECT COUNT(*) as total_products FROM products;
SELECT name, category, price, substring(image, 1, 80) as image_preview FROM products ORDER BY category, name;
