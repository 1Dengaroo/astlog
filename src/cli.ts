#!/usr/bin/env node

import cac from 'cac';
import { version as pkgVersion } from '../package.json';
import { SigdiffException } from './errors';
import { assertGitRepo, extractAtRef, resolveRefs } from './git';
import { diff } from './diff';
import { classify } from './classify';
import { buildResult, format } from './format';

const cli = cac('sigdiff');

cli
  .command('[range]', 'Diff the public API surface between two git refs')
  .option('--entrypoint <path>', 'Scope to a specific file')
  .option('--json', 'Output as JSON instead of markdown')
  .action((range: string | undefined, options: { entrypoint?: string; json?: boolean }) => {
    try {
      assertGitRepo();

      const refs = resolveRefs(range);
      const before = extractAtRef(refs.before, options.entrypoint);
      const after = extractAtRef(refs.after, options.entrypoint);

      const changes = diff(before, after);
      const classified = classify(changes);
      const result = buildResult(classified);
      const output = format(result, { json: options.json });

      process.stdout.write(output);
    } catch (err) {
      if (err instanceof SigdiffException) {
        process.stderr.write(`Error: ${err.error.message}\n`);
        process.exit(1);
      }
      throw err;
    }
  });

cli.help();
cli.version(pkgVersion);
cli.parse();
