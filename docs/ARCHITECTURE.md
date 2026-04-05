# Architecture

## Pipeline

```
CLI args → Git integration → Extract (×2) → Diff → Classify → Format → stdout
```

Each stage is a pure function (except git I/O). They compose independently.

## Modules

```
src/
  cli.ts        — Entry point, arg parsing (cac), error boundary
  git.ts        — Read files at git refs, auto-detect tags, temp file management
  extract.ts    — TS Compiler API -> ApiSurface
  diff.ts       — Two ApiSurfaces -> Change[]
  classify.ts   — Change[] -> ClassifiedChange[] (semver levels)
  format.ts     — ChangelogResult -> markdown or JSON string
  types.ts      — All shared contracts
  errors.ts     — Typed error union (AstlogError)
  index.ts      — Barrel export for programmatic API
```

## Key Types

```typescript
interface ApiSurface {
  symbols: Map<string, ExportedSymbol>; // Keyed by "filePath:name"
}

interface ExportedSymbol {
  name: string;
  kind: SymbolKind; // "function" | "interface" | "type-alias" | "enum" | "class" | "constant"
  signature: string; // Canonical string representation for comparison
  filePath: string;
}

type Change =
  | { type: 'added'; symbol: ExportedSymbol }
  | { type: 'removed'; symbol: ExportedSymbol }
  | { type: 'modified'; before: ExportedSymbol; after: ExportedSymbol };

interface ClassifiedChange {
  change: Change;
  level: SemverLevel; // "major" | "minor" | "patch"
  description: string;
}

interface ChangelogResult {
  breaking: ClassifiedChange[];
  features: ClassifiedChange[];
  fixes: ClassifiedChange[];
  suggestedBump: SemverLevel;
}
```

## Design Decisions

**Contract first.** Types in `types.ts` are the spec. Define them before implementing.

**Discriminated unions over optional fields.** `Change` has `type: "added" | "removed" | "modified"` — each variant carries exactly its data. Enables exhaustive `switch`.

**Signature as string.** `ExportedSymbol.signature` is a canonical string, not raw AST nodes. Diff comparison is string equality. Signatures are normalized at extraction time (whitespace collapsed, semicolons standardized, index signatures canonicalized to `Record<>`).

**Validate at boundaries only.** `cli.ts` validates args and catches `AstlogException`. Internal functions (`diff`, `classify`, `format`) trust typed inputs — no defensive checks.

**Arrow function detection.** `const fn = () => ...` is classified as `"function"` kind, not `"constant"`. The extractor checks if a variable declaration's type has call signatures.

**Git integration via temp files.** Files are read with `git show <ref>:<path>`, written to a temp directory, passed to the TS Compiler API, then cleaned up. File paths are normalized back to logical project paths so both surfaces use matching keys.

## Dependencies

- `typescript` — peer dependency. Used for AST parsing via `ts.createProgram`.
- `cac` — CLI argument parser.
- That's it.

## Error Handling

```typescript
type AstlogError =
  | { code: 'INVALID_REF'; message: string }
  | { code: 'NO_TAGS'; message: string }
  | { code: 'NO_TYPESCRIPT'; message: string }
  | { code: 'PARSE_ERROR'; message: string }
  | { code: 'NOT_GIT_REPO'; message: string };
```

Library code throws `AstlogException`. Only `cli.ts` calls `process.exit`.

## Semver Classification Rules

| Change                                 | Level |
| -------------------------------------- | ----- |
| Removed export                         | major |
| Changed parameter type                 | major |
| Changed return type                    | major |
| Removed interface property             | major |
| Added required interface property      | major |
| Changed enum members                   | major |
| Changed constant type/value            | major |
| Kind change (e.g. constant → function) | major |
| New export                             | minor |
| New optional interface property        | minor |
| New optional function parameter        | minor |
| No signature change                    | patch |
