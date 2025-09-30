"use client"

import { useEffect } from "react"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function SignOutPage() {
  const router = useRouter()

  useEffect(() => {
    const handleSignOut = async () => {
      await signOut({ redirect: false })
      router.push("/")
    }

    handleSignOut()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Signing you out...
        </h2>
        <p className="text-gray-600">
          You will be redirected to the homepage shortly.
        </p>
      </div>
    </div>
  )
}