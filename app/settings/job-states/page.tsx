"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { JobStatesManager } from "@/components/job-states-manager"

export default function JobStatesPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <DashboardHeader />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Estados de Trabajo</h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Gestión de Estados</CardTitle>
            <CardDescription>
              Personaliza los estados de tus aplicaciones de trabajo. Puedes crear, editar y eliminar estados según tus
              necesidades.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <JobStatesManager />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
