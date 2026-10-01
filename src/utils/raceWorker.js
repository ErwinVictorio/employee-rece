import { createRace } from './race.js';
self.onmessage = ({ data }) => {
  try { self.postMessage({ race: createRace(data.employees, data.duration, data.settings) }); }
  catch (error) { self.postMessage({ error: error.message }); }
};
