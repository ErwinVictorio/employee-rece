// Presentation only: rankings, events and crossing times remain immutable.
export function applyScenario(plan, rank, count, scenario) {
  if (scenario === 'steady') return plan;
  const end = plan.points.at(-1);
  const target = scenario === 'comeback'
    ? rank === 0 ? .77 : .84 - .16 * (rank - 1) / Math.max(1, count - 2)
    : rank === 0 ? .83 : .82 - .14 * (rank - 1) / Math.max(1, count - 2);
  const offset = target - end;
  // Both the winner and another runner can build speed from behind. This
  // progress-space curve preserves event slowdowns and has a positive slope.
  const dip = scenario === 'comeback' && (rank === 0 || rank === count - 1) ? .10 : 0;
  const points = [], velocities = [];
  plan.points.forEach((p, i) => {
    const t = p / end;
    points.push(p + offset * t * t * (3 - 2 * t) - dip * Math.sin(Math.PI * t) ** 2);
    velocities.push(plan.velocities[i] * (1 + offset * 6 * t * (1 - t) / end - dip * Math.PI * Math.sin(2 * Math.PI * t) / end));
  });
  return Object.freeze({ ...plan, points: Object.freeze(points), velocities: Object.freeze(velocities) });
}
