import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
async function files(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((e) =>
        e.isDirectory()
          ? files(path.join(dir, e.name))
          : [path.join(dir, e.name)],
      ),
    )
  ).flat();
}
const assets = (await files("out"))
  .filter((f) => /\.(js|css|woff2|png|svg)$/.test(f) && !f.endsWith("sw.js"))
  .map((f) => "/" + f.replaceAll("\\", "/").slice(4));
const source = await fs.readFile("public/sw.js", "utf8");
const hash = crypto
  .createHash("sha256")
  .update(assets.join())
  .digest("hex")
  .slice(0, 12);
await fs.writeFile(
  "out/sw.js",
  source
    .replace("'mi-semana-v1'", `'mi-semana-${hash}'`)
    .replace(
      "['/','/icon.svg','/manifest.webmanifest']",
      JSON.stringify(["/", "/manifest.webmanifest", ...assets]),
    ),
);
