import axios from "axios";
import slugify from 'slugify';
import { buildIpfsGatewayUrl } from "../upload";

async function generatePinataJWT() {
  const keyRestrictions = {
    keyName: 'Signed Upload JWT',
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
  };

  try {
    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: `Bearer ${process.env.PINATA_JWT}`
      },
      body: JSON.stringify(keyRestrictions)
    };

    const jwtResponse = await fetch('https://api.pinata.cloud/users/generateApiKey', options);
    const json = await jwtResponse.json();
    return json.JWT;
  } catch (error) {
    console.error("Failed to generate Pinata JWT:", error);
    throw error;
  }
}

export async function uploadImageToPinata(imageUrl: string, petName: string): Promise<string> {
  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');
    const blob = new Blob([buffer]);

    const formData = new FormData();
    const uploadedFilename = slugify(`${petName}_profile_picture.png`);
    formData.append("file", blob, uploadedFilename);

    const JWT = await generatePinataJWT();

    const pinataRes = await fetch(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${JWT}`,
        },
        body: formData,
      }
    );

    const pinataJson = await pinataRes.json();
    const { IpfsHash } = pinataJson;
    return buildIpfsGatewayUrl(IpfsHash, uploadedFilename);
  } catch (error) {
    console.error("Failed to upload image to Pinata:", error);
    throw error;
  }
}
