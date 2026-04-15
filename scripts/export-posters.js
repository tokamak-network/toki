/**
 * Export lottery poster mockups to print-ready A3 PNG (300 DPI)
 *
 * Usage: node scripts/export-posters.js
 *
 * Output: ./poster-exports/poster-{1,2,3}-a3-300dpi.png
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// A3 at 300 DPI
const A3_WIDTH = 3508;
const A3_HEIGHT = 4961;

// Original HTML canvas size
const HTML_WIDTH = 480;
const HTML_HEIGHT = 678;

const SCALE = A3_WIDTH / HTML_WIDTH; // ~7.31

const OUTPUT_DIR = path.join(__dirname, '..', 'poster-exports');
const HTML_FILE = path.join(__dirname, '..', 'lottery-poster-mockups.html');

async function exportPosters() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: A3_WIDTH, height: A3_HEIGHT },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  // Load the HTML file
  await page.goto(`file://${HTML_FILE}`);
  await page.waitForLoadState('networkidle');

  // Wait for Google Fonts to load
  await page.waitForFunction(() => document.fonts.ready);
  await page.waitForTimeout(2000); // Extra buffer for font rendering

  const posters = [
    { selector: '.p1', name: 'poster-1' },
    { selector: '.p2', name: 'poster-2' },
    { selector: '.p3', name: 'poster-3' },
    { selector: '.p4', name: 'poster-4' },
  ];

  for (const { selector, name } of posters) {
    console.log(`Exporting ${name}...`);

    // Inject CSS to isolate and scale the target poster
    await page.evaluate(({ sel, scale, w, h }) => {
      // Hide everything
      document.body.style.cssText = `
        margin: 0; padding: 0; background: transparent;
        width: ${w}px; height: ${h}px; overflow: hidden;
      `;

      // Hide all elements except target poster
      document.querySelectorAll('body > *').forEach(el => {
        el.style.display = 'none';
      });

      // Show and scale target poster
      const poster = document.querySelector(sel);
      poster.style.display = 'block';
      poster.style.position = 'absolute';
      poster.style.top = '0';
      poster.style.left = '0';
      poster.style.transform = `scale(${scale})`;
      poster.style.transformOrigin = 'top left';
    }, { sel: selector, scale: SCALE, w: A3_WIDTH, h: A3_HEIGHT });

    // Small delay for render
    await page.waitForTimeout(500);

    const outputPath = path.join(OUTPUT_DIR, `${name}-a3-300dpi.png`);

    await page.screenshot({
      path: outputPath,
      clip: { x: 0, y: 0, width: A3_WIDTH, height: A3_HEIGHT },
    });

    console.log(`  -> ${outputPath} (${A3_WIDTH}x${A3_HEIGHT}px)`);

    // Reset styles for next poster
    await page.evaluate(() => {
      document.body.style.cssText = '';
      document.querySelectorAll('body > *').forEach(el => {
        el.style.display = '';
        el.style.position = '';
        el.style.top = '';
        el.style.left = '';
        el.style.transform = '';
        el.style.transformOrigin = '';
      });
    });
  }

  await browser.close();
  console.log('\nDone! Exported to:', OUTPUT_DIR);
  console.log(`Resolution: ${A3_WIDTH}x${A3_HEIGHT}px (A3 @ 300 DPI)`);

  // Embed 300 DPI metadata if ImageMagick is available
  try {
    const { execSync } = require('child_process');
    for (const { name } of posters) {
      const file = path.join(OUTPUT_DIR, `${name}-a3-300dpi.png`);
      execSync(`convert "${file}" -density 300 -units PixelsPerInch "${file}"`);
      console.log(`  DPI metadata embedded: ${name}`);
    }
  } catch {
    console.log('\nNote: Install ImageMagick to embed DPI metadata: brew install imagemagick');
  }
}

exportPosters().catch(console.error);
