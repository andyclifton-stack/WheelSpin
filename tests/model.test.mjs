import test from "node:test";
import assert from "node:assert/strict";
import {
  makeItems,
  defaults,
  cleanWheel,
  loadState,
  randomIndex,
  landingAngle,
  indexAtPointer,
  shareHash,
  parseShare,
  textColor,
  resultsCsv,
} from "../src/utils/model.js";
test("pointer lands on every winner for 1–50 entries, including repeated rotations", () => {
  for (let count = 1; count <= 50; count++)
    for (let index = 0; index < count; index++)
      for (const start of [0, 53.3, 359.999, 2340.5, 999999.21]) {
        const angle = landingAngle(start, index, count);
        assert.equal(indexAtPointer(angle, count), index);
        assert.ok(angle - start >= 1800);
      }
});
test("random selection rejects biased tail and accepts every valid index", () => {
  for (let count = 1; count <= 50; count++)
    for (let index = 0; index < count; index++)
      assert.equal(
        randomIndex(count, (values) => (values[0] = index)),
        index,
      );
  let calls = 0;
  assert.equal(
    randomIndex(6, (values) => (values[0] = ++calls === 1 ? 0xffffffff : 7)),
    1,
  );
  assert.equal(calls, 2);
  for (const count of [0, 51, 1.1, -1]) assert.throws(() => randomIndex(count));
});
test("shared wheels preserve Unicode names and colours, with no private state", () => {
  const value = {
    title: "🎉 Café 東京",
    items: makeItems(["你好", "Zoë 🐰", "<script>alert(1)</script>", "A & B"]),
    history: [{ name: "private" }],
    settings: { sound: true },
  };
  const hash = shareHash(value),
    parsed = parseShare(hash);
  assert.equal(parsed.title, value.title);
  assert.deepEqual(
    parsed.items.map(({ name, color }) => ({ name, color })),
    value.items.map(({ name, color }) => ({ name, color })),
  );
  assert.equal(parsed.history, undefined);
  assert.equal(parsed.settings, undefined);
});
test("rejects oversized and malformed shares without accepting invalid names", () => {
  assert.throws(() => parseShare("#wheel=" + "a".repeat(24000)));
  assert.throws(() => parseShare("#wheel=invalid"));
  assert.throws(() => shareHash({ items: [] }));
  assert.throws(() =>
    cleanWheel({ items: makeItems(Array.from({ length: 51 }, () => "Name")) }),
  );
  assert.throws(() => cleanWheel({ items: [{ name: "" }] }));
  assert.throws(() => cleanWheel({ items: [{ name: "a".repeat(121) }] }));
  assert.equal(parseShare("#other"), null);
});
test("normalises legacy colours and duplicate IDs; duplicates remain independent entries", () => {
  const clean = cleanWheel({
    items: [
      { id: "same", name: "Alex", color: "hsl(2,80%,55%)" },
      { id: "same", name: "Alex", color: "#123456" },
    ],
  });
  assert.notEqual(clean.items[0].id, clean.items[1].id);
  assert.match(clean.items[0].color, /^#[a-f0-9]{6}$/);
  assert.equal(clean.items[1].color, "#123456");
});
test("empty wheels and one-entry wheels remain valid", () => {
  assert.equal(cleanWheel({ items: [] }).items.length, 0);
  assert.equal(makeItems(["one"]).length, 1);
});
test("migrates legacy entries and recovers safely from corrupt or unavailable storage", () => {
  const legacy = makeItems(["Old favourite"]);
  const migrated = loadState({
    getItem: (key) =>
      key === "wheelspin_items" ? JSON.stringify(legacy) : null,
  });
  assert.equal(migrated.items[0].name, "Old favourite");
  assert.equal(loadState({ getItem: () => "{bad" }).items.length, 6);
  assert.equal(
    loadState({
      getItem: () => {
        throw new Error("blocked");
      },
    }).items.length,
    6,
  );
});
test("persisted settings and libraries are validated on reload", () => {
  const state = defaults();
  state.settings = {
    sound: true,
    reducedMotion: true,
    removeAfter: true,
    duration: 999,
  };
  state.saved = [
    { title: "Saved", items: makeItems(["A"]) },
    { items: [{ name: "" }] },
  ];
  state.history = [
    { name: "Valid", time: Date.now() },
    { name: "Bad", time: "bad" },
  ];
  const loaded = loadState({ getItem: () => JSON.stringify(state) });
  assert.equal(loaded.settings.duration, 4.5);
  assert.equal(loaded.settings.sound, true);
  assert.equal(loaded.saved.length, 1);
  assert.equal(loaded.history.length, 1);
});
test("text colour chooses contrast on black and white", () => {
  assert.equal(textColor("#ffffff"), "#000000");
  assert.equal(textColor("#000000"), "#ffffff");
});
test("CSV preserves Unicode and escapes quotes, newlines and spreadsheet formulas", () => {
  const csv = resultsCsv([
    { time: 0, title: "=1+1", name: 'Zoë "A",\nB', count: 6 },
  ]);
  assert.ok(csv.startsWith("\ufeff"));
  assert.ok(csv.includes('"\'=1+1"'));
  assert.ok(csv.includes('"Zoë ""A"",\nB"'));
  assert.ok(csv.includes('"6"'));
});
