import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReactDOM from 'react-dom/client';

// Mocke createRoot avant l'import de main.tsx pour capter l'appel de bootstrap.
vi.mock('react-dom/client', () => {
  const render = vi.fn();
  const createRoot = vi.fn(() => ({ render }));
  return { createRoot, default: { createRoot, render } };
});

vi.mock('./App', () => ({
  default: () => <div data-testid="app-mock" />,
}));

describe('main.tsx (bootstrap)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Nettoie le DOM entre les tests
    document.body.innerHTML = '';
    document.getElementById('root')?.remove();
  });

  it('monte App dans le conteneur #root', async () => {
    const root = document.createElement('div');
    root.id = 'root';
    document.body.appendChild(root);

    // main.tsx s'exécute à l'import : il faut charger le DOM avant.
    await import('./main');

    expect(ReactDOM.createRoot).toHaveBeenCalledWith(root);

    const rootMock = vi.mocked(ReactDOM.createRoot).mock.results[0]?.value as {
      render: ReturnType<typeof vi.fn>;
    };
    expect(rootMock.render).toHaveBeenCalledTimes(1);
  });
});
