import fs from 'fs';
import path from 'path';

const srcDir = path.resolve('src');

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== 'node_modules') files.push(...walk(full));
    else if (e.isFile() && (e.name.endsWith('.tsx') || e.name.endsWith('.ts'))) files.push(full);
  }
  return files;
}

let totalFixed = 0;
for (const file of walk(srcDir)) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  
  // Fix ../src/ -> ../  (for files in src/components/)
  content = content.replace(/from\s+'\.\.\/src\//g, "from '../");
  
  // Fix ../../src/ -> ../../  (for files in src/components/subdir/)
  content = content.replace(/from\s+'\.\.\/\.\.\/src\//g, "from '../../");
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    const relPath = path.relative(srcDir, file);
    const count = (original.match(/\.\.\/src\//g) || []).length;
    console.log(`Fixed ${count} imports in ${relPath}`);
    totalFixed += count;
  }
}
console.log(`\nDone! Fixed ${totalFixed} broken imports across all files.`);
