import dynamic from "next/dynamic"

const AddAccountForm = dynamic(() => import("@/components/auth/AddAccountForm"), {
  ssr: false,
})

export default function AddAccount() {
  return <AddAccountForm />
}
