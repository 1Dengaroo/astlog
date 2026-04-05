export interface User {
  id: string;
  name: string;
  email: string;
  age?: number;
}

export interface Config {
  host: string;
  port: number;
}
