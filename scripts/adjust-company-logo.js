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

// Bicubic interpolation weight (Catmull-Rom spline, a = -0.5)
function cubicWeight(x) {
  const a = -0.5;
  const ax = Math.abs(x);
  if (ax <= 1) {
    return (a + 2) * ax * ax * ax - (a + 3) * ax * ax + 1;
  } else if (ax < 2) {
    return a * ax * ax * ax - 5 * a * ax * ax + 8 * a * ax - 4 * a;
  }
  return 0;
}

// Resample from source crop box to target canvas
function resampleCrop(src, cropX, cropY, cropW, cropH, dstW, dstH) {
  const dst = Buffer.alloc(dstW * dstH * 4);
  const scaleX = cropW / dstW;
  const scaleY = cropH / dstH;
  
  for (let dy = 0; dy < dstH; dy++) {
    const sy = cropY + (dy + 0.5) * scaleY - 0.5;
    for (let dx = 0; dx < dstW; dx++) {
      const sx = cropX + (dx + 0.5) * scaleX - 0.5;
      
      const x0 = Math.floor(sx);
      const y0 = Math.floor(sy);
      
      let rSum = 0, gSum = 0, bSum = 0, aSum = 0, wSum = 0;
      
      for (let j = -1; j <= 2; j++) {
        const py = y0 + j;
        if (py < 0 || py >= src.height) continue;
        const wy = cubicWeight(sy - py);
        if (wy === 0) continue;
        
        for (let i = -1; i <= 2; i++) {
          const px = x0 + i;
          if (px < 0 || px >= src.width) continue;
          const wx = cubicWeight(sx - px);
          const w = wx * wy;
          if (w === 0) continue;
          
          const sIdx = (py * src.width + px) * 4;
          const a = src.data[sIdx + 3] / 255;
          
          rSum += src.data[sIdx] * a * w;
          gSum += src.data[sIdx + 1] * a * w;
          bSum += src.data[sIdx + 2] * a * w;
          aSum += src.data[sIdx + 3] * w;
          wSum += w;
        }
      }
      
      const dIdx = (dy * dstW + dx) * 4;
      if (wSum > 0 && aSum > 0) {
        const finalA = Math.min(Math.max(aSum / wSum, 0), 255);
        const aNorm = finalA / 255;
        if (aNorm > 0.001) {
          dst[dIdx] = Math.min(Math.max(Math.round((rSum / wSum) / aNorm), 0), 255);
          dst[dIdx + 1] = Math.min(Math.max(Math.round((gSum / wSum) / aNorm), 0), 255);
          dst[dIdx + 2] = Math.min(Math.max(Math.round((bSum / wSum) / aNorm), 0), 255);
          dst[dIdx + 3] = Math.round(finalA);
        }
      }
    }
  }
  return dst;
}

// Generate multi-resolution ICO file
function createIco(pngBuffers, sizes) {
  const count = pngBuffers.length;
  const headerSize = 6 + count * 16;
  let totalSize = headerSize;
  for (const buf of pngBuffers) {
    totalSize += buf.length;
  }
  
  const ico = Buffer.alloc(totalSize);
  ico.writeUInt16LE(0, 0); // reserved
  ico.writeUInt16LE(1, 2); // icon type
  ico.writeUInt16LE(count, 4); // number of images
  
  let currentOffset = headerSize;
  for (let i = 0; i < count; i++) {
    const size = sizes[i];
    const pngBuf = pngBuffers[i];
    const entryOffset = 6 + i * 16;
    
    ico.writeUInt8(size >= 256 ? 0 : size, entryOffset); // width
    ico.writeUInt8(size >= 256 ? 0 : size, entryOffset + 1); // height
    ico.writeUInt8(0, entryOffset + 2); // color count
    ico.writeUInt8(0, entryOffset + 3); // reserved
    ico.writeUInt16LE(1, entryOffset + 4); // planes
    ico.writeUInt16LE(32, entryOffset + 6); // bpp
    ico.writeUInt32LE(pngBuf.length, entryOffset + 8); // size
    ico.writeUInt32LE(currentOffset, entryOffset + 12); // offset
    
    pngBuf.copy(ico, currentOffset);
    currentOffset += pngBuf.length;
  }
  
  return ico;
}

function run() {
  const sourcePath = path.resolve('public/turquoise.png');
  const srcImg = decodePng(fs.readFileSync(sourcePath));
  
  // Find non-transparent bounds
  let minX = srcImg.width, maxX = 0, minY = srcImg.height, maxY = 0;
  for (let y = 0; y < srcImg.height; y++) {
    for (let x = 0; x < srcImg.width; x++) {
      const alpha = srcImg.data[(y * srcImg.width + x) * 4 + 3];
      if (alpha > 5) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  
  const contentW = maxX - minX + 1;
  const contentH = maxY - minY + 1;
  const contentSize = Math.max(contentW, contentH);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  
  console.log(`Content dimensions: ${contentW}x${contentH}, center: (${centerX.toFixed(1)}, ${centerY.toFixed(1)})`);
  
  // We want the logo to occupy ~92% of the canvas height/width (leaving 4% clean margin on each side)
  // This provides maximum size and clarity on browser tabs without edge clipping.
  const paddingRatio = 0.04;
  const cropSize = contentSize / (1 - 2 * paddingRatio);
  const cropX = centerX - cropSize / 2;
  const cropY = centerY - cropSize / 2;
  
  console.log(`Adjusted crop box: size=${cropSize.toFixed(1)}, x=${cropX.toFixed(1)}, y=${cropY.toFixed(1)}`);
  
  // Generate 1080x1080, 512x512, 192x192, 48x48, 32x32, 16x16
  const data1080 = resampleCrop(srcImg, cropX, cropY, cropSize, cropSize, 1080, 1080);
  const data512 = resampleCrop(srcImg, cropX, cropY, cropSize, cropSize, 512, 512);
  const data192 = resampleCrop(srcImg, cropX, cropY, cropSize, cropSize, 192, 192);
  const data48 = resampleCrop(srcImg, cropX, cropY, cropSize, cropSize, 48, 48);
  const data32 = resampleCrop(srcImg, cropX, cropY, cropSize, cropSize, 32, 32);
  const data16 = resampleCrop(srcImg, cropX, cropY, cropSize, cropSize, 16, 16);
  
  const png1080 = encodePng(1080, 1080, data1080);
  const png512 = encodePng(512, 512, data512);
  const png192 = encodePng(192, 192, data192);
  const png48 = encodePng(48, 48, data48);
  const png32 = encodePng(32, 32, data32);
  const png16 = encodePng(16, 16, data16);
  
  const icoFile = createIco([png16, png32, png48, png512], [16, 32, 48, 256]);
  
  // Write to public/turquoise.png
  fs.writeFileSync('public/turquoise.png', png1080);
  console.log('Updated public/turquoise.png (1080x1080)');
  
  // Write to app/icon.png
  fs.writeFileSync('app/icon.png', png512);
  console.log('Updated app/icon.png (512x512)');
  
  // Write to app/apple-icon.png
  fs.writeFileSync('app/apple-icon.png', png512);
  console.log('Updated app/apple-icon.png (512x512)');
  
  // Write to app/favicon.ico
  fs.writeFileSync('app/favicon.ico', icoFile);
  console.log('Updated app/favicon.ico (multi-size ICO)');
  
  // Write to public/favicon.ico
  fs.writeFileSync('public/favicon.ico', icoFile);
  console.log('Updated public/favicon.ico (multi-size ICO)');
  
  // Write to public/quard.png
  fs.writeFileSync('public/quard.png', png512);
  console.log('Updated public/quard.png (512x512)');
  
  console.log('All tab logo and icon files successfully updated!');
}

run();
