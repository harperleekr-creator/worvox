const fs = require('fs');

// Read app.js
let content = fs.readFileSync('app.js', 'utf8');

// Replace patterns
const replacements = [
  // alert('message') → toast.error('message')
  [/alert\('([^']+)'\)/g, "toast.error('$1')"],
  // alert("message") → toast.error("message")
  [/alert\("([^"]+)"\)/g, 'toast.error("$1")'],
  // alert(`message`) → toast.error(`message`)
  [/alert\(`([^`]+)`\)/g, 'toast.error(`$1`)'],
  
  // 특별한 경우: 성공 메시지
  [/toast\.error\('✅([^']+)'\)/g, "toast.success('$1')"],
  [/toast\.error\('🎁([^']+)'\)/g, "toast.success('$1')"],
  [/toast\.error\('🎉([^']+)'\)/g, "toast.success('$1')"],
  
  // 경고 메시지
  [/toast\.error\('⚠️([^']+)'\)/g, "toast.warning('$1')"],
  [/toast\.error\('💡([^']+)'\)/g, "toast.info('$1')"],
  [/toast\.error\('📝([^']+)'\)/g, "toast.info('$1')"],
  [/toast\.error\('🎬([^']+)'\)/g, "toast.info('$1')"],
  [/toast\.error\('⏱️([^']+)'\)/g, "toast.info('$1')"],
];

let count = 0;
replacements.forEach(([pattern, replacement]) => {
  const matches = content.match(pattern);
  if (matches) {
    count += matches.length;
  }
  content = content.replace(pattern, replacement);
});

// Write back
fs.writeFileSync('app.js', content, 'utf8');

console.log(`✅ Replaced ${count} alert() calls with toast notifications`);
