const SLUG = 'rehearsal-sightline';
const TOKEN_KEY = `sb_license:${SLUG}`;
const VERDICT_KEY = `sb_license_verdict:${SLUG}`;
const VERIFY_URL = `https://api.sociobot.in/api/v1/products/${SLUG}/verify`;
export const checkoutUrl = `https://api.sociobot.in/api/v1/products/${SLUG}/checkout`;

type Verdict = { valid: boolean; checkedAt: number; reason?: string };

function readVerdict(): Verdict | null {
  try {
    return JSON.parse(localStorage.getItem(VERDICT_KEY) || 'null') as Verdict | null;
  } catch {
    return null;
  }
}

export function captureLicenseFromUrl(): boolean {
  const url = new URL(location.href);
  const token = url.searchParams.get('license');
  if (!token) return false;
  localStorage.setItem(TOKEN_KEY, token.trim());
  localStorage.removeItem(VERDICT_KEY);
  url.searchParams.delete('license');
  history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  return true;
}

export function cachedUnlock(): boolean {
  return Boolean(localStorage.getItem(TOKEN_KEY)) && readVerdict()?.valid === true;
}

export function hasLicenseToken(): boolean {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}

export function storeLicense(token: string): void {
  localStorage.setItem(TOKEN_KEY, token.trim());
  localStorage.removeItem(VERDICT_KEY);
}

export async function verifyLicense(force = false): Promise<{ valid: boolean; message: string }> {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return { valid: false, message: 'Paste the license from your receipt to restore your unlock.' };
  const cached = readVerdict();
  if (!force && cached && Date.now() - cached.checkedAt < 86_400_000) {
    return { valid: cached.valid, message: cached.valid ? 'Studio unlock active.' : 'License no longer active.' };
  }
  try {
    const response = await fetch(`${VERIFY_URL}?license=${encodeURIComponent(token)}`);
    if (!response.ok) throw new Error('verify unavailable');
    const result = await response.json() as { valid: boolean; reason?: string };
    localStorage.setItem(VERDICT_KEY, JSON.stringify({ valid: result.valid, reason: result.reason, checkedAt: Date.now() }));
    return { valid: result.valid, message: result.valid ? 'Studio unlock active.' : 'License no longer active. You can purchase again or restore another license.' };
  } catch {
    return { valid: cached?.valid === true, message: cached?.valid ? 'Studio unlock active; verification will retry when you are online.' : 'Could not verify while offline. Your free workspace is still available.' };
  }
}
