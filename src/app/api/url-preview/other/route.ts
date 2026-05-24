import axios from 'axios';
import cheerio from 'cheerio';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)

    const query = url.searchParams.get("query")

    if (!query) {
      return Response.json({ error: "query is required" })
    }

    const response = await axios.get(query, { headers: { 'User-Agent': 'SupercastBot/1.0 (https://super.sc)' } });
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

    return Response.json({ tags })
  } catch (error) {
    console.log(`error fetching og tags from ${req.url}`)
    return Response.json({ "status": `error fetching og tags from ${req.url}` }, { status: 400 })
  }
};
