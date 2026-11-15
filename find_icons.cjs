const fs = require('fs');
const path = require('path');
const dirs = ['frontend/src/pages', 'frontend/src/components'];
const icons = new Set();
dirs.forEach(d => {
  fs.readdirSync(d).forEach(f => {
    if (f.endsWith('.jsx')) {
      const content = fs.readFileSync(path.join(d, f), 'utf8');
      const matches = content.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"][^'"]*Iconify['"]/g);
      for (const m of matches) {
        m[1].split(',').forEach(x => {
          const item = x.trim();
          if (item) icons.add(item);
        });
      }
    }
  });
});
console.log(JSON.stringify(Array.from(icons).sort(), null, 2));

