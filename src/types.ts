export type SymbolKind = 'function' | 'interface' | 'type-alias' | 'class' | 'constant' | 'enum';

export interface ExportedSymbol {
  name: string;
  kind: SymbolKind;
  signature: string;
  filePath: string;
}

export interface ApiSurface {
  symbols: Map<string, ExportedSymbol>; // Keyed by "filePath:name"
}

export type Change =
  | { type: 'added'; symbol: ExportedSymbol }
  | { type: 'removed'; symbol: ExportedSymbol }
  | { type: 'modified'; before: ExportedSymbol; after: ExportedSymbol };

export type SemverLevel = 'major' | 'minor' | 'patch';

export interface ClassifiedChange {
  change: Change;
  level: SemverLevel;
  description: string;
}

export interface ChangelogResult {
  breaking: ClassifiedChange[];
  features: ClassifiedChange[];
  fixes: ClassifiedChange[];
  suggestedBump: SemverLevel;
}
