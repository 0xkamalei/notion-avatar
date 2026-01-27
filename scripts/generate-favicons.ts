import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const SIZES = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon-96x96.png', size: 96 },
  { name: 'apple-icon-180x180.png', size: 180 },
  { name: 'android-icon-192x192.png', size: 192 },
  { name: 'ms-icon-144x144.png', size: 144 },
  { name: 'android-icon-36x36.png', size: 36 },
  { name: 'android-icon-48x48.png', size: 48 },
  { name: 'android-icon-72x72.png', size: 72 },
  { name: 'android-icon-96x96.png', size: 96 },
  { name: 'android-icon-144x144.png', size: 144 },
  { name: 'apple-icon-57x57.png', size: 57 },
  { name: 'apple-icon-60x60.png', size: 60 },
  { name: 'apple-icon-72x72.png', size: 72 },
  { name: 'apple-icon-76x76.png', size: 76 },
  { name: 'apple-icon-114x114.png', size: 114 },
  { name: 'apple-icon-120x120.png', size: 120 },
  { name: 'apple-icon-144x144.png', size: 144 },
  { name: 'apple-icon-152x152.png', size: 152 },
  { name: 'ms-icon-70x70.png', size: 70 },
  { name: 'ms-icon-150x150.png', size: 150 },
  { name: 'ms-icon-310x310.png', size: 310 },
  { name: 'android-icon-512x512.png', size: 512 },
];

const LOGO_PATH = path.resolve(process.cwd(), 'public/logo.svg');
const FAVICON_DIR = path.resolve(process.cwd(), 'public/favicon');

async function main() {
  if (!fs.existsSync(FAVICON_DIR)) {
    fs.mkdirSync(FAVICON_DIR, { recursive: true });
  }

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  console.log(`Reading logo from ${LOGO_PATH}...`);
  const svgContent = fs.readFileSync(LOGO_PATH, 'utf-8');
  
  for (const { name, size } of SIZES) {
    await page.setViewport({ width: size, height: size });
    
    // Inject SVG directly into the page with CSS scaling
    await page.setContent(`
      <html>
        <body style="margin: 0; padding: 0; overflow: hidden; background: transparent; display: flex; justify-content: center; align-items: center; width: 100vw; height: 100vh;">
          ${svgContent}
          <style>
            svg {
              width: 100% !important;
              height: 100% !important;
              display: block;
            }
          </style>
        </body>
      </html>
    `);

    const buffer = await page.screenshot({ type: 'png', omitBackground: true });
    if (Buffer.isBuffer(buffer)) {
      fs.writeFileSync(path.join(FAVICON_DIR, name), buffer as any);
      console.log(`Generated ${name} (${size}x${size})`);
    } else {
      console.error(`Failed to generate buffer for ${name}`);
    }
  }

  await browser.close();
  console.log('Done!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
