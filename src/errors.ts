export type AstlogError =
  | { code: 'INVALID_REF'; message: string }
  | { code: 'NO_TAGS'; message: string }
  | { code: 'NO_TYPESCRIPT'; message: string }
  | { code: 'PARSE_ERROR'; message: string }
  | { code: 'NOT_GIT_REPO'; message: string };

export class AstlogException extends Error {
  constructor(public readonly error: AstlogError) {
    super(error.message);
    this.name = 'AstlogException';
  }
}
