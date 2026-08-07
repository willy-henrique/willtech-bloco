import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema } from '../src/schemas/auth';

describe('auth schemas', () => {
  it('validates login', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: '123456' }).success).toBe(true);
    expect(loginSchema.safeParse({ email: 'x', password: '1' }).success).toBe(false);
  });

  it('requires matching passwords on register', () => {
    const result = registerSchema.safeParse({
      email: 'a@b.com',
      password: '123456',
      confirmPassword: '654321',
      displayName: 'Willy',
    });
    expect(result.success).toBe(false);
  });
});
