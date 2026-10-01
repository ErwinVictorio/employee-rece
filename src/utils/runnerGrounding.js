// Vertical bounds of the shoe ellipsoid and sole box in Runner3D.
export function shoeBottom(hip, knee, lean = 0) {
  const thigh = hip + lean;
  const foot = thigh + knee;
  const kneeY = 1.28 * Math.cos(lean) - .59 * Math.cos(thigh);
  const shoeY = kneeY - .57 * Math.cos(foot) - .12 * Math.sin(foot);
  const soleY = kneeY - .64 * Math.cos(foot) - .12 * Math.sin(foot);
  return Math.min(
    shoeY - Math.hypot(.20 * Math.cos(foot), .52 * Math.sin(foot)),
    soleY - .035 * Math.abs(Math.cos(foot)) - .27 * Math.abs(Math.sin(foot)),
  );
}

export function groundedBodyY(leftHip, leftKnee, rightHip, rightKnee, lean = 0) {
  // Root is at .08; track contact is at .02, just above the stadium surface.
  return .02 - .08 - Math.min(shoeBottom(leftHip, leftKnee, lean), shoeBottom(rightHip, rightKnee, lean));
}
