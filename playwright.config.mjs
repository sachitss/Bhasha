import { defineConfig, devices } from "@playwright/test";
const exe = process.env.PW_CHROMIUM_PATH; // optional: use an already-installed Chromium
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30000,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: { baseURL: "http://127.0.0.1:4173", launchOptions: exe ? { executablePath: exe } : {} },
  webServer: { command: "npx http-server web -p 4173 -c-1 -s", url: "http://127.0.0.1:4173", reuseExistingServer: true },
  projects: [
    { name: "phone", use: { ...devices["Pixel 7"], launchOptions: exe ? { executablePath: exe } : {} } },
    { name: "desktop", use: { viewport: { width: 1366, height: 860 } } },
  ],
});
