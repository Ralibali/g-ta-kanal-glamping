import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import SirvoyBookingWidget from './SirvoyBookingWidget';
afterEach(cleanup);
describe('Sirvoy data transfer activation', () => {
  it('does not insert the remote booking script until the visitor opens the form', () => {
    const { container } = render(<SirvoyBookingWidget />);
    expect(container.querySelector('script[src*="sirvoy"]')).toBeNull();
    expect(screen.getByText(/Sirvoy, som får din IP-adress/)).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Öppna bokningsformuläret' }));
    expect(container.querySelector('script[src*="sirvoy"]')).not.toBeNull();
  });
});
