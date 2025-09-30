"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { UserRole } from "@prisma/client"
import { Permission, hasPermission, canAccessCMS } from "@/lib/permissions"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole
  requiredPermission?: Permission
  fallbackUrl?: string
  loadingComponent?: React.ReactNode
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  fallbackUrl = "/auth/signin",
  loadingComponent
}: ProtectedRouteProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return // Still loading

    if (!session) {
      router.push(fallbackUrl)
      return
    }

    const userRole = session.user.role as UserRole

    // Check role requirement
    if (requiredRole && userRole !== requiredRole && userRole !== "ADMIN") {
      router.push("/unauthorized")
      return
    }

    // Check permission requirement
    if (requiredPermission && !hasPermission(userRole, requiredPermission)) {
      router.push("/unauthorized")
      return
    }

    // For CMS routes, check general CMS access
    if (!requiredRole && !requiredPermission && !canAccessCMS(userRole)) {
      router.push("/unauthorized")
      return
    }
  }, [session, status, router, requiredRole, requiredPermission, fallbackUrl])

  if (status === "loading") {
    return loadingComponent || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const userRole = session.user.role as UserRole

  // Final permission check before rendering
  if (requiredRole && userRole !== requiredRole && userRole !== "ADMIN") {
    return null
  }

  if (requiredPermission && !hasPermission(userRole, requiredPermission)) {
    return null
  }

  if (!requiredRole && !requiredPermission && !canAccessCMS(userRole)) {
    return null
  }

  return <>{children}</>
}

// Convenience components for common use cases
export function AdminRoute({ children, ...props }: Omit<ProtectedRouteProps, "requiredRole">) {
  return (
    <ProtectedRoute requiredRole="ADMIN" {...props}>
      {children}
    </ProtectedRoute>
  )
}

export function EditorRoute({ children, ...props }: Omit<ProtectedRouteProps, "requiredRole">) {
  return (
    <ProtectedRoute requiredRole="EDITOR" {...props}>
      {children}
    </ProtectedRoute>
  )
}

export function CMSRoute({ children, ...props }: Omit<ProtectedRouteProps, "requiredPermission">) {
  return (
    <ProtectedRoute {...props}>
      {children}
    </ProtectedRoute>
  )
}