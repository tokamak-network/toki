import type { SnapConfig } from "@metamask/snaps-cli";
import { resolve } from "path";

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
