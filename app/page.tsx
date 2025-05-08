import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { JobBoard } from "@/components/job-board"

export default function Home() {
  // In a real app, you would check authentication here
  // For demo purposes, we'll assume the user is logged in
  const isAuthenticated = true

  if (!isAuthenticated) {
    redirect("/login")
  }

  return (
    <main className="flex min-h-screen flex-col">
      <DashboardHeader />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Job Applications</h2>
        </div>
        <JobBoard />
      </div>
    </main>
  )
}
