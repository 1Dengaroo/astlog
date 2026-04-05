export { extract } from './extract';
export { diff } from './diff';
export { classify } from './classify';
export { buildResult, format } from './format';
export { SigdiffException } from './errors';

export type {
  ApiSurface,
  ExportedSymbol,
  Change,
  ClassifiedChange,
  ChangelogResult,
  SemverLevel,
  SymbolKind
} from './types';

export type { SigdiffError } from './errors';
