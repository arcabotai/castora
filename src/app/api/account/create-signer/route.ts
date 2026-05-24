import { isAuthenticated } from '@/utils/auth/isAuthenticated';
import { getSignerFromNeynar, signSigner, sendSignedToNeynar, checkSignerApproval } from '@/utils/signer'

export async function POST(req: Request) {

  const { authenticated } = await isAuthenticated(req)

  if (!authenticated) {
    return Response.json({ "error": "Not authenticated" }, { status: 401 })
  }

  // TODO potential timebomb. If somebody fails to login withing 365 days from first login, there is no way for them to self recover
  const deadline = Math.floor(Date.now() / 1000) + (365 * 86400);

  const signerObject = await getSignerFromNeynar()

  const publicKey = signerObject?.publicKey
  const signerUUID = signerObject?.signerUUID

  if (!publicKey || !signerUUID) return Response.json("no public key", { "status": 400 })

  const { signature, sponsor } = await signSigner(publicKey, deadline)

  if (!signature) return Response.json("no signature", { "status": 400 })

  const signerApprovalUrl = await sendSignedToNeynar(signature, sponsor, signerUUID, deadline)

  return Response.json({
    "signerApprovalUrl": signerApprovalUrl,
    "signerUUID": signerUUID,
    "publicKey": publicKey,
    "signature": signature,
    "deadline": deadline,
  })
};