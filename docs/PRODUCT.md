# astlog — Changelog from code, not commits

## Problem

Every existing changelog tool (conventional-changelog, changesets, release-it, auto-changelog) parses **commit messages** to generate changelogs. This is fundamentally flawed:

- Commit messages are written by humans and are frequently wrong, vague, or missing
- A developer can write `fix: typo` and ship a breaking API change
- Teams that don't follow conventional commits get nothing

## Solution

`astlog` reads what the code actually did. Your exported functions, types, and interfaces _are_ your API contract. If a function signature changed, that's a breaking change — regardless of what the commit message says.

```
git ref A --> TS Compiler API --> API Surface A --\
                                                   --> Diff --> Classify --> Changelog
git ref B --> TS Compiler API --> API Surface B --/
```

## Usage

```bash
# Compare last tag to HEAD
npx astlog

# Compare two specific refs
npx astlog v1.2.0..v1.3.0

# Scope to barrel export only
npx astlog --entrypoint src/index.ts

# Machine-readable output
npx astlog --json
```

## Example Output

```markdown
### Breaking Changes

- Removed function `fetchLegacyData`
- `createUser` signature changed: `function createUser(name: string)` -> `function createUser(opts: CreateUserOpts)`

### New

- Added `updateUser(id: string, patch: Partial<User>): Promise<User>`
- Added interface `CreateUserOpts`
```

## Scope

### In

- Single command: `astlog <ref>..<ref>` (defaults to last tag..HEAD)
- TypeScript files only (`.ts`, `.tsx`)
- Detect exports: functions, interfaces, type aliases, enums, classes, constants
- Diff: added / removed / signature-changed
- Semver classification (major/minor/patch)
- Output: markdown (default) and `--json`
- Zero config — works out of the box on any TS project
- `--entrypoint` flag to scope to specific files
- Programmatic API: `import { extract, diff, classify, format } from 'astlog'`

### Out of Scope

- **No commit message parsing** — that's what every other tool does
- **No release management** — use `np` or `release-it` for that
- **No monorepo support** — single-package only
- **No JavaScript support** — no type info means no meaningful signature diffing
- **No config file** — if it needs config, the defaults are wrong
- **No plugin system** — premature abstraction
- **No watch mode** — it's a point-in-time diff, not a daemon

## Design Philosophy

- Zero config. No `.astlogrc`, no `astlog.config.js`.
- Tiny dependency footprint. `typescript` as a peer dep and `cac` for CLI parsing.
- One command, one output.
- Composable — generates a changelog, doesn't manage releases. Pipe its output wherever you want.
- Adopt in 30 seconds: `npx astlog` and you're done.
