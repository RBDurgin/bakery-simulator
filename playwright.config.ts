import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const isCI = !!process.env.CI;
const VISUAL = /visual\.spec\.ts/;

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
  // One baseline for each screenshot. They are made on CI only, so there is no platform in the path.
  snapshotPathTemplate: 'e2e/__screenshots__/{projectName}/{arg}{ext}',
  // Phone projects come first: every journey runs on them.
  projects: [
    { name: 'phone-chromium', testIgnore: VISUAL, use: { ...devices['Pixel 7'] } },
    { name: 'phone-webkit', testIgnore: VISUAL, use: { ...devices['iPhone 14'] } },
    { name: 'desktop-chromium', testIgnore: VISUAL, use: { ...devices['Desktop Chrome'] } },
    // Screenshot tests. Run with `npm run e2e:visual`; see the README.
    { name: 'visual-phone', testMatch: VISUAL, use: { ...devices['Pixel 7'] } },
    { name: 'visual-desktop', testMatch: VISUAL, use: { ...devices['Desktop Chrome'] } },
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
