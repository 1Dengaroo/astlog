export function greet(name: string): string {
  return `Hello ${name}`;
}

export function add(a: number, b: number): number {
  return a + b;
}

export async function fetchUser(id: string): Promise<{ name: string }> {
  throw new Error('not implemented');
}

export const multiply = (a: number, b: number): number => a * b;
