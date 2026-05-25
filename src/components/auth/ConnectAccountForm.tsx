import axios from "axios";
import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { toast } from "sonner";
import { useQueryClient } from "react-query";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";

interface ConnectAccountFormProps {
  onBack: () => void;
}

type NeynarSignInPayload = {
  fid?: number | string;
  signer_uuid?: string;
  signerUUID?: string;
  user?: {
    fid?: number | string;
  };
};

declare global {
  interface Window {
    onCastoraNeynarSignIn?: (data: NeynarSignInPayload) => void;
  }
}

export default function ConnectAccountForm({ onBack }: ConnectAccountFormProps) {
  const { getAccessToken } = usePrivy();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [clientId, setClientId] = useState("");
  const [loadingClientId, setLoadingClientId] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchClientId = async () => {
      try {
        const response = await axios.get("/api/account/siwn");
        if (!cancelled) {
          setClientId(response.data.clientId);
        }
      } catch (error) {
        console.error(error);
        toast.error("Neynar sign-in is not configured yet");
      } finally {
        if (!cancelled) {
          setLoadingClientId(false);
        }
      }
    };

    fetchClientId();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!clientId) return;

    window.onCastoraNeynarSignIn = async (data: NeynarSignInPayload) => {
      const fid = data?.fid ?? data?.user?.fid;
      const signerUUID = data?.signer_uuid ?? data?.signerUUID;

      if (!fid || !signerUUID) {
        toast.error("Neynar did not return a Farcaster signer");
        return;
      }

      setConnecting(true);

      try {
        const accessToken = await getAccessToken();
        await axios.post(
          "/api/account/siwn",
          { fid, signer_uuid: signerUUID },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        await queryClient.invalidateQueries("supercastUserState");
        toast.success("Farcaster account connected");
        router.push("/");
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error("Could not connect your Farcaster account");
      } finally {
        setConnecting(false);
      }
    };

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://neynarxyz.github.io/siwn/raw/1.2.0/index.js"]',
    );

    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://neynarxyz.github.io/siwn/raw/1.2.0/index.js";
      script.async = true;
      document.body.appendChild(script);
    }

    return () => {
      delete window.onCastoraNeynarSignIn;
    };
  }, [clientId, getAccessToken, queryClient, router]);

  return (
    <div className="flex flex-col items-center justify-center pt-20">
      <h1 className="font-semibold text-2xl tracking-tight mb-2 text-center max-w-xs">Connect your Farcaster account</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-xs text-center leading">
        Sign in with Neynar to let Castora read and write with your approved Farcaster signer.
      </p>
      <div className="w-full max-w-md">
        <div className="space-y-4 p-4 flex flex-col items-center">
          {loadingClientId ? (
            <p className="text-gray-400 text-xs">loading Farcaster sign-in...</p>
          ) : clientId ? (
            <div
              className="neynar_signin"
              data-client_id={clientId}
              data-success-callback="onCastoraNeynarSignIn"
              data-theme="dark"
            />
          ) : (
            <p className="text-red-500 text-sm text-center">Neynar sign-in is unavailable.</p>
          )}
          {connecting && <p className="text-gray-400 text-xs">connecting your signer...</p>}
        </div>
        <Button
          onClick={onBack}
          variant="ghost"
          className="w-full mt-6"
          disabled={connecting}
        >
          Go back
        </Button>
      </div>
    </div>
  );
}
