import axios from 'axios';
import cheerio from 'cheerio';
import dns from 'node:dns/promises';
import net from 'node:net';
import { publicCacheHeaders } from '@/utils/cacheHeaders';

// This endpoint fetches a USER-SUPPLIED URL, so it must not be usable to reach
// internal services (SSRF). Block private/reserved/link-local/metadata addresses
// (resolved, not just the literal) and disable redirect-following so a public host
// can't redirect to an internal one.
const isBlockedIp = (ip: string): boolean => {
  const type = net.isIP(ip);
  if (type === 4) {
    const [a, b] = ip.split('.').map(Number);
    if (a === 0 || a === 10 || a === 127) return true; // this-network, private, loopback
    if (a === 169 && b === 254) return true; // link-local incl. cloud metadata 169.254.169.254
    if (a === 172 && b >= 16 && b <= 31) return true; // private
    if (a === 192 && b === 168) return true; // private
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a >= 224) return true; // multicast + reserved
    return false;
  }
  if (type === 6) {
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '::') return true; // loopback / unspecified
    if (lower.startsWith('fe80')) return true; // link-local
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // unique local
    if (lower.startsWith('::ffff:')) return isBlockedIp(lower.slice('::ffff:'.length)); // IPv4-mapped
    return false;
  }
  return true; // not a valid IP -> block
};

const assertPublicUrl = async (targetUrl: URL): Promise<void> => {
  const host = targetUrl.hostname.replace(/^\[|\]$/g, ''); // strip IPv6 brackets
  const lowerHost = host.toLowerCase();
  if (!host || lowerHost === 'localhost' || lowerHost.endsWith('.local') || lowerHost.endsWith('.internal')) {
    throw new Error('Blocked host');
  }
  if (net.isIP(host)) {
    if (isBlockedIp(host)) throw new Error('Blocked IP');
    return;
  }
  // Resolve and reject if ANY address is internal. (Best-effort: there is a small
  // TOCTOU window vs. the fetch's own resolution; maxRedirects:0 below closes the
  // common redirect-to-internal bypass.)
  const records = await dns.lookup(host, { all: true });
  if (records.length === 0 || records.some((r) => isBlockedIp(r.address))) {
    throw new Error('Blocked resolved IP');
  }
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)

    const query = url.searchParams.get("query")

    if (!query) {
      return Response.json({ error: "query is required" }, { status: 400 })
    }

    const targetUrl = new URL(query)

    if (targetUrl.protocol !== "http:" && targetUrl.protocol !== "https:") {
      return Response.json({ error: "Unsupported URL protocol" }, { status: 400 })
    }

    await assertPublicUrl(targetUrl)

    const response = await axios.get(targetUrl.toString(), {
      headers: { 'User-Agent': 'CastoraBot/1.0 (https://castora.social)' },
      maxContentLength: 2_000_000,
      maxRedirects: 0,
      timeout: 5000,
    });
    const html = response.data;
    const $ = cheerio.load(html);

    const tags = {};
    $('meta[property^="og"]').each((_, element) => {
      const property = $(element).attr('property');
      const content = $(element).attr('content');
      if (property && content) {
        tags[property] = content;
      }
    });

    $('meta[property^="fc"]').each((_, element) => {
      const property = $(element).attr('property');
      const content = $(element).attr('content');
      if (property && content) {
        tags[property] = content;
      }
    });

    $('meta[name^="og"]').each((_, element) => {
      const name = $(element).attr('name');
      const content = $(element).attr('content');
      if (name && content) {
        tags[name] = content;
      }
    });

    $('meta[name^="fc"]').each((_, element) => {
      const name = $(element).attr('name');
      const content = $(element).attr('content');
      if (name && content) {
        tags[name] = content;
      }
    });

    return Response.json({ tags }, {
      headers: publicCacheHeaders({ browserMaxAge: 120, cdnMaxAge: 3600, staleWhileRevalidate: 86400 }),
    })
  } catch (error) {
    console.log(`error fetching og tags from ${req.url}`)
    return Response.json({ "status": `error fetching og tags from ${req.url}` }, { status: 400 })
  }
};
