// Copies the woff2 font files used by web/css/app.css from @fontsource into web/fonts.
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
const css = readFileSync("web/css/app.css", "utf8");
const files = [...css.matchAll(/fonts\/([a-z0-9-]+\.woff2)/g)].map((m) => m[1]);
mkdirSync("web/fonts", { recursive: true });
for (const f of new Set(files)) {
  const fam = f.split("-")[0];
  copyFileSync(`node_modules/@fontsource/${fam}/files/${f}`, `web/fonts/${f}`);
}
console.log(`Copied ${new Set(files).size} font files.`);
