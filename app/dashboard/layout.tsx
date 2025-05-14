import type { ReactNode } from "react"

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  // This layout can be used for dashboard-specific context providers
  // or minor structural adjustments if needed in the future.
  // For now, it just passes children through as Sidebar and Header are global.
  return <>{children}</>
}
