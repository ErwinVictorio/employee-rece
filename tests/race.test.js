import test from 'node:test'
import assert from 'node:assert/strict'
import { createRace, progressAt, shuffleArray } from '../src/utils/race.js'

function seeded(seed) { return () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296 } }
const employees = count => Array.from({ length: count }, (_, i) => ({ id: `employee-${i}`, name: `Employee ${i}`, character: i % 3, avatar: '' }))

test('shuffle preserves every participant, does not mutate input, and can produce every permutation', () => {
  const input = [1, 2, 3]
  const permutations = new Set()
  for (const first of [0, 0.34, 0.67]) for (const second of [0, 0.5]) {
    const values = [first, second]
    permutations.add(shuffleArray(input, () => values.shift()).join(','))
  }
  assert.equal(permutations.size, 6)
  assert.deepEqual(input, [1, 2, 3])
})

test('all counts and durations finish in locked order without backward movement or premature crossings', () => {
  for (const duration of [10, 15, 20, 30]) for (let count = 2; count <= 12; count++) for (let seed = 1; seed <= 20; seed++) {
    const race = createRace(employees(count), duration, seeded(seed))
    assert.equal(new Set(race.order.map(e => e.id)).size, count)
    let previousFinish = 0
    for (const runner of race.runners) {
      assert.ok(runner.finishTime > previousFinish)
      previousFinish = runner.finishTime
      let previous = 0
      for (let i = 0; i <= 600; i++) {
        const elapsed = duration * i / 600
        const progress = progressAt(runner, elapsed, duration)
        assert.ok(progress >= previous && progress <= 1)
        if (elapsed < runner.finishTime) assert.ok(progress < 1)
        previous = progress
      }
      assert.equal(progressAt(runner, runner.finishTime, duration), 1)
      assert.equal(progressAt(runner, duration + 50, duration), 1)
      assert.equal(progressAt(runner, -1, duration), 0)
    }
    assert.equal(previousFinish, duration)
  }
})

test('result snapshots survive participant edits and replay generates a fresh race', () => {
  const input = employees(6)
  const race = createRace(input, 15, seeded(7))
  input[0].name = 'Changed'
  assert.ok(!race.order.some(e => e.name === 'Changed'))
  assert.throws(() => { race.order.reverse() }, TypeError)
  assert.throws(() => { race.runners[0].finishTime = 1 }, TypeError)
  const next = createRace(input, 15, seeded(81))
  assert.notDeepEqual(next.order.map(e => e.id), race.order.map(e => e.id))
})

test('speed variation produces overtakes before the final stretch', () => {
  const race = createRace(employees(12), 15, seeded(98))
  const standings = new Set()
  for (let time = 1; time < 11; time += 0.5) standings.add([...race.runners].sort((a, b) => progressAt(b, time, 15) - progressAt(a, time, 15)).map(r => r.employee.id).join(','))
  assert.ok(standings.size > 5)
})

test('invalid rosters and durations are rejected', () => {
  for (const count of [0, 1, 13]) assert.throws(() => createRace(employees(count), 15))
  assert.throws(() => createRace([{ id: 1, name: ' ' }, { id: 2, name: 'A' }], 15))
  assert.throws(() => createRace([{ id: 1, name: 'A' }, { id: 1, name: 'B' }], 15))
  assert.throws(() => createRace(employees(2), 12))
})
