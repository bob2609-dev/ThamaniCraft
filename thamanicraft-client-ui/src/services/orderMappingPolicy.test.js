import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canMapOrderRecipe } from './orderMappingPolicy.js';

for (const status of ['NEW', 'CONFIRMED']) {
  for (const [paymentStatus, netPaid, balance] of [['UNPAID', 0, 67500], ['PARTIAL', 40000, 27500], ['PAID', 67500, 0]]) {
    test(`${status} / ${paymentStatus} can map without a payment gate`, () => {
      assert.equal(canMapOrderRecipe({ status, paymentStatus, netPaid, balance, depositShortfall: 40000 }, () => true), true);
    });
  }
}
test('cancelled orders remain restricted even when paid', () => {
  assert.equal(canMapOrderRecipe({ status: 'CANCELLED', paymentStatus: 'PAID' }, () => true), false);
});
test('both permissions are required', () => {
  for (const permission of ['PROCESS_SALES', 'VIEW_RECIPES']) {
    assert.equal(canMapOrderRecipe({ status: 'NEW' }, p => p === permission), false);
  }
});
