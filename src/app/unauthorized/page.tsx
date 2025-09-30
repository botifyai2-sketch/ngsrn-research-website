import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShieldX, Home, ArrowLeft } from "lucide-react"

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <ShieldX className="mx-auto h-16 w-16 text-red-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Access Denied
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            You don&apos;t have permission to access this resource.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <p className="text-gray-700">
            If you believe this is an error, please contact your administrator or try signing in with a different account.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="outline">
              <Link href="/" className="flex items-center space-x-2">
                <Home className="h-4 w-4" />
                <span>Go Home</span>
              </Link>
            </Button>

            <Button asChild>
              <Link href="/auth/signin" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Sign In</span>
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-8 text-xs text-gray-500">
          <p>Error Code: 403 - Forbidden</p>
        </div>
      </div>
    </div>
  )
}