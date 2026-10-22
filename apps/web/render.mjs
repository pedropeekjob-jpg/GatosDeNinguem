import { chromium } from "@playwright/test";
const [, , input, output, size = "600"] = process.argv;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +size, height: +size } });
await p.goto("file://" + input); await p.screenshot({ path: output }); await b.close();
