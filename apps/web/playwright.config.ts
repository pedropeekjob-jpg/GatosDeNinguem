import { defineConfig, devices } from "@playwright/test";

/** Mobile first: phones run before desktop, and every journey must pass on both. */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  // Reduced motion: checks run on the final state of the page, not mid-animation.
  // The "Avisem-me de gatos novos" window counts as already answered, so it never pops up mid-journey;
  // its own tests start from an empty storage.
  use: {
    baseURL: "http://localhost:3000", trace: "retain-on-failure", locale: "pt-PT", contextOptions: { reducedMotion: "reduce" },
    storageState: { cookies: [], origins: [{ origin: "http://localhost:3000", localStorage: [{ name: "gn-avisos-gatos", value: JSON.stringify({ estado: "fechado", em: "2099-01-01T00:00:00.000Z" }) }] }] },
  },
  projects: [
    { name: "telemovel-android", use: { ...devices["Pixel 7"] } },
    { name: "telemovel-iphone", use: { ...devices["iPhone 14"], browserName: "chromium" } },
    { name: "computador", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: { command: "pnpm start", url: "http://localhost:3000", reuseExistingServer: !process.env.CI, timeout: 120_000 },
});
