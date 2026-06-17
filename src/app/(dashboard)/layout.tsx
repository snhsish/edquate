import { DefaultSidebar } from "@/components/default-sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { AuthGuard } from "@/components/auth-guard"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <SidebarProvider className="flex min-h-0 h-full overflow-hidden">
        <DefaultSidebar />
        <SidebarInset className="min-h-0 overflow-y-auto">
          {children}
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}
