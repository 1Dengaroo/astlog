import { ChangelogResult, ClassifiedChange, SemverLevel } from './types';

export function buildResult(classified: ClassifiedChange[]): ChangelogResult {
  const breaking: ClassifiedChange[] = [];
  const features: ClassifiedChange[] = [];
  const fixes: ClassifiedChange[] = [];

  for (const c of classified) {
    switch (c.level) {
      case 'major':
        breaking.push(c);
        break;
      case 'minor':
        features.push(c);
        break;
      case 'patch':
        fixes.push(c);
        break;
    }
  }

  let suggestedBump: SemverLevel = 'patch';
  if (breaking.length > 0) suggestedBump = 'major';
  else if (features.length > 0) suggestedBump = 'minor';

  return { breaking, features, fixes, suggestedBump };
}

export function format(result: ChangelogResult, options?: { json?: boolean }): string {
  if (options?.json) {
    return JSON.stringify(result, null, 2);
  }
  return formatMarkdown(result);
}

const MAX_SIGNATURE_LENGTH = 120;

function truncateSignature(sig: string): string {
  if (sig.length <= MAX_SIGNATURE_LENGTH) return sig;
  return sig.slice(0, MAX_SIGNATURE_LENGTH) + '...';
}

function deduplicateDescriptions(changes: ClassifiedChange[]): string[] {
  const seen = new Set<string>();
  const descriptions: string[] = [];

  for (const c of changes) {
    const name = getChangeName(c);
    if (seen.has(name)) continue;
    seen.add(name);
    descriptions.push(truncateDescription(c));
  }

  return descriptions;
}

function getChangeName(c: ClassifiedChange): string {
  switch (c.change.type) {
    case 'added':
      return c.change.symbol.name;
    case 'removed':
      return c.change.symbol.name;
    case 'modified':
      return c.change.before.name;
  }
}

function truncateDescription(c: ClassifiedChange): string {
  if (c.change.type !== 'modified') return c.description;

  const { before, after } = c.change;

  if (before.kind !== after.kind) {
    return c.description;
  }

  const beforeSig = truncateSignature(before.signature);
  const afterSig = truncateSignature(after.signature);
  return `\`${before.name}\` signature changed: \`${beforeSig}\` -> \`${afterSig}\``;
}

function formatMarkdown(result: ChangelogResult): string {
  const sections = [
    formatSection('### Breaking Changes', result.breaking),
    formatSection('### New', result.features),
    formatSection('### Changed', result.fixes)
  ]
    .filter(Boolean)
    .join('\n');

  if (!sections) return 'No API changes detected.\n';

  return `${sections}\n**Suggested version bump:** ${result.suggestedBump}\n`;
}

function formatSection(heading: string, changes: ClassifiedChange[]): string {
  if (changes.length === 0) return '';
  const items = deduplicateDescriptions(changes)
    .map((d) => `- ${d}`)
    .join('\n');
  return `${heading}\n\n${items}\n`;
}
