import test from 'node:test';
import assert from 'node:assert/strict';
import { eligibleEmployees, recordWinner } from '../src/utils/winnerEligibility.js';

test('winner exclusion is cumulative, ID-based and reversible without deleting employees', () => {
  const employees = [{ id: 'a', name: 'Same name' }, { id: 'b', name: 'Same name' }, { id: 'c', name: 'Third' }];
  let winners = recordWinner([], 'a');
  assert.equal(recordWinner(winners, 'a'), winners);
  assert.deepEqual(eligibleEmployees(employees, winners, true).map(e => e.id), ['b', 'c']);
  winners = recordWinner(winners, 'b');
  assert.equal(eligibleEmployees(employees, winners, true).length, 1);
  assert.equal(eligibleEmployees(employees, winners, false), employees);
  assert.equal(eligibleEmployees(employees, [], true).length, 3);
  assert.equal(employees.length, 3);
});
