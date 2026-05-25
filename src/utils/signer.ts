import { mnemonicToAccount } from "viem/accounts";

import axios from "axios";

/*** EIP-712 helper code ***/

const SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN = {
  name: "Farcaster SignedKeyRequestValidator",
  version: "1",
  chainId: 10,
  verifyingContract: "0x00000000fc700472606ed4fa22623acf62c60553",
} as const;

const SIGNED_KEY_REQUEST_TYPE = [
  { name: "requestFid", type: "uint256" },
  { name: "key", type: "bytes" },
  { name: "deadline", type: "uint256" },
] as const;

export const getSignerFromNeynar = async (): Promise<{ publicKey: `0x${string}`; signerUUID: string } | null> => {

  const res = await axios.post("https://api.neynar.com/v2/farcaster/signer/", {}, { "headers": { "x-api-key": process.env.NEYNAR_API_KEY } })

  if (res.status === 200) {
    return {
      "publicKey": `${res.data.public_key}` as `0x${string}`,
      "signerUUID": res.data.signer_uuid,
    }
  } else {
    return null
  }
}

export const signSigner = async (publicKey: `0x${string}`, deadline: number) => {

  /*** Generating a Signed Key Request signature ***/

  const appFid = parseInt(process.env.APP_FID as string); // Your app's fid
  const account = mnemonicToAccount(process.env.APP_MNENOMIC as string); // Your app's mnemonic

  const signature = await account.signTypedData({
    domain: SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN,
    types: {
      SignedKeyRequest: SIGNED_KEY_REQUEST_TYPE,
    },
    primaryType: "SignedKeyRequest",
    message: {
      requestFid: BigInt(appFid),
      key: publicKey,
      deadline: BigInt(deadline),
    },
  });

  const sponsorSignature = await account.signMessage({
    message: { raw: signature },
  });

  const sponsor = {
    signature: sponsorSignature,
    fid: appFid,
  };

  return { signature, sponsor }
}

export const sendSignedToNeynar = async (signature: string, sponsor: { signature: string, fid: number }, signerUUID: string, deadline: number) => {
  const data = {
    "signer_uuid": signerUUID,
    "signature": signature,
    "deadline": deadline,
    "app_fid": parseInt(process.env.APP_FID as string),
    "sponsor": sponsor,
  }

  const res = await axios.post("https://api.neynar.com/v2/farcaster/signer/signed_key/", data, { "headers": { "x-api-key": process.env.NEYNAR_API_KEY } })

  return res.data.signer_approval_url
}

export const checkSignerApproval = async (signerUUID: string) => {
  const res = await axios.get(`https://api.neynar.com/v2/farcaster/signer/?signer_uuid=${signerUUID}`, { "headers": { "x-api-key": process.env.NEYNAR_API_KEY } })

  return res.data
}