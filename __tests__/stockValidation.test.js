/**
 * Test cases for the stock validation system
 * Run these tests to verify the fix is working properly
 */

import { validateCartOperation, validateCartStock } from '../utils/cartStockValidation';
import { CheckoutValidator } from '../utils/checkoutValidator';

// Mock data for testing
const mockStockQuantities = {
  'item1': 10,    // Good stock
  'item2': 2,     // Low stock  
  'item3': 0,     // Out of stock
  'item4': 0.5,   // Very low stock (kg item)
};

const mockCartItems = {
  'item1': 5,     // Valid quantity
  'item2': 5,     // Exceeds available (2)
  'item3': 1,     // Out of stock item
  'item4': 0.25,  // Valid for kg item
};

const mockItemDetails = {
  'item1': { name: 'Paper', measurement_unit: 2 }, // pieces
  'item2': { name: 'Plastic', measurement_unit: 2 }, // pieces  
  'item3': { name: 'Metal', measurement_unit: 2 }, // pieces
  'item4': { name: 'Cardboard', measurement_unit: 1 }, // kg
};

/**
 * Test 1: Cart Stock Validation
 */
export const testCartStockValidation = () => {
  console.log('🧪 Running Cart Stock Validation Test...');
  
  const result = validateCartStock(mockCartItems, mockStockQuantities, mockItemDetails);
  
  console.log('Validation Result:', {
    isValid: result.isValid,
    totalItems: result.totalItems,
    validItems: result.validItems,
    invalidCount: result.invalidCount,
    outOfStockItems: result.outOfStockItems
  });
  
  // Expected results:
  // - isValid: false
  // - totalItems: 4
  // - validItems: 2 (item1, item4)
  // - invalidCount: 2 (item2, item3)
  // - outOfStockItems: ['Metal']
  
  const expectedInvalid = ['item2', 'item3'];
  const actualInvalid = result.invalidItems.map(item => item.itemId);
  
  const testPassed = !result.isValid && 
                    result.invalidCount === 2 && 
                    expectedInvalid.every(id => actualInvalid.includes(id));
  
  console.log('✅ Test 1 Passed:', testPassed);
  return testPassed;
};

/**
 * Test 2: Individual Cart Operation Validation
 */
export const testCartOperationValidation = () => {
  console.log('🧪 Running Cart Operation Validation Test...');
  
  // Test adding valid quantity
  const validOp = validateCartOperation(
    'add', 
    'item1', 
    3, 
    mockStockQuantities, 
    {}, 
    mockItemDetails
  );
  
  // Test adding to out of stock item
  const invalidOp = validateCartOperation(
    'add',
    'item3',
    1,
    mockStockQuantities,
    {},
    mockItemDetails
  );
  
  console.log('Valid Operation:', {
    canProceed: validOp.canProceed,
    availableStock: validOp.availableStock
  });
  
  console.log('Invalid Operation:', {
    canProceed: invalidOp.canProceed,
    reason: invalidOp.reason
  });
  
  const testPassed = validOp.canProceed && !invalidOp.canProceed;
  console.log('✅ Test 2 Passed:', testPassed);
  return testPassed;
};

/**
 * Test 3: Checkout Validation
 */
export const testCheckoutValidation = async () => {
  console.log('🧪 Running Checkout Validation Test...');
  
  const result = await CheckoutValidator.validateForCheckout(
    mockCartItems,
    mockStockQuantities,
    mockItemDetails,
    { showMessages: false }
  );
  
  console.log('Checkout Validation:', {
    isValid: result.isValid,
    canProceed: result.canProceed,
    issueCount: result.issues?.length || 0,
    error: result.error
  });
  
  const testPassed = !result.isValid && 
                    !result.canProceed && 
                    result.issues && 
                    result.issues.length > 0;
  
  console.log('✅ Test 3 Passed:', testPassed);
  return testPassed;
};

/**
 * Test 4: Cache Invalidation Simulation
 */
export const testCacheInvalidation = async () => {
  console.log('🧪 Running Cache Invalidation Test...');
  
  try {
    const stockCacheManager = require('../utils/stockCacheManager').default;
    
    // Get initial cache stats
    const initialStats = await stockCacheManager.getCacheStats();
    console.log('Initial Cache Stats:', initialStats);
    
    // Simulate stock update
    stockCacheManager.notifyStockUpdate({ 'item1': 15, 'item3': 5 });
    
    // Check if invalidation timestamp updated
    const shouldInvalidate = stockCacheManager.shouldInvalidateCaches(1000); // 1 second
    
    console.log('Cache Invalidation Triggered:', !shouldInvalidate);
    
    const testPassed = !shouldInvalidate; // Should be false if recently invalidated
    console.log('✅ Test 4 Passed:', testPassed);
    return testPassed;
  } catch (error) {
    console.log('❌ Test 4 Failed:', error.message);
    return false;
  }
};

/**
 * Run all tests
 */
export const runAllTests = async () => {
  console.log('🚀 Starting Stock Validation System Tests...\n');
  
  const results = [];
  
  results.push(testCartStockValidation());
  results.push(testCartOperationValidation());
  results.push(await testCheckoutValidation());
  results.push(await testCacheInvalidation());
  
  const passedTests = results.filter(Boolean).length;
  const totalTests = results.length;
  
  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Stock validation system is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Please check the implementation.');
  }
  
  return passedTests === totalTests;
};

// Export for use in development
export default {
  testCartStockValidation,
  testCartOperationValidation,
  testCheckoutValidation,
  testCacheInvalidation,
  runAllTests
};
