export type UserID = string;

export type Role = 'admin' | 'user' | 'guest';

export enum Status {
  Active = 'active',
  Inactive = 'inactive'
}

export const API_VERSION = '1.0.0';

export class UserService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async findById(id: string): Promise<{ id: string; name: string } | null> {
    throw new Error('not implemented');
  }
}
