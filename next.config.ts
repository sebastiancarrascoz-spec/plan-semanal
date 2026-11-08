import type { NextConfig } from "next";
import path from "node:path";
const config: NextConfig = {
  output: "export",
  outputFileTracingRoot: path.resolve("."),
  images: { unoptimized: true },
};
export default config;
