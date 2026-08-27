import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cachedUnlock, captureLicenseFromUrl, storeLicense, verifyLicense } from './license';

describe('Studio license flow', () => {
  beforeEach(() => {
    localStorage.clear();
    history.replaceState({}, '', '/');
    vi.restoreAllMocks();
  });

  it('captures a returned license and strips it from the visible URL', () => {
    history.replaceState({}, '', '/?license=test-token&kept=yes');
    expect(captureLicenseFromUrl()).toBe(true);
    expect(localStorage.getItem('sb_license:rehearsal-sightline')).toBe('test-token');
    expect(location.search).toBe('?kept=yes');
  });

  it('verifies and caches a valid license verdict', async () => {
    storeLicense('restored-token');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ valid: true, reason: 'ok' }) }));
    await expect(verifyLicense(true)).resolves.toMatchObject({ valid: true });
    expect(cachedUnlock()).toBe(true);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('license=restored-token'));
  });
});
