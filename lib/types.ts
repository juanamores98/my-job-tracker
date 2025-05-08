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
  location?: string
  salary?: string
  date?: string
  status: ColumnType
  notes?: string
  url?: string
  priority?: number
  tags?: string[]
  description?: string
  // New fields
  applyDate?: string
  followUpDate?: string
  workMode?: WorkMode
  excitement?: number // 1-5 rating
  salaryMin?: number
  salaryMax?: number
  salaryCurrency?: string
  contactPerson?: string
  contactEmail?: string
  benefits?: string[]
  interviewNotes?: string[]
}

export interface ResumeData {
  id: string
  title: string
  lastUpdated: string
  format: string
  size: string
  content?: string
  file?: File
  url?: string
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
  tags?: string[]
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
