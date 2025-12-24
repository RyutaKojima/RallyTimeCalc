import { createSerwistRoute } from "@serwist/turbopack";

export const { GET } = createSerwistRoute({
  swSrc: "src/app/sw.ts",
  nextConfig: {},
});
