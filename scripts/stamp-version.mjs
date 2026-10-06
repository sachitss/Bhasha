// Writes the package.json version into the service worker, Tauri and Android configs before a release.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
const { version } = JSON.parse(readFileSync("package.json", "utf8"));
const sw = readFileSync("web/sw.js", "utf8").replace(/const VERSION = "[^"]+"/, `const VERSION = "${version}"`);
writeFileSync("web/sw.js", sw);
if (existsSync("src-tauri/tauri.conf.json")) {
  const c = JSON.parse(readFileSync("src-tauri/tauri.conf.json", "utf8")); c.version = version;
  writeFileSync("src-tauri/tauri.conf.json", JSON.stringify(c, null, 2) + "\n");
}
if (existsSync("src-tauri/Cargo.toml")) {
  writeFileSync("src-tauri/Cargo.toml", readFileSync("src-tauri/Cargo.toml", "utf8").replace(/^version = "[^"]+"/m, `version = "${version}"`));
}
const g = "android/app/build.gradle";
if (existsSync(g)) {
  const [maj, min, pat] = version.split(".").map(Number);
  writeFileSync(g, readFileSync(g, "utf8")
    .replace(/versionCode \d+/, `versionCode ${maj * 10000 + min * 100 + pat}`)
    .replace(/versionName "[^"]+"/, `versionName "${version}"`));
}
console.log("Stamped version", version);
