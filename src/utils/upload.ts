import slugify from 'slugify'

type UploadOptions = {
  accessToken: string | null;
  asFid?: number;
}

const DEFAULT_IPFS_GATEWAY = "https://gateway.pinata.cloud";

export function buildIpfsGatewayUrl(cid: string, filename?: string) {
  const gateway = (
    process.env.NEXT_PUBLIC_PINATA_GATEWAY ||
    process.env.PINATA_GATEWAY ||
    DEFAULT_IPFS_GATEWAY
  ).replace(/\/$/, "");
  const baseUrl = gateway.endsWith("/ipfs") ? gateway : `${gateway}/ipfs`;
  const filenameQuery = filename ? `?filename=${encodeURIComponent(filename)}` : "";

  return `${baseUrl}/${cid}${filenameQuery}`;
}

export const uploadFileClientSide = async (fileToUpload: File, options: UploadOptions) => {
  try {
    if (fileToUpload.size > 10 * 1024 * 1024) {
      throw new Error("File size too large. Max 10MB");
    }

    if (!options.accessToken) {
      throw new Error("Please sign in before uploading.");
    }

    const formData = new FormData();
    const uploadedFilename = slugify(fileToUpload.name);
    formData.append("file", fileToUpload, uploadedFilename);

    const jwtRes = await fetch("/api/cast/upload", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${options.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        asFid: options.asFid,
        fileName: uploadedFilename,
        fileType: fileToUpload.type,
        fileSize: fileToUpload.size,
      }),
    });

    const data = await jwtRes.json();
    if (!jwtRes.ok) {
      throw new Error(data?.error || "Failed to create upload token");
    }

    const { JWT } = data;

    const res = await fetch(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${JWT}`,
        },
        body: formData,
      }
    );

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.error || "Failed to upload file");
    }

    const { IpfsHash } = json;
    return {
      IpfsHash,
      uploadedFilename,
    };

  } catch (e) {
    throw e instanceof Error ? e : new Error(String(e));
  }
};
