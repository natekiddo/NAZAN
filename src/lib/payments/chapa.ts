import crypto from 'crypto';
import { ChapaInitResponse } from './types';

const CHAPA_API_URL = 'https://api.chapa.co/v1';

export function isChapaConfigured(): boolean {
  const key = process.env.CHAPA_SECRET_KEY;
  return Boolean(key && !key.includes('placeholder') && !key.includes('your-'));
}

export async function initializeChapaCheckout({
  amount,
  currency = 'ETB',
  email,
  firstName,
  lastName,
  txRef,
  callbackUrl,
  returnUrl,
}: {
  amount: number;
  currency?: 'ETB' | 'USD';
  email: string;
  firstName: string;
  lastName: string;
  txRef: string;
  callbackUrl?: string;
  returnUrl?: string;
}): Promise<{ checkoutUrl?: string; error?: string; isTestMode?: boolean }> {
  const secretKey = process.env.CHAPA_SECRET_KEY;

  // Development sandbox simulation mode if key is not yet set in production
  if (!secretKey || secretKey.includes('placeholder') || secretKey.trim() === '') {
    console.log('[Chapa Payment Adapter] Running in Instant Developer Sandbox Mode');
    return {
      checkoutUrl: returnUrl ? `${returnUrl}?chapa_status=success&tx_ref=${txRef}` : undefined,
      isTestMode: true,
    };
  }

  try {
    const payload = {
      amount: amount.toString(),
      currency,
      email,
      first_name: firstName,
      last_name: lastName,
      tx_ref: txRef,
      callback_url: callbackUrl,
      return_url: returnUrl,
      'customization[title]': 'ProjectHub Pro Team Workspace',
      'customization[description]': 'Upgrade workspace to unlimited team members',
    };

    const res = await fetch(`${CHAPA_API_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data: ChapaInitResponse = await res.json();
    if (data.status === 'success' && data.data?.checkout_url) {
      return { checkoutUrl: data.data.checkout_url };
    }

    return { error: data.message || 'Failed to initialize Chapa checkout' };
  } catch (err: any) {
    return { error: err?.message || 'Network error connecting to Chapa payment gateway' };
  }
}

export function verifyChapaWebhookSignature(
  signature: string,
  secretKey: string,
  rawBody: string
): boolean {
  try {
    const hash = crypto
      .createHmac('sha256', secretKey)
      .update(rawBody)
      .digest('hex');
    return hash === signature;
  } catch {
    return false;
  }
}
