import type { NextConfig } from "next";

const config: NextConfig = {
  serverExternalPackages: ["esbuild-wasm"],
};

export default config;
