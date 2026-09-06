import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StrictMode } from 'react';
import SirvoyBookingWidget from './SirvoyBookingWidget';
import { LanguageProvider } from '@/i18n/LanguageContext';

const findScript = () => document.querySelector<HTMLScriptElement>('script[data-form-id]')!;
function ready(script = findScript()) {
  const callback = (window as unknown as Record<string, (event: unknown) => void>)[script.dataset.callback!];
  act(() => callback({ event: 'page_search', form_id: script.dataset.formId }));
}

describe('Sirvoy booking loading state', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => { cleanup(); vi.useRealTimers(); });

  it('waits for the real form instead of declaring success after 600 ms', () => {
    render(<SirvoyBookingWidget />);
    act(() => vi.advanceTimersByTime(600));
    expect(screen.getByRole('status')).toHaveTextContent('Laddar bokningen');
    ready();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(15000));
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('retries without reloading the page or keeping the old widget', () => {
    render(<StrictMode><SirvoyBookingWidget /></StrictMode>);
    expect(document.querySelectorAll('script[data-form-id]')).toHaveLength(1);
    const first = findScript();
    fireEvent.error(first);
    fireEvent.click(screen.getByRole('button', { name: 'Försök igen' }));
    expect(findScript()).not.toBe(first);
    expect(screen.getByRole('status')).toBeInTheDocument();
    ready();
    expect(screen.queryByText('Bokningen kunde inte laddas')).not.toBeInTheDocument();
  });

  it('keeps the form available during a slow load and recovers on a late event', () => {
    render(<LanguageProvider value="de"><SirvoyBookingWidget /></LanguageProvider>);
    const script = findScript();
    expect(script.dataset.lang).toBe('de');
    act(() => vi.advanceTimersByTime(15000));
    expect(screen.getByRole('button', { name: 'Erneut versuchen' })).toBeInTheDocument();
    expect(script).toBeInTheDocument();
    ready(script);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
