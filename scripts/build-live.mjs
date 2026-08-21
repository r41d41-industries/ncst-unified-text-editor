import * as esbuild from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

await esbuild.build({
  absWorkingDir: root,
  entryPoints: ["editor/live/index.js"],
  bundle: true,
  outfile: "editor/live-preview.bundle.js",
  format: "iife",
  globalName: "NcstLive",
  platform: "browser",
  target: "es2022",
  legalComments: "none",
});

console.log("built editor/live-preview.bundle.js");
