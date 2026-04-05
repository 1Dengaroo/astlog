# sigdiff

Detects breaking changes in TypeScript projects by diffing the actual API surface between git refs.

## Problem

Existing tools require humans to correctly describe what changed:

- `changesets` requires developers to manually write changeset files and pick semver levels
- `semantic-release` relies on commit message conventions to determine version bumps
- `api-extractor` extracts the API surface but leaves semver classification to humans

Even with good conventions and linting, commit messages are a human interpretation of a change. They can be imprecise, incomplete, or miss things entirely.

## Solution

`sigdiff` reads what the code actually exported. Point it at two git refs, it diffs the public API surface using the TypeScript Compiler API and classifies every change by semver level.

```
git ref A --> TS Compiler API --> API Surface A --\
                                                   --> Diff --> Classify --> Changelog
git ref B --> TS Compiler API --> API Surface B --/
```

Think [`cargo-semver-checks`](https://github.com/obi1kenobi/cargo-semver-checks) for TypeScript. No equivalent exists in the npm ecosystem.

## Scope

### In

- `sigdiff <ref>..<ref>` (defaults to last tag..HEAD)
- TypeScript files only (`.ts`, `.tsx`)
- Detect exports: functions, interfaces, type aliases, enums, classes, constants
- Diff: added, removed, signature-changed
- Semver classification (major/minor/patch)
- Output: markdown (default) and `--json`
- Zero config, works on any TS project
- `--entrypoint` flag to scope to specific files
- Programmatic API: `import { extract, diff, classify, format } from 'sigdiff'`

### Out of scope

- No commit message parsing
- No release management (use `np` or `release-it`)
- No monorepo support (single-package only)
- No JavaScript support (no type info to diff)
- No config files
- No plugin system
- No watch mode

## Design philosophy

- Zero config. Zero overhead. Run it and get output.
- 1 runtime dependency. ~8 KB published.
- Composable. Generates a changelog, doesn't manage releases. Pipe it wherever you want.
- Read-only. Never touches your working tree.
