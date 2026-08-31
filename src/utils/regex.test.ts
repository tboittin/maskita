import { describe, it, expect, beforeEach } from 'vitest';
import { REGLES } from './regex';

describe('Règles regex', () => {
  beforeEach(() => {
    // Réinitialiser lastIndex des regex globales entre les tests
    REGLES.forEach(r => r.pattern.lastIndex = 0);
  });

  it('detecte un email', () => {
    const r = REGLES.find(r => r.type === 'EMAIL')!;
    r.pattern.lastIndex = 0;
    const match = r.pattern.exec('contact@exemple.fr');
    expect(match?.[0]).toBe('contact@exemple.fr');
  });

  it('detecte un téléphone', () => {
    const r = REGLES.find(r => r.type === 'TEL')!;
    r.pattern.lastIndex = 0;
    const match = r.pattern.exec('06 12 34 56 78');
    expect(match?.[0]).toBe('06 12 34 56 78');
  });

  it('detecte un téléphone avec points', () => {
    const r = REGLES.find(r => r.type === 'TEL')!;
    r.pattern.lastIndex = 0;
    const match = r.pattern.exec('06.12.34.56.78');
    expect(match?.[0]).toBe('06.12.34.56.78');
  });

  it('detecte un ADELI', () => {
    const r = REGLES.find(r => r.type === 'ADELI')!;
    r.pattern.lastIndex = 0;
    const match = r.pattern.exec('ADELI: 123456789');
    expect(match?.[0]).toBe('123456789');
  });

  it('detecte un NIR', () => {
    const r = REGLES.find(r => r.type === 'NIR')!;
    r.pattern.lastIndex = 0;
    const match = r.pattern.exec('1 23 45 67 890 123 45');
    expect(match?.[0]).toBe('1 23 45 67 890 123 45');
  });

  it('detecte un SIRET', () => {
    const r = REGLES.find(r => r.type === 'SIRET')!;
    r.pattern.lastIndex = 0;
    const match = r.pattern.exec('12345678901234');
    expect(match?.[0]).toBe('12345678901234');
  });

  it('detecte un IBAN', () => {
    const r = REGLES.find(r => r.type === 'IBAN')!;
    r.pattern.lastIndex = 0;
    const match = r.pattern.exec('FR76 1234 5678 9012 3456 7890 123');
    expect(match?.[0]).toBe('FR76 1234 5678 9012 3456 7890 123');
  });

  it('detecte une IP', () => {
    const r = REGLES.find(r => r.type === 'IP')!;
    r.pattern.lastIndex = 0;
    const match = r.pattern.exec('192.168.1.1');
    expect(match?.[0]).toBe('192.168.1.1');
  });

  it('detecte une URL', () => {
    const r = REGLES.find(r => r.type === 'URL')!;
    r.pattern.lastIndex = 0;
    const match = r.pattern.exec('https://exemple.fr/rapport');
    expect(match?.[0]).toBe('https://exemple.fr/rapport');
  });

  it('detecte une carte bancaire', () => {
    const r = REGLES.find(r => r.type === 'CARTE_BANCAIRE')!;
    r.pattern.lastIndex = 0;
    const match = r.pattern.exec('1234 5678 9012 3456');
    expect(match?.[0]).toBe('1234 5678 9012 3456');
  });
});