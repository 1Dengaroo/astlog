import * as path from 'path';
import * as ts from 'typescript';
import { ApiSurface, ExportedSymbol, SymbolKind } from './types';

export function extract(fileNames: string[], compilerOptions?: ts.CompilerOptions): ApiSurface {
  const options: ts.CompilerOptions = compilerOptions ?? {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.CommonJS,
    strict: true,
    skipLibCheck: true
  };

  const program = ts.createProgram(fileNames, options);
  const checker = program.getTypeChecker();
  const symbols = new Map<string, ExportedSymbol>();

  for (const fileName of fileNames) {
    const sourceFile = program.getSourceFile(fileName);
    if (!sourceFile) continue;

    const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
    if (!moduleSymbol) continue;

    const relativePath = path.relative(process.cwd(), fileName);
    const exports = checker.getExportsOfModule(moduleSymbol);

    for (const exp of exports) {
      const extracted = extractSymbol(exp, relativePath, checker);
      if (extracted) {
        const key = `${extracted.filePath}:${extracted.name}`;
        symbols.set(key, extracted);
      }
    }
  }

  return { symbols };
}

function extractSymbol(
  symbol: ts.Symbol,
  filePath: string,
  checker: ts.TypeChecker
): ExportedSymbol | null {
  const declarations = symbol.getDeclarations();
  if (!declarations || declarations.length === 0) return null;

  const decl = declarations[0];
  const name = symbol.getName();

  const kind = getSymbolKind(decl, checker);
  if (!kind) return null;

  const rawSignature = buildSignature(name, kind, decl, checker);
  const signature = normalizeSignature(rawSignature);
  return { name, kind, signature, filePath };
}

function getSymbolKind(decl: ts.Declaration, checker: ts.TypeChecker): SymbolKind | null {
  if (ts.isFunctionDeclaration(decl)) return 'function';
  if (ts.isInterfaceDeclaration(decl)) return 'interface';
  if (ts.isTypeAliasDeclaration(decl)) return 'type-alias';
  if (ts.isEnumDeclaration(decl)) return 'enum';
  if (ts.isClassDeclaration(decl)) return 'class';
  if (ts.isVariableDeclaration(decl)) {
    const type = checker.getTypeAtLocation(decl);
    if (type.getCallSignatures().length > 0) return 'function';
    return 'constant';
  }
  return null;
}

function buildSignature(
  name: string,
  kind: SymbolKind,
  decl: ts.Declaration,
  checker: ts.TypeChecker
): string {
  switch (kind) {
    case 'function':
      if (ts.isFunctionDeclaration(decl)) {
        return buildFunctionSignature(name, decl, checker);
      }
      return buildArrowFunctionSignature(name, decl as ts.VariableDeclaration, checker);
    case 'interface':
      return buildInterfaceSignature(name, decl as ts.InterfaceDeclaration, checker);
    case 'type-alias':
      return buildTypeAliasSignature(name, decl as ts.TypeAliasDeclaration, checker);
    case 'enum':
      return buildEnumSignature(name, decl as ts.EnumDeclaration);
    case 'class':
      return buildClassSignature(name, decl as ts.ClassDeclaration, checker);
    case 'constant':
      return buildConstantSignature(name, decl as ts.VariableDeclaration, checker);
  }
}

function buildFunctionSignature(
  name: string,
  decl: ts.FunctionDeclaration,
  checker: ts.TypeChecker
): string {
  const params = formatParams(decl.parameters, checker);
  const returnType = inferReturnType(decl, checker);
  return `function ${name}(${params}): ${returnType}`;
}

function buildInterfaceSignature(
  name: string,
  decl: ts.InterfaceDeclaration,
  checker: ts.TypeChecker
): string {
  const props = formatMembers(decl.members, checker);
  return `interface ${name} { ${props} }`;
}

function buildTypeAliasSignature(
  name: string,
  decl: ts.TypeAliasDeclaration,
  checker: ts.TypeChecker
): string {
  const type = checker.getTypeAtLocation(decl);
  const typeStr = checker.typeToString(type, decl, ts.TypeFormatFlags.NoTruncation);
  return `type ${name} = ${typeStr}`;
}

function buildEnumSignature(name: string, decl: ts.EnumDeclaration): string {
  const members = decl.members.map((m) =>
    ts.isIdentifier(m.name) ? m.name.text : m.name.getText()
  );
  return `enum ${name} { ${members.join(', ')} }`;
}

function buildClassSignature(
  name: string,
  decl: ts.ClassDeclaration,
  checker: ts.TypeChecker
): string {
  const props = formatMembers(decl.members, checker);
  return `class ${name} { ${props} }`;
}

function buildArrowFunctionSignature(
  name: string,
  decl: ts.VariableDeclaration,
  checker: ts.TypeChecker
): string {
  const type = checker.getTypeAtLocation(decl);
  const sig = type.getCallSignatures()[0];
  if (!sig) return `function ${name}(): void`;

  const params = sig
    .getParameters()
    .map((p) => {
      const paramType = checker.getTypeOfSymbolAtLocation(p, decl);
      const optional = p.flags & ts.SymbolFlags.Optional ? '?' : '';
      return `${p.getName()}${optional}: ${checker.typeToString(paramType)}`;
    })
    .join(', ');

  const returnType = checker.typeToString(checker.getReturnTypeOfSignature(sig));
  return `function ${name}(${params}): ${returnType}`;
}

function buildConstantSignature(
  name: string,
  decl: ts.VariableDeclaration,
  checker: ts.TypeChecker
): string {
  const type = checker.getTypeAtLocation(decl);
  return `const ${name}: ${checker.typeToString(type)}`;
}

function formatParams(
  parameters: ts.NodeArray<ts.ParameterDeclaration>,
  checker: ts.TypeChecker
): string {
  return parameters
    .map((param) => {
      const name = param.name.getText();
      const type = checker.typeToString(checker.getTypeAtLocation(param));
      const optional = param.questionToken || param.initializer ? '?' : '';
      return `${name}${optional}: ${type}`;
    })
    .join(', ');
}

function formatMembers(
  members: ts.NodeArray<ts.TypeElement | ts.ClassElement>,
  checker: ts.TypeChecker
): string {
  const parts: string[] = [];

  for (const member of members) {
    if (ts.isPropertySignature(member) || ts.isPropertyDeclaration(member)) {
      const name = member.name?.getText() ?? '';
      let type = checker.typeToString(checker.getTypeAtLocation(member));
      const optional = member.questionToken ? '?' : '';
      if (optional && type.endsWith(' | undefined')) {
        type = type.slice(0, -' | undefined'.length);
      }
      parts.push(`${name}${optional}: ${type}`);
    } else if (ts.isMethodSignature(member) || ts.isMethodDeclaration(member)) {
      const name = member.name?.getText() ?? '';
      const sig = checker.getSignatureFromDeclaration(member);
      const type = sig ? checker.signatureToString(sig) : '(...args: any[]) => any';
      parts.push(`${name}: ${type}`);
    }
  }

  return parts.join(', ');
}

function inferReturnType(decl: ts.FunctionDeclaration, checker: ts.TypeChecker): string {
  const sig = checker.getSignatureFromDeclaration(decl);
  if (!sig) return 'void';
  return checker.typeToString(checker.getReturnTypeOfSignature(sig));
}

/**
 * Normalize signatures to prevent false positives from cosmetic differences
 * between TS versions or source formatting (whitespace, semicolons, index signatures).
 */
function normalizeSignature(sig: string): string {
  let result = sig;
  result = result.replace(/\s+/g, ' ');
  result = result.replace(/;\s*}/g, ' }');
  result = result.replace(/;\s+(?=\w)/g, ', ');
  result = result.replace(
    /\{\s*\[\w+:\s*string\]:\s*([^}]+)\}/g,
    (_, valueType) => `Record<string, ${valueType.trim()}>`
  );
  result = result.replace(/\s+/g, ' ').trim();
  return result;
}
