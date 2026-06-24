import { describe, it, expect } from 'vitest';
import { buildWhatsappUrl } from './whatsapp';

describe('buildWhatsappUrl', () => {
  it('returns null when number is empty', () => {
    expect(buildWhatsappUrl('', 'hola')).toBeNull();
  });

  it('builds a wa.me url with encoded message', () => {
    const url = buildWhatsappUrl('593987654321', 'Hola, lo saco?');
    expect(url).toBe('https://wa.me/593987654321?text=Hola%2C%20lo%20saco%3F');
  });
});
