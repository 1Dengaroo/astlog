import { ApiSurface, Change } from './types';

export function diff(before: ApiSurface, after: ApiSurface): Change[] {
  const changes: Change[] = [];

  for (const [key, symbol] of before.symbols) {
    if (!after.symbols.has(key)) {
      changes.push({ type: 'removed', symbol });
    }
  }

  for (const [key, symbol] of after.symbols) {
    if (!before.symbols.has(key)) {
      changes.push({ type: 'added', symbol });
    }
  }

  for (const [key, afterSymbol] of after.symbols) {
    const beforeSymbol = before.symbols.get(key);
    if (beforeSymbol && beforeSymbol.signature !== afterSymbol.signature) {
      changes.push({ type: 'modified', before: beforeSymbol, after: afterSymbol });
    }
  }

  return changes;
}
