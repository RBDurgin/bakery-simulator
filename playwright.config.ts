import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  // Phone projects come first: every journey runs on them.
  projects: [
    { name: 'phone-chromium', use: { ...devices['Pixel 7'] } },
    { name: 'phone-webkit', use: { ...devices['iPhone 14'] } },
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    // Test hooks (fixed seed, clock speed) exist only in this build.
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    env: { VITE_TEST_HOOKS: 'true' },
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
