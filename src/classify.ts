import { Change, ClassifiedChange, SemverLevel } from './types';

export function classify(changes: Change[]): ClassifiedChange[] {
  return changes.map(classifyOne);
}

function classifyOne(change: Change): ClassifiedChange {
  switch (change.type) {
    case 'removed':
      return {
        change,
        level: 'major',
        description: `Removed ${change.symbol.kind} \`${change.symbol.name}\``
      };

    case 'added':
      return {
        change,
        level: 'minor',
        description: `Added ${change.symbol.kind} \`${change.symbol.name}\``
      };

    case 'modified':
      return {
        change,
        level: classifyModification(change),
        description: buildModificationDescription(change)
      };
  }
}

function classifyModification(change: Extract<Change, { type: 'modified' }>): SemverLevel {
  const { before, after } = change;

  if (before.kind !== after.kind) return 'major';

  if (before.kind === 'function') {
    return classifyFunctionChange(before.signature, after.signature);
  }

  if (before.kind === 'interface' || before.kind === 'type-alias' || before.kind === 'class') {
    return classifyStructuralChange(before.signature, after.signature);
  }

  return 'major';
}

function classifyFunctionChange(beforeSig: string, afterSig: string): SemverLevel {
  const beforeParams = extractParamsFromSignature(beforeSig);
  const afterParams = extractParamsFromSignature(afterSig);
  const beforeReturn = extractReturnFromSignature(beforeSig);
  const afterReturn = extractReturnFromSignature(afterSig);

  if (
    beforeReturn === afterReturn &&
    afterParams.startsWith(beforeParams) &&
    isOnlyOptionalParamsAdded(beforeParams, afterParams)
  ) {
    return 'minor';
  }

  return 'major';
}

function classifyStructuralChange(beforeSig: string, afterSig: string): SemverLevel {
  const beforeProps = extractPropsFromSignature(beforeSig);
  const afterProps = extractPropsFromSignature(afterSig);

  const beforeSet = new Set(beforeProps);
  const afterSet = new Set(afterProps);

  for (const prop of beforeProps) {
    if (!afterSet.has(prop)) return 'major';
  }

  let hasAdditions = false;
  for (const prop of afterProps) {
    if (!beforeSet.has(prop)) {
      hasAdditions = true;
      if (!prop.includes('?:')) return 'major';
    }
  }

  return hasAdditions ? 'minor' : 'patch';
}

function buildModificationDescription(change: Extract<Change, { type: 'modified' }>): string {
  const { before, after } = change;

  if (before.kind !== after.kind) {
    return `\`${before.name}\` changed from ${before.kind} to ${after.kind}`;
  }

  return `\`${before.name}\` signature changed: \`${before.signature}\` -> \`${after.signature}\``;
}

function extractParamsFromSignature(sig: string): string {
  const start = sig.indexOf('(');
  if (start === -1) return '';
  const end = findMatchingParen(sig, start);
  return sig.slice(start + 1, end);
}

function extractReturnFromSignature(sig: string): string {
  const start = sig.indexOf('(');
  if (start === -1) return '';
  const end = findMatchingParen(sig, start);
  const afterParen = sig.slice(end + 1);
  const match = afterParen.match(/^:\s*(.+)$/);
  return match ? match[1].trim() : '';
}

function findMatchingParen(str: string, openIndex: number): number {
  let depth = 0;
  for (let i = openIndex; i < str.length; i++) {
    if (str[i] === '(') depth++;
    else if (str[i] === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return str.length;
}

function isOnlyOptionalParamsAdded(beforeParams: string, afterParams: string): boolean {
  const added = afterParams.slice(beforeParams.length).trim();
  if (!added) return true;
  const parts = added
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.every((p) => p.includes('?'));
}

function extractPropsFromSignature(sig: string): string[] {
  const match = sig.match(/\{([^}]*)\}/);
  if (!match) return [];
  return match[1]
    .split(/[;,]/)
    .map((p) => p.trim())
    .filter(Boolean);
}
