import { describe, it, expect } from 'vitest';
import { diff } from '../src/diff';
import { ApiSurface, ExportedSymbol } from '../src/types';

function sym(overrides: Partial<ExportedSymbol> & { name: string }): ExportedSymbol {
  return {
    kind: 'function',
    signature: `function ${overrides.name}(): void`,
    filePath: 'api.ts',
    ...overrides
  };
}

function surface(...symbols: ExportedSymbol[]): ApiSurface {
  const map = new Map<string, ExportedSymbol>();
  for (const s of symbols) {
    map.set(`${s.filePath}:${s.name}`, s);
  }
  return { symbols: map };
}

describe('diff', () => {
  it('detects added symbols', () => {
    const before = surface(sym({ name: 'foo' }));
    const after = surface(sym({ name: 'foo' }), sym({ name: 'bar' }));
    const changes = diff(before, after);

    expect(changes).toHaveLength(1);
    expect(changes[0].type).toBe('added');
    if (changes[0].type === 'added') {
      expect(changes[0].symbol.name).toBe('bar');
    }
  });

  it('detects removed symbols', () => {
    const before = surface(sym({ name: 'foo' }), sym({ name: 'bar' }));
    const after = surface(sym({ name: 'foo' }));
    const changes = diff(before, after);

    expect(changes).toHaveLength(1);
    expect(changes[0].type).toBe('removed');
    if (changes[0].type === 'removed') {
      expect(changes[0].symbol.name).toBe('bar');
    }
  });

  it('detects modified symbols by signature change', () => {
    const before = surface(sym({ name: 'foo', signature: 'function foo(a: string): void' }));
    const after = surface(sym({ name: 'foo', signature: 'function foo(a: number): void' }));
    const changes = diff(before, after);

    expect(changes).toHaveLength(1);
    expect(changes[0].type).toBe('modified');
    if (changes[0].type === 'modified') {
      expect(changes[0].before.signature).toContain('string');
      expect(changes[0].after.signature).toContain('number');
    }
  });

  it('returns empty array when surfaces are identical', () => {
    const s = surface(sym({ name: 'foo' }), sym({ name: 'bar' }));
    const changes = diff(s, s);
    expect(changes).toHaveLength(0);
  });

  it('handles completely different surfaces', () => {
    const before = surface(sym({ name: 'foo' }));
    const after = surface(sym({ name: 'bar' }));
    const changes = diff(before, after);

    expect(changes).toHaveLength(2);
    const types = changes.map((c) => c.type).sort();
    expect(types).toEqual(['added', 'removed']);
  });

  it('handles empty surfaces', () => {
    const empty = surface();
    expect(diff(empty, empty)).toHaveLength(0);
    expect(diff(empty, surface(sym({ name: 'foo' })))).toHaveLength(1);
    expect(diff(surface(sym({ name: 'foo' })), empty)).toHaveLength(1);
  });
});
