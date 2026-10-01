import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import ExternalEmbedGate from './ExternalEmbedGate';
afterEach(cleanup);
describe('third-party embeds', () => {
  it('mounts a remote iframe only after the informed click', () => {
    const { container } = render(<ExternalEmbedGate service="Google Maps"><iframe src="https://maps.google.com" title="Karta" /></ExternalEmbedGate>);
    expect(container.querySelector('iframe')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Visa innehåll från Google Maps' }));
    expect(container.querySelector('iframe')).not.toBeNull();
  });
});
