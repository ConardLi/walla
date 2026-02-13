import { build } from "esbuild";

const shared = {
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  sourcemap: true,
  external: ["electron"],
};

// 主进程
await build({
  ...shared,
  entryPoints: ["electron/main.ts"],
  outfile: "dist-electron/main.js",
});

// preload 脚本
await build({
  ...shared,
  entryPoints: ["electron/preload.ts"],
  outfile: "dist-electron/preload.js",
});

console.log("✅ Electron build complete");
