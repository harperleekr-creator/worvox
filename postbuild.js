#!/usr/bin/env node
// Post-build script to update _routes.json

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const routesPath = path.join(__dirname, 'dist', '_routes.json');

// Copy app.js to app.min.js in both public/static and dist/static
console.log('📦 Copying app.js to app.min.js...');
try {
  const appJsSource = path.join(__dirname, 'public', 'static', 'app.js');
  const appJsDestPublic = path.join(__dirname, 'public', 'static', 'app.min.js');
  const appJsDestDist = path.join(__dirname, 'dist', 'static', 'app.min.js');
  
  if (fs.existsSync(appJsSource)) {
    // Copy to public/static
    fs.copyFileSync(appJsSource, appJsDestPublic);
    console.log('✅ app.min.js created in public/static');
    
    // Copy to dist/static (for deployment)
    const distStaticDir = path.join(__dirname, 'dist', 'static');
    if (fs.existsSync(distStaticDir)) {
      fs.copyFileSync(appJsSource, appJsDestDist);
      console.log('✅ app.min.js copied to dist/static');
    }
  } else {
    console.warn('⚠️ app.js not found, skipping app.min.js creation');
  }
} catch (error) {
  console.error('❌ Failed to copy app.js:', error);
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
