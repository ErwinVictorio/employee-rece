export const locations = Object.freeze({
  stadium: Object.freeze({ id: 'stadium', title: 'Stadium', description: 'A big stage for your team', cameraHeight: 1.65 }),
  'company-grounds': Object.freeze({ id: 'company-grounds', title: 'Company Grounds', description: 'A courtyard sprint at company headquarters', cameraHeight: .65 }),
  'company-image': Object.freeze({ id: 'company-image', title: 'Company Grounds — Image', description: '3D runners with an illustrated venue backdrop', cameraHeight: 1.05 }),
});

export function normalizeLocation(id) {
  return Object.hasOwn(locations, id) ? id : 'stadium';
}

export function environmentLaneCapacity(count) {
  return Math.max(2, Math.min(12, count));
}

// Artistic proportions, adjustable together; the unseen rear remains plain.
export const companyBuilding = Object.freeze({ width: 27, depth: 8, levelHeight: 3.6, balconyDepth: 2.2, roofOverhang: 2.8, entranceX: -4 });
