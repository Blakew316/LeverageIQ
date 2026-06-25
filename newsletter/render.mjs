import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const here = path.dirname(fileURLToPath(import.meta.url));
const html = 'file://' + path.join(here, 'founding-partner.html');
const out = path.join(here, 'LeverageIQ_Founding_Partner.pdf');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 1600 } });
await page.goto(html, { waitUntil: 'networkidle' });
await page.emulateMedia({ media: 'print' });
await page.waitForTimeout(500); // give web fonts a beat
await page.pdf({
  path: out,
  format: 'Letter',
  printBackground: true,
  margin: { top: '0', right: '0', bottom: '0', left: '0' },
  preferCSSPageSize: true,
});
await browser.close();
console.log('wrote', out);
