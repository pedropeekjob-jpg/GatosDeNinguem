// One command to try everything locally, no database needed: pnpm demo
// Starts the API (in-memory demo content), the public site and the back office.
import { spawn } from "node:child_process";

const ADMIN_TOKEN = "demo-gatos-de-ninguem";
const shared = { ...process.env, REVALIDATE_SECRET: "demo-revalidate-secret" };
const apps = [
  { name: "api", filter: "@gn/api", env: { ADMIN_TOKEN, DATABASE_URL: "", PORT: "4000", WEB_REVALIDATE_URL: "http://localhost:3000/api/revalidate" } },
  { name: "site", filter: "@gn/web", env: { API_URL: "http://localhost:4000" } },
  { name: "backoffice", filter: "@gn/backoffice", env: { VITE_API_URL: "http://localhost:4000" } },
];

const children = apps.map(({ name, filter, env }) => {
  const child = spawn("pnpm", ["--filter", filter, "dev"], { env: { ...shared, ...env }, shell: true });
  const prefix = `[${name}] `;
  child.stdout.on("data", (d) => process.stdout.write(prefix + d.toString().replace(/\n(?!$)/g, `\n${prefix}`)));
  child.stderr.on("data", (d) => process.stderr.write(prefix + d.toString().replace(/\n(?!$)/g, `\n${prefix}`)));
  return child;
});

const stop = () => { for (const c of children) c.kill(); process.exit(0); };
process.on("SIGINT", stop);
process.on("SIGTERM", stop);

setTimeout(() => {
  console.log(`
  Gatos de Ninguém is running (demo content, nothing is saved after you stop):

    Public site   http://localhost:3000
    Back office   http://localhost:5173   password: ${ADMIN_TOKEN}
    API           http://localhost:4000/health

  Changes made in the back office show up on the site. Press Ctrl+C to stop.
`);
}, 8000);
