# samus-cli

> Transform stack traces into navigable ASCII dungeons.

Your error is a dungeon. Each stack frame is a room. The exception at the top is the boss waiting at the end.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│ 🧠  BOSS: Memory Eater                                                       │
│                                                                              │
│ OutOfMemoryError: JavaScript heap out of memory                              │
│ auth.service.ts:44                                                           │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Installation

```bash
git clone <repo>
cd samus-cli
npm install
npm run build
npm link
```

After linking, `samus-cli` is available as a global command.

---

## Usage

### From a file

```bash
samus-cli path/to/error.log
```

### From stdin (pipe)

```bash
cat error.log | samus-cli
npm start 2>&1 | samus-cli
```

### Export to Markdown

```bash
samus-cli error.log --export markdown
samus-cli error.log --export markdown --output dungeon.md
cat error.log | samus-cli --export markdown > dungeon.md
```

### Change theme

```bash
samus-cli error.log --theme retro
samus-cli error.log --theme neon
```

---

## CLI Flags

| Flag | Values | Default | Description |
|------|--------|---------|-------------|
| `-t, --theme` | `dark` `retro` `neon` | `dark` | Color theme for the terminal UI |
| `-e, --export` | `markdown` | — | Export dungeon map instead of launching UI |
| `-o, --output` | file path | stdout | Write export output to a file |

---

## Navigation

Once the dungeon is open, use these keys to explore:

| Key | Action |
|-----|--------|
| `↑` / `k` | Previous room |
| `↓` / `j` | Next room |
| `Enter` | Toggle room details panel |
| `Esc` / `q` | Close panel / exit |

The minimap on the right tracks your position. Visited rooms are marked.

---

## Dungeon Anatomy

### Rooms

Each stack frame becomes a room. The outermost frame (where execution started) is Room 1. The innermost frame — the one that threw the error — is the **Boss Room**.

Room layouts are deterministic: the same frame always generates the same layout shape.

| Layout | Shape |
|--------|-------|
| `corridor` | Single wide line |
| `L` | Top-left pocket |
| `T` | Centered tab opening |
| `square` | Full-width box |

Anonymous frames (node internals, `<anonymous>`) become **Unknown Rooms**.

### Biomes

Directory names determine the biome. The biome defines the room's atmosphere and icon.

| Directory keyword | Biome | Icon |
|-------------------|-------|------|
| `auth` | Castle | 🏰 |
| `user` | Cave | 🕳 |
| `api` | Fortress | 🛡 |
| `database` / `db` | Sewer | 🚧 |
| `cache` | Lab | 🧪 |
| `queue` | Mine | ⛏ |
| `payment` / `payments` | Volcano | 🌋 |
| *(other)* | Forest | 🌲 |

### Bosses

The error type determines the final boss.

| Error | Boss | Icon |
|-------|------|------|
| `TypeError` | Shape Shifter | 👾 |
| `ReferenceError` | The Phantom | 👻 |
| `NullPointerException` | Void Walker | 💀 |
| `StackOverflowError` | Infinite Hydra | 🐉 |
| `OutOfMemoryError` | Memory Eater | 🧠 |
| `TimeoutError` | Chronos | ⏳ |
| *(other)* | Unknown Evil | 👹 |

### Treasures

Certain rooms contain treasures based on function name or file path.

| Condition | Treasure | Icon |
|-----------|----------|------|
| Function name contains `cache` | Cache Hit | 💎 |
| Function name contains `memo` | Memoized Function | 🗝 |
| File is `.test.ts` or `.spec.ts` | Test Coverage | ⚔ |
| File is `.docs.ts` or under `/docs/` | Documentation Found | 📜 |

### Threat Level

Displayed as a `█░` bar in the footer (0–100%).

```
frameScore      = min(frames × 5, 50)
exceptionScore  = 30 for StackOverflow/OutOfMemory, 15 for Type/Reference, 5 otherwise
repetitionScore = min(repeated files × 5, 20)  — recursive functions excluded
recursionScore  = +20 if any function appears ≥ 3 times
```

---

## Themes

| Theme | Main | Minimap | Footer | Details |
|-------|------|---------|--------|---------|
| `dark` | cyan | yellow | red | green |
| `retro` | green | green | green | green |
| `neon` | magenta | yellow | magenta | yellow |

---

## Testing with Fixtures

The `fixtures/` directory contains ready-to-use stack traces for every scenario.

```bash
# TypeError with auth/user/cache biomes — 45% threat
samus-cli fixtures/sample.log

# StackOverflowError with deep recursion — 90% threat
samus-cli fixtures/recursion.log

# TimeoutError across payment/api/database/cache/queue — 55% threat
samus-cli fixtures/payment-timeout.log

# ReferenceError with .test.ts and .spec.ts frames → ⚔ treasures
samus-cli fixtures/test-treasure.log

# TypeError, 2 frames, low threat
samus-cli fixtures/short-error.log

# OutOfMemoryError across 7 distinct biomes — 65% threat
samus-cli fixtures/multi-biome.log
```

Try them with different themes:

```bash
samus-cli fixtures/recursion.log --theme retro
samus-cli fixtures/multi-biome.log --theme neon
```

Export one to Markdown to see the full dungeon layout:

```bash
samus-cli fixtures/multi-biome.log --export markdown
```

---

## Development

```bash
npm run build       # compile TypeScript → dist/
npm run dev         # run with ts-node (no build step)
npm test            # run all tests
npm run test:watch  # watch mode
npm run clean       # delete dist/
```

Tests cover the parser, map builder, renderer, UI helpers, exporter, and CLI integration via subprocess.

---

## Roadmap

- **Fase 3:** Interactive room search, keyboard shortcut help overlay, biome filter
- **Fase 4:** Config file (`samus.config.json`), custom biome rules, plugin system for custom boss/treasure definitions
