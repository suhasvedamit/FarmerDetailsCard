/**
 * Navigation helpers and routing types for Card Studio (cardstudio.vedamit.com).
 * Uses clean pathname routes (/, /farmer, /pvc-makers, /terms, etc.) while
 * remaining backward-compatible with ?page=... query parameters and #hash fragments.
 */

export type AppPage =
  | 'home'
  | 'create-card'
  | 'pvc-makers'
  | 'verify'
  | 'terms'
  | 'privacy'
  | 'contact'
  | 'disclaimer';

const PAGE_PATHS: Record<AppPage, string> = {
  home: '/',
  'create-card': '/farmer',
  'pvc-makers': '/pvc-makers',
  verify: '/verify',
  terms: '/terms',
  privacy: '/privacy',
  contact: '/contact',
  disclaimer: '/disclaimer',
};

function resolvePageCandidate(rawCandidate: string | null | undefined): AppPage | null {
  const candidate = (rawCandidate || '')
    .toLowerCase()
    .replace(/^#+/, '')
    .replace(/^\/+|\/+$/g, '')
    .trim();

  if (!candidate) return null;

  if (
    candidate === 'farmer' ||
    candidate === 'farmer-card' ||
    candidate === 'farmer-id' ||
    candidate === 'create-card' ||
    candidate === 'create' ||
    candidate === 'card-maker' ||
    candidate === 'maker' ||
    candidate === 'generator' ||
    candidate === 'app' ||
    candidate === 'product'
  ) {
    return 'create-card';
  }
  if (
    candidate === 'pvc-makers' ||
    candidate === 'order-pvc' ||
    candidate === 'pvc' ||
    candidate === 'pvc-agents' ||
    candidate === 'agents'
  ) {
    return 'pvc-makers';
  }
  if (candidate === 'terms' || candidate === 'terms-and-conditions' || candidate === 'terms-of-service') {
    return 'terms';
  }
  if (candidate === 'privacy' || candidate === 'privacy-policy') {
    return 'privacy';
  }
  if (candidate === 'contact' || candidate === 'contact-us' || candidate === 'support') {
    return 'contact';
  }
  if (candidate === 'disclaimer' || candidate === 'legal' || candidate === 'legal-disclaimer') {
    return 'disclaimer';
  }
  if (candidate === 'verify') {
    return 'verify';
  }
  if (candidate === 'home') {
    return 'home';
  }

  return null;
}

/**
 * Determines the current active page from URL query params, hash fragments, or pathname.
 */
export function getPageFromUrl(): AppPage {
  if (typeof window === 'undefined') return 'home';

  try {
    const params = new URLSearchParams(window.location.search);

    // QR Verification fallback checks take priority so scanned links always verify
    if (params.has('verify') || params.has('data') || params.has('farmer_id') || params.has('id')) {
      return 'verify';
    }

    const fromQuery = resolvePageCandidate(params.get('page'));
    if (fromQuery) return fromQuery;

    const fromHash = resolvePageCandidate(window.location.hash);
    if (fromHash) return fromHash;

    const fromPath = resolvePageCandidate(window.location.pathname);
    if (fromPath) return fromPath;
  } catch (e) {
    console.warn('[Navigation] Error reading page from URL:', e);
  }

  return 'home';
}

/**
 * Generates the clean URL path for a given target page.
 */
export function getPageUrl(page: AppPage): string {
  const targetPath = PAGE_PATHS[page] || '/';

  if (typeof window === 'undefined') {
    return targetPath;
  }

  try {
    if (page === 'verify') {
      const url = new URL(window.location.href);
      url.pathname = targetPath;
      url.searchParams.delete('page');
      url.hash = '';
      return url.pathname + url.search;
    }

    return targetPath;
  } catch {
    return targetPath;
  }
}

/**
 * Programmatically navigates to a page.
 * If inNewTab is true, opens in a new browser tab.
 * Otherwise uses history.pushState and emits a popstate event for instant SPA transition.
 */
export function navigateToPage(page: AppPage, inNewTab: boolean = false): void {
  if (typeof window === 'undefined') return;

  const url = getPageUrl(page);

  if (inNewTab) {
    window.open(url, '_blank', 'noopener,noreferrer');
  } else {
    window.history.pushState({}, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
