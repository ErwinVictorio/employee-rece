export const MAX_EMPLOYEES = 100;
export function parseNames(text, existingCount) {
  const names = text.split(/\r?\n/).map(name => name.trim()).filter(Boolean);
  if (!names.length) throw new Error('Paste at least one name, one per line.');
  if (names.some(name => name.includes('\t'))) throw new Error('Paste a single column of names from Excel.');
  if (names.some(name => name.length > 60)) throw new Error('Each name must be 60 characters or fewer. No names were added.');
  if (existingCount + names.length > MAX_EMPLOYEES) throw new Error(`Maximum 100 employees. ${MAX_EMPLOYEES - existingCount} spaces available; no names were added.`);
  return names;
}
export function raceTiming(count, requestedDuration) {
  const large = count > 12;
  const duration = large ? Math.max(requestedDuration, Math.ceil((count - 1) * .12 / .2)) : requestedDuration;
  return { duration, firstFinish: large ? .8 : .9, splitFraction: large ? .65 : .75 };
}
