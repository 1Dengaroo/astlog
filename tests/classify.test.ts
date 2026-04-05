import { describe, it, expect } from 'vitest';
import { classify } from '../src/classify';
import { Change } from '../src/types';

describe('classify', () => {
  describe('removed symbols', () => {
    it('classifies removals as major', () => {
      const changes: Change[] = [
        {
          type: 'removed',
          symbol: {
            name: 'foo',
            kind: 'function',
            signature: 'function foo(): void',
            filePath: 'api.ts'
          }
        }
      ];
      const result = classify(changes);
      expect(result[0].level).toBe('major');
      expect(result[0].description).toContain('Removed');
    });
  });

  describe('added symbols', () => {
    it('classifies additions as minor', () => {
      const changes: Change[] = [
        {
          type: 'added',
          symbol: {
            name: 'bar',
            kind: 'function',
            signature: 'function bar(): void',
            filePath: 'api.ts'
          }
        }
      ];
      const result = classify(changes);
      expect(result[0].level).toBe('minor');
      expect(result[0].description).toContain('Added');
    });
  });

  describe('modified functions', () => {
    it('classifies parameter type change as major', () => {
      const changes: Change[] = [
        {
          type: 'modified',
          before: {
            name: 'foo',
            kind: 'function',
            signature: 'function foo(a: string): void',
            filePath: 'api.ts'
          },
          after: {
            name: 'foo',
            kind: 'function',
            signature: 'function foo(a: number): void',
            filePath: 'api.ts'
          }
        }
      ];
      const result = classify(changes);
      expect(result[0].level).toBe('major');
    });

    it('classifies return type change as major', () => {
      const changes: Change[] = [
        {
          type: 'modified',
          before: {
            name: 'foo',
            kind: 'function',
            signature: 'function foo(): string',
            filePath: 'api.ts'
          },
          after: {
            name: 'foo',
            kind: 'function',
            signature: 'function foo(): number',
            filePath: 'api.ts'
          }
        }
      ];
      const result = classify(changes);
      expect(result[0].level).toBe('major');
    });

    it('classifies new optional parameter as minor', () => {
      const changes: Change[] = [
        {
          type: 'modified',
          before: {
            name: 'foo',
            kind: 'function',
            signature: 'function foo(a: string): void',
            filePath: 'api.ts'
          },
          after: {
            name: 'foo',
            kind: 'function',
            signature: 'function foo(a: string, b?: number): void',
            filePath: 'api.ts'
          }
        }
      ];
      const result = classify(changes);
      expect(result[0].level).toBe('minor');
    });

    it('handles nested parens in callback params', () => {
      const changes: Change[] = [
        {
          type: 'modified',
          before: {
            name: 'on',
            kind: 'function',
            signature: 'function on(cb: (x: string) => void): void',
            filePath: 'api.ts'
          },
          after: {
            name: 'on',
            kind: 'function',
            signature: 'function on(cb: (x: number) => void): void',
            filePath: 'api.ts'
          }
        }
      ];
      const result = classify(changes);
      expect(result[0].level).toBe('major');
    });
  });

  describe('modified interfaces', () => {
    it('classifies new optional property as minor', () => {
      const changes: Change[] = [
        {
          type: 'modified',
          before: {
            name: 'User',
            kind: 'interface',
            signature: 'interface User { id: string, name: string }',
            filePath: 'api.ts'
          },
          after: {
            name: 'User',
            kind: 'interface',
            signature: 'interface User { id: string, name: string, age?: number }',
            filePath: 'api.ts'
          }
        }
      ];
      const result = classify(changes);
      expect(result[0].level).toBe('minor');
    });

    it('classifies new required property as major', () => {
      const changes: Change[] = [
        {
          type: 'modified',
          before: {
            name: 'User',
            kind: 'interface',
            signature: 'interface User { id: string }',
            filePath: 'api.ts'
          },
          after: {
            name: 'User',
            kind: 'interface',
            signature: 'interface User { id: string, email: string }',
            filePath: 'api.ts'
          }
        }
      ];
      const result = classify(changes);
      expect(result[0].level).toBe('major');
    });

    it('classifies removed property as major', () => {
      const changes: Change[] = [
        {
          type: 'modified',
          before: {
            name: 'User',
            kind: 'interface',
            signature: 'interface User { id: string, name: string }',
            filePath: 'api.ts'
          },
          after: {
            name: 'User',
            kind: 'interface',
            signature: 'interface User { id: string }',
            filePath: 'api.ts'
          }
        }
      ];
      const result = classify(changes);
      expect(result[0].level).toBe('major');
    });
  });

  describe('modified enums', () => {
    it('classifies enum changes as major', () => {
      const changes: Change[] = [
        {
          type: 'modified',
          before: {
            name: 'Status',
            kind: 'enum',
            signature: 'enum Status { Active, Inactive }',
            filePath: 'api.ts'
          },
          after: {
            name: 'Status',
            kind: 'enum',
            signature: 'enum Status { Active, Inactive, Banned }',
            filePath: 'api.ts'
          }
        }
      ];
      const result = classify(changes);
      expect(result[0].level).toBe('major');
    });
  });

  describe('kind changes', () => {
    it('classifies kind change as major', () => {
      const changes: Change[] = [
        {
          type: 'modified',
          before: {
            name: 'foo',
            kind: 'constant',
            signature: 'const foo: "bar"',
            filePath: 'api.ts'
          },
          after: {
            name: 'foo',
            kind: 'function',
            signature: 'function foo(): string',
            filePath: 'api.ts'
          }
        }
      ];
      const result = classify(changes);
      expect(result[0].level).toBe('major');
      expect(result[0].description).toContain('changed from constant to function');
    });
  });
});
