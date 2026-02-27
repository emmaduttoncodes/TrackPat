import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:4173',
  },
  webServer: {
    command: 'npm run preview -- --port 4173',
    port: 4173,
    reuseExistingServer: true,
  },
  projects: [
    {
      name: 'iPhone 12 Pro Max',
      use: { ...devices['iPhone 12 Pro Max'] },
    },
    {
      name: 'iPhone SE',
      use: { ...devices['iPhone SE'] },
    },
    {
      name: 'Pixel 5',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'iPad Mini',
      use: { ...devices['iPad Mini'] },
    },
    {
      name: 'iPhone 12 Pro Max - Chromium',
      use: {
        ...devices['iPhone 12 Pro Max'],
        defaultBrowserType: 'chromium',
      },
    },
    {
      name: 'iPad Pro 11',
      use: { ...devices['iPad Pro 11'] },
    },
    {
      name: 'Desktop 1280',
      use: { viewport: { width: 1280, height: 720 } },
    },
    {
      name: 'Desktop 1920',
      use: { viewport: { width: 1920, height: 1080 } },
    },
  ],
});
