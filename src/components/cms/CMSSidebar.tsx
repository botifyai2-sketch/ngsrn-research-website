"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { UserRole } from "@prisma/client"
import { Permission, hasPermission } from "@/lib/permissions"
import {
  FileText,
  Image,
  BarChart3,
  Search,
  PlusCircle,
  UserCog,
  Users,
} from "lucide-react"

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  requiredPermission?: Permission
}

const navigation: NavigationItem[] = [
  { name: "Dashboard", href: "/cms", icon: BarChart3 },
  { name: "Articles", href: "/cms/articles", icon: FileText, requiredPermission: "articles:read" },
  { name: "New Article", href: "/cms/articles/new", icon: PlusCircle, requiredPermission: "articles:write" },
  { name: "Leadership Team", href: "/cms/leadership", icon: Users, requiredPermission: "users:read" },
  { name: "Media Library", href: "/cms/media", icon: Image, requiredPermission: "media:read" },
  { name: "SEO Management", href: "/cms/seo", icon: Search, requiredPermission: "settings:read" },
  { name: "User Management", href: "/cms/users", icon: UserCog, requiredPermission: "users:read" },
]

export function CMSSidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  const userRole = session?.user?.role as UserRole

  const filteredNavigation = navigation.filter((item) => {
    if (!item.requiredPermission) return true
    return hasPermission(userRole, item.requiredPermission)
  })

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
      <nav className="p-4 space-y-2">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}