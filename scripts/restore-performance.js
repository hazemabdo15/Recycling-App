#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = process.cwd();
const BACKUP_DIR = path.join(PROJECT_ROOT, '.performance-backup');

console.log('🔙 Restoring original performance files...');

const filesToRestore = [
  { backup: 'apiService.js', target: 'services/api/apiService.js' },
  { backup: 'performanceMonitor.js', target: 'utils/performanceMonitor.js' }
];

filesToRestore.forEach(({ backup, target }) => {
  const backupPath = path.join(BACKUP_DIR, backup);
  const targetPath = path.join(PROJECT_ROOT, target);
  
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, targetPath);
    console.log(`   ✅ Restored ${target}`);
  }
});

console.log('✅ Original files restored. Restart your development server.');
