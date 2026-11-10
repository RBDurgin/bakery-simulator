/**
 * Test hooks. Only in builds made with VITE_TEST_HOOKS=true (the Playwright
 * build), URL parameters can fix the random seed and speed up the clock:
 * `?seed=42&speed=4`. Normal builds ignore them.
 */
export interface TestHooks {
  seed?: number;
  speed?: number;
}

export function readTestHooks(search: string): TestHooks {
  if (import.meta.env.VITE_TEST_HOOKS !== 'true') return {};
  const params = new URLSearchParams(search);
  const hooks: TestHooks = {};
  const seed = Number(params.get('seed'));
  if (params.has('seed') && Number.isInteger(seed) && seed >= 0) hooks.seed = seed;
  const speed = Number(params.get('speed'));
  if (params.has('speed') && speed > 0 && speed <= 100) hooks.speed = speed;
  return hooks;
}
