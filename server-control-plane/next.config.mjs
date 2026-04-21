import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import("next").NextConfig} */
const nextConfig = {
  output: "standalone",
  /** Keep tracing inside this app so Docker standalone is not nested under the parent monorepo path. */
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
