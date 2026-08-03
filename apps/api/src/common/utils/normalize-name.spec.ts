import { normalizeName } from './normalize-name';

describe('normalizeName', () => {
  it('removes accents, uppercases, collapses whitespace, and trims the patient name', () => {
    expect(normalizeName('  Mária   da  Conceição  ')).toBe('MARIA DA CONCEICAO');
  });

  it('returns an empty string for a name made only of whitespace', () => {
    expect(normalizeName(' \t\n ')).toBe('');
  });
});
