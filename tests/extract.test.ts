import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { extract } from '../src/extract';

const fixture = (name: string) => path.resolve(__dirname, 'fixtures', name);

describe('extract', () => {
  describe('functions', () => {
    it('extracts function declarations', () => {
      const surface = extract([fixture('functions.ts')]);
      const symbols = [...surface.symbols.values()];
      const greet = symbols.find((s) => s.name === 'greet');

      expect(greet).toBeDefined();
      expect(greet!.kind).toBe('function');
      expect(greet!.signature).toContain('function greet(name: string): string');
    });

    it('extracts async functions with complex return types', () => {
      const surface = extract([fixture('functions.ts')]);
      const symbols = [...surface.symbols.values()];
      const fetchUser = symbols.find((s) => s.name === 'fetchUser');

      expect(fetchUser).toBeDefined();
      expect(fetchUser!.kind).toBe('function');
      expect(fetchUser!.signature).toContain('Promise<');
    });

    it('classifies arrow functions as function kind', () => {
      const surface = extract([fixture('functions.ts')]);
      const symbols = [...surface.symbols.values()];
      const multiply = symbols.find((s) => s.name === 'multiply');

      expect(multiply).toBeDefined();
      expect(multiply!.kind).toBe('function');
      expect(multiply!.signature).toContain('function multiply(');
    });
  });

  describe('interfaces', () => {
    it('extracts interfaces with required and optional properties', () => {
      const surface = extract([fixture('interfaces.ts')]);
      const symbols = [...surface.symbols.values()];
      const user = symbols.find((s) => s.name === 'User');

      expect(user).toBeDefined();
      expect(user!.kind).toBe('interface');
      expect(user!.signature).toContain('id: string');
      expect(user!.signature).toContain('age?:');
    });
  });

  describe('mixed exports', () => {
    it('extracts type aliases', () => {
      const surface = extract([fixture('mixed.ts')]);
      const symbols = [...surface.symbols.values()];
      const userId = symbols.find((s) => s.name === 'UserID');

      expect(userId).toBeDefined();
      expect(userId!.kind).toBe('type-alias');
      expect(userId!.signature).toBe('type UserID = string');
    });

    it('extracts enums with members', () => {
      const surface = extract([fixture('mixed.ts')]);
      const symbols = [...surface.symbols.values()];
      const status = symbols.find((s) => s.name === 'Status');

      expect(status).toBeDefined();
      expect(status!.kind).toBe('enum');
      expect(status!.signature).toContain('Active');
      expect(status!.signature).toContain('Inactive');
    });

    it('extracts constants', () => {
      const surface = extract([fixture('mixed.ts')]);
      const symbols = [...surface.symbols.values()];
      const version = symbols.find((s) => s.name === 'API_VERSION');

      expect(version).toBeDefined();
      expect(version!.kind).toBe('constant');
      expect(version!.signature).toBe('const API_VERSION: "1.0.0"');
    });

    it('extracts classes with methods', () => {
      const surface = extract([fixture('mixed.ts')]);
      const symbols = [...surface.symbols.values()];
      const svc = symbols.find((s) => s.name === 'UserService');

      expect(svc).toBeDefined();
      expect(svc!.kind).toBe('class');
      expect(svc!.signature).toContain('findById');
    });
  });

  describe('keying', () => {
    it('keys symbols by filePath:name', () => {
      const surface = extract([fixture('functions.ts')]);
      const keys = [...surface.symbols.keys()];

      expect(keys.every((k) => k.includes(':'))).toBe(true);
      expect(keys.some((k) => k.endsWith(':greet'))).toBe(true);
    });

    it('sets filePath relative to cwd', () => {
      const surface = extract([fixture('functions.ts')]);
      const symbols = [...surface.symbols.values()];

      expect(symbols[0].filePath).not.toMatch(/^\//);
    });
  });

  describe('multiple files', () => {
    it('extracts from multiple files into one surface', () => {
      const surface = extract([
        fixture('functions.ts'),
        fixture('interfaces.ts'),
        fixture('mixed.ts')
      ]);

      const names = [...surface.symbols.values()].map((s) => s.name);
      expect(names).toContain('greet');
      expect(names).toContain('User');
      expect(names).toContain('Status');
    });
  });
});
