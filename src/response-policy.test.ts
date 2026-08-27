import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('static deployment response policy', () => {
  it('blocks framing and limits executable content to this origin', async () => {
    const source = await readFile(resolve(process.cwd(), 'public/staticwebapp.config.json'), 'utf8');
    const config = JSON.parse(source) as { globalHeaders: Record<string, string> };
    const csp = config.globalHeaders['Content-Security-Policy'];

    expect(config.globalHeaders['X-Frame-Options']).toBe('DENY');
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("connect-src 'self' https://api.sociobot.in");
  });
});
