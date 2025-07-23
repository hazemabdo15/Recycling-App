
import {
    calculateQuantity,
    formatQuantityDisplay,
    getIncrementStep,
    normalizeItemData
} from '../cartUtils';

console.log('Testing calculateQuantity function:');

console.log('KG Quantity Tests:');
console.log('0 + 0.25 =', calculateQuantity(0, 0.25, 'add'));
console.log('0.25 + 0.25 =', calculateQuantity(0.25, 0.25, 'add'));
console.log('1.0 + 0.25 =', calculateQuantity(1.0, 0.25, 'add'));
console.log('0.25 - 0.25 =', calculateQuantity(0.25, 0.25, 'subtract'));
console.log('0.75 - 0.25 =', calculateQuantity(0.75, 0.25, 'subtract'));

console.log('\nPiece Quantity Tests:');
console.log('0 + 1 =', calculateQuantity(0, 1, 'add'));
console.log('1 + 1 =', calculateQuantity(1, 1, 'add'));
console.log('2 - 1 =', calculateQuantity(2, 1, 'subtract'));
console.log('1 - 1 =', calculateQuantity(1, 1, 'subtract'));

console.log('\nTesting formatQuantityDisplay:');
console.log('KG 0.25 =', formatQuantityDisplay(0.25, 1));
console.log('KG 1.50 =', formatQuantityDisplay(1.5, 1));
console.log('Piece 1 =', formatQuantityDisplay(1, 2));
console.log('Piece 5 =', formatQuantityDisplay(5, 2));

console.log('\nTesting normalizeItemData:');
const testItem1 = {
    _id: '123',
    name: 'Test Item',
    measurement_unit: 'KG'
};
const normalized1 = normalizeItemData(testItem1);
console.log('String KG normalization:', normalized1);

const testItem2 = {
    categoryId: '456',
    name: 'Test Item 2',
    measurement_unit: 'Piece'
};
const normalized2 = normalizeItemData(testItem2);
console.log('String Piece normalization:', normalized2);

console.log('\nTesting getIncrementStep:');
console.log('KG step (1):', getIncrementStep(1));
console.log('Piece step (2):', getIncrementStep(2));

console.log('\nAll tests completed!');
