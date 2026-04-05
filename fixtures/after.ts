export interface User {
  id: string;
  name: string;
  email: string;
  age?: number; // new optional property
}

export interface CreateUserOpts {
  name: string;
  email: string;
  role?: 'admin' | 'user';
}

export function createUser(opts: CreateUserOpts): Promise<User> {
  throw new Error('not implemented');
}

export function getUser(id: string): Promise<User | null> {
  throw new Error('not implemented');
}

// fetchLegacyData removed

export function updateUser(id: string, patch: Partial<User>): Promise<User> {
  throw new Error('not implemented');
}

export const API_VERSION = '2.0.0';

export enum Status {
  Active = 'active',
  Inactive = 'inactive',
  Banned = 'banned'
}
