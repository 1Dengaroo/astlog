# sigdiff

Detects breaking changes in TypeScript projects by diffing the actual API surface between git refs. No config, no setup, no commit conventions.

```bash
npx sigdiff v1.0.0..v2.0.0
```

## Why this exists

Tools like `changesets` require developers to manually describe what changed. `semantic-release` relies on commit message conventions. `api-extractor` extracts the API surface but leaves semver classification to humans.

`sigdiff` skips all of that. Point it at two git refs and it tells you what changed in your exports, classified by semver level. Think [`cargo-semver-checks`](https://github.com/obi1kenobi/cargo-semver-checks) for TypeScript.

The goal here is to keep it simple and minimize overhead. No config files. No plugins. No workflow changes.

## Usage

```bash
# Compare last tag to HEAD
npx sigdiff

# Compare two tags
npx sigdiff v1.0.0..v2.0.0

# Any git ref works: branches, commits, relative refs
npx sigdiff main..feature-branch
npx sigdiff abc1234..def5678
npx sigdiff HEAD~5..HEAD

# Scope to a specific entrypoint
npx sigdiff --entrypoint src/index.ts

# JSON output
npx sigdiff --json
```

## Example output

```
### Breaking Changes

- Removed function `fetchLegacyData`
- `createUser` signature changed: `(name: string, email: string)` -> `(opts: CreateUserOpts)`

### New

- Added function `updateUser`
- Added interface `CreateUserOpts`

Suggested version bump: major
```

## What it detects

Functions, arrow functions, interfaces, type aliases, enums, classes, and constants. Parameters, return types, property shapes, and member names.

Changes are classified as `major`, `minor`, or `patch` per semver rules.

## How it compares

|                       | sigdiff         | changesets              | semantic-release     | api-extractor   |
| --------------------- | --------------- | ----------------------- | -------------------- | --------------- |
| Detects API changes   | Automatic (AST) | Manual (you write them) | No (commit messages) | Automatic (AST) |
| Semver classification | Automatic       | Manual                  | Commit-based         | Manual          |
| Changelog output      | Yes             | Yes                     | Yes                  | No              |
| Config required       | None            | Yes                     | Yes                  | Yes             |
| Git ref comparison    | Any ref         | N/A                     | N/A                  | Baseline file   |

## Programmatic API

```typescript
import { extract, diff, classify, buildResult, format } from 'sigdiff';

const before = extract(['src/v1/index.ts']);
const after = extract(['src/v2/index.ts']);

console.log(format(buildResult(classify(diff(before, after)))));
```

## Notes

- TypeScript only. No JS support (no type info to diff).
- Single-package projects. No monorepo support yet.
- Read-only. Never touches your working tree.
- 1 runtime dependency ([`cac`](https://github.com/cacjs/cac)). ~8 KB published.

## License

MIT
