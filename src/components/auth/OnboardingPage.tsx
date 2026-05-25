'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import CreateAccountForm from "@/components/auth/CreateAccountForm";
import Link from "next/link";
import ConnectAccountForm from "./ConnectAccountForm";
import { useSupercastUserState } from "@/providers/SupercastUserStateProvider";
import { useRouter } from "next/navigation";
import { useQuery } from "react-query";
import axios from "axios";
import { HOST_URL } from "@/utils/hostURL";
import { usePrivy } from '@privy-io/react-auth';

enum OnboardingStage {
  START = 'start',
  CREATE_ACCOUNT = 'create-account',
  CONNECT_ACCOUNT = 'connect-account',
}

type RegistrationStatus = {
  registrationPaidFor: boolean;
};

const OnboardingPage = () => {
  const { isRegularUser, isAuthenticated } = useSupercastUserState();
  const router = useRouter();
  const { getAccessToken } = usePrivy();
  const [stage, setStage] = useState<OnboardingStage>(OnboardingStage.START);

  if (isRegularUser()) {
    router.push('/');
  }

  const fetchRegistrationStatus = async () => {
    const accessToken = await getAccessToken();
    const response = await axios.get(`${HOST_URL}/api/account/registration-status`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      }
    });
    return response.data;
  }

  const registrationStatusQuery = useQuery<RegistrationStatus>(
    'registrationStatus',
    fetchRegistrationStatus,
    {
      enabled: isAuthenticated(),
    }
  );

  const renderCreateAccountForm = () => (
    <CreateAccountForm
      onBack={() => {
        if (registrationStatusQuery.data?.registrationPaidFor) {
          router.push('/')
        } else {
          setStage(OnboardingStage.START)
        }
      }}
      registrationPaidFor={registrationStatusQuery.data?.registrationPaidFor}
    />
  );

  const renderConnectAccountForm = () => (
    <ConnectAccountForm
      onBack={() => setStage(OnboardingStage.START)}
    />
  );

  const renderStartScreen = () => (
    <div className="flex flex-col items-center justify-center pt-20">
      <h1 className="font-semibold text-2xl tracking-tight mb-2 text-center max-w-xs">Create or connect a Farcaster account</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-xs text-center leading">
        Castora runs on Farcaster.<br />If you already have a Farcaster account, you can use it here too.
      </p>
      <div className="flex flex-col gap-y-2 w-full max-w-xs">
        <Button
          onClick={() => { setStage(OnboardingStage.CONNECT_ACCOUNT) }}
          className="w-full"
        >
          Connect existing account
          <img src="/warpcast.svg" alt="Farcaster logo" className="h-4 w-4 ml-2" />
        </Button>
        <Button
          onClick={() => setStage(OnboardingStage.CREATE_ACCOUNT)}
          className="w-full"
          variant="outline"
        >
          Register new account
        </Button>
        <Link href="/">
          <Button
            variant="ghost"
            className="w-full"
          >
            Go back
          </Button>
        </Link>
      </div>
    </div>
  );

  // Render based on current stage
  if (stage === OnboardingStage.CREATE_ACCOUNT || registrationStatusQuery.data?.registrationPaidFor) {
    return renderCreateAccountForm();
  }
  if (stage === OnboardingStage.CONNECT_ACCOUNT) {
    return renderConnectAccountForm();
  }
  return renderStartScreen();
};

export default OnboardingPage;