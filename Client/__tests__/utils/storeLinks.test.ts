import { normalizeWebsite, storeLink } from '@/utils/storeLinks';
import type { Retailer, Store } from '@/types';

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

describe('storeLink', () => {
  const retailer = (overrides: Partial<Retailer> = {}): Retailer => ({
    key: 'tesco',
    name: 'Tesco',
    homepage: 'https://www.tesco.com',
    searchUrl: 'https://www.tesco.com/groceries/en-GB/search?query={query}',
    retired: false,
    ...overrides,
  });
  const store = (overrides: Partial<Store> = {}): Store => ({
    OHID: 7, name: 'Big Tesco', householdId: 5, createdAt: '', retailerKey: null, website: null, ...overrides,
  });
  const asda = retailer({
    key: 'asda', name: 'Asda', homepage: 'https://www.asda.com', searchUrl: 'https://groceries.asda.com/search/{query}',
  });
  const coop = retailer({ key: 'coop', name: 'Co-op', homepage: 'https://www.coop.co.uk', searchUrl: null });
  const retailers = [retailer(), asda, coop];

  it("searches the retailer for the item's name", () => {
    expect(storeLink(store({ retailerKey: 'tesco' }), retailers, 'Milk')).toEqual({
      url: 'https://www.tesco.com/groceries/en-GB/search?query=Milk', isSearch: true,
    });
  });

  it.each([
    ['Semi-skimmed milk 2L', 'Semi-skimmed%20milk%202L'],
    ['  Fish & chips ', 'Fish%20%26%20chips'],
    ['50% off? #deal', '50%25%20off%3F%20%23deal'],
    ['Café crème', 'Caf%C3%A9%20cr%C3%A8me'],
    ['M&S food/drink = £5', 'M%26S%20food%2Fdrink%20%3D%20%C2%A35'],
  ])('URL-encodes %p, and nothing but the name, in place of {query}', (name, encoded) => {
    expect(storeLink(store({ retailerKey: 'tesco' }), retailers, name)?.url)
      .toBe(`https://www.tesco.com/groceries/en-GB/search?query=${encoded}`);
    // A search address that takes the name in its path cannot be broken out of either
    expect(storeLink(store({ retailerKey: 'asda' }), retailers, name)?.url)
      .toBe(`https://groceries.asda.com/search/${encoded}`);
  });

  it("opens the retailer's homepage when it cannot search, or there is no item", () => {
    expect(storeLink(store({ retailerKey: 'coop' }), retailers, 'Milk'))
      .toEqual({ url: 'https://www.coop.co.uk', isSearch: false });
    expect(storeLink(store({ retailerKey: 'tesco' }), retailers))
      .toEqual({ url: 'https://www.tesco.com', isSearch: false });
    expect(storeLink(store({ retailerKey: 'tesco' }), retailers, '   ')?.url).toBe('https://www.tesco.com');
  });

  it("opens a store's own website, even with an item", () => {
    const market = store({ website: 'https://market.example/fruit' });
    expect(storeLink(market, retailers, 'Apples')).toEqual({ url: 'https://market.example/fruit', isSearch: false });
  });

  it('has no link for a store with none, or a retired or unknown retailer', () => {
    expect(storeLink(store(), retailers, 'Milk')).toBeNull();
    expect(storeLink(store({ retailerKey: 'tesco' }), [retailer({ retired: true })], 'Milk')).toBeNull();
    expect(storeLink(store({ retailerKey: 'gone' }), retailers, 'Milk')).toBeNull();
  });
});
