import { useEffect, useState } from "react"

export default function PasswordOverlay() {

  const [accessCode, setAccessCode] = useState("")
  const [hasAccess, setHasAccess] = useState(true)

  useEffect(() => {
    // read access code from localstorage
    const accessCode = localStorage.getItem("accessCode")
    if (accessCode) {
      setAccessCode(accessCode)
    }
  }, [])

  useEffect(() => {
    // save access code to localstorage
    if (accessCode === 'superdupercasting') {
      setHasAccess(true)
    } else {
      setHasAccess(false)
    }
    localStorage.setItem("accessCode", accessCode)
  }, [accessCode])

  return (
    // if you care so much about supercast to be here you can get in. dm me on @wojtekwtf tg
    <div className={`fixed w-screen h-screen bg-white z-50 ${hasAccess && 'hidden'}`}>
      <div className="flex flex-col items-center justify-center pt-20">
        <p className="mb-2 text-center">Castora is in beta. What's your code?</p>
        <div className="flex flex-row gap-x-2">
          <input
            className="border rounded-md py-2 px-4 sm:text-sm focus:outline-none"
            placeholder="Access code"
            onChange={(e) => setAccessCode(e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
