#!/usr/bin/env node

/**
 * Simple helper to create a single pasteable console script
 * by combining the JS + CSS from `pnpm build:console`
 */

import fs from 'fs';
import path from 'path';

const distDir = path.resolve('./dist');
const jsFile = path.join(distDir, 'iamnotyourfan-console.js');
const cssFile = path.join(distDir, 'assets', fs.readdirSync(path.join(distDir, 'assets')).find(f => f.endsWith('.css')));

if (!fs.existsSync(jsFile) || !fs.existsSync(cssFile)) {
  console.error('Build files not found. Run `pnpm build:console` first.');
  process.exit(1);
}

const js = fs.readFileSync(jsFile, 'utf8');
const css = fs.readFileSync(cssFile, 'utf8');

const combined = `
// Iamnotyourfan - Full Console Script
// Generated with: pnpm build:console

(function() {
  // Inject CSS
  const style = document.createElement('style');
  style.textContent = \`${css.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
  document.head.appendChild(style);

  // Run the app
  ${js}
})();
`;

const outputPath = path.join(distDir, 'iamnotyourfan-full-console.js');
fs.writeFileSync(outputPath, combined);

console.log('✅ Created single-file console script:');
console.log(outputPath);
console.log('\nYou can now copy the contents of this file and paste it into the console on x.com.');
