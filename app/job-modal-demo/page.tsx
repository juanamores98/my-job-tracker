"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MinimalisticJobModal } from "@/components/minimalistic-job-modal"
import { defaultJobStates } from "@/lib/data"
import type { JobData } from "@/lib/types"
import { TagBadge } from "@/components/tag-badge"
import { Building, MapPin, Calendar, Briefcase } from "lucide-react"

export default function JobModalDemo() {
  const [jobs, setJobs] = useState<JobData[]>([])

  const handleAddJob = (job: JobData) => {
    setJobs((prev) => [...prev, job])
  }

  const handleEditJob = (updatedJob: JobData) => {
    setJobs((prev) =>
      prev.map((job) => (job.id === updatedJob.id ? updatedJob : job))
    )
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Job Modal Demo</h1>
        <MinimalisticJobModal
          onAddJob={handleAddJob}
          jobStates={defaultJobStates}
          buttonLabel="Add New Job"
        />
      </div>

      {jobs.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Jobs ({jobs.length})</h2>
          <div className="grid gap-4">
            {jobs.map((job) => (
              <div key={job.id} className="border rounded-lg p-4 bg-card">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-medium">{job.company}</h3>
                    <p className="text-muted-foreground">{job.position}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span 
                      className="px-2 py-1 rounded-full text-xs"
                      style={{ 
                        backgroundColor: defaultJobStates.find(s => s.id === job.status)?.color + "20",
                        color: defaultJobStates.find(s => s.id === job.status)?.color
                      }}
                    >
                      {defaultJobStates.find(s => s.id === job.status)?.name}
                    </span>
                    <MinimalisticJobModal
                      onEditJob={handleEditJob}
                      jobToEdit={job}
                      jobStates={defaultJobStates}
                      buttonVariant="ghost"
                      buttonSize="sm"
                      buttonLabel="Edit"
                    />
                  </div>
                </div>
                
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {job.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{job.location}</span>
                    </div>
                  )}
                  {job.workMode && (
                    <div className="flex items-center gap-1">
                      <Building className="h-4 w-4" />
                      <span className="capitalize">{job.workMode}</span>
                    </div>
                  )}
                  {job.applyDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(job.applyDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {(job.salaryMin || job.salaryMax) && (
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      <span>
                        {job.salaryMin && job.salaryMax
                          ? `${job.salaryCurrency} ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}`
                          : job.salaryMin
                          ? `${job.salaryCurrency} ${job.salaryMin.toLocaleString()}+`
                          : `Up to ${job.salaryCurrency} ${job.salaryMax?.toLocaleString()}`}
                      </span>
                    </div>
                  )}
                </div>
                
                {job.tags && job.tags.length > 0 && (
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-1.5">
                      {job.tags.map((tag, index) => {
                        const gradients: Array<"blue" | "green" | "orange"> = ["blue", "green", "orange"]
                        const gradient = gradients[index % gradients.length]
                        return (
                          <TagBadge
                            key={index}
                            tag={tag}
                            gradient={gradient}
                            className="h-5 text-xs"
                          />
                        )
                      })}
                    </div>
                  </div>
                )}
                
                {job.notes && (
                  <div className="mt-3 text-sm">
                    <p className="text-muted-foreground">{job.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg bg-card">
          <h3 className="text-xl font-medium mb-2">No jobs added yet</h3>
          <p className="text-muted-foreground mb-6">
            Click the "Add New Job" button to create your first job entry
          </p>
          <MinimalisticJobModal
            onAddJob={handleAddJob}
            jobStates={defaultJobStates}
            buttonLabel="Add New Job"
          />
        </div>
      )}
    </div>
  )
}
