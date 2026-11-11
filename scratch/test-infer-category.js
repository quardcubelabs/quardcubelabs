function inferCategory(title, url = '') {
  const t = title.toLowerCase();
  const u = url.toLowerCase();

  if (t.includes('gift card') || t.includes('itunes code') || t.includes('digital code')) return 'Digital Codes';
  if (t.includes('antivirus') || t.includes('anti-virus') || t.includes('bitdefender') || t.includes('kaspersky') || t.includes('windows 11 pro') || t.includes('office 202') || t.includes('office 365') || t.includes('operating system')) return 'Software';
  if (t.includes('cash counting') || t.includes('bill counter') || t.includes('money counter')) return 'Cash Counting Machines';
  if (t.includes('powerstation') || t.includes('power station') || t.includes('ecoflow') || t.includes('anker solix') || t.includes('jackery')) return 'Powerstations';
  if (t.includes(' ups ') || t.startsWith('ups ') || t.endsWith(' ups') || t.includes('uninterruptible') || t.includes('apc easy') || t.includes('mercury ups')) return 'UPS';
  if (t.includes('printer') || t.includes('pixma') || t.includes('maxify') || t.includes('laserjet') || t.includes('ink tank')) return 'Printers';
  if (t.includes('toner') || t.includes('ink cartridge') || t.includes('ink bottle')) return 'Toners and Ink';
  if (t.includes('ipad') || t.includes('tablet') || t.includes('galaxy tab')) return 'Tablets';
  if (t.includes('gaming laptop') || (t.includes('alienware') && t.includes('laptop')) || (t.includes('rtx') && t.includes('laptop')) || (t.includes('legion') && t.includes('laptop')) || (t.includes('tuf') && t.includes('laptop')) || (t.includes('rog') && t.includes('laptop')) || (t.includes('victus') && t.includes('laptop')) || (t.includes('predator') && t.includes('laptop'))) return 'Gaming Laptops';
  if (t.includes('refurbished') && (t.includes('laptop') || t.includes('thinkpad') || t.includes('latitude') || t.includes('elitebook'))) return 'Refurbished Laptops';
  if (t.includes('laptop') || t.includes('thinkpad') || t.includes('latitude') || t.includes('elitebook') || t.includes('zenbook') || t.includes('macbook') || t.includes('notebook') || t.includes('chromebook') || t.includes('envy') || t.includes('spectre') || t.includes('probook') || t.includes('vostro')) return 'New Laptops';
  if (t.includes('all-in-one') || t.includes('aio')) return 'All-in-One';
  if (t.includes('gaming desktop') || (t.includes('gaming') && (t.includes('pc') || t.includes('tower')))) return 'Gaming Desktop';
  if (t.includes('desktop') || t.includes('optiplex') || t.includes('prodesk') || t.includes('elitedesk') || t.includes('tower')) return 'Desktops';
  if (t.includes('gaming chair')) return 'Gaming Chairs';
  if (t.includes('monitor') || t.includes('display') || t.includes('inch ips') || t.includes('curved screen')) return 'Monitors';
  if (t.includes('router') || t.includes('switch') || t.includes('access point') || t.includes('mesh') || t.includes('ethernet') || t.includes('tp-link')) return 'Routers/Switches';
  if (t.includes('wifi') || t.includes('wireless adapter') || t.includes('dongle')) return 'WiFi Adapters';
  if (t.includes('case usb') || t.includes('hdd enclosure') || t.includes('hdd case') || t.includes('docking station') || t.includes('rack')) return 'HDD Cases & Racks';
  if (t.includes('ssd') || t.includes('solid state') || t.includes('nvme')) return 'Solid State Drives';
  if (t.includes('external hdd') || t.includes('external hard drive') || t.includes('expansion portable')) return 'External Hard Drives';
  if (t.includes('internal hdd') || t.includes('hard disk drive') || (t.includes('hdd') && !t.includes('case'))) return 'Internal Hard Drives';
  if (t.includes('flash drive') || t.includes('flash disk') || t.includes('usb drive')) return 'USB Flash Disk';
  if (t.includes('micro sd') || t.includes('sd card') || t.includes('memory card')) return 'SD & Micro SD Cards';
  if (t.includes('rtx') || t.includes('gtx') || t.includes('radeon') || t.includes('graphics card') || t.includes('gpu')) return 'Graphics Card';
  if (t.includes('motherboard') || t.includes('mainboard')) return 'Motherboard';
  if (t.includes('ddr4') || t.includes('ddr5') || t.includes('ram memory') || t.includes('dimm')) return 'RAM Memory';
  if (t.includes('intel core') || t.includes('ryzen') || t.includes('processor') || t.includes('cpu')) return 'Processors';
  if (t.includes('power supply') || t.includes('psu') || t.includes('watt power')) return 'Power Supply';
  if (t.includes('cooling') || t.includes('liquid cooler') || t.includes('cpu fan')) return 'CPU Cooling';
  if (t.includes('pc case') || t.includes('chassis')) return 'PC Cases';
  if (t.includes('keyboard') || t.includes('mouse') || t.includes('combo')) return 'Keyboard/Mouse';
  if (t.includes('headphone') || t.includes('headset') || t.includes('speaker') || t.includes('earbuds') || t.includes('soundbar')) return 'Headphones & Speakers';
  if (t.includes('webcam') || t.includes('camera')) return 'Webcam';
  if (t.includes('cctv') || t.includes('dvr') || t.includes('nvr') || t.includes('ip camera')) return 'CCTV Cameras';
  if (t.includes('bag') || t.includes('backpack') || t.includes('sleeve')) return 'Laptop Bags';
  if (t.includes('charger') || t.includes('power adapter')) return 'Laptop Chargers';
  if (t.includes('cable') || t.includes('hdmi') || t.includes('vga') || t.includes('adapter')) return 'Cables & Dongles';
  if (t.includes('power bank')) return 'Power Banks';
  if (t.includes('stand')) return 'Monitor Stands';

  return 'Gadgets & Accessories';
}

console.log('2.5″HDD EXTERNAL CASE ->', inferCategory('2.5″HDD EXTERNAL CASE USB 2.0'));
console.log('Apple Gift Card 10 USD ->', inferCategory('Apple Gift Card 10 USD iTunes Code'));
console.log('Canon Maxify GX3040 Printer ->', inferCategory('Canon Maxify GX3040 Printer'));
console.log('Bitdefender Antivirus ->', inferCategory('Bitdefender Antivirus Plus | 2 DEVICES| 1 YEAR'));
console.log('DELL Alienware 16 Aurora ->', inferCategory('DELL Alienware 16 Aurora i7 16GB RAM RTX 5060 8GB'));
