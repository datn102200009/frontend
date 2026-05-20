const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, 'src');
const aliases = ['app', 'shared', 'features', 'entities', 'widgets', 'processes', 'pages', 'config', 'lib'];

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  
  // Match imports and exports with relative paths
  const importExportRegex = /(import|export)\s+(.*?)\s+from\s+['"](\.\.[\/a-zA-Z0-9_.-]+)['"]/g;
  
  content = content.replace(importExportRegex, (match, p1, p2, p3) => {
    // p1 = import/export
    // p2 = what is imported
    // p3 = relative path (e.g., ../../shared/ui/Button)
    
    // Check if it's actually going up (has ../)
    if (!p3.includes('../')) return match;
    
    const absoluteImportPath = path.resolve(path.dirname(filePath), p3);
    
    // Check if it's inside src
    if (absoluteImportPath.startsWith(rootDir)) {
      // Get relative to src
      const relativeToSrc = path.relative(rootDir, absoluteImportPath).replace(/\\/g, '/');
      const parts = relativeToSrc.split('/');
      const topFolder = parts[0];
      
      if (aliases.includes(topFolder)) {
        hasChanges = true;
        const newImportPath = '@' + relativeToSrc;
        return ${p1}  from '';
      }
    }
    return match;
  });

  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(Updated: );
  }
}

const allFiles = getAllFiles(rootDir);
let updatedCount = 0;
for (const file of allFiles) {
  const original = fs.readFileSync(file, 'utf8');
  processFile(file);
  if (original !== fs.readFileSync(file, 'utf8')) updatedCount++;
}
console.log(Refactoring complete. Updated  files.);
