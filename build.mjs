// Assembles index.html from the template, the stylesheet, and the ordered modules.
// Usage: node build.mjs [--site-url https://slipgate.example.com]
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, "src");
const arg = process.argv.indexOf("--site-url");
const siteUrl = (arg > -1 ? process.argv[arg + 1] : "https://slipgate.example.com").replace(/\/$/, "");

const order = JSON.parse(readFileSync(join(src, "_order.json"), "utf8"));
const css = readFileSync(join(src, "styles.css"), "utf8");

const app = [
  '"use strict";',
  "(function(){",
  ...order.map((f) => `\n/* ---- src/${f} ---- */\n` + readFileSync(join(src, f), "utf8")),
  "})();",
].join("\n");

let html = readFileSync(join(src, "index.template.html"), "utf8")
  .replace("__STYLES__", css)
  .replace("__APP__", app)
  .replaceAll("__SITE_URL__", siteUrl);

writeFileSync(join(here, "index.html"), html);
console.log(`index.html  ${(html.length / 1024).toFixed(0)} KB  from ${order.length} modules`);

// A single portable file for opening straight off disk, with no sibling folders.
// Libraries come from a CDN in this variant; the hosted build stays vendored.
if (process.argv.includes("--standalone")) {
  const solo = html
    .replace('<script src="vendor/three.min.js"></script>',
      '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>')
    .replace('sc.src = "vendor/html2canvas.min.js";',
      'sc.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";')
    .replace(/\n?\s*<link rel="manifest"[^>]*>/, "")
    .replace(/\n?\s*<link rel="icon"[^>]*>/, "")
    .replace(/\n?\s*<link rel="apple-touch-icon"[^>]*>/, "")
    .replace(/<script>\s*if\("serviceWorker"[\s\S]*?<\/script>/, "");
  writeFileSync(join(here, "slipgate-standalone.html"), solo);
  console.log(`slipgate-standalone.html  ${(solo.length / 1024).toFixed(0)} KB`);
}
