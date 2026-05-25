import axios from "axios";
import { getTweet } from "react-tweet/api";
import { sanitizeTweetForReactTweet } from "../../../utils/tweets";

async function getFullTweetId(shortCode: string): Promise<string | null> {
  try {
    const response = await axios.head(`https://t.co/${shortCode}`, {
      validateStatus: function (status) {
        return status === 403 || (status >= 200 && status < 400);  // Accept 403 as well
      }
    });

    // Check if the path contains the tweet ID
    const pathMatch = response.request.path.match(/\/status\/(\d+)/);
    if (pathMatch) {
      return pathMatch[1];
    }

    // If not in the path, check headers for redirection
    if (response.status >= 300 && response.status < 400 && response.headers.location) {
      const headerMatch = response.headers.location.match(/\/status\/(\d+)/);
      return headerMatch ? headerMatch[1] : null;
    }

    return null;
  } catch (error) {
    console.error('Error extracting tweet ID:', error);
    return null;
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  let id = url.searchParams.get("id");

  if (!id) {
    return Response.json("Missing tweet ID", { status: 400 });
  }

  // Check if the ID is a short t.co code (typically 10 characters)
  if (id.length === 10) {
    const fullId = await getFullTweetId(id);
    if (fullId) {
      id = fullId;
    } else {
      return Response.json("Unable to resolve short t.co code to full tweet ID", { status: 400 });
    }
  }

  // Use the resolved ID to fetch tweet data (implementation depends on your needs)
  const tweet = await getTweet(id);

  if (!tweet) {
    return Response.json("Can't fetch the tweet", { status: 400 });
  }

  return Response.json({ tweet: sanitizeTweetForReactTweet(tweet) });
}
