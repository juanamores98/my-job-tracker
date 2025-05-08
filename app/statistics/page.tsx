"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getJobs, updateStatistics } from "@/lib/storage"
import { SkillsDashboard } from "@/components/statistics/skills-dashboard"
import type { JobData, JobStatus } from "@/lib/types"

export default function StatisticsPage() {
  const [jobs, setJobs] = useState<JobData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusCounts, setStatusCounts] = useState<Record<JobStatus, number>>({
    wishlist: 0,
    bookmarked: 0,
    applying: 0,
    applied: 0,
    interview: 0,
    offer: 0,
    accepted: 0,
    rejected: 0,
  })
  const [responseRate, setResponseRate] = useState(0)
  const [interviewRate, setInterviewRate] = useState(0)
  const [offerRate, setOfferRate] = useState(0)

  useEffect(() => {
    // Load jobs from localStorage
    const loadedJobs = getJobs()
    setJobs(loadedJobs)

    // Calculate status counts
    const counts: Record<JobStatus, number> = {
      wishlist: 0,
      bookmarked: 0,
      applying: 0,
      applied: 0,
      interview: 0,
      offer: 0,
      accepted: 0,
      rejected: 0,
    }

    loadedJobs.forEach((job) => {
      counts[job.status as JobStatus] = (counts[job.status as JobStatus] || 0) + 1
    })

    setStatusCounts(counts)

    // Calculate rates
    const totalApplications = loadedJobs.length
    if (totalApplications > 0) {
      // Response rate: (interviews + offers + accepted + rejected) / total
      const responses = counts.interview + counts.offer + counts.accepted + counts.rejected
      setResponseRate(Math.round((responses / totalApplications) * 100))

      // Interview rate: (interviews + offers + accepted) / total
      const interviews = counts.interview + counts.offer + counts.accepted
      setInterviewRate(Math.round((interviews / totalApplications) * 100))

      // Offer rate: (offers + accepted) / total
      const offers = counts.offer + counts.accepted
      setOfferRate(Math.round((offers / totalApplications) * 100))
    }

    // Update statistics in storage
    updateStatistics()
    setIsLoading(false)
  }, [])

  return (
    <main className="flex min-h-screen flex-col">
      <DashboardHeader />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Statistics</h2>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="skills">Skills Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{jobs.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{responseRate}%</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Interview Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{interviewRate}%</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Offer Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{offerRate}%</div>
                </CardContent>
              </Card>
            </div>

            {/* Application Funnel */}
            <Card>
              <CardHeader>
                <CardTitle>Application Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Bookmarked */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Bookmarked</span>
                        <span className="text-sm text-muted-foreground">{statusCounts.bookmarked}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${jobs.length ? (statusCounts.bookmarked / jobs.length) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Applying */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Applying</span>
                        <span className="text-sm text-muted-foreground">{statusCounts.applying}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-500"
                          style={{ width: `${jobs.length ? (statusCounts.applying / jobs.length) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Applied */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Applied</span>
                        <span className="text-sm text-muted-foreground">{statusCounts.applied}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500"
                          style={{ width: `${jobs.length ? (statusCounts.applied / jobs.length) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Interview */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Interview</span>
                        <span className="text-sm text-muted-foreground">{statusCounts.interview}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500"
                          style={{ width: `${jobs.length ? (statusCounts.interview / jobs.length) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Offer */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Offer</span>
                        <span className="text-sm text-muted-foreground">{statusCounts.offer}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{ width: `${jobs.length ? (statusCounts.offer / jobs.length) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Accepted */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Accepted</span>
                        <span className="text-sm text-muted-foreground">{statusCounts.accepted}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500"
                          style={{ width: `${jobs.length ? (statusCounts.accepted / jobs.length) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Rejected */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Rejected</span>
                        <span className="text-sm text-muted-foreground">{statusCounts.rejected}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500"
                          style={{ width: `${jobs.length ? (statusCounts.rejected / jobs.length) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="skills" className="space-y-4">
            <SkillsDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
