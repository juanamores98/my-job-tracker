export type JobStatus = string

export type ColumnType = JobStatus

export type WorkMode = "remote" | "onsite" | "hybrid" | "flexible"

export interface JobState {
  id: string
  name: string
  color: string
  order: number
  isDefault?: boolean
  isSystem?: boolean
}

export interface JobData {
  id: string
  company: string
  position: string
  location?: string // City and country
  salary?: string // Legacy field for backward compatibility
  date?: string
  status: ColumnType
  notes?: string
  url?: string
  priority?: number
  skills?: string[] // Technical skills
  tags?: string[] // Legacy field for backward compatibility (technical skills)
  softSkills?: string[] // Soft skills like communication, teamwork, etc.
  requirements?: string[] // Job requirements like education, experience, etc.
  description?: string
  // Work modality as a separate field
  workMode?: WorkMode
  // Salary information
  salaryMin?: number
  salaryMax?: number
  salaryCurrency?: string
  // Dates
  applyDate?: string
  followUpDate?: string
  // Additional fields
  contactPerson?: string
  contactEmail?: string
  benefits?: string[]
  interviewNotes?: string[]
}

export interface ResumeData {
  id: string
  originalName: string // Original uploaded file name
  title: string // User-editable display name
  lastUpdated: string // ISO date string of upload/update
  format: string // e.g., 'application/pdf', 'application/msword' (MIME type)
  size: string // File size in a readable format (e.g., "2.5 MB")
  content?: string // Base64 encoded file content for localStorage
  file?: File // Transient, for upload/download handling
  url?: string // Blob URL for preview/download
  // New fields
  version?: string
  targetPosition?: string
  tailoredFor?: string // Company or job
  skills?: string[]
}

export interface CoverLetterData {
  id: string
  title: string
  company?: string
  lastUpdated: string
  content: string
  // New fields
  version?: string
  targetPosition?: string
  tailoredFor?: string // Company or job
  keyPoints?: string[]
}

export interface UserProfile {
  firstName: string
  lastName: string
  email: string
  title: string
  bio: string
  skills: string[]
  avatar?: string
  social: {
    linkedin?: string
    github?: string
    portfolio?: string
  }
  // New fields
  location?: string
  phone?: string
  preferredWorkMode?: WorkMode[]
  targetPositions?: string[]
  targetIndustries?: string[]
  targetLocations?: string[]
  salaryExpectation?: {
    min?: number
    max?: number
    currency?: string
  }
}

export interface UserSettings {
  theme: "light" | "dark" | "system"
  compactView: boolean
  animations: boolean
  defaultView: "kanban" | "table" | "calendar"
  notifications: {
    email: {
      interviewReminders: boolean
      applicationDeadlines: boolean
      weeklySummary: boolean
    }
    inApp: {
      statusChanges: boolean
      followUpReminders: boolean
    }
  }
  dataManagement: {
    automaticBackups: boolean
    analytics: boolean
  }
  // New fields
  language: string
  dateFormat: string
  defaultJobView: "kanban" | "table" | "calendar"
  defaultSortField: string
  defaultSortOrder: "asc" | "desc"
  defaultFilters: Record<string, any>
  jobStates: JobState[]
}

export interface KeywordAnalysis {
  keyword: string
  percentage: number
}

export interface JobStatistics {
  totalApplications: number
  interviewRate: number
  offerRate: number
  averageResponseTime: number
  statusDistribution: Record<ColumnType, number>
  keywordAnalysis: KeywordAnalysis[]
  recentActivity: {
    id: string
    type: string
    description: string
    date: string
    color: string
  }[]
  // New fields
  applicationsByMonth: Record<string, number>
  responseRateByCompany: Record<string, number>
  topSkillsRequested: {
    technical: KeywordAnalysis[]
    soft: KeywordAnalysis[]
    requirements: KeywordAnalysis[]
  }
  averageSalaryRange: {
    min: number
    max: number
    currency: string
  }
  applicationsByWorkMode: Record<WorkMode, number>
}

// New interfaces for advanced filtering
export interface JobFilter {
  status?: ColumnType[]
  dateRange?: {
    start?: string
    end?: string
  }
  excitement?: number[]
  salaryRange?: {
    min?: number
    max?: number
    currency?: string
  }
  workMode?: WorkMode[]
  location?: string[]
  company?: string[]
  skills?: string[]
  softSkills?: string[]
  requirements?: string[]
  searchTerm?: string
}

export interface SortOption {
  field: string
  order: "asc" | "desc"
}

export interface GroupOption {
  field: "company" | "location" | "status" | "workMode" | "date" | "none"
}

// New interface for user authentication
export interface UserAuth {
  id: string
  email: string
  role: "guest" | "user" | "admin"
  createdAt: string
  lastLogin?: string
  isVerified: boolean
}

// New interface for extraction progress
export interface ExtractionProgress {
  status: "idle" | "extracting" | "success" | "error"
  progress: number
  message?: string
  extractedData?: Partial<JobData>
  error?: string
}

// New interface for extraction result
export interface ExtractionResult {
  success: boolean
  data?: Partial<JobData>
  error?: string
  extractedFields: string[]
  missingFields: string[]
}
