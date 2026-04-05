export interface User {
  id: string;
  name: string;
  email: string;
  age?: number;
}

export interface CreateUserOpts {
  name: string;
  email: string;
  role?: 'admin' | 'user';
}

export type UserID = string;

export enum Status {
  Active = 'active',
  Inactive = 'inactive',
  Banned = 'banned'
}

export function createUser(opts: CreateUserOpts): Promise<User> {
  throw new Error('not implemented');
}

export function getUser(id: UserID): Promise<User | null> {
  throw new Error('not implemented');
}

export function deleteUser(id: string): Promise<void> {
  throw new Error('not implemented');
}

export const API_VERSION = '1.0.0';

export class UserService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async findById(id: string): Promise<User | null> {
    throw new Error('not implemented');
  }
}
