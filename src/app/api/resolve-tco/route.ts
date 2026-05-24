import axios from "axios";

async function resolveShortUrl(shortCode: string): Promise<string | null> {
  try {
    const response = await axios.head(`https://t.co/${shortCode}`, {
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400,
    });

    if (response.headers.location) {
      return response.headers.location;
    }

    return null;
  } catch (error) {
    console.error('Error resolving t.co URL:', error);
    return null;
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const shortCode = url.searchParams.get("code");

  if (!shortCode) {
    return Response.json({ error: "Missing short code" }, { status: 400 });
  }

  const resolvedUrl = await resolveShortUrl(shortCode);

  if (!resolvedUrl) {
    return Response.json({ error: "Unable to resolve URL" }, { status: 400 });
  }

  return Response.json({ url: resolvedUrl });
}