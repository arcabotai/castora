import slugify from 'slugify'

export const uploadFileClientSide = async (fileToUpload) => {
  try {

    if (fileToUpload.size > 100 * 1000 * 1000) {
      throw new Error("File size too large. Max 100MB");
    }


    const formData = new FormData();
    const uploadedFilename = slugify(fileToUpload.name);
    formData.append("file", fileToUpload, uploadedFilename);

    const jwtRes = await fetch("/api/cast/upload", { method: "POST" });
    const data = await jwtRes.json();

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
    const { IpfsHash } = json;
    return {
      IpfsHash,
      uploadedFilename,
    };

  } catch (e) {
    throw new Error(e);
  }
};