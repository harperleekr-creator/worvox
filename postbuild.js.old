#!/usr/bin/env node
// Post-build script to update _routes.json

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const routesPath = path.join(__dirname, 'dist', '_routes.json');

// Minify app.js to app.min.js using Terser
console.log('📦 Minifying app.js to app.min.js with Terser...');
try {
  const { minify } = await import('terser');
  const appJsSource = path.join(__dirname, 'public', 'static', 'app.js');
  const appJsDestPublic = path.join(__dirname, 'public', 'static', 'app.min.js');
  const appJsDestDist = path.join(__dirname, 'dist', 'static', 'app.min.js');
  
  if (fs.existsSync(appJsSource)) {
    const code = fs.readFileSync(appJsSource, 'utf8');
    const originalSize = Buffer.byteLength(code, 'utf8');
    
    // Minify with Terser
    const result = await minify(code, {
      compress: {
        dead_code: true,
        drop_console: false, // Keep console for debugging
        drop_debugger: true,
        passes: 2
      },
      mangle: {
        toplevel: false,
        keep_fnames: true // Keep function names for better debugging
      },
      format: {
        comments: false
      }
    });
    
    if (result.code) {
      const minifiedSize = Buffer.byteLength(result.code, 'utf8');
      const reduction = ((1 - minifiedSize / originalSize) * 100).toFixed(2);
      
      // Write to public/static
      fs.writeFileSync(appJsDestPublic, result.code, 'utf8');
      console.log('✅ app.min.js created in public/static');
      
      // Write to dist/static (for deployment)
      const distStaticDir = path.join(__dirname, 'dist', 'static');
      if (fs.existsSync(distStaticDir)) {
        fs.writeFileSync(appJsDestDist, result.code, 'utf8');
        console.log('✅ app.min.js copied to dist/static');
      }
      
      console.log(`📉 Compression: ${reduction}%`);
      console.log(`💾 Saved: ${Math.round((originalSize - minifiedSize) / 1024)}KB`);
    }
  } else {
    console.warn('⚠️ app.js not found, skipping app.min.js creation');
  }
} catch (error) {
  console.error('❌ Failed to minify app.js:', error);
}

console.log('📝 Updating _routes.json...');

try {
  // Read current _routes.json
  const routesContent = fs.readFileSync(routesPath, 'utf8');
  const routes = JSON.parse(routesContent);

  // Add sw.js and manifest.json to exclude list
  const additionalExcludes = ['/sw.js', '/manifest.json'];
  
  routes.exclude = routes.exclude || [];
  
  additionalExcludes.forEach(item => {
    if (!routes.exclude.includes(item)) {
      routes.exclude.push(item);
    }
  });

  // Write updated _routes.json
  fs.writeFileSync(routesPath, JSON.stringify(routes, null, 2), 'utf8');
  
  console.log('✅ Updated _routes.json');
  console.log('   Excluded items:', routes.exclude.join(', '));
  
} catch (error) {
  console.error('❌ Failed to update _routes.json:', error);
  process.exit(1);
}
