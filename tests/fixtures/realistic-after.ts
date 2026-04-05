// Simulates a real-world CLI/SDK library API surface (v2)
// Breaking: removed exports, changed signatures, renamed types
// New: added exports, optional properties
// Unchanged: arrow functions kept same signature

export interface CommandOption {
  name: string;
  description: string;
  required: boolean;
  defaultValue?: unknown; // new optional property
}

export interface Command {
  name: string;
  description: string;
  options: CommandOption[];
  aliases: string[]; // new required property (breaking)
  action: (...args: any[]) => void;
}

export interface ParsedArgs {
  args: string[];
  options: Record<string, any>;
  rest: string[]; // new required property (breaking)
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'trace'; // widened union

export type EventHandler = (event: string, data: unknown) => void;

export interface ClientConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  headers: Record<string, string>;
  auth?: { token: string }; // new optional property
}

export interface RequestOptions {
  signal?: AbortSignal;
  timeout?: number;
}

export function createClient(config: ClientConfig): Client {
  throw new Error('not implemented');
}

// Changed: added required second param (breaking)
export function parseArgs(argv: string[], strict: boolean): ParsedArgs {
  throw new Error('not implemented');
}

// Changed: param type changed from boolean to options object (breaking)
export function formatOutput(
  data: unknown,
  options: { pretty?: boolean; color?: boolean }
): string {
  throw new Error('not implemented');
}

export function validateConfig(config: unknown): config is ClientConfig {
  throw new Error('not implemented');
}

// Arrow functions — same signatures, should NOT show as changed
export const removeBrackets = (v: string): string => {
  return v.replace(/[<\[\]>]/g, '');
};

export const camelcase = (input: string): string => {
  return input.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ''));
};

export const findLongest = (arr: string[]): string => {
  return arr.sort((a, b) => (a.length > b.length ? -1 : 1))[0] ?? '';
};

export const padRight = (str: string, length: number): string => {
  return str.length >= length ? str : `${str}${' '.repeat(length - str.length)}`;
};

export enum OutputFormat {
  JSON = 'json',
  Text = 'text',
  Table = 'table',
  YAML = 'yaml' // new member (breaking for exhaustive switch)
}

export class Client {
  private config: ClientConfig;

  constructor(config: ClientConfig) {
    this.config = config;
  }

  async get(path: string, options?: RequestOptions): Promise<unknown> {
    throw new Error('not implemented');
  }

  async post(path: string, body: unknown): Promise<unknown> {
    throw new Error('not implemented');
  }

  async delete(path: string): Promise<void> {
    throw new Error('not implemented');
  }

  async patch(path: string, body: unknown): Promise<unknown> {
    throw new Error('not implemented');
  }
}

export const VERSION = '2.0.0';

export const DEFAULT_TIMEOUT = 30000;

// Renamed type (breaking: old one removed, new one added)
export type RequestMiddleware = (ctx: {
  path: string;
  headers: Record<string, string>;
  method: string;
}) => void;

export function registerMiddleware(mw: RequestMiddleware): void {
  throw new Error('not implemented');
}

// fetchLegacyData removed entirely (breaking)

// processArgs renamed to runtimeArgs (breaking: old removed, new added)
export function runtimeArgs(argv: string[]): Record<string, any> {
  throw new Error('not implemented');
}

// New exports
export function createPlugin(name: string, handler: EventHandler): { name: string } {
  throw new Error('not implemented');
}

export interface Plugin {
  name: string;
  version: string;
  init: () => Promise<void>;
}
