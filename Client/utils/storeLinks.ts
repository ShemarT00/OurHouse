// Store links: where tapping a store goes, and a store's own website as typed by a member.
// Website rules match the server's in Server/stores/StoreControllers.py (_website).

import type { Retailer, Store } from '@/types';

export interface StoreLink {
  url: string;
  /** True when the link searches the retailer for an item, false for a homepage */
  isSearch: boolean;
}

/**
 * Where tapping a store goes. With an item name, a retailer that can search opens
 * its search for that name; otherwise the retailer's homepage or the store's own
 * website. Null when the store has no link, or its retailer is retired or unknown
 * (`retailers` holds only the ones still offered).
 */
export const storeLink = (store: Store, retailers: Retailer[], itemName?: string): StoreLink | null => {
  if (store.retailerKey !== null) {
    const retailer = retailers.find((r) => r.key === store.retailerKey && !r.retired);
    if (!retailer) return null;
    const query = itemName?.trim();
    if (query && retailer.searchUrl) {
      return { url: retailer.searchUrl.replace('{query}', encodeURIComponent(query)), isSearch: true };
    }
    return { url: retailer.homepage, isSearch: false };
  }
  return store.website ? { url: store.website, isSearch: false } : null;
};

export const WEBSITE_ERROR = 'Website must be a web address, like www.example.com';

const MAX_WEBSITE_LENGTH = 2048;
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i;
// scheme://host[:port][/path?query#fragment]; no user:password@ before the host
const WEBSITE = /^([a-z][a-z0-9+.-]*):\/\/([^/?#@:\s]+)(:\d*)?([/?#]\S*)?$/i;
const HOST_LABEL = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i;
const TOP_LEVEL_DOMAIN = /^[a-z]{2,63}$/i;

/**
 * A typed website as it will be saved: trimmed, with https:// added when no scheme is given.
 * Blank means no website (null); anything that is not http(s) with a domain is undefined.
 */
export const normalizeWebsite = (typed: string): string | null | undefined => {
  let website = typed.trim();
  if (!website) return null;
  if (!HAS_SCHEME.test(website)) website = `https://${website}`;

  const match = WEBSITE.exec(website);
  if (!match || website.length > MAX_WEBSITE_LENGTH) return undefined;
  const [, scheme, host] = match;
  const labels = host.split('.');
  if (
    !['http', 'https'].includes(scheme.toLowerCase()) ||
    labels.length < 2 ||
    !labels.every((label) => HOST_LABEL.test(label)) ||
    !TOP_LEVEL_DOMAIN.test(labels[labels.length - 1])
  ) {
    return undefined;
  }
  return scheme.toLowerCase() + website.slice(scheme.length);
};
