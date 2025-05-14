"use client"

import { Button } from "@/components/ui/button"
import { useStatusManager } from "@/lib/contexts/status-manager-context"

export function JobStatesManager() {
  const { openStatusManager } = useStatusManager()

  return (
    <div>
      <Button onClick={openStatusManager}>Manage Job Statuses</Button>
    </div>
  )
}
