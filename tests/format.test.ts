import { describe, it, expect } from 'vitest';
import { buildResult, format } from '../src/format';
import { ClassifiedChange } from '../src/types';

function classified(level: 'major' | 'minor' | 'patch', desc: string): ClassifiedChange {
  return {
    change: {
      type: 'removed',
      symbol: {
        name: 'test',
        kind: 'function',
        signature: 'function test(): void',
        filePath: 'api.ts'
      }
    },
    level,
    description: desc
  };
}

describe('buildResult', () => {
  it('groups changes by semver level', () => {
    const input = [
      classified('major', 'breaking 1'),
      classified('minor', 'feature 1'),
      classified('patch', 'fix 1'),
      classified('major', 'breaking 2')
    ];
    const result = buildResult(input);

    expect(result.breaking).toHaveLength(2);
    expect(result.features).toHaveLength(1);
    expect(result.fixes).toHaveLength(1);
  });

  it('suggests major when breaking changes exist', () => {
    const result = buildResult([classified('major', 'breaking')]);
    expect(result.suggestedBump).toBe('major');
  });

  it('suggests minor when only features exist', () => {
    const result = buildResult([classified('minor', 'feature')]);
    expect(result.suggestedBump).toBe('minor');
  });

  it('suggests patch when only fixes exist', () => {
    const result = buildResult([classified('patch', 'fix')]);
    expect(result.suggestedBump).toBe('patch');
  });

  it('suggests major over minor', () => {
    const result = buildResult([classified('minor', 'feature'), classified('major', 'breaking')]);
    expect(result.suggestedBump).toBe('major');
  });
});

describe('format', () => {
  describe('markdown', () => {
    it('renders breaking changes section', () => {
      const result = buildResult([classified('major', 'Removed function `foo`')]);
      const md = format(result);

      expect(md).toContain('### Breaking Changes');
      expect(md).toContain('- Removed function `foo`');
      expect(md).toContain('**Suggested version bump:** major');
    });

    it('renders features section', () => {
      const result = buildResult([classified('minor', 'Added function `bar`')]);
      const md = format(result);

      expect(md).toContain('### New');
      expect(md).toContain('- Added function `bar`');
    });

    it('returns no-changes message for empty result', () => {
      const result = buildResult([]);
      const md = format(result);
      expect(md).toBe('No API changes detected.\n');
    });
  });

  describe('json', () => {
    it('returns valid JSON', () => {
      const result = buildResult([classified('major', 'breaking')]);
      const json = format(result, { json: true });
      const parsed = JSON.parse(json);

      expect(parsed.breaking).toHaveLength(1);
      expect(parsed.suggestedBump).toBe('major');
    });
  });
});
