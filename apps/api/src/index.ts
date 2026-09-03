import { buildApp } from "./app.js";
import { env } from "./config.js";

const app = await buildApp();

try {
  await app.listen({ port: env.port, host: "0.0.0.0" });
  console.log(`CareerPilot API listening on http://localhost:${env.port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
