import test from 'node:test';
import assert from 'node:assert/strict';
import { simulatedLineCost } from './costingSimulation.js';

test('simulation overrides price without mutating inventory and clearing restores price', () => {
  const materials = Object.freeze([Object.freeze({ id: 'flour', costPerBaseUnit: 0.75 })]);
  const item = Object.freeze({ rawMaterialId: 'flour', quantityRequired: 250, wastePercent: 0 });
  assert.equal(simulatedLineCost(item, materials, {}), 187.5);
  assert.equal(simulatedLineCost(item, materials, { flour: 1 }), 250);
  assert.equal(simulatedLineCost(item, materials, { flour: 0 }), 0);
  assert.equal(simulatedLineCost(item, materials, { flour: null }), 187.5);
  assert.equal(materials[0].costPerBaseUnit, 0.75);
});
test('simulation includes waste and tolerates an empty ingredient line', () => {
  assert.equal(simulatedLineCost({ rawMaterialId: 'x', quantityRequired: 10, wastePercent: 5 }, [], { x: 2 }), 21);
  assert.equal(simulatedLineCost(undefined, [], {}), 0);
});
