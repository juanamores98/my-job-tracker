"use client"

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react"
import { EnhancedStatusModal } from "@/components/enhanced-status-modal"
import { getJobStates, saveJobStates, deleteJobState, getJobs, saveJobs } from "@/lib/storage"
import { defaultJobStates } from "@/lib/data"
import type { JobState, JobData } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/i18n"

interface StatusManagerContextType {
  openStatusManager: () => void
  jobStates: JobState[]
  setJobStates: (states: JobState[]) => void
}

const StatusManagerContext = createContext<StatusManagerContextType>({
  openStatusManager: () => {},
  jobStates: [],
  setJobStates: () => {}
})

export const useStatusManager = () => useContext(StatusManagerContext)

export function StatusManagerProvider({ children }: { children: ReactNode }) {
  const [jobStates, setJobStates] = useState<JobState[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { toast } = useToast()
  const { t } = useLanguage()

  // Load job states when provider mounts
  React.useEffect(() => {
    const states = getJobStates()
    setJobStates(states.sort((a, b) => a.order - b.order))
  }, [])

  const handleAddStatus = useCallback((newState: JobState) => {
    const stateToAdd: JobState = {
      ...newState,
      order: Math.max(...jobStates.map((s) => s.order), 0) + 1,
    }

    const updatedStates = [...jobStates]

    // If this is the first state or marked as default, ensure it's the only default
    if (stateToAdd.isDefault || updatedStates.length === 0) {
      updatedStates.forEach((s) => {
        s.isDefault = false
      })
      stateToAdd.isDefault = true
    }

    updatedStates.push(stateToAdd)
    const sortedStates = updatedStates.sort((a, b) => a.order - b.order)
    
    setJobStates(sortedStates)
    saveJobStates(sortedStates)

    toast({
      title: t("statusAdded"),
      description: t("statusAddedSuccess", { statusName: stateToAdd.name }),
    })
  }, [jobStates, toast, t])

  const handleUpdateStatus = useCallback((updatedState: JobState) => {
    const updatedStates = jobStates.map((state) => 
      state.id === updatedState.id ? updatedState : state
    )

    // If this state is marked as default, ensure it's the only default
    if (updatedState.isDefault) {
      updatedStates.forEach((s) => {
        if (s.id !== updatedState.id) {
          s.isDefault = false
        }
      })
    } else {
      // Ensure there's always at least one default state
      const hasDefault = updatedStates.some((s) => s.isDefault)
      if (!hasDefault && updatedStates.length > 0) {
        updatedStates[0].isDefault = true
      }
    }

    const sortedStates = updatedStates.sort((a, b) => a.order - b.order)
    setJobStates(sortedStates)
    saveJobStates(sortedStates)

    toast({
      title: t("statusUpdated"),
      description: t("statusUpdatedSuccess", { statusName: updatedState.name }),
    })
  }, [jobStates, toast, t])

  const handleDeleteStatus = useCallback((stateId: string) => {
    // Check if this is the only state
    if (jobStates.length <= 1) {
      toast({
        title: t("cannotDelete"),
        description: t("mustHaveOneStatus"),
        variant: "destructive",
      })
      return
    }

    const result = deleteJobState(stateId)
    setJobStates(result.states.sort((a, b) => a.order - b.order))

    toast({
      title: t("statusDeleted"),
      description: t("statusDeletedSuccess"),
    })
  }, [jobStates, toast, t])

  const handleReorderStatuses = useCallback((reorderedStates: JobState[]) => {
    // Update the order property for each state
    const updatedStates = reorderedStates.map((state, index) => ({
      ...state,
      order: index,
    }))

    setJobStates(updatedStates)
    saveJobStates(updatedStates)

    toast({
      title: t("statusesReordered"),
      description: t("statusesReorderedSuccess"),
    })
  }, [toast, t])

  const handleRestoreDefaults = useCallback((fallbackStatus: string) => {
    const allJobs = getJobs()
    const defaultStatusIds = new Set(defaultJobStates.map(s => s.id))
    const defaultStatusNames = new Set(defaultJobStates.map(s => s.name.toLowerCase()))

    const updatedJobs = allJobs.map(job => {
      const currentStatus = jobStates.find(s => s.id === job.status)
      if (!currentStatus) {
        // Job has an orphaned status
        return { ...job, status: fallbackStatus }
      }

      // Check if current status is one of the new default statuses by ID
      if (defaultStatusIds.has(currentStatus.id)) {
        return job // Status is already a default one, no change needed
      }
      
      // Check if current status name matches a default status name (case-insensitive)
      const matchingDefaultByName = defaultJobStates.find(
        ds => ds.name.toLowerCase() === currentStatus.name.toLowerCase()
      )
      if (matchingDefaultByName) {
        return { ...job, status: matchingDefaultByName.id }
      }

      // If status is not a default one (by ID or name), move to fallback
      return { ...job, status: fallbackStatus }
    })

    saveJobs(updatedJobs)
    setJobStates([...defaultJobStates].sort((a, b) => a.order - b.order))
    saveJobStates([...defaultJobStates])

    toast({
      title: t("statusesRestored"),
      description: t("statusesRestoredSuccess"),
    })
  }, [jobStates, toast, t])

  const openStatusManager = useCallback(() => {
    setIsModalOpen(true)
  }, [])

  return (
    <StatusManagerContext.Provider value={{ openStatusManager, jobStates, setJobStates }}>
      {children}
      
      <EnhancedStatusModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        jobStates={jobStates}
        onAddStatus={handleAddStatus}
        onUpdateStatus={handleUpdateStatus}
        onDeleteStatus={handleDeleteStatus}
        onReorderStatuses={handleReorderStatuses}
        onRestoreDefaults={handleRestoreDefaults}
      />
    </StatusManagerContext.Provider>
  )
} 