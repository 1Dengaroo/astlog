import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { extract } from '../src/extract';
import { diff } from '../src/diff';
import { classify } from '../src/classify';
import { buildResult, format } from '../src/format';
import { ApiSurface, ExportedSymbol } from '../src/types';

const fixture = (name: string) => path.resolve(__dirname, 'fixtures', name);

function normalizePaths(surface: ApiSurface, logicalPath: string): ApiSurface {
  const normalized = new Map<string, ExportedSymbol>();
  for (const [, symbol] of surface.symbols) {
    const key = `${logicalPath}:${symbol.name}`;
    normalized.set(key, { ...symbol, filePath: logicalPath });
  }
  return { symbols: normalized };
}

describe('full pipeline with realistic fixtures', () => {
  const before = normalizePaths(extract([fixture('realistic-before.ts')]), 'src/lib.ts');
  const after = normalizePaths(extract([fixture('realistic-after.ts')]), 'src/lib.ts');
  const changes = diff(before, after);
  const classified = classify(changes);
  const result = buildResult(classified);

  it('detects removed exports', () => {
    const removedNames = result.breaking
      .filter((c) => c.change.type === 'removed')
      .map((c) => c.change.symbol.name);

    expect(removedNames).toContain('fetchLegacyData');
    expect(removedNames).toContain('processArgs');
    expect(removedNames).toContain('Middleware');
  });

  it('detects added exports', () => {
    const addedNames = result.features
      .filter((c) => c.change.type === 'added')
      .map((c) => c.change.symbol.name);

    expect(addedNames).toContain('createPlugin');
    expect(addedNames).toContain('Plugin');
    expect(addedNames).toContain('runtimeArgs');
    expect(addedNames).toContain('RequestMiddleware');
    expect(addedNames).toContain('RequestOptions');
  });

  it('detects function signature changes as breaking', () => {
    const modifiedBreaking = result.breaking
      .filter((c) => c.change.type === 'modified')
      .map((c) => c.change.type === 'modified' && c.change.before.name);

    expect(modifiedBreaking).toContain('parseArgs');
    expect(modifiedBreaking).toContain('formatOutput');
    expect(modifiedBreaking).toContain('registerMiddleware');
  });

  it('detects new optional interface properties as minor', () => {
    const minorModified = result.features
      .filter((c) => c.change.type === 'modified')
      .map((c) => c.change.type === 'modified' && c.change.before.name);

    expect(minorModified).toContain('CommandOption');
    expect(minorModified).toContain('ClientConfig');
  });

  it('detects new required interface properties as breaking', () => {
    const breakingModified = result.breaking.filter(
      (c) => c.change.type === 'modified' && c.change.before.kind === 'interface'
    );
    const names = breakingModified.map((c) => c.change.type === 'modified' && c.change.before.name);

    expect(names).toContain('Command');
    expect(names).toContain('ParsedArgs');
  });

  it('does not flag unchanged arrow functions', () => {
    const allChangedNames = changes.map((c) => {
      if (c.type === 'modified') return c.before.name;
      return c.symbol.name;
    });

    expect(allChangedNames).not.toContain('removeBrackets');
    expect(allChangedNames).not.toContain('camelcase');
    expect(allChangedNames).not.toContain('findLongest');
    expect(allChangedNames).not.toContain('padRight');
  });

  it('does not flag unchanged functions', () => {
    const allChangedNames = changes.map((c) => {
      if (c.type === 'modified') return c.before.name;
      return c.symbol.name;
    });

    expect(allChangedNames).not.toContain('createClient');
    expect(allChangedNames).not.toContain('validateConfig');
  });

  it('detects constant value change as breaking', () => {
    const versionChange = result.breaking.find(
      (c) => c.change.type === 'modified' && c.change.before.name === 'VERSION'
    );
    expect(versionChange).toBeDefined();
  });

  it('does not flag unchanged constants', () => {
    const allChangedNames = changes.map((c) => {
      if (c.type === 'modified') return c.before.name;
      return c.symbol.name;
    });

    expect(allChangedNames).not.toContain('DEFAULT_TIMEOUT');
  });

  it('detects enum member addition as breaking', () => {
    const enumChange = result.breaking.find(
      (c) => c.change.type === 'modified' && c.change.before.name === 'OutputFormat'
    );
    expect(enumChange).toBeDefined();
  });

  it('suggests major bump', () => {
    expect(result.suggestedBump).toBe('major');
  });

  it('produces valid markdown output', () => {
    const md = format(result);
    expect(md).toContain('### Breaking Changes');
    expect(md).toContain('### New');
    expect(md).toContain('**Suggested version bump:** major');
  });

  it('produces valid JSON output', () => {
    const json = format(result, { json: true });
    const parsed = JSON.parse(json);
    expect(parsed.breaking.length).toBeGreaterThan(0);
    expect(parsed.features.length).toBeGreaterThan(0);
    expect(parsed.suggestedBump).toBe('major');
  });
});
