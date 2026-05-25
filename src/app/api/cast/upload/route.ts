import { NextResponse, NextRequest } from "next/server";
import { isAuthenticated } from "@/utils/auth/isAuthenticated";
import { isAuthorized } from "@/utils/auth/isAuthorized";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/bmp",
  "image/svg+xml",
  "image/tiff",
  "image/x-icon",
]);

type UploadIntent = {
  asFid?: number | string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
}

export async function POST(request: NextRequest) {
  const { authenticated, supercastUser } = await isAuthenticated(request);
  if (!authenticated || !supercastUser) {
    return NextResponse.json({ error: "Invalid auth" }, { status: 401 });
  }

  let intent: UploadIntent;
  try {
    intent = await request.json();
  } catch (_error) {
    return NextResponse.json({ error: "Invalid upload intent" }, { status: 400 });
  }

  const asFid = intent.asFid === undefined ? null : Number(intent.asFid);
  if (asFid !== null && (!Number.isInteger(asFid) || asFid <= 0)) {
    return NextResponse.json({ error: "Invalid asFid" }, { status: 400 });
  }

  if (asFid !== null) {
    const { authorized, error_message } = await isAuthorized(supercastUser, asFid, false);
    if (!authorized) {
      return NextResponse.json({ error: error_message || "Unauthorized" }, { status: 403 });
    }
  }

  const fileType = String(intent.fileType || "").toLowerCase();
  const fileSize = Number(intent.fileSize);
  if (!ALLOWED_IMAGE_TYPES.has(fileType)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "File too large" }, { status: 400 });
  }

  if (!process.env.PINATA_JWT) {
    return NextResponse.json({ error: "Upload service is not configured" }, { status: 500 });
  }

  const keyRestrictions = {
    keyName: `Castora upload ${asFid} ${Date.now()}`,
    maxUses: 1,
    permissions: {
      endpoints: {
        data: {
          pinList: false,
          userPinnedDataTotal: false
        },
        pinning: {
          pinFileToIPFS: true,
          pinJSONToIPFS: false,
          pinJobs: false,
          unpin: false,
          userPinPolicy: false
        }
      }
    }
  }

  try {
    const jwtResponse = await fetch('https://api.pinata.cloud/users/generateApiKey', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: `Bearer ${process.env.PINATA_JWT}`
      },
      body: JSON.stringify(keyRestrictions)
    });

    if (!jwtResponse.ok) {
      return NextResponse.json({ error: 'Failed to create upload token' }, { status: 502 });
    }

    const json = await jwtResponse.json();
    const { JWT } = json;

    if (!JWT) {
      return NextResponse.json({ error: 'Upload token missing from provider response' }, { status: 502 });
    }

    return NextResponse.json({ JWT }, { status: 200 });
  } catch (error) {
    console.error('/api/cast/upload failed', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
