import { apiErrorMessage } from '@/lib/apiError';

describe('apiErrorMessage', () => {
  it("returns the API detail when it's a string", () => {
    const error = { response: { data: { detail: 'Cette idée est déjà réservée.' } } };
    expect(apiErrorMessage(error)).toBe('Cette idée est déjà réservée.');
  });

  it('falls back to the API message field', () => {
    expect(apiErrorMessage({ response: { data: { message: 'Oups' } } })).toBe('Oups');
  });

  it('uses the fallback for validation arrays and network errors', () => {
    const validation = { response: { data: { detail: [{ msg: 'field required' }] } } };
    expect(apiErrorMessage(validation, 'Échec')).toBe('Échec');
    expect(apiErrorMessage(new Error('Network Error'))).toBe('Une erreur est survenue. Réessaie.');
    expect(apiErrorMessage(null)).toBe('Une erreur est survenue. Réessaie.');
  });

  it('falls back when detail or message is empty or whitespace-only', () => {
    expect(apiErrorMessage({ response: { data: { detail: '' } } })).toBe('Une erreur est survenue. Réessaie.');
    expect(apiErrorMessage({ response: { data: { detail: '   ' } } })).toBe('Une erreur est survenue. Réessaie.');
    expect(apiErrorMessage({ response: { data: { message: '' } } })).toBe('Une erreur est survenue. Réessaie.');
    expect(apiErrorMessage({ response: { data: { message: '  \n\t' } } })).toBe('Une erreur est survenue. Réessaie.');
  });
});
