import typescript from "@rollup/plugin-typescript";
import pkg from "./package.json";

const plugins = [typescript()];

const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
];

export default [
  {
    input: "src/browser/index.ts",
    output: { file: pkg.module, format: "esm", sourcemap: true },
    plugins,
    external,
  },
  {
    input: "src/browser/index.ts",
    output: { file: pkg.main, format: "cjs", sourcemap: true },
    plugins,
    external,
  },
  {
    input: "src/server/index.ts",
    output: { file: "dist/server/index.js", format: "cjs", sourcemap: true },
    plugins,
    external,
  },
];
