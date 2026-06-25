import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const here = path.dirname(fileURLToPath(import.meta.url));
const html = 'file://' + path.join(here, 'boi-founding-partner.html');
const pdfOut = path.join(here, 'BusinessOwnerInsider_Founding_Partner.pdf');
const pngOut = path.join(here, 'boi-preview.png');

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 816, height: 1056 }, deviceScaleFactor: 2 });
await page.goto(html, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(600);
await page.emulateMedia({ media: 'print' });
await page.pdf({
  path: pdfOut, format: 'Letter', printBackground: true,
  margin: { top: '0', right: '0', bottom: '0', left: '0' }, preferCSSPageSize: true,
});
await page.emulateMedia({ media: 'screen' });
await page.screenshot({ path: pngOut, fullPage: true });
await browser.close();
console.log('wrote', pdfOut);
console.log('wrote', pngOut);
