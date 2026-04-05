export type SigdiffError =
  | { code: 'INVALID_REF'; message: string }
  | { code: 'NO_TAGS'; message: string }
  | { code: 'NO_TYPESCRIPT'; message: string }
  | { code: 'PARSE_ERROR'; message: string }
  | { code: 'NOT_GIT_REPO'; message: string };

export class SigdiffException extends Error {
  constructor(public readonly error: SigdiffError) {
    super(error.message);
    this.name = 'SigdiffException';
  }
}
