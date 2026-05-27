import axios from 'axios';
import cheerio from 'cheerio';
import { publicCacheHeaders } from '@/utils/cacheHeaders';

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

    const response = await axios.get(targetUrl.toString(), {
      headers: { 'User-Agent': 'CastoraBot/1.0 (https://castora.social)' },
      maxContentLength: 2_000_000,
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
