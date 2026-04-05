import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { AstlogException } from './errors';
import { extract } from './extract';
import { ApiSurface, ExportedSymbol } from './types';

export function assertGitRepo(): void {
  try {
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
  } catch {
    throw new AstlogException({
      code: 'NOT_GIT_REPO',
      message: 'Not a git repository. Run astlog from inside a git repo.'
    });
  }
}

export function resolveRefs(rangeArg?: string): {
  before: string;
  after: string;
} {
  if (rangeArg) {
    const parts = rangeArg.split('..');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new AstlogException({
        code: 'INVALID_REF',
        message: `Invalid range format: "${rangeArg}". Expected format: <ref>..<ref>`
      });
    }
    validateRef(parts[0]);
    validateRef(parts[1]);
    return { before: parts[0], after: parts[1] };
  }

  let lastTag: string;
  try {
    lastTag = execSync('git describe --tags --abbrev=0', {
      encoding: 'utf-8'
    }).trim();
  } catch {
    throw new AstlogException({
      code: 'NO_TAGS',
      message: 'No git tags found. Provide an explicit range: astlog <ref>..<ref>'
    });
  }

  return { before: lastTag, after: 'HEAD' };
}

export function extractAtRef(ref: string, entrypoint?: string): ApiSurface {
  const files = discoverFiles(ref, entrypoint);

  if (files.length === 0) {
    throw new AstlogException({
      code: 'NO_TYPESCRIPT',
      message: `No TypeScript files found at ref "${ref}".`
    });
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'astlog-'));

  try {
    const pathMap = new Map<string, string>();

    for (const logicalPath of files) {
      const content = execSync(`git show '${ref}:${logicalPath}'`, {
        encoding: 'utf-8'
      });

      const tempAbsPath = path.join(tmpDir, logicalPath);
      fs.mkdirSync(path.dirname(tempAbsPath), { recursive: true });
      fs.writeFileSync(tempAbsPath, content);

      const tempRelative = path.relative(process.cwd(), tempAbsPath);
      pathMap.set(tempRelative, logicalPath);
    }

    const tempPaths = files.map((f) => path.join(tmpDir, f));
    const rawSurface = extract(tempPaths);
    return normalizeSurface(rawSurface, pathMap);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

function validateRef(ref: string): void {
  try {
    execSync(`git rev-parse --verify ${ref}`, { stdio: 'ignore' });
  } catch {
    throw new AstlogException({
      code: 'INVALID_REF',
      message: `Git ref "${ref}" does not exist.`
    });
  }
}

function discoverFiles(ref: string, entrypoint?: string): string[] {
  const output = execSync(`git ls-tree -r --name-only ${ref}`, {
    encoding: 'utf-8'
  });

  const allFiles = output.trim().split('\n').filter(Boolean);

  let tsFiles = allFiles.filter(
    (f) =>
      (f.endsWith('.ts') || f.endsWith('.tsx')) &&
      !f.endsWith('.d.ts') &&
      !f.includes('node_modules/')
  );

  if (entrypoint) {
    tsFiles = tsFiles.filter((f) => f === entrypoint);
  }

  return tsFiles;
}

function normalizeSurface(surface: ApiSurface, pathMap: Map<string, string>): ApiSurface {
  const normalized = new Map<string, ExportedSymbol>();

  for (const [, symbol] of surface.symbols) {
    const logicalPath = pathMap.get(symbol.filePath);
    if (!logicalPath) continue;

    const newSymbol = { ...symbol, filePath: logicalPath };
    const key = `${logicalPath}:${newSymbol.name}`;
    normalized.set(key, newSymbol);
  }

  return { symbols: normalized };
}
