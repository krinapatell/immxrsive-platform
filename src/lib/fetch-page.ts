import 'server-only';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

/**
 * Fetches a public web page for company import (R4.08) without letting the
 * server be pointed at itself or a private network:
 *  - http/https only, standard ports only;
 *  - every host (including each redirect) must resolve to public addresses;
 *  - at most 3 redirects, 8 seconds, 1 MB, and the reply must be HTML/text.
 * Any problem becomes a plain-language message for staff (R4.11).
 */
export class FetchPageError extends Error {}

const MAX_BYTES = 1_000_000;
const TIMEOUT_MS = 8000;

function privateV4(ip: string): boolean {
  const [a, b] = ip.split('.').map(Number);
  return (
    a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 198 && (b === 18 || b === 19)) || a >= 224
  );
}

function privateAddress(ip: string): boolean {
  if (isIP(ip) === 4) return privateV4(ip);
  const v6 = ip.toLowerCase();
  if (v6.startsWith('::ffff:')) return privateV4(v6.slice(7));
  return v6 === '::' || v6 === '::1' || v6.startsWith('fc') || v6.startsWith('fd') || v6.startsWith('fe80') || v6.startsWith('ff');
}

async function assertPublicHost(url: URL) {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new FetchPageError('Only http:// or https:// website addresses can be imported.');
  if (url.username || url.password) throw new FetchPageError('Website addresses with a username or password cannot be imported.');
  if (process.env.IMPORT_ALLOW_PRIVATE_HOSTS === '1') return; // local testing only, never set on Vercel
  if (url.port && url.port !== '80' && url.port !== '443') throw new FetchPageError('That address uses an unusual port and cannot be imported.');
  const host = url.hostname.replace(/^\[|\]$/g, '');
  let addresses: string[];
  try {
    addresses = isIP(host) ? [host] : (await lookup(host, { all: true })).map((a) => a.address);
  } catch {
    throw new FetchPageError(`We couldn't find the website ${url.hostname}. Check the address, or fill in the details by hand.`);
  }
  if (!addresses.length || addresses.some(privateAddress)) {
    throw new FetchPageError('That address points to a private network and cannot be imported.');
  }
}

export async function fetchPublicPage(input: string): Promise<{ html: string; finalUrl: string }> {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new FetchPageError('Enter a full website address, for example https://example.com.');
  }

  for (let hop = 0; hop <= 3; hop++) {
    await assertPublicHost(url);
    let res: Response;
    try {
      res = await fetch(url, {
        redirect: 'manual',
        headers: { 'User-Agent': 'ImmXrsive-Partner-Import/1.0', Accept: 'text/html,text/plain;q=0.9' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: 'no-store',
      });
    } catch {
      throw new FetchPageError(`We couldn't reach ${url.hostname}. Try again later, or fill in the details by hand.`);
    }
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      url = new URL(res.headers.get('location')!, url);
      continue;
    }
    if (!res.ok) throw new FetchPageError(`The website answered with an error (${res.status}). You can fill in the details by hand.`);
    const type = res.headers.get('content-type') ?? '';
    if (type && !/text\/html|text\/plain|application\/xhtml/i.test(type)) {
      throw new FetchPageError('That address is not a web page (it looks like a file). Try the company home page instead.');
    }
    const reader = res.body?.getReader();
    if (!reader) return { html: '', finalUrl: url.toString() };
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_BYTES) {
        await reader.cancel();
        break;
      }
      chunks.push(value);
    }
    return { html: new TextDecoder().decode(Buffer.concat(chunks)), finalUrl: url.toString() };
  }
  throw new FetchPageError('That website redirects too many times to import.');
}
