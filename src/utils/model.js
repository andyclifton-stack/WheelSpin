export const MAX_ITEMS = 50;
export const COLORS = [
  "#e66e78",
  "#eda76b",
  "#e0c169",
  "#69bd9b",
  "#6a9de0",
  "#a589d9",
  "#df86b6",
  "#65bdcc",
];
export const STORAGE_KEY = "wheelspin_v2";
export const keepAllEntries = (settings) => ({ ...settings, removeAfter: false });
export const makeId = () =>
  typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Array.from(crypto.getRandomValues(new Uint32Array(4)), (value) =>
        value.toString(16).padStart(8, "0"),
      ).join("-");
export const makeItems = (names) =>
  names.map((name, index) => ({
    id: makeId(),
    name: name.trim().slice(0, 120),
    color: COLORS[index % COLORS.length],
  }));
export const TEMPLATES = [
  {
    title: "Dinner choices",
    description: "Settle what to eat tonight.",
    names: ["Pizza", "Burgers", "Sushi", "Tacos", "Pasta", "Salad"],
  },
  {
    title: "Names",
    description: "Example names to replace with your group.",
    names: ["Alex", "Sam", "Taylor", "Jordan", "Charlie", "Morgan"],
  },
  {
    title: "Party challenges",
    description: "Lighthearted challenges for the table.",
    names: [
      "Tell a joke",
      "Do an impression",
      "Name that song",
      "Two truths and a lie",
      "Dance for 10 seconds",
      "Give someone a compliment",
    ],
  },
  {
    title: "Gymnastics skills",
    description: "Customise this list to suit your session.",
    names: [
      "Cartwheel",
      "Roundoff",
      "Handstand",
      "Forward roll",
      "Backward roll",
      "Bridge",
    ],
  },
  {
    title: "Movie night",
    description: "Pick a genre for tonight.",
    names: ["Comedy", "Adventure", "Animation", "Mystery", "Sci-fi", "Drama"],
  },
  {
    title: "Weekend plans",
    description: "A little inspiration for your next day off.",
    names: [
      "Go for a walk",
      "Visit a café",
      "Board games",
      "Movie night",
      "Try a new recipe",
      "Explore somewhere new",
    ],
  },
  {
    title: "Competition winning",
    description: "Seven playful ways to celebrate a win.",
    names: [
      "I just beat the beep out of you.",
      "Say “HA HA HA HA!” like a cartoon villain.",
      "Give them the side eye. 👀",
      "Do a ridiculously slow victory dance.",
      "Pretend to polish your imaginary winner’s trophy.",
      "Walk away in slow motion without looking back.",
      "Whisper, “Better luck next time…” 😏",
    ],
  },
];
export const defaults = () => ({
  title: "Dinner choices",
  items: makeItems(TEMPLATES[0].names),
  settings: {
    sound: false,
    reducedMotion: false,
    removeAfter: false,
    duration: 4.5,
  },
  history: [],
  saved: [],
});
export function cleanWheel(value, { allowEmpty = true } = {}) {
  if (
    !value ||
    typeof value !== "object" ||
    !Array.isArray(value.items) ||
    value.items.length > MAX_ITEMS ||
    (!allowEmpty && !value.items.length)
  )
    throw new Error("This wheel must contain between 1 and 50 entries.");
  const ids = new Set();
  const items = value.items.map((item, index) => {
    if (
      !item ||
      typeof item.name !== "string" ||
      !item.name.trim() ||
      item.name.length > 120
    )
      throw new Error("Each entry needs a name of 120 characters or fewer.");
    let id =
      typeof item.id === "string" && item.id.length < 100 ? item.id : makeId();
    if (ids.has(id)) id = makeId();
    ids.add(id);
    return {
      id,
      name: item.name.trim(),
      color: /^#[0-9a-f]{6}$/i.test(item.color)
        ? item.color
        : COLORS[index % COLORS.length],
    };
  });
  return {
    title:
      typeof value.title === "string" && value.title.trim()
        ? value.title.trim().slice(0, 80)
        : "My wheel",
    items,
  };
}
export function loadState(storage) {
  const fresh = defaults();
  try {
    const stored = storage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return {
        ...fresh,
        ...cleanWheel(data),
        settings: {
          sound: data.settings?.sound === true,
          reducedMotion: data.settings?.reducedMotion === true,
          removeAfter: data.settings?.removeAfter === true,
          duration: [3, 4.5, 6].includes(data.settings?.duration)
            ? data.settings.duration
            : 4.5,
        },
        history: Array.isArray(data.history)
          ? data.history
              .filter(
                (row) =>
                  row &&
                  typeof row.name === "string" &&
                  row.name.length <= 120 &&
                  Number.isFinite(row.time) &&
                  Math.abs(row.time) <= 8.64e15,
              )
              .slice(0, 50)
              .map((row) => ({
                id: makeId(),
                name: row.name,
                title:
                  typeof row.title === "string"
                    ? row.title.slice(0, 80)
                    : "My wheel",
                color: /^#[0-9a-f]{6}$/i.test(row.color)
                  ? row.color
                  : COLORS[0],
                time: row.time,
                count:
                  Number.isInteger(row.count) &&
                  row.count > 0 &&
                  row.count <= MAX_ITEMS
                    ? row.count
                    : 0,
              }))
          : [],
        saved: Array.isArray(data.saved)
          ? data.saved.slice(0, 20).flatMap((row) => {
              try {
                return [{ ...cleanWheel(row), id: makeId() }];
              } catch {
                return [];
              }
            })
          : [],
      };
    }
    const legacy = storage.getItem("wheelspin_items");
    return legacy
      ? {
          ...fresh,
          ...cleanWheel({ title: "My wheel", items: JSON.parse(legacy) }),
        }
      : fresh;
  } catch {
    return fresh;
  }
}
// Rejection sampling avoids modulo bias, including non-power-of-two wheel sizes.
export function randomIndex(
  count,
  fill = (values) => crypto.getRandomValues(values),
) {
  if (!Number.isInteger(count) || count < 1 || count > MAX_ITEMS)
    throw new Error("Invalid wheel size");
  const limit = Math.floor(2 ** 32 / count) * count;
  const values = new Uint32Array(1);
  do {
    fill(values);
  } while (values[0] >= limit);
  return values[0] % count;
}
export const normaliseAngle = (angle) => ((angle % 360) + 360) % 360;
export function landingAngle(current, index, count) {
  return (
    current +
    5 * 360 +
    normaliseAngle(-index * (360 / count) - normaliseAngle(current))
  );
}
export function indexAtPointer(angle, count) {
  return Math.round(normaliseAngle(-angle) / (360 / count)) % count;
}
export function shareHash(wheel) {
  const clean = cleanWheel(wheel, { allowEmpty: false });
  const payload = JSON.stringify({
    v: 1,
    title: clean.title,
    items: clean.items.map(({ name, color }) => ({ name, color })),
  });
  const bytes = new TextEncoder().encode(payload);
  return (
    "#wheel=" +
    btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""))
      .replaceAll("+", "-")
      .replaceAll("/", "_")
      .replace(/=+$/, "")
  );
}
export function wheelShareMessage(wheel, url) {
  const count = wheel.items.length;
  return [
    "🎡 *Fancy a spin?*",
    "",
    `✨ ${wheel.title || "My wheel"}`,
    `🎯 ${count} ${count === 1 ? "choice" : "choices"}. What will you land on?`,
    "",
    "Tap the link, choose ‘Open this wheel’, then hit SPIN! No account needed.",
    "",
    "👇 Give my wheel a go:",
    url,
  ].join("\n");
}
export function parseShare(hash) {
  if (!hash.startsWith("#wheel=")) return null;
  if (hash.length > 24000) throw new Error("This shared wheel is too large.");
  const encoded = hash.slice(7).replaceAll("-", "+").replaceAll("_", "/");
  const bytes = Uint8Array.from(atob(encoded), (character) =>
    character.charCodeAt(0),
  );
  const data = JSON.parse(
    new TextDecoder("utf-8", { fatal: true }).decode(bytes),
  );
  if (data.v !== 1)
    throw new Error("This shared wheel format is not supported.");
  return cleanWheel(data, { allowEmpty: false });
}
export function textColor(hex) {
  const rgb = hex
    .slice(1)
    .match(/../g)
    .map((value) => parseInt(value, 16) / 255)
    .map((value) =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    );
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2] > 0.179
    ? "#000000"
    : "#ffffff";
}
export function resultsCsv(history) {
  const cell = (value) => '"' + String(value).replaceAll('"', '""') + '"';
  const safe = (value) =>
    /^[=+\-@\t\r]/.test(String(value)) ? "'" + value : value;
  const rows = [
    ["Time", "Wheel", "Result", "Entries in draw"],
    ...history.map((row) => [
      new Date(row.time).toISOString(),
      safe(row.title || "My wheel"),
      safe(row.name),
      row.count || "",
    ]),
  ];
  return "\ufeff" + rows.map((row) => row.map(cell).join(",")).join("\r\n");
}
