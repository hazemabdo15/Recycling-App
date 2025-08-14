#!/usr/bin/env node

/**
 * Migration Script for Role-Based Labels to Translation System
 * 
 * This script helps identify and suggest replacements for getLabel() calls
 * throughout your codebase.
 */

const fs = require('fs');
const path = require('path');

// Mapping from old roleLabels keys to new translation keys
const MIGRATION_MAP = {
  // App names
  'appName': 'app.name',
  'welcomeMessage': 'home.callToAction',
  
  // Tab labels
  'tabLabels.home': 'tabs.home',
  'tabLabels.explore': 'tabs.explore',
  'tabLabels.cart': 'tabs.cart',
  'tabLabels.profile': 'tabs.profile',
  
  // Cart related
  'cartTitle': 'cart.title',
  'cartSubtitle': 'cart.subtitle',
  'addToPickup': 'cart.addTo',
  'emptyCartTitle': 'cart.empty',
  'emptyCartSubtitle': 'cart.emptySubtitle',
  'cartPage.findItemsButton': 'cart.findItemsButton',
  
  // Pickup/Order related
  'pickup': 'pickup.label',
  'requestPickup': 'pickup.request',
  'schedulePickup': 'pickup.schedule',
  'pickupCart': 'cart.title',
  
  // Money
  'money': 'money',
  
  // Explore page
  'exploreTitle': 'explore.title',
  'exploreSubtitle': 'explore.subtitle',
  'searchPlaceholder': 'explore.searchPlaceholder',
  
  // Orders
  'orderConfirmation': 'orders.confirmation',
  'orderStatus': 'orders.statusMessage',
  'trackingInfo': 'orders.trackingInfo',
  'estimatedTime': 'orders.estimatedTime',
  
  // Address
  'selectAddress': 'address.select',
  'deliveryTo': 'address.deliveryTo',
  
  // Toast messages
  'categoryToastMessages.itemAdded': 'categoryToastMessages.itemAdded',
  'categoryToastMessages.itemRemoved': 'categoryToastMessages.itemRemoved',
  'categoryToastMessages.itemReduced': 'categoryToastMessages.itemReduced',
  'categoryToastMessages.addFailed': 'categoryToastMessages.addFailed',
  'categoryToastMessages.updateFailed': 'categoryToastMessages.updateFailed',
  
  // Profile labels
  'profileLabels.ordersTab': 'profileLabels.ordersTab',
  'profileLabels.incomingTab': 'profileLabels.incomingTab',
  'profileLabels.completedTab': 'profileLabels.completedTab',
  'profileLabels.cancelledTab': 'profileLabels.cancelledTab',
  'profileLabels.noOrdersMessage': 'profileLabels.noOrdersMessage',
  'profileLabels.startOrderingMessage': 'profileLabels.startOrderingMessage',
  
  // Misc
  'earnPoints': 'earnPoints',
  'itemsReadyFor': 'itemsReadyFor',
  'minimumOrderMessage': 'minimumOrder.message',
  'minimumOrderButton': 'minimumOrder.button',
};

// Progress steps are special - they need custom handling
const PROGRESS_STEPS_PATTERN = /getProgressStepLabel\((\d+),\s*([^)]+)\)/g;

function findFilesToMigrate(dir, extensions = ['.js', '.jsx', '.ts', '.tsx']) {
  const files = [];
  
  function walkDir(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        walkDir(fullPath);
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  walkDir(dir);
  return files;
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const suggestions = [];
  
  // Check if file uses getLabel
  if (content.includes('getLabel')) {
    // Find getLabel calls
    const getLabelPattern = /getLabel\(\s*["']([^"']+)["']\s*,\s*([^,)]+)(?:\s*,\s*([^)]+))?\)/g;
    let match;
    
    while ((match = getLabelPattern.exec(content)) !== null) {
      const [fullMatch, key, role, params] = match;
      const newKey = MIGRATION_MAP[key];
      
      if (newKey) {
        const newCall = params 
          ? `tRole("${newKey}", ${role}, ${params})`
          : `tRole("${newKey}", ${role})`;
          
        suggestions.push({
          type: 'getLabel',
          original: fullMatch,
          suggested: newCall,
          line: content.substring(0, match.index).split('\n').length
        });
      } else {
        suggestions.push({
          type: 'unmapped',
          original: fullMatch,
          key: key,
          line: content.substring(0, match.index).split('\n').length
        });
      }
    }
    
    // Check for getProgressStepLabel
    let progressMatch;
    while ((progressMatch = PROGRESS_STEPS_PATTERN.exec(content)) !== null) {
      const [fullMatch, step, role] = progressMatch;
      const newCall = `tRole("progressSteps", ${role})?.[${step}] || t("common.step", {step: ${step}})`;
      
      suggestions.push({
        type: 'progressStep',
        original: fullMatch,
        suggested: newCall,
        line: content.substring(0, progressMatch.index).split('\n').length
      });
    }
  }
  
  return suggestions.length > 0 ? { file: filePath, suggestions } : null;
}

function generateMigrationReport(projectDir) {
  const files = findFilesToMigrate(projectDir);
  const results = [];
  
  console.log(`🔍 Scanning ${files.length} files for getLabel() usage...\n`);
  
  for (const file of files) {
    const analysis = analyzeFile(file);
    if (analysis) {
      results.push(analysis);
    }
  }
  
  if (results.length === 0) {
    console.log("✅ No getLabel() calls found! Migration appears complete.");
    return;
  }
  
  console.log(`📋 Found ${results.length} files that need migration:\n`);
  
  for (const result of results) {
    console.log(`📁 ${result.file}`);
    console.log('─'.repeat(50));
    
    for (const suggestion of result.suggestions) {
      console.log(`Line ${suggestion.line}:`);
      console.log(`  ❌ ${suggestion.original}`);
      
      if (suggestion.type === 'unmapped') {
        console.log(`  ⚠️  UNMAPPED KEY: "${suggestion.key}" - needs manual mapping`);
      } else {
        console.log(`  ✅ ${suggestion.suggested}`);
      }
      console.log();
    }
    console.log();
  }
  
  // Generate summary
  const totalCalls = results.reduce((sum, r) => sum + r.suggestions.length, 0);
  const unmappedCalls = results.reduce((sum, r) => 
    sum + r.suggestions.filter(s => s.type === 'unmapped').length, 0);
  
  console.log("📊 MIGRATION SUMMARY");
  console.log("=".repeat(30));
  console.log(`Total getLabel() calls found: ${totalCalls}`);
  console.log(`Mapped calls: ${totalCalls - unmappedCalls}`);
  console.log(`Unmapped calls: ${unmappedCalls}`);
  
  if (unmappedCalls > 0) {
    console.log("\n⚠️  Some keys need manual mapping in the translation files!");
  }
}

// Example usage instructions
function printUsageInstructions() {
  console.log(`
🔧 MIGRATION STEPS:

1. Add tRole to your component:
   const { t, tRole } = useLocalization();

2. Replace getLabel() calls:
   ❌ getLabel("cartTitle", user?.role)
   ✅ tRole("cart.title", user?.role)

3. Replace getProgressStepLabel() calls:
   ❌ getProgressStepLabel(1, user?.role)
   ✅ tRole("progressSteps", user?.role)?.[1]

4. Remove roleLabels import:
   ❌ import { getLabel } from "../../utils/roleLabels";
   ✅ // Remove this line

5. Update any unmapped keys by adding them to the translation files.

🎯 Complete migration checklist:
[ ] Update all getLabel() calls to tRole()
[ ] Update all getProgressStepLabel() calls  
[ ] Remove roleLabels imports
[ ] Test with both customer and buyer roles
[ ] Test with both English and Arabic languages
[ ] Remove roleLabels.js file when complete
`);
}

// Main execution
if (require.main === module) {
  const projectDir = process.argv[2] || '.';
  
  console.log("🌍 Role-Based Translation Migration Tool");
  console.log("=====================================\n");
  
  generateMigrationReport(projectDir);
  printUsageInstructions();
}

module.exports = {
  findFilesToMigrate,
  analyzeFile,
  generateMigrationReport,
  MIGRATION_MAP
};
