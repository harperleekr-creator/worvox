#!/usr/bin/env node

/**
 * Auto-update BUILD_TIME in src/index.tsx before build
 * This ensures proper cache busting without manual version updates
 */

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'src', 'index.tsx');
const buildTime = Date.now().toString();

// Read the file
let content = fs.readFileSync(indexPath, 'utf8');

// Replace BUILD_TIME value
content = content.replace(
  /const BUILD_TIME = '[0-9]+';/,
  `const BUILD_TIME = '${buildTime}';`
);

// Write back
fs.writeFileSync(indexPath, content, 'utf8');

console.log(`✅ Updated BUILD_TIME to ${buildTime} (${new Date(parseInt(buildTime)).toISOString()})`);
