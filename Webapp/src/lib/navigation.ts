/**
 * Navigation helpers and routing types for the Farmer ID Card web application.
 * Supports query parameters (?page=terms), hash fragments (#terms), and history pushState.
 */

export type AppPage =
  | 'home'
  | 'verify'
  | 'terms'
  | 'privacy'
  | 'contact'
  | 'disclaimer';

/**
 * Determines the current active page from the browser URL search params or hash.
 */
export function getPageFromUrl(): AppPage {
  if (typeof window === 'undefined') return 'home';

  try {
    const params = new URLSearchParams(window.location.search);
    const pageParam = params.get('page')?.toLowerCase().trim();
    const hash = window.location.hash.toLowerCase().replace('#', '').replace('/', '').trim();

    const candidate = pageParam || hash;

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

    // QR Verification fallback checks
    if (params.has('verify') || params.has('data') || params.has('farmer_id') || params.has('id')) {
      return 'verify';
    }
  } catch (e) {
    console.warn('[Navigation] Error reading page from URL:', e);
  }

  return 'home';
}

/**
 * Generates the clean URL for a given target page.
 * Keeps existing path (important for GitHub Pages sub-directories).
 */
export function getPageUrl(page: AppPage): string {
  if (typeof window === 'undefined') {
    return page === 'home' ? '/' : `?page=${page}`;
  }

  try {
    const url = new URL(window.location.href);

    if (page === 'home') {
      url.searchParams.delete('page');
      url.searchParams.delete('data');
      url.searchParams.delete('verify');
      url.searchParams.delete('farmer_id');
      url.searchParams.delete('id');
    } else {
      url.searchParams.set('page', page);
      if (page !== 'verify') {
        url.searchParams.delete('data');
        url.searchParams.delete('verify');
        url.searchParams.delete('farmer_id');
        url.searchParams.delete('id');
      }
    }

    url.hash = '';
    return url.pathname + url.search;
  } catch {
    return page === 'home' ? window.location.pathname : `?page=${page}`;
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
