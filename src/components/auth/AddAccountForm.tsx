'use client'

import axios from "axios";
import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { toast } from "sonner";
import { useQueryClient } from "react-query";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { useSupercastUserState } from "@/providers/SupercastUserStateProvider";

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
    onCastoraAddAccountSignIn?: (data: NeynarSignInPayload) => void;
  }
}

// Mirrors ConnectAccountForm (the onboarding first-account flow), but posts to the
// additive /api/account/add-account endpoint so it ATTACHES a sibling account
// instead of reassigning the user's primary, then switches into the new account.
export default function AddAccountForm() {
  const { getAccessToken } = usePrivy();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { switchAccount, isAuthenticated, isRegularUser, isReconnecting, hasLoadError } = useSupercastUserState();

  const [clientId, setClientId] = useState("");
  const [loadingClientId, setLoadingClientId] = useState(true);
  const [connecting, setConnecting] = useState(false);

  // Only an onboarded (regular) user can add a sibling account. Send guests to
  // onboarding — but only once user/state has DEFINITIVELY loaded, so we don't
  // bounce a legit user during the brief loading/reconnecting window.
  useEffect(() => {
    if (isAuthenticated() && !isReconnecting() && !hasLoadError() && !isRegularUser()) {
      router.replace("/onboarding");
    }
  }, [isAuthenticated, isReconnecting, hasLoadError, isRegularUser, router]);

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

    window.onCastoraAddAccountSignIn = async (data: NeynarSignInPayload) => {
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
          "/api/account/add-account",
          { fid, signer_uuid: signerUUID },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        // Refresh the accounts list FIRST so the new account exists before we
        // switch into it (avoids getCurrentProfile() returning null mid-switch).
        await queryClient.invalidateQueries("supercastUserState");
        switchAccount(Number(fid));
        toast.success("Account added");
        router.push("/");
        router.refresh();
      } catch (error: any) {
        console.error(error);
        if (error?.response?.data?.error === "ACCOUNT_OWNED_BY_OTHER_USER") {
          toast.error("That account is already registered to another Castora user.");
        } else {
          toast.error("Could not add your Farcaster account");
        }
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
      delete window.onCastoraAddAccountSignIn;
    };
  }, [clientId, getAccessToken, queryClient, router, switchAccount]);

  return (
    <div className="flex flex-col items-center justify-center pt-20">
      <h1 className="font-semibold text-2xl tracking-tight mb-2 text-center max-w-xs">Add a Farcaster account</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-xs text-center leading">
        Sign in with Neynar to connect another Farcaster account. You&apos;ll be able to switch between your accounts and post from any of them.
      </p>
      <div className="w-full max-w-md">
        <div className="space-y-4 p-4 flex flex-col items-center">
          {loadingClientId ? (
            <p className="text-gray-400 text-xs">loading Farcaster sign-in...</p>
          ) : clientId ? (
            <div
              className="neynar_signin"
              data-client_id={clientId}
              data-success-callback="onCastoraAddAccountSignIn"
              data-theme="dark"
            />
          ) : (
            <p className="text-red-500 text-sm text-center">Neynar sign-in is unavailable.</p>
          )}
          {connecting && <p className="text-gray-400 text-xs">adding your account...</p>}
        </div>
        <Button
          onClick={() => router.push("/")}
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
