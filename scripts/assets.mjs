import fs from "node:fs/promises";
import sharp from "sharp";
const svg = await fs.readFile("public/icon.svg");
for (const n of [192, 512])
  await sharp(svg).resize(n, n).png().toFile(`public/icon-${n}.png`);
await sharp({
  create: { width: 512, height: 512, channels: 4, background: "#0F7D6C" },
})
  .composite([
    {
      input: await sharp(svg).resize(320, 320).png().toBuffer(),
      gravity: "centre",
    },
  ])
  .png()
  .toFile("public/icon-maskable.png");
