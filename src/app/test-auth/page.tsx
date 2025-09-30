"use client"

import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function TestAuthPage() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <div className="p-8">Loading...</div>
  }

  if (!session) {
    return (
      <div className="p-8 space-y-4">
        <h1 className="text-2xl font-bold">Authentication Test</h1>
        <p>You are not signed in.</p>
        <Button asChild>
          <Link href="/auth/signin">Sign In</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Authentication Test</h1>
      <div className="bg-green-100 p-4 rounded">
        <p className="font-semibold">✅ Authentication Working!</p>
        <p>Signed in as: {session.user.email}</p>
        <p>Name: {session.user.name}</p>
        <p>Role: {(session.user as any).role}</p>
      </div>
      
      <div className="space-x-4">
        <Button asChild>
          <Link href="/cms">Go to CMS</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/auth/signout">Sign Out</Link>
        </Button>
      </div>
    </div>
  )
}