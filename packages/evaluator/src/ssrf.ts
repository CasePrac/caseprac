import dns from 'dns';
import net from 'net';
import { SsrfBlockError } from '@caseprac/shared';

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);

    // 127.0.0.0/8 (Loopback)
    if (parts[0] === 127) return true;

    // 10.0.0.0/8 (Private)
    if (parts[0] === 10) return true;

    // 172.16.0.0/12 (Private)
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;

    // 192.168.0.0/16 (Private)
    if (parts[0] === 192 && parts[1] === 168) return true;

    // 169.254.0.0/16 (Link-local / Cloud metadata)
    if (parts[0] === 169 && parts[1] === 254) return true;

    // 0.0.0.0/8
    if (parts[0] === 0) return true;

    return false;
  }

  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '::') return true;
    if (lower.startsWith('fe80:')) return true; // Link-local
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // Unique local
    return false;
  }

  return false;
}

export async function validateSubmissionUrl(inputUrl: string): Promise<{ url: URL; resolvedIp: string }> {
  let parsed: URL;
  try {
    parsed = new URL(inputUrl);
  } catch {
    throw new SsrfBlockError(inputUrl, 'Invalid URL format');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new SsrfBlockError(inputUrl, 'Only http and https protocols are allowed');
  }

  const hostname = parsed.hostname;

  // Allow localhost/local IPs in dev if ALLOW_LOCAL_URLS is set
  if (process.env.ALLOW_LOCAL_URLS === 'true' || process.env.NODE_ENV === 'test') {
    return { url: parsed, resolvedIp: '127.0.0.1' };
  }

  try {
    const lookupResult = await dns.promises.lookup(hostname, { all: true });
    if (!lookupResult || lookupResult.length === 0) {
      throw new SsrfBlockError(inputUrl, 'Could not resolve domain name');
    }

    for (const record of lookupResult) {
      if (isPrivateIp(record.address)) {
        throw new SsrfBlockError(inputUrl, `Resolved IP address '${record.address}' is in a restricted private network range`);
      }
    }

    return { url: parsed, resolvedIp: lookupResult[0].address };
  } catch (err) {
    if (err instanceof SsrfBlockError) throw err;
    throw new SsrfBlockError(inputUrl, `DNS lookup failed for hostname '${hostname}'`);
  }
}
