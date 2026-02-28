import { resolve } from "node:path";
import type { SnapConfig } from "@metamask/snaps-cli";

const config: SnapConfig = {
  input: resolve(__dirname, "src/index.ts"),
  output: {
    path: resolve(__dirname, "dist"),
  },
  server: {
    port: 8080,
  },
  stats: {
    buffer: false,
  },
};

export default config;
