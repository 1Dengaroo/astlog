# sigdiff

Diffs the public API surface of a TypeScript project between two git refs and outputs a structured changelog.

```bash
npx sigdiff v1.0.0..v2.0.0
```

## Why

Commit messages are a human interpretation of a change — imprecise, incomplete, or missing entirely. `sigdiff` adds a second perspective: what the code actually exported. It catches things commit messages miss, like a signature change buried in a large PR.

## Usage

```bash
# Compare last tag to HEAD
npx sigdiff

# Compare two refs
npx sigdiff v1.0.0..v2.0.0

# Scope to a specific entrypoint
npx sigdiff --entrypoint src/index.ts

# JSON output
npx sigdiff --json
```

## What it detects

Functions, arrow functions, interfaces, type aliases, enums, classes, and constants — parameters, return types, property shapes, and member names.

Changes are classified as `major`, `minor`, or `patch` per semver rules.

## Example output

```
### Breaking Changes

- Removed function `fetchLegacyData`
- `createUser` signature changed: `(name: string, email: string)` → `(opts: CreateUserOpts)`

### New

- Added function `updateUser`
- Added interface `CreateUserOpts`

Suggested version bump: major
```

## Programmatic API

```typescript
import { extract, diff, classify, buildResult, format } from 'sigdiff';

const before = extract(['src/v1/index.ts']);
const after = extract(['src/v2/index.ts']);

console.log(format(buildResult(classify(diff(before, after)))));
```

## Notes

- TypeScript only — no JS support (no type info to diff)
- Single-package projects only — no monorepo support yet
- Read-only — never touches your working tree
- 1 runtime dependency ([`cac`](https://github.com/cacjs/cac))

## License

MIT
