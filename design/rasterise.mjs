// Turn the generated SVGs into the PNGs Xcode wants.
//
// Uses the Playwright Chromium that the e2e suite already installs, rather than
// adding a rasteriser dependency for three files. The SVGs stay the source of
// truth: edit the generator, run this, never touch a PNG by hand.
//
//   node rasterise.mjs icon/icon.svg 1024 ../app/ios/.../AppIcon-1024.png
// @playwright/test ships CommonJS, so the named export has to come off default
import playwright from '../app/node_modules/@playwright/test/index.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const { chromium } = playwright;

const [src, sizeArg, dest] = process.argv.slice(2);
if (!src || !sizeArg || !dest) {
  console.error('usage: node rasterise.mjs <in.svg> <size> <out.png>');
  process.exit(1);
}

const size = Number(sizeArg);
const svg = readFileSync(resolve(src), 'utf8');

const browser = await chromium.launch();
// omitBackground keeps the transparent dark variant transparent; a variant that
// paints its own ground is unaffected
const page = await browser.newPage({
  viewport: { width: size, height: size },
  deviceScaleFactor: 1
});
await page.setContent(
  /*
   * The SVG carries an intrinsic 1024 size, so without forcing it to the
   * viewport the screenshot crops the top-left corner instead of scaling —
   * which silently produced a plain red square at 120px.
   */
  `<style>html,body{margin:0;padding:0;background:transparent;}
     svg{display:block;width:100vw;height:100vh;}</style>${svg}`,
  { waitUntil: 'load' }
);
await page.screenshot({ path: resolve(dest), omitBackground: true });
await browser.close();
console.log(`${src} -> ${dest} at ${size}x${size}`);
