// Run this to see all installed printers on your PC
// Command: node list-printers.js

const { exec } = require('child_process');

console.log('🖨️  Installed Printers on this PC:');
console.log('─────────────────────────────────');

exec('wmic printer get name', (err, stdout) => {
  if (err) {
    console.error('Error:', err.message);
    return;
  }
  const printers = stdout
    .split('\n')
    .map(p => p.trim())
    .filter(p => p && p !== 'Name');
  
  printers.forEach((p, i) => {
    console.log(`${i + 1}. ${p}`);
  });
  
  console.log('─────────────────────────────────');
  console.log('👆 Copy exact printer name and paste in config.js');
});
