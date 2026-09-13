const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  
  const typeAndData = Buffer.alloc(4 + len);
  typeAndData.write(type, 0, 4, 'ascii');
  data.copy(typeAndData, 4);
  const crc = crc32(typeAndData);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function decodePng(buffer) {
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  let offset = 8;
  const idatChunks = [];
  while (offset < buffer.length) {
    const len = buffer.readUInt32BE(offset);
    const type = buffer.slice(offset + 4, offset + 8).toString('ascii');
    if (type === 'IDAT') idatChunks.push(buffer.slice(offset + 8, offset + 8 + len));
    offset += 12 + len;
  }
  const uncompressed = zlib.inflateSync(Buffer.concat(idatChunks));
  const raw = Buffer.alloc(width * height * 4);
  let srcPos = 0;
  for (let y = 0; y < height; y++) {
    const filterType = uncompressed[srcPos++];
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      for (let c = 0; c < 4; c++) {
        let val = uncompressed[srcPos++];
        let left = x > 0 ? raw[idx - 4 + c] : 0;
        let up = y > 0 ? raw[((y - 1) * width + x) * 4 + c] : 0;
        let upleft = (x > 0 && y > 0) ? raw[((y - 1) * width + (x - 1)) * 4 + c] : 0;
        if (filterType === 1) val = (val + left) & 0xff;
        else if (filterType === 2) val = (val + up) & 0xff;
        else if (filterType === 3) val = (val + Math.floor((left + up) / 2)) & 0xff;
        else if (filterType === 4) {
          const p = left + up - upleft;
          const pa = Math.abs(p - left), pb = Math.abs(p - up), pc = Math.abs(p - upleft);
          let pr = (pa <= pb && pa <= pc) ? left : (pb <= pc ? up : upleft);
          val = (val + pr) & 0xff;
        }
        raw[idx + c] = val;
      }
    }
  }
  return { width, height, data: raw };
}

function encodePng(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8);
  ihdrData.writeUInt8(6, 9);
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);
  const ihdrChunk = createChunk('IHDR', ihdrData);
  
  const stride = width * 4;
  const filtered = Buffer.alloc(height * (stride + 1));
  let destPos = 0;
  for (let y = 0; y < height; y++) {
    filtered[destPos++] = 0;
    rgbaBuffer.copy(filtered, destPos, y * stride, (y + 1) * stride);
    destPos += stride;
  }
  
  const compressed = zlib.deflateSync(filtered, { level: 9 });
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Area-averaging downsampler with subpixel integration (preserves energy and crisp geometry)
function resampleAreaAverage(src, cropX, cropY, cropW, cropH, dstW, dstH) {
  const dst = Buffer.alloc(dstW * dstH * 4);
  const scaleX = cropW / dstW;
  const scaleY = cropH / dstH;

  for (let dy = 0; dy < dstH; dy++) {
    const yStart = cropY + dy * scaleY;
    const yEnd = yStart + scaleY;
    
    for (let dx = 0; dx < dstW; dx++) {
      const xStart = cropX + dx * scaleX;
      const xEnd = xStart + scaleX;

      let rAcc = 0, gAcc = 0, bAcc = 0, aAcc = 0, totalWeight = 0;

      const yMin = Math.max(0, Math.floor(yStart));
      const yMax = Math.min(src.height - 1, Math.floor(yEnd));
      const xMin = Math.max(0, Math.floor(xStart));
      const xMax = Math.min(src.width - 1, Math.floor(xEnd));

      for (let sy = yMin; sy <= yMax; sy++) {
        const yTop = Math.max(yStart, sy);
        const yBottom = Math.min(yEnd, sy + 1);
        const yWeight = Math.max(0, yBottom - yTop);
        if (yWeight <= 0) continue;

        for (let sx = xMin; sx <= xMax; sx++) {
          const xLeft = Math.max(xStart, sx);
          const xRight = Math.min(xEnd, sx + 1);
          const xWeight = Math.max(0, xRight - xLeft);
          if (xWeight <= 0) continue;

          const w = xWeight * yWeight;
          const sIdx = (sy * src.width + sx) * 4;
          const alpha = src.data[sIdx + 3] / 255;

          rAcc += src.data[sIdx] * alpha * w;
          gAcc += src.data[sIdx + 1] * alpha * w;
          bAcc += src.data[sIdx + 2] * alpha * w;
          aAcc += src.data[sIdx + 3] * w;
          totalWeight += w;
        }
      }

      const dIdx = (dy * dstW + dx) * 4;
      if (totalWeight > 0 && aAcc > 0) {
        const finalA = Math.min(Math.max(aAcc / totalWeight, 0), 255);
        const aNorm = finalA / 255;
        if (aNorm > 0.001) {
          dst[dIdx] = Math.min(Math.max(Math.round((rAcc / totalWeight) / aNorm), 0), 255);
          dst[dIdx + 1] = Math.min(Math.max(Math.round((gAcc / totalWeight) / aNorm), 0), 255);
          dst[dIdx + 2] = Math.min(Math.max(Math.round((bAcc / totalWeight) / aNorm), 0), 255);
          dst[dIdx + 3] = Math.round(finalA);
        }
      }
    }
  }
  return dst;
}

// Crisp detail enhancer (Unsharp mask tuned for small icon rasters)
function enhanceCrispDetails(imgBuf, width, height, amount = 0.25) {
  if (amount <= 0 || width < 8 || height < 8) return imgBuf;
  const out = Buffer.from(imgBuf);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const alpha = imgBuf[idx + 3];
      if (alpha < 30) continue;

      // 4-neighbor laplacian for color channels
      for (let c = 0; c < 3; c++) {
        const val = imgBuf[idx + c];
        const left = x > 0 ? imgBuf[idx - 4 + c] : val;
        const right = x < width - 1 ? imgBuf[idx + 4 + c] : val;
        const up = y > 0 ? imgBuf[((y - 1) * width + x) * 4 + c] : val;
        const down = y < height - 1 ? imgBuf[((y + 1) * width + x) * 4 + c] : val;

        const laplacian = 4 * val - (left + right + up + down);
        const sharpened = val + laplacian * amount;
        out[idx + c] = Math.min(Math.max(Math.round(sharpened), 0), 255);
      }
    }
  }
  return out;
}

// Generate multi-resolution ICO file
function createIco(pngBuffers, sizes) {
  const count = pngBuffers.length;
  const headerSize = 6 + count * 16;
  let totalSize = headerSize;
  for (const buf of pngBuffers) totalSize += buf.length;
  
  const ico = Buffer.alloc(totalSize);
  ico.writeUInt16LE(0, 0); // reserved
  ico.writeUInt16LE(1, 2); // icon type (1 = icon)
  ico.writeUInt16LE(count, 4); // count
  
  let currentOffset = headerSize;
  for (let i = 0; i < count; i++) {
    const size = sizes[i];
    const pngBuf = pngBuffers[i];
    const entryOffset = 6 + i * 16;
    
    ico.writeUInt8(size >= 256 ? 0 : size, entryOffset);
    ico.writeUInt8(size >= 256 ? 0 : size, entryOffset + 1);
    ico.writeUInt8(0, entryOffset + 2);
    ico.writeUInt8(0, entryOffset + 3);
    ico.writeUInt16LE(1, entryOffset + 4);
    ico.writeUInt16LE(32, entryOffset + 6);
    ico.writeUInt32LE(pngBuf.length, entryOffset + 8);
    ico.writeUInt32LE(currentOffset, entryOffset + 12);
    
    pngBuf.copy(ico, currentOffset);
    currentOffset += pngBuf.length;
  }
  return ico;
}

function run() {
  console.log('Loading high-resolution master source...');
  const srcPath = path.resolve('public/site logo 02.png');
  const srcImg = decodePng(fs.readFileSync(srcPath));

  // Symmetrical content bounds: 279..1220 => size 942x942, center 749.5, 749.5
  const contentW = 942;
  const contentH = 942;
  const centerX = 749.5;
  const centerY = 749.5;

  // Target: logo fills ~97% of the canvas (enlarged with ~1.5% subpixel margin for crisp circular anti-aliasing)
  const paddingRatio = 0.015;
  const cropSize = contentW / (1 - 2 * paddingRatio); // ~971.1px
  const cropX = centerX - cropSize / 2;
  const cropY = centerY - cropSize / 2;

  console.log(`Master size: ${srcImg.width}x${srcImg.height}, Crop: size=${cropSize.toFixed(1)}, X=${cropX.toFixed(1)}, Y=${cropY.toFixed(1)}`);

  // Target sizes with tailored sharpening and contrast enhancement
  const configs = [
    { size: 16, sharpen: 0.38 },
    { size: 32, sharpen: 0.30 },
    { size: 48, sharpen: 0.22 },
    { size: 64, sharpen: 0.16 },
    { size: 128, sharpen: 0.10 },
    { size: 180, sharpen: 0.08 },
    { size: 192, sharpen: 0.08 },
    { size: 256, sharpen: 0.05 },
    { size: 512, sharpen: 0.0 },
    { size: 1080, sharpen: 0.0 }
  ];

  const renderedMap = {};

  for (const cfg of configs) {
    const raw = resampleAreaAverage(srcImg, cropX, cropY, cropSize, cropSize, cfg.size, cfg.size);
    const enhanced = enhanceCrispDetails(raw, cfg.size, cfg.size, cfg.sharpen);
    const png = encodePng(cfg.size, cfg.size, enhanced);
    renderedMap[cfg.size] = png;
    console.log(`Rendered ${cfg.size}x${cfg.size} (sharpen=${cfg.sharpen}, pngSize=${png.length} bytes)`);
  }

  // Write dedicated browser tab icon files to public/
  fs.writeFileSync('public/favicon-16x16.png', renderedMap[16]);
  fs.writeFileSync('public/favicon-32x32.png', renderedMap[32]);
  fs.writeFileSync('public/favicon-48x48.png', renderedMap[48]);
  fs.writeFileSync('public/apple-touch-icon.png', renderedMap[180]);
  fs.writeFileSync('public/icon-192.png', renderedMap[192]);
  fs.writeFileSync('public/icon-512.png', renderedMap[512]);
  fs.writeFileSync('public/turquoise.png', renderedMap[1080]);
  fs.writeFileSync('public/quard.png', renderedMap[512]);

  // Multi-resolution ICO for legacy & modern browser tabs
  const multiIco = createIco(
    [renderedMap[16], renderedMap[32], renderedMap[48], renderedMap[64], renderedMap[128], renderedMap[256]],
    [16, 32, 48, 64, 128, 256]
  );
  fs.writeFileSync('public/favicon.ico', multiIco);

  // App router specific files
  fs.writeFileSync('app/favicon.ico', multiIco);
  fs.writeFileSync('app/icon.png', renderedMap[512]);
  fs.writeFileSync('app/apple-icon.png', renderedMap[180]);

  console.log('All clear, high-detail favicon and tab icon files successfully generated!');
}

run();
