import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TexteApercu } from './TexteApercu';

const MAPPING = { '[EMAIL]': ['test@exemple.fr'] };

describe('TexteApercu', () => {
  it('affiche le titre', () => {
    render(<TexteApercu titre="Texte test" texte="Bonjour" mapping={MAPPING} />);
    expect(screen.getByText('Texte test')).toBeInTheDocument();
  });

  it('affiche le texte', () => {
    render(<TexteApercu titre="Test" texte="Bonjour le monde" mapping={MAPPING} />);
    expect(screen.getByText('Bonjour le monde')).toBeInTheDocument();
  });

  it('surligne les tags quand surlignerTags est vrai', () => {
    const { container } = render(
      <TexteApercu
        titre="Test"
        texte="Contact : [EMAIL]"
        mapping={MAPPING}
        tagSurbrillance="[EMAIL]"
        surlignerTags
      />,
    );
    // Le tag doit être dans un span avec surbrillance
    const spans = container.querySelectorAll('span');
    const tagSpan = Array.from(spans).find(s => s.textContent === '[EMAIL]');
    expect(tagSpan).toBeDefined();
    expect(tagSpan!.style.backgroundColor).toContain('rgba');
  });

  it('surligne les valeurs quand surlignerValeurs est vrai', () => {
    const { container } = render(
      <TexteApercu
        titre="Test"
        texte="Contact : test@exemple.fr"
        mapping={MAPPING}
        tagSurbrillance="[EMAIL]"
        surlignerValeurs
      />,
    );
    const spans = container.querySelectorAll('span');
    const valSpan = Array.from(spans).find(s => s.textContent === 'test@exemple.fr');
    expect(valSpan).toBeDefined();
    expect(valSpan!.style.backgroundColor).toContain('rgba');
  });
});