# sigdiff

Zero-config CLI that diffs the public API surface of a TypeScript project between two git refs and outputs a structured changelog.

## Build & Test

```bash
npm run build
npm test
```

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for full details. Also [docs/PRODUCT.md](docs/PRODUCT.md) and [docs/TODO.md](docs/TODO.md).

```
src/
  types.ts      — All contracts (define before implementing)
  extract.ts    — TS Compiler API -> ApiSurface
  diff.ts       — Two ApiSurfaces -> Change[]
  classify.ts   — Change -> SemverLevel
  format.ts     — ChangelogResult -> markdown or JSON
  errors.ts     — Typed error union (SigdiffError)
  git.ts        — Read files at git refs, temp file management
  cli.ts        — Entry point, arg parsing, error boundary
  index.ts      — Barrel export for programmatic API
```

## Design Rules

- **Contract first.** Define types in `types.ts` before implementing.
- **Discriminated unions over optional fields.** Each `Change` variant carries exactly its data.
- **Validate at boundaries only.** CLI validates args. Internal functions trust typed inputs.
- **Each function is independently useful.** `extract`, `diff`, `classify`, `format` are composable.
- **Consistent error format.** Library code throws `SigdiffException`, never calls `process.exit`.

## Conventions

- Zero config — no config files
- `typescript` is a peer dep, `cac` for CLI parsing — that's it
- `ExportedSymbol.signature` is a normalized string — comparison happens on strings, not AST nodes
- `ApiSurface.symbols` keyed by `filePath:name` for cross-file uniqueness
