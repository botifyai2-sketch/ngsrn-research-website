import { CMSHeader } from "@/components/cms/CMSHeader"
import { CMSSidebar } from "@/components/cms/CMSSidebar"
import { CMSRoute } from "@/components/auth/ProtectedRoute"

export default function CMSLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CMSRoute>
      <div className="min-h-screen bg-gray-50">
        <CMSHeader />
        <div className="flex">
          <CMSSidebar />
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </CMSRoute>
  )
}