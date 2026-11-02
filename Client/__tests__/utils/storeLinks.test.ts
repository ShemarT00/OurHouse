import { normalizeWebsite } from '@/utils/storeLinks';

describe('normalizeWebsite', () => {
  it.each([
    ['example.com', 'https://example.com'],
    ['  www.cornershop.co.uk/shop ', 'https://www.cornershop.co.uk/shop'],
    ['http://market.example.org', 'http://market.example.org'],
    ['HTTPS://Example.com/Path?q=1', 'https://Example.com/Path?q=1'],
    ['https://shop.example.com:8443/', 'https://shop.example.com:8443/'],
  ])('saves %p as %p', (typed, saved) => {
    expect(normalizeWebsite(typed)).toBe(saved);
  });

  it.each(['', '   '])('treats %p as no website', (typed) => {
    expect(normalizeWebsite(typed)).toBeNull();
  });

  it.each([
    'ftp://example.com',
    'javascript:alert(1)',
    'mailto:shop@example.com',
    'localhost',
    'https://',
    'https://example',
    'https://exa mple.com',
    'https://user:pw@example.com',
    'https://-bad-.com',
    'https://example.c0m',
    'https://example.com:port',
    `https://example.com/${'a'.repeat(2048)}`,
  ])('refuses %p', (typed) => {
    expect(normalizeWebsite(typed)).toBeUndefined();
  });
});
