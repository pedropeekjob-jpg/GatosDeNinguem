import { defineConfig, devices } from "@playwright/test";

/** Mobile first: phones run before desktop, and every journey must pass on both. */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  // Reduced motion: checks run on the final state of the page, not mid-animation.
  use: { baseURL: "http://localhost:3000", trace: "retain-on-failure", locale: "pt-PT", contextOptions: { reducedMotion: "reduce" } },
  projects: [
    { name: "telemovel-android", use: { ...devices["Pixel 7"] } },
    { name: "telemovel-iphone", use: { ...devices["iPhone 14"], browserName: "chromium" } },
    { name: "computador", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: { command: "pnpm start", url: "http://localhost:3000", reuseExistingServer: !process.env.CI, timeout: 120_000 },
});
