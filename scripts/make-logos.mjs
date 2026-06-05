import Jimp from 'jimp';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { writeFile } from 'fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));

const MASTER_ICON_PATH = '/Users/harsh/.gemini/antigravity/brain/a717e827-3267-4562-86a8-f803746815d3/easytools_brand_icon_1780667231127.png';
const PUBLIC_DIR = resolve(__dirname, '../public');
const ASSETS_DIR = resolve(__dirname, '../src/assets');

async function processMasterIcon() {
  console.log(`Loading master icon: ${MASTER_ICON_PATH}`);
  const image = await Jimp.read(MASTER_ICON_PATH);
  
  // 1. Make the white background transparent
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
    const r = this.bitmap.data[idx + 0];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    if (r > 240 && g > 240 && b > 240) {
      this.bitmap.data[idx + 3] = 0;
    }
  });

  // 2. Crop to the bounding box of the icon
  let minX = image.bitmap.width;
  let maxX = 0;
  let minY = image.bitmap.height;
  let maxY = 0;

  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
    const a = this.bitmap.data[idx + 3];
    if (a !== 0) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  });

  if (maxX >= minX && maxY >= minY) {
    const w = maxX - minX + 1;
    const h = maxY - minY + 1;
    const size = Math.max(w, h);
    const centerX = minX + w / 2;
    const centerY = minY + h / 2;
    const cropX = Math.max(0, Math.floor(centerX - size / 2));
    const cropY = Math.max(0, Math.floor(centerY - size / 2));
    
    console.log(`Cropped icon square: x=${cropX}, y=${cropY}, size=${size}`);
    image.crop(cropX, cropY, size, size);
  }
  
  return image;
}

function manualCrop(image) {
  let minX = image.bitmap.width;
  let maxX = 0;
  let minY = image.bitmap.height;
  let maxY = 0;

  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
    const a = this.bitmap.data[idx + 3];
    if (a !== 0) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  });

  if (maxX >= minX && maxY >= minY) {
    const cropWidth = maxX - minX + 1;
    const cropHeight = maxY - minY + 1;
    image.crop(minX, minY, cropWidth, cropHeight);
  }
}

async function run() {
  try {
    const masterIcon = await processMasterIcon();

    // --- GENERATE FAVICONS ---
    console.log('\n--- Generating Favicons ---');
    
    // 512x512
    const img512 = masterIcon.clone().resize(512, 512);
    const path512 = resolve(PUBLIC_DIR, 'web-app-manifest-512x512.png');
    await img512.writeAsync(path512);
    console.log(`Saved: ${path512}`);

    // SVG
    const buffer512 = await img512.getBufferAsync(Jimp.MIME_PNG);
    const base64_512 = buffer512.toString('base64');
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" width="512" height="512" viewBox="0 0 512 512"><image width="512" height="512" xlink:href="data:image/png;base64,${base64_512}"></image></svg>\n`;
    const svgPath = resolve(PUBLIC_DIR, 'favicon.svg');
    await writeFile(svgPath, svgContent, 'utf-8');
    console.log(`Saved: ${svgPath}`);

    // 192x192
    const img192 = masterIcon.clone().resize(192, 192);
    const path192 = resolve(PUBLIC_DIR, 'web-app-manifest-192x192.png');
    await img192.writeAsync(path192);
    console.log(`Saved: ${path192}`);

    // 180x180
    const img180 = masterIcon.clone().resize(180, 180);
    const path180 = resolve(PUBLIC_DIR, 'apple-touch-icon.png');
    await img180.writeAsync(path180);
    console.log(`Saved: ${path180}`);

    // 96x96
    const img96 = masterIcon.clone().resize(96, 96);
    const path96 = resolve(PUBLIC_DIR, 'favicon-96x96.png');
    await img96.writeAsync(path96);
    console.log(`Saved: ${path96}`);

    // 32x32
    const img32 = masterIcon.clone().resize(32, 32);
    const path32 = resolve(PUBLIC_DIR, 'favicon.ico');
    await img32.writeAsync(path32);
    console.log(`Saved: ${path32}`);


    // --- GENERATE LOGOS ---
    console.log('\n--- Generating Logos ---');

    // Create brand logo icon part
    const logoIcon = masterIcon.clone().resize(80, 80);

    // Light Logo (Dark Text)
    const lightLogoCanvas = new Jimp(450, 100, 0x00000000);
    lightLogoCanvas.composite(logoIcon, 10, 10);
    const fontBlack = await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK);
    lightLogoCanvas.print(fontBlack, 110, 18, 'EasyTools');
    manualCrop(lightLogoCanvas);
    const lightLogoPath = resolve(ASSETS_DIR, 'logo.png');
    await lightLogoCanvas.writeAsync(lightLogoPath);
    console.log(`Saved Light Logo: ${lightLogoPath} (${lightLogoCanvas.bitmap.width}x${lightLogoCanvas.bitmap.height})`);

    // Dark Logo (White Text)
    const darkLogoCanvas = new Jimp(450, 100, 0x00000000);
    darkLogoCanvas.composite(logoIcon, 10, 10);
    const fontWhite = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
    darkLogoCanvas.print(fontWhite, 110, 18, 'EasyTools');
    manualCrop(darkLogoCanvas);
    const darkLogoPath = resolve(ASSETS_DIR, 'logo-white.png');
    await darkLogoCanvas.writeAsync(darkLogoPath);
    console.log(`Saved Dark Logo: ${darkLogoPath} (${darkLogoCanvas.bitmap.width}x${darkLogoCanvas.bitmap.height})`);

    console.log('\nAll logo and favicon assets built successfully!');
  } catch (error) {
    console.error('Error building assets:', error);
    process.exit(1);
  }
}

run();
