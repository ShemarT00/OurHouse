// Store links: a store's own website, typed by a member.
// The rules match the server's in Server/stores/StoreControllers.py (_website).

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
