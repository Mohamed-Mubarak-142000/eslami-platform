import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const data = JSON.parse(readFileSync(new URL("../src/features/adhkar/adhkarContent.json", import.meta.url), "utf8"));
assert.equal(new Set(data.map((entry) => entry.id)).size, data.length, "Counter IDs must be unique");
assert.equal(new Set(data.map((entry) => entry.chapter)).size, 132, "All source chapters must be present");
for (const entry of data) {
  assert(entry.text.trim(), `Empty text: ${entry.id}`);
  assert(entry.sourceUrl.startsWith("https://sunnah.com/hisn:"));
  if (entry.repeat !== undefined) assert(Number.isInteger(entry.repeat) && entry.repeat > 0);
}
const sourceIds = new Set(data.map((entry) => Number(entry.id.split("-")[1])));
for (let id = 1; id <= 267; id++) assert(sourceIds.has(id), `Missing source entry ${id}`);
const find = (id) => {
  const entry = data.find((item) => item.id === id);
  assert(entry, `Missing ${id}`);
  return entry;
};
for (const category of ["morning", "evening"]) {
  assert.equal(find(`hisn-83-${category}`).repeat, 7);
  for (const id of [75, 76, 79, 84, 85]) find(`hisn-${id}-${category}`);
}
assert(!data.some((entry) => entry.id === "hisn-97-morning"));
for (const id of [93, 94, 95]) assert(!data.some((entry) => entry.id === `hisn-${id}-evening`));
assert(find("hisn-78-evening").text.includes("الْمَصِيرُ"));
assert(find("hisn-77-evening").text.includes("اللَّيْلَةِ"));
assert.equal(find("hisn-106-sleep-2").repeat, 34);
assert.equal(find("hisn-69-after-prayer-3").repeat, 1);
assert.equal(find("hisn-66-after-prayer-0").repeat, 3);
assert.equal(find("hisn-197-general").text, "وَلَكَ");
console.log(`Verified ${data.length} cards across 132 chapters and morning/evening/counter regressions.`);
