import { FarmerRecord } from '../types';
import { savePaymentRecord } from './supabase';

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

export interface CardPaymentRecord {
  cardKey: string;
  farmerId: string;
  farmerName: string;
  paymentId: string;
  amount: number;
  currency: string;
  paidAt: string;
}

export interface CheckoutOptions {
  record: FarmerRecord;
  amountInr?: number;
  onSuccess: (response: RazorpaySuccessResponse, paymentRecord: CardPaymentRecord) => void;
  onFailure?: (error: any) => void;
  onDismiss?: () => void;
}

const DEFAULT_CARD_PRICE_INR = 10;

// In-memory runtime store only — zero localStorage, zero sessionStorage, zero disk cache.
// Details remain strictly in memory during the active session and are never persisted to client storage.
const inMemoryPaidCards = new Map<string, CardPaymentRecord>();

// Clear any stale payment details that may have been saved previously in browser storage
if (typeof window !== 'undefined') {
  try {
    window.localStorage?.removeItem('cardstudio_paid_cards_v1');
    window.localStorage?.removeItem('cardstudio_paid_cards');
    window.sessionStorage?.removeItem('cardstudio_paid_cards_v1');
    window.sessionStorage?.removeItem('cardstudio_paid_cards');
  } catch {
    // ignore storage cleanup errors
  }
}

/**
 * Returns the configured Razorpay Key ID (trimmed of any accidental spaces).
 */
export function getRazorpayKeyId(): string {
  const win = typeof window !== 'undefined' ? (window as any) : {};
  const envKey =
    win.__ENV__?.VITE_RAZORPAY_KEY_ID ||
    win.VITE_RAZORPAY_KEY_ID ||
    import.meta.env.VITE_RAZORPAY_KEY_ID ||
    'rzp_test_TzdhcrzOfZcV5p';
  return String(envKey).trim();
}

/**
 * Returns the card download price in INR (e.g. 10).
 */
export function getCardDownloadPriceInr(): number {
  const envPrice = import.meta.env.VITE_CARD_DOWNLOAD_PRICE_INR;
  if (envPrice) {
    const parsed = Number(envPrice);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return DEFAULT_CARD_PRICE_INR;
}

/**
 * Generates a unique, stable key for a given card record to track payment state in memory.
 */
export function getCardPaymentKey(record: FarmerRecord | null | undefined): string {
  if (!record) return 'card_unknown';

  const fId = (record.farmer_id || '').trim();
  if (fId) return `farmer_${fId}`;

  const enroll = (record.enrollment_no || '').trim();
  if (enroll) return `enroll_${enroll}`;

  const name = (record.farmer_name || '').trim().toLowerCase().replace(/\s+/g, '_');
  if (name) return `card_${name}`;

  return 'card_default';
}

/**
 * Retrieves the in-memory map of paid cards.
 */
export function getPaidCards(): Record<string, CardPaymentRecord> {
  const result: Record<string, CardPaymentRecord> = {};
  inMemoryPaidCards.forEach((val, key) => {
    result[key] = val;
  });
  return result;
}

/**
 * Checks whether the specified card has been paid for and unlocked (in-memory only).
 */
export function isCardPaid(record: FarmerRecord | null | undefined): boolean {
  if (!record) return false;
  const key = getCardPaymentKey(record);
  return inMemoryPaidCards.has(key);
}

/**
 * Retrieves the payment record for the specified card, if available in memory.
 */
export function getCardPaymentRecord(
  record: FarmerRecord | null | undefined
): CardPaymentRecord | null {
  if (!record) return null;
  const key = getCardPaymentKey(record);
  return inMemoryPaidCards.get(key) || null;
}

/**
 * Records a successful payment in volatile runtime memory only (no localStorage or browser cache).
 */
export function saveCardPayment(
  record: FarmerRecord,
  paymentResponse: RazorpaySuccessResponse,
  amountInr: number
): CardPaymentRecord {
  const cardKey = getCardPaymentKey(record);
  const paymentRecord: CardPaymentRecord = {
    cardKey,
    farmerId: record.farmer_id || '',
    farmerName: record.farmer_name || '',
    paymentId: paymentResponse.razorpay_payment_id,
    amount: amountInr,
    currency: 'INR',
    paidAt: new Date().toISOString(),
  };

  // Store strictly in runtime memory — never in localStorage or browser cache
  inMemoryPaidCards.set(cardKey, paymentRecord);

  // Non-blocking sync to Supabase (guaranteed never to throw or interrupt user if network/url/table fails)
  try {
    savePaymentRecord(
      record,
      paymentResponse.razorpay_payment_id,
      amountInr,
      'INR',
      paymentResponse.razorpay_order_id || '',
      paymentResponse.razorpay_signature || ''
    ).catch((err) => {
      console.warn('[Payment] Non-fatal background sync warning:', err);
    });
  } catch (syncErr) {
    console.warn('[Payment] Non-fatal background sync trigger error:', syncErr);
  }

  return paymentRecord;
}

let razorpayScriptPromise: Promise<boolean> | null = null;

/**
 * Dynamically loads the Razorpay checkout.js script with strict timeout and retry support.
 * Guaranteed never to hang indefinitely.
 */
export function loadRazorpayScript(timeoutMs = 8000): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if ((window as any).Razorpay) return Promise.resolve(true);
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise<boolean>((resolve) => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let settled = false;

    const finish = (result: boolean) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      if (!result) {
        // Reset promise on failure so next click can retry loading
        razorpayScriptPromise = null;
      }
      resolve(result);
    };

    // Hard timeout so loading never hangs the button indefinitely
    timer = setTimeout(() => {
      console.warn('[Razorpay] Script loading timed out after', timeoutMs, 'ms');
      finish(Boolean((window as any).Razorpay));
    }, timeoutMs);

    const existing = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    ) as HTMLScriptElement | null;

    if (existing) {
      if ((window as any).Razorpay) {
        finish(true);
        return;
      }
      // If an existing tag was in DOM but failed or hasn't loaded Razorpay, remove it to retry cleanly
      try {
        existing.remove();
      } catch {
        // ignore removal error
      }
    }

    try {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        if ((window as any).Razorpay) {
          finish(true);
        } else {
          // In rare cases script loaded but Razorpay wasn't defined yet
          setTimeout(() => finish(Boolean((window as any).Razorpay)), 100);
        }
      };
      script.onerror = (err) => {
        console.error('[Razorpay] Script failed to load from checkout.razorpay.com:', err);
        finish(false);
      };
      document.head.appendChild(script);
    } catch (err) {
      console.error('[Razorpay] Error appending checkout script tag:', err);
      finish(false);
    }
  });

  return razorpayScriptPromise;
}

/**
 * Opens Razorpay Standard Web Checkout modal to unlock the card.
 */
export async function openRazorpayCheckout({
  record,
  amountInr = getCardDownloadPriceInr(),
  onSuccess,
  onFailure,
  onDismiss,
}: CheckoutOptions): Promise<boolean> {
  try {
    const isLoaded = await loadRazorpayScript(8000);
    if (!isLoaded || !(window as any).Razorpay) {
      const errMsg =
        'Payment service could not be loaded. Please check your internet connection or ad-blocker and try again.';
      console.error('[Payment]', errMsg);
      onFailure?.(new Error(errMsg));
      return false;
    }

    const key = getRazorpayKeyId();
    if (!key) {
      const errMsg = 'Payment gateway is not configured.';
      console.error('[Payment]', errMsg);
      onFailure?.(new Error(errMsg));
      return false;
    }

    const amountInPaise = Math.round(amountInr * 100);

    const options = {
      key,
      amount: amountInPaise,
      currency: 'INR',
      name: 'Card Studio',
      description: `Farmer ID Card Download — ${record.farmer_name || 'AgriStack Card'}`,
      image: `${window.location.origin}/logo.png`,
      handler: function (response: RazorpaySuccessResponse) {
        try {
          const paymentRecord = saveCardPayment(record, response, amountInr);
          onSuccess(response, paymentRecord);
        } catch (err) {
          console.error('[Razorpay] Error in payment handler callback:', err);
          onSuccess(response, {
            cardKey: getCardPaymentKey(record),
            farmerId: record.farmer_id || '',
            farmerName: record.farmer_name || '',
            paymentId: response.razorpay_payment_id,
            amount: amountInr,
            currency: 'INR',
            paidAt: new Date().toISOString(),
          });
        }
      },
      prefill: {},
      notes: {
        farmer_id: record.farmer_id || '',
        enrollment_no: record.enrollment_no || '',
      },
      theme: {
        color: '#047857', // Emerald 700 to match webapp branding
      },
      modal: {
        confirm_close: true,
        ondismiss: function () {
          onDismiss?.();
        },
      },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.on('payment.failed', function (resp: any) {
      const errDetail =
        resp?.error?.description ||
        resp?.error?.reason ||
        resp?.error?.message ||
        'Payment was declined or cancelled.';
      console.error('[Razorpay] Payment failed:', resp?.error);
      onFailure?.(new Error(errDetail));
    });
    rzp.open();
    return true;
  } catch (err: any) {
    console.error('[Razorpay] Failed to open checkout modal:', err);
    const errObj =
      err instanceof Error
        ? err
        : new Error(String(err?.message || err || 'Failed to initialize payment'));
    onFailure?.(errObj);
    return false;
  }
}

