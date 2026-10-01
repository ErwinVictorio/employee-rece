const smooth = t => t * t * (3 - 2 * t);

export function planFunEvents(ids, duration, random, cutoff = .7) {
  const available = [...ids];
  const events = new Map(ids.map(id => [id, []]));
  const target = ids.length <= 4 ? 1 : ids.length <= 8 ? 2 : 3;
  let at = duration * 0.15 + random() * 0.15;
  for (let i = 0; i < target && at + 2.35 <= duration * cutoff; i++) {
    const id = available.splice(Math.floor(random() * available.length), 1)[0];
    events.get(id).push(Object.freeze({ id: `${id}-fall`, stumbleAt: at, fallAt: at + 0.25,
      groundAt: at + 0.5, getUpAt: at + 0.85, comebackAt: at + 1.3, endAt: at + 2.35 }));
    at += 2.85 + random() * 0.2;
  }
  return events;
}

export function poseAt(events, elapsed) {
  const event = events.find(e => elapsed >= e.stumbleAt && elapsed < e.endAt);
  if (!event) return { pose: 'running', poseProgress: 0, event: null };
  const stages = [['stumbling', 'stumbleAt', 'fallAt'], ['falling', 'fallAt', 'groundAt'],
    ['fallen', 'groundAt', 'getUpAt'], ['recovering', 'getUpAt', 'comebackAt'], ['comeback', 'comebackAt', 'endAt']];
  const [pose, from, to] = stages.find(([, , to]) => elapsed < event[to]);
  return { pose, poseProgress: (elapsed - event[from]) / (event[to] - event[from]), event };
}

// Integrate a smooth positive velocity envelope. Final Hermite segment preserves
// entry velocity and arrives at the assigned crossing with zero terminal velocity.
export function buildMotionPlan(events, duration, finishTime, random, rankFraction = Math.max(0, Math.min(1, (finishTime / duration - .9) / .1)), splitFraction = .75) {
  const split = duration * splitFraction;
  const phases = [random() * 6.28, random() * 6.28];
  const pace = 0.94 + random() * 0.08;
  const steps = Math.min(12000, Math.ceil(split * 120));
  const dt = split / steps;
  const points = [0];
  const velocities = [];
  const speedAt = time => {
    let speed = pace * (1 + 0.22 * Math.sin(time * 1.8 + phases[0]) + 0.1 * Math.sin(time * 3 + phases[1])) / duration;
    for (const e of events) {
      if (time < e.stumbleAt || time >= e.endAt) continue;
      if (time < e.groundAt) speed *= 1 - 0.98 * smooth((time - e.stumbleAt) / (e.groundAt - e.stumbleAt));
      else if (time < e.getUpAt) speed *= 0.02;
      else if (time < e.comebackAt) speed *= 0.02 + 0.78 * smooth((time - e.getUpAt) / (e.comebackAt - e.getUpAt));
      else {
        const t = (time - e.comebackAt) / (e.endAt - e.comebackAt);
        speed *= 0.8 + 0.2 * smooth(t) + 0.45 * Math.sin(Math.PI * t) ** 2;
      }
    }
    return speed;
  };
  for (let i = 0; i <= steps; i++) {
    velocities.push(speedAt(i * dt));
    if (i) points.push(points[i - 1] + (velocities[i - 1] + velocities[i]) * dt / 2);
  }
  // Coordinated targets spread the field instead of forcing everyone into a
  // half-unit pack. Keep the random draw stable for existing seeded races.
  const draw = random();
  const base = .80 + draw * .025;
  const scale = base / points.at(-1);
  const offset = .84 - .16 * rankFraction + draw * .008 - base;
  const from = base * .35, span = base - from;
  for (let i = 0; i < points.length; i++) {
    const p = points[i] * scale;
    const t = Math.max(0, Math.min(1, (p - from) / span));
    points[i] = p + offset * smooth(t);
    velocities[i] *= scale * (1 + offset * 6 * t * (1 - t) / span);
  }
  return Object.freeze({ dt, split, finishTime, points: Object.freeze(points), velocities: Object.freeze(velocities) });
}

export function sampleRunner(runner, elapsed) {
  if (elapsed >= runner.finishTime) return { progress: 1, speed: 0, pose: 'finished', poseProgress: 0, event: null };
  const m = runner.motionPlan;
  const time = Math.max(0, elapsed);
  let progress, speed;
  if (time < m.split) {
    const i = Math.min(m.points.length - 2, Math.floor(time / m.dt));
    const t = time - i * m.dt;
    const acceleration = (m.velocities[i + 1] - m.velocities[i]) / m.dt;
    progress = m.points[i] + m.velocities[i] * t + acceleration * t * t / 2;
    speed = m.velocities[i] + acceleration * t;
  } else {
    const length = runner.finishTime - m.split;
    const t = (time - m.split) / length;
    const start = m.points.at(-1), tangent = m.velocities.at(-1) * length;
    progress = start + (1 - start) * smooth(t) + tangent * (t ** 3 - 2 * t * t + t);
    speed = ((1 - start) * 6 * t * (1 - t) + tangent * (3 * t * t - 4 * t + 1)) / length;
  }
  return { progress: Math.min(1 - Number.EPSILON, progress), speed, ...poseAt(runner.events, time) };
}

export function validateRacePlan(race) {
  const violations = [];
  for (const r of race.runners) {
    let previous = 0;
    let previousSpeed = sampleRunner(r, 0).speed;
    for (let t = 0; t < r.finishTime; t += 1 / 120) {
      const s = sampleRunner(r, t);
      if (!Number.isFinite(s.progress) || s.progress < previous - 1e-12 || s.speed < -1e-10 || s.speed > 2.5 / r.finishTime) {
        violations.push(`${r.employee.id}: invalid motion at ${t}`); break;
      }
      // Normalized track-distance per second squared. A generous explicit
      // cartoon acceleration limit still catches impulses and teleports.
      if (Math.abs(s.speed - previousSpeed) * 120 > 12 / race.duration) {
        violations.push(`${r.employee.id}: excessive acceleration at ${t}`); break;
      }
      previous = s.progress;
      previousSpeed = s.speed;
    }
  }
  return violations;
}

// Announce actual recent overtakes, never the preselected winner/scenario.
export function comebackRunner(race, elapsed) {
  if (!race || elapsed < race.duration * .6 || elapsed >= race.runners[0].finishTime) return null;
  const standings = time => [...race.runners].sort((a, b) => sampleRunner(b, time).progress - sampleRunner(a, time).progress || a.rank - b.rank);
  const earlier = standings(elapsed - race.duration * .06);
  return standings(elapsed).find((runner, index) => !sampleRunner(runner, elapsed).event && earlier.findIndex(r => r.employee.id === runner.employee.id) > index) || null;
}
