const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

async function optimizeFiles() {
  console.log('\n📦 Enhanced Post-Build Optimization\n');
  
  const files = [
    { src: 'public/static/app.js', dest: 'public/static/app.min.js', name: 'app.js' },
    { src: 'public/static/scenario-data.js', dest: 'public/static/scenario-data.min.js', name: 'scenario-data.js' },
    { src: 'public/static/module-loader.js', dest: 'public/static/module-loader.min.js', name: 'module-loader.js' }
  ];
  
  let totalOriginal = 0;
  let totalMinified = 0;
  
  for (const file of files) {
    if (!fs.existsSync(file.src)) {
      console.log(`⚠️  ${file.name} not found, skipping...`);
      continue;
    }
    
    const code = fs.readFileSync(file.src, 'utf8');
    const originalSize = Buffer.byteLength(code, 'utf8');
    totalOriginal += originalSize;
    
    console.log(`\n📖 Minifying: ${file.name}`);
    console.log(`   Original: ${(originalSize / 1024).toFixed(2)} KB`);
    
    try {
      const result = await minify(code, {
        compress: {
          dead_code: true,
          drop_console: false, // Keep console for debugging
          drop_debugger: true,
          keep_classnames: true,
          keep_fnames: false,
          passes: 2
        },
        mangle: {
          keep_classnames: true,
          keep_fnames: false
        },
        format: {
          comments: false
        }
      });
      
      if (result.code) {
        const minifiedSize = Buffer.byteLength(result.code, 'utf8');
        totalMinified += minifiedSize;
        const savings = originalSize - minifiedSize;
        const percentage = ((savings / originalSize) * 100).toFixed(2);
        
        // Write to public/static
        fs.writeFileSync(file.dest, result.code);
        console.log(`   Minified: ${(minifiedSize / 1024).toFixed(2)} KB`);
        console.log(`   Saved: ${(savings / 1024).toFixed(2)} KB (${percentage}%)`);
        console.log(`   ✅ ${file.dest}`);
        
        // Copy to dist/static
        const distDest = file.dest.replace('public/static', 'dist/static');
        const distDir = path.dirname(distDest);
        if (!fs.existsSync(distDir)) {
          fs.mkdirSync(distDir, { recursive: true });
        }
        fs.copyFileSync(file.dest, distDest);
        console.log(`   ✅ ${distDest}`);
      }
    } catch (error) {
      console.error(`❌ Error minifying ${file.name}:`, error.message);
    }
  }
  
  console.log('\n📊 Total Optimization Results:');
  console.log(`   Original: ${(totalOriginal / 1024).toFixed(2)} KB`);
  console.log(`   Minified: ${(totalMinified / 1024).toFixed(2)} KB`);
  console.log(`   Saved: ${((totalOriginal - totalMinified) / 1024).toFixed(2)} KB`);
  console.log(`   Reduction: ${(((totalOriginal - totalMinified) / totalOriginal) * 100).toFixed(2)}%\n`);
  
  // Update _routes.json
  const routesPath = 'dist/_routes.json';
  if (fs.existsSync(routesPath)) {
    const routes = JSON.parse(fs.readFileSync(routesPath, 'utf8'));
    const excludePatterns = [
      '/static/*',
      '/favicon.ico',
      '/favicon-*.png',
      '/apple-touch-icon.png',
      '/android-chrome-*.png',
      '/og-image.jpg',
      '/logo.png',
      '/*.webp',
      '/sw.js',
      '/manifest.json',
      '/test-toss.html',
      '/test.html'
    ];
    
    routes.exclude = [...new Set([...(routes.exclude || []), ...excludePatterns])];
    fs.writeFileSync(routesPath, JSON.stringify(routes, null, 2));
    console.log('📝 Updated _routes.json');
    console.log('   Excluded items:', routes.exclude.join(', '));
  }
}

optimizeFiles().catch(console.error);
