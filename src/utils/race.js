import { buildMotionPlan, planFunEvents, sampleRunner, validateRacePlan } from './raceMotion.js';
import { applyScenario } from './raceScenarios.js';
export function shuffleArray(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function createRace(employees, duration, settings = {}, random = Math.random) {
  if (typeof settings === 'function') { random = settings; settings = {}; }
  const funMoments = settings.funMoments !== false;
  if (employees.length < 2 || employees.length > 12 || employees.some(e => !e.name.trim()) || new Set(employees.map(e => e.id)).size !== employees.length) throw new Error('Add 2–12 employees with unique IDs and nonblank names.');
  if (![10, 15, 20, 30].includes(duration) && !(Number.isInteger(duration) && duration >= 60 && duration <= 600 && duration % 60 === 0)) throw new Error('Choose a seconds preset or 1–10 whole minutes.');
  const order = shuffleArray(employees, random).map(e => Object.freeze({
    ...e
  }));
  const events = funMoments ? planFunEvents(employees.map(e => e.id), duration, random) : new Map();
  let runners = order.map((employee, rank) => {
    const finishTime = duration * (0.9 + 0.1 * rank / (order.length - 1));
    const runnerEvents = Object.freeze(events.get(employee.id) || []);
    return Object.freeze({ employee, rank, finishTime, events: runnerEvents,
      motionPlan: buildMotionPlan(runnerEvents, duration, finishTime, random) });
  });
  const scenarioDraw = random();
  const scenario = scenarioDraw < .3 ? 'comeback' : scenarioDraw < .5 ? 'close' : 'steady';
  runners = runners.map(runner => Object.freeze({ ...runner, motionPlan: applyScenario(runner.motionPlan, runner.rank, order.length, scenario) }));
  // Reject an infeasible presentation before countdown without touching the
  // locked ranking, finish times, or rank-independent event participants.
  for (let attempt = 0; ; attempt++) {
    if (!validateRacePlan({ duration, runners }).length) break;
    if (attempt === 8) throw new Error('The race animation could not be prepared. Please try again.');
    runners = runners.map(runner => Object.freeze({ ...runner,
      motionPlan: applyScenario(buildMotionPlan(runner.events, duration, runner.finishTime, attempt < 4 ? random : () => .5), runner.rank, order.length, scenario)
    }));
  }
  return Object.freeze({
    id: globalThis.crypto?.randomUUID?.() || String(Date.now()),
    settings: Object.freeze({ funMoments }),
    duration,
    scenario,
    order: Object.freeze(order),
    runners: Object.freeze(runners)
  });
}
export function progressAt(runner, elapsed) { return sampleRunner(runner, elapsed).progress; }
