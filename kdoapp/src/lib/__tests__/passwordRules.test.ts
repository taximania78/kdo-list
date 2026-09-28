import { PASSWORD_MESSAGES, passwordChecks, strongPassword } from '@/lib/passwordRules';

describe('passwordChecks', () => {
  it('lists which rules are met', () => {
    expect(passwordChecks('abc').map((r) => r.met)).toEqual([false, false, false, false]);
    expect(passwordChecks('Abcdefg1!').map((r) => r.met)).toEqual([true, true, true, true]);
    expect(passwordChecks('Abcdefgh').map((r) => r.met)).toEqual([true, true, false, false]);
  });
});

describe('strongPassword', () => {
  it('accepts a strong password', () => {
    expect(strongPassword.safeParse('Noël2026!').success).toBe(true);
  });

  it('explains every missing rule with the existing messages', () => {
    const result = strongPassword.safeParse('weak');
    expect(result.success).toBe(false);
    const messages = result.success ? [] : result.error.issues.map((i) => i.message);
    expect(messages).toEqual(
      expect.arrayContaining([PASSWORD_MESSAGES.minLength, PASSWORD_MESSAGES.uppercase, PASSWORD_MESSAGES.number, PASSWORD_MESSAGES.special])
    );
    expect(PASSWORD_MESSAGES.minLength).toBe('Le mot de passe doit contenir au moins 8 caractères.');
  });
});
