export interface User {
  id: string;
  name: string;
  email: string;
}

export function createUser(name: string, email: string): Promise<User> {
  throw new Error('not implemented');
}

export function getUser(id: string): Promise<User> {
  throw new Error('not implemented');
}

export function fetchLegacyData(): Promise<unknown> {
  throw new Error('not implemented');
}

export const API_VERSION = '1.0.0';

export enum Status {
  Active = 'active',
  Inactive = 'inactive'
}
