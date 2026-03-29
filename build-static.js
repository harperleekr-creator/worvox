#!/usr/bin/env node
// Build script for static JS files - optimizes app.js for production

import { minify } from 'terser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceFile = path.join(__dirname, 'public', 'static', 'app.js');
const outputFile = path.join(__dirname, 'public', 'static', 'app.min.js');

console.log('🔨 Building static JavaScript files...');
console.log(`📖 Reading: ${sourceFile}`);

// Read source file
const code = fs.readFileSync(sourceFile, 'utf8');

console.log(`📦 Original size: ${(code.length / 1024).toFixed(2)} KB`);

// Minify with aggressive options
const minifyOptions = {
  compress: {
    dead_code: true,
    drop_console: false, // Keep console for debugging (set to true for production)
    drop_debugger: true,
    keep_classnames: false,
    keep_fargs: true,
    keep_fnames: false,
    keep_infinity: false,
    passes: 3, // Multiple passes for better compression
    pure_getters: true,
    toplevel: false,
    unsafe: false,
    unsafe_arrows: false,
    unsafe_comps: false,
    unsafe_math: false,
    unsafe_methods: false,
    unsafe_proto: false,
    unsafe_regexp: false,
    unsafe_undefined: false,
    unused: true,
  },
  mangle: {
    toplevel: false,
    keep_classnames: true, // Keep WorVox class name
    keep_fnames: false,
    reserved: ['WorVox', 'worvox', 'moduleLoader'], // Preserve global variables
  },
  format: {
    comments: false, // Remove all comments
    beautify: false,
    preserve_annotations: false,
  },
  sourceMap: false,
};

console.log('⚙️  Minifying with Terser...');

minify(code, minifyOptions)
  .then(result => {
    if (result.code) {
      // Write minified file
      fs.writeFileSync(outputFile, result.code, 'utf8');
      
      const minifiedSize = result.code.length;
      const compressionRatio = ((1 - minifiedSize / code.length) * 100).toFixed(2);
      
      console.log(`✅ Minified size: ${(minifiedSize / 1024).toFixed(2)} KB`);
      console.log(`📉 Compression: ${compressionRatio}%`);
      console.log(`💾 Saved to: ${outputFile}`);
      console.log('');
      console.log('✨ Build complete!');
    }
  })
  .catch(error => {
    console.error('❌ Minification failed:', error);
    process.exit(1);
  });
