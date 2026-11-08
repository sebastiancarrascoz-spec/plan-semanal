import { composeWeeklyMenu } from "../lib/kitchen.ts";
import fs from "node:fs/promises";
import { seedPlan, generateMenu, generateShopping } from "../lib/engine.ts";
await fs.mkdir("data", { recursive: true });
const menu = composeWeeklyMenu(seedPlan);
for (const [name, value] of Object.entries({
  plan: seedPlan,
  minuta: menu,
  compras: generateShopping(menu),
}))
  await fs.writeFile(`data/${name}.json`, JSON.stringify(value, null, 2));
