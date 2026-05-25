import { prisma } from "@/prisma/client"
import { SupercastFarcasterAccount, PetOption } from "@prisma/client"
import axios from "axios"
import { createWalletClient, createPublicClient, custom, http, Account, bytesToHex } from 'viem';
import { generatePrivateKey, mnemonicToAccount, privateKeyToAccount } from 'viem/accounts'
import { mainnet, optimism } from "viem/chains";
import {
  ID_REGISTRY_EIP_712_TYPES,
  idRegistryABI,
  ID_GATEWAY_ADDRESS,
  ID_REGISTRY_ADDRESS,
} from '@farcaster/hub-web';

import { ViemLocalEip712Signer } from '@farcaster/hub-nodejs'

const publicClient = createPublicClient({
  chain: optimism,
  transport: http(),
});

const getDeadline = () => {
  const now = Math.floor(Date.now() / 1000);
  const oneHour = 60 * 60;
  return now + oneHour;
};

const readNonce = async (account: Account) => {
  return await publicClient.readContract({
    address: ID_REGISTRY_ADDRESS,
    abi: idRegistryABI,
    functionName: 'nonces',
    args: [account.address as `0x${string}`],
  });
};

export const createFarcasterAccountForPet = async (ownerAccount: SupercastFarcasterAccount, petOption: PetOption): Promise<SupercastFarcasterAccount> => {

  const newFidResponse = await axios.get(`https://api.neynar.com/v2/farcaster/user/fid/`, { "headers": { "x-api-key": process.env.NEYNAR_API_KEY } })

  const newFid = newFidResponse.data.fid;

  console.log('new fid', newFid)

  // const account = await createNewEthereumAccount()

  const privateKey = generatePrivateKey()

  // Create an account from the private key
  const account = privateKeyToAccount(privateKey)
  const requestedUserAccountSigner = new ViemLocalEip712Signer(account)
  const nonce = await readNonce(account);
  const deadline = getDeadline();

  const requestedUserSignature = await requestedUserAccountSigner.signTransfer({
    fid: BigInt(newFid),
    to: account.address as `0x${string}`,
    nonce: BigInt(nonce),
    deadline: BigInt(deadline),
  })

  const randomNumber = Math.floor(Math.random() * 900) + 100;

  // @ts-ignore value works
  console.log('signature', bytesToHex(requestedUserSignature.value))
  console.log('deadline', deadline)
  console.log('randomNumber', randomNumber)
  // remove spaces and make lowercase
  const petName = petOption.name.replace(/\s+/g, '').toLowerCase().slice(0, 10) + ownerAccount.fid

  const neynarRegistrationData = {
    // @ts-ignore value works
    signature: bytesToHex(requestedUserSignature.value),
    fid: newFid,
    requested_user_custody_address: account.address,
    deadline: deadline,
    // todo handle taken names
    fname: petName,
  };

  console.log('neynarRegistrationData', neynarRegistrationData)

  try {
    const responseRegistrationResponse = await axios.post(`https://api.neynar.com/v2/farcaster/user/`, neynarRegistrationData, { "headers": { "x-api-key": process.env.NEYNAR_API_KEY } })

    const newNeynarFid = responseRegistrationResponse.data.signer.fid;
    const newNeynarSigner = responseRegistrationResponse.data.signer.signer_uuid;

    console.log('newNeynarSigner', newNeynarSigner)

    const followData1 = {
      "target_fids": [
        ownerAccount.fid
      ],
      "signer_uuid": newNeynarSigner,
    }
    const responseFollow1 = await axios.post(`https://api.neynar.com/v2/farcaster/user/follow/`, followData1, { "headers": { "x-api-key": process.env.NEYNAR_API_KEY } })

    const followData2 = {
      "target_fids": [
        newNeynarFid
      ],
      "signer_uuid": ownerAccount.signerUUID,
    }
    const responseFollow2 = await axios.post(`https://api.neynar.com/v2/farcaster/user/follow/`, followData2, { "headers": { "x-api-key": process.env.NEYNAR_API_KEY } })

    const updateData = {
      display_name: petOption.name,
      pfp_url: petOption.pfp_url,
      bio: `i'm ${petOption.ownerUsername}'s best friend, powered by @supercast`,
      signer_uuid: newNeynarSigner
    }

    const updateDataResponse = await axios.patch(`https://api.neynar.com/v2/farcaster/user/`, updateData, { "headers": { "x-api-key": process.env.NEYNAR_API_KEY } })

    const welcomeContent = `hi @${petOption.ownerUsername}!
    
i'm ${petOption.name}, your new best friend :)

You look great today!`

    const castData = {
      "text": welcomeContent,
      "signer_uuid": newNeynarSigner,
    }

    const response = await axios.post(`https://api.neynar.com/v2/farcaster/cast/`, castData, { "headers": { "x-api-key": process.env.NEYNAR_API_KEY } })

    console.log('updateDataResponse', updateDataResponse)

    const petSupercastFarcasterAccount = await prisma.supercastFarcasterAccount.create({
      data: {
        fid: newNeynarFid,
        signerUUID: newNeynarSigner
      }
    })

    console.log('petSupercastFarcasterAccount', petSupercastFarcasterAccount)

    return petSupercastFarcasterAccount
  } catch (error) {
    console.error('Error in createFarcasterAccountForPet:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    if (axios.isAxiosError(error)) {
      console.error('Axios error response:', error.response?.data);
      console.error('Axios error status:', error.response?.status);
    }
    throw error; // Re-throw the error after logging
  }
}