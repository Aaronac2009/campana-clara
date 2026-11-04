import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImageStudio } from '@/components/app/ImageStudio';
import { StoreProvider, KEY, seed } from '@/lib/store';

vi.mock('@/lib/image-studio', async importOriginal => {
  const original = await importOriginal<typeof import('@/lib/image-studio')>();
  return {
    ...original,
    importLocalImage: vi.fn(async () => ({ image: { naturalWidth: 100, naturalHeight: 100 }, name: 'local.png', mime: 'image/png', url: 'blob:test' })),
    renderEdit: vi.fn(() => document.createElement('canvas')),
    exportCanvas: vi.fn(async () => new Blob(['png'], { type: 'image/png' })),
  };
});

describe('studio action regression', () => {
  it('imports and prepares export from real UI events without calling hooks inside handlers', async () => {
    localStorage.setItem(KEY, JSON.stringify({ ...seed(), prefs: { ...seed().prefs, lang: 'en' } }));
    const { container } = render(<StoreProvider><ImageStudio /></StoreProvider>);
    const input = container.querySelector('input[type=file]');
    if (!input) throw new Error('missing file input');
    fireEvent.change(input, { target: { files: [new File(['png'], 'local.png', { type: 'image/png' })] } });
    await screen.findByRole('img', { name: 'Edited image' });
    fireEvent.click(screen.getByRole('button', { name: 'Prepare export' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Download PNG' })).toBeTruthy());
  });
});