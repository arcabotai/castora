import dynamic from "next/dynamic"

const OnboardingPage = dynamic(() => import("@/components/auth/OnboardingPage"), {
  ssr: false,
})

export default function Onboarding() {
  return <OnboardingPage />
}

