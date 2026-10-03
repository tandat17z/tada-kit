#!/usr/bin/env node
// Copies the <tdz-account> script into a static site that has no bundler:
//   tada-copy-account-menu public/assets/account.js
// Run it from the site's postinstall / build; the copied file is generated (git-ignore it).
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dest = process.argv[2];
if (!dest) {
  console.error("usage: tada-copy-account-menu <destination file>");
  process.exit(1);
}
mkdirSync(dirname(dest), { recursive: true });
copyFileSync(fileURLToPath(new URL("../src/account/menu.js", import.meta.url)), dest);
console.log(`account menu → ${dest}`);
