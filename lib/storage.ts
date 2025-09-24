import type {
  JobData,
  ResumeData,
  CoverLetterData,
  UserProfile,
  UserSettings,
  JobStatistics,
  JobState,
  WorkMode,
  LocalUser,
  SanitizedUser,
} from "./types"
import { initialJobs, defaultJobStates } from "./data"

// Keys for localStorage
const STORAGE_KEYS = {
  JOBS: "job-tracker-jobs",
  RESUMES: "job-tracker-resumes",
  COVER_LETTERS: "job-tracker-cover-letters",
  USER_PROFILE: "job-tracker-user-profile",
  USER_SETTINGS: "job-tracker-user-settings",
  JOB_STATISTICS: "job-tracker-statistics",
  JOB_STATES: "job-tracker-job-states",
  USERS: "job-tracker-users",
  ACTIVE_USER: "job-tracker-active-user",
}

const AUTH_COOKIE_NAME = "job-tracker-auth"
const GLOBAL_FALLBACK_KEY = "__global"

const isBrowser = () => typeof window !== "undefined"

const getCookie = (name: string): string | null => {
  if (!isBrowser()) return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/([.$?*|{}()\\\[\]\\\/\+^])/g, "\\$1")}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

const setCookie = (name: string, value: string, days = 30) => {
  if (!isBrowser()) return
  const expires = new Date()
  expires.setDate(expires.getDate() + days)
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires.toUTCString()}`
}

const deleteCookie = (name: string) => {
  if (!isBrowser()) return
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`
}

const readScopedStore = <T,>(key: string): Record<string, T> => {
  if (!isBrowser()) return {}
  const raw = localStorage.getItem(key)
  if (!raw) return {}

  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return { [GLOBAL_FALLBACK_KEY]: parsed as unknown as T }
    }
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, T>
    }
  } catch (error) {
    console.error(`Error parsing stored value for ${key}`, error)
  }

  return {}
}

export const getActiveUserId = (): string | null => {
  if (!isBrowser()) return null
  const local = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER)
  if (local) return local
  const cookie = getCookie(AUTH_COOKIE_NAME)
  if (cookie) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, cookie)
    return cookie
  }
  return null
}

export const setActiveUserId = (userId: string | null, remember = true) => {
  if (!isBrowser()) return
  if (userId) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, userId)
    if (remember) {
      setCookie(AUTH_COOKIE_NAME, userId)
    } else {
      setCookie(AUTH_COOKIE_NAME, userId, 1)
    }
  } else {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER)
    deleteCookie(AUTH_COOKIE_NAME)
  }
}

const getScopedValue = <T,>(key: string, fallback: T, options: { persist?: boolean } = {}): T => {
  if (!isBrowser()) return fallback

  const activeUserId = getActiveUserId()
  const raw = localStorage.getItem(key)

  if (!activeUserId) {
    if (!raw) {
      if (options.persist) {
        localStorage.setItem(key, JSON.stringify(fallback))
      }
      return fallback
    }

    try {
      return JSON.parse(raw)
    } catch (error) {
      console.error(`Error parsing stored value for ${key}`, error)
      return fallback
    }
  }

  const store = readScopedStore<T>(key)
  if (store[activeUserId] !== undefined) {
    return store[activeUserId]
  }

  const fallbackValue = store[GLOBAL_FALLBACK_KEY] ?? fallback

  if (options.persist) {
    setScopedValue(key, fallbackValue)
  }

  return fallbackValue
}

const setScopedValue = <T,>(key: string, value: T) => {
  if (!isBrowser()) return
  const activeUserId = getActiveUserId()

  if (!activeUserId) {
    localStorage.setItem(key, JSON.stringify(value))
    return
  }

  const store = readScopedStore<T>(key)
  store[activeUserId] = value
  localStorage.setItem(key, JSON.stringify(store))
}

// User management
const createEmptyProfile = (): UserProfile => ({
  fullName: "",
  username: "",
  email: "",
  skills: [],
  studies: [],
  preferences: "",
})

export const createDefaultSettings = (): UserSettings => ({
  theme: "system",
  compactView: false,
  animations: true,
  defaultView: "kanban",
  notifications: {
    email: {
      interviewReminders: true,
      applicationDeadlines: true,
      weeklySummary: true,
    },
    inApp: {
      statusChanges: true,
      followUpReminders: true,
    },
  },
  dataManagement: {
    automaticBackups: true,
    analytics: true,
  },
  language: "en",
  dateFormat: "MM/DD/YYYY",
  defaultJobView: "kanban",
  defaultSortField: "date",
  defaultSortOrder: "desc",
  defaultFilters: {},
  jobStates: defaultJobStates.map((state) => ({ ...state })),
})

export const getUsers = (): LocalUser[] => {
  if (!isBrowser()) return []
  const raw = localStorage.getItem(STORAGE_KEYS.USERS)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed as LocalUser[]
    }
  } catch (error) {
    console.error("Error parsing users", error)
  }
  return []
}

export const saveUsers = (users: LocalUser[]): void => {
  if (!isBrowser()) return
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
}

export const findUserByUsername = (username: string): LocalUser | undefined =>
  getUsers().find((user) => user.username.toLowerCase() === username.toLowerCase())

export const findUserByEmail = (email: string): LocalUser | undefined =>
  getUsers().find((user) => user.email.toLowerCase() === email.toLowerCase())

export const getActiveUser = (): LocalUser | null => {
  const userId = getActiveUserId()
  if (!userId) return null
  return getUsers().find((user) => user.id === userId) ?? null
}

export const upsertUser = (user: LocalUser): void => {
  const users = getUsers()
  const index = users.findIndex((existing) => existing.id === user.id)
  if (index >= 0) {
    users[index] = user
  } else {
    users.push(user)
  }
  saveUsers(users)
}

export const deleteUserById = (userId: string): void => {
  const users = getUsers().filter((user) => user.id !== userId)
  saveUsers(users)
}

export const getActiveUserProfile = (): UserProfile => {
  const activeUser = getActiveUser()
  if (!activeUser) {
    return createEmptyProfile()
  }

  return {
    fullName: activeUser.fullName,
    username: activeUser.username,
    email: activeUser.email,
    phone: activeUser.phone,
    birthday: activeUser.birthday,
    preferences: activeUser.preferences,
    skills: activeUser.skills ?? [],
    studies: activeUser.studies ?? [],
    university: activeUser.university,
    school: activeUser.school,
    highSchool: activeUser.highSchool,
    about: activeUser.about,
    photo: activeUser.photo,
  }
}

export const updateActiveUserProfile = (profile: Partial<UserProfile>): LocalUser | null => {
  const activeUser = getActiveUser()
  if (!activeUser) return null

  const updatedUser: LocalUser = {
    ...activeUser,
    ...profile,
    skills: profile.skills ?? activeUser.skills ?? [],
    studies: profile.studies ?? activeUser.studies ?? [],
    updatedAt: new Date().toISOString(),
  }

  upsertUser(updatedUser)
  return updatedUser
}

export const exportActiveUser = (): SanitizedUser | null => {
  const activeUser = getActiveUser()
  if (!activeUser) return null
  const { passwordHash, ...rest } = activeUser
  return rest
}

export const importUserProfile = (profile: UserProfile): SanitizedUser | null => {
  const activeUser = getActiveUser()
  if (!activeUser) return null

  const updatedUser: LocalUser = {
    ...activeUser,
    ...profile,
    skills: profile.skills ?? [],
    studies: profile.studies ?? [],
    updatedAt: new Date().toISOString(),
  }

  upsertUser(updatedUser)
  const { passwordHash, ...rest } = updatedUser
  return rest
}

// Jobs
export const getJobs = (): JobData[] => {
  if (!isBrowser()) return initialJobs
  return getScopedValue<JobData[]>(STORAGE_KEYS.JOBS, initialJobs, { persist: true })
}

export const saveJobs = (jobs: JobData[]): void => {
  if (!isBrowser()) return
  setScopedValue(STORAGE_KEYS.JOBS, jobs)
}

export const addJob = (job: JobData): JobData[] => {
  const jobs = getJobs()
  const updatedJobs = [...jobs, job]
  saveJobs(updatedJobs)
  return updatedJobs
}

export const updateJob = (updatedJob: JobData): JobData[] => {
  const jobs = getJobs()
  const updatedJobs = jobs.map((job) => (job.id === updatedJob.id ? updatedJob : job))
  saveJobs(updatedJobs)
  return updatedJobs
}

export const deleteJob = (jobId: string): JobData[] => {
  const jobs = getJobs()
  const updatedJobs = jobs.filter((job) => job.id !== jobId)
  saveJobs(updatedJobs)
  return updatedJobs
}

// Job States
export const getJobStates = (): JobState[] => {
  if (!isBrowser()) return defaultJobStates
  const states = getScopedValue<JobState[]>(STORAGE_KEYS.JOB_STATES, defaultJobStates, { persist: true })
  return [...states].sort((a, b) => a.order - b.order)
}

export const saveJobStates = (states: JobState[]): void => {
  if (!isBrowser()) return
  setScopedValue(STORAGE_KEYS.JOB_STATES, states)
}

export const addJobState = (state: JobState): JobState[] => {
  const states = getJobStates()

  // Ensure the ID is unique
  if (states.some((s) => s.id === state.id)) {
    state.id = `${state.id}-${Date.now()}`
  }

  // Set the order to be after the last state
  if (state.order === undefined) {
    const maxOrder = Math.max(...states.map((s) => s.order), 0)
    state.order = maxOrder + 1
  }

  const updatedStates = [...states, state]
  saveJobStates(updatedStates)
  return updatedStates
}

export const updateJobState = (updatedState: JobState): JobState[] => {
  const states = getJobStates()
  const updatedStates = states.map((state) => (state.id === updatedState.id ? updatedState : state))
  saveJobStates(updatedStates)
  return updatedStates
}

export const deleteJobState = (stateId: string): { states: JobState[]; jobs: JobData[] } => {
  const states = getJobStates()
  const jobs = getJobs()

  // Find the state to delete
  const stateToDelete = states.find((s) => s.id === stateId)

  // Cannot delete if it's the only state or a system state
  if (!stateToDelete || states.length <= 1 || stateToDelete.isSystem) {
    return { states, jobs }
  }

  // Find a default state to move jobs to
  const defaultState = states.find((s) => s.isDefault) || states[0]

  // Move jobs from the deleted state to the default state
  const updatedJobs = jobs.map((job) => (job.status === stateId ? { ...job, status: defaultState.id } : job))

  // Remove the state
  const updatedStates = states.filter((state) => state.id !== stateId)

  // Ensure there's always a default state
  if (stateToDelete.isDefault && updatedStates.length > 0) {
    updatedStates[0].isDefault = true
  }

  // Save changes
  saveJobStates(updatedStates)
  saveJobs(updatedJobs)

  return { states: updatedStates, jobs: updatedJobs }
}

// Resumes
export const getResumes = (): ResumeData[] => {
  if (!isBrowser()) return []
  return getScopedValue<ResumeData[]>(STORAGE_KEYS.RESUMES, [])
}

// Update the saveResumes function to handle File objects
export const saveResumes = (resumes: ResumeData[]): void => {
  if (!isBrowser()) return

  // Create a serializable version of resumes without File objects
  const serializableResumes = resumes.map((resume) => {
    const { file, ...rest } = resume
    return rest
  })

  setScopedValue(STORAGE_KEYS.RESUMES, serializableResumes)
}

// Update the addResume function to handle File objects
export const addResume = (resume: ResumeData): ResumeData[] => {
  const resumes = getResumes()
  const updatedResumes = [...resumes, resume]
  saveResumes(updatedResumes)
  return updatedResumes
}

export const updateResume = (updatedResume: ResumeData): ResumeData[] => {
  const resumes = getResumes()
  const updatedResumes = resumes.map((resume) => (resume.id === updatedResume.id ? updatedResume : resume))
  saveResumes(updatedResumes)
  return updatedResumes
}

export const deleteResume = (resumeId: string): ResumeData[] => {
  const resumes = getResumes()
  const updatedResumes = resumes.filter((resume) => resume.id !== resumeId)
  saveResumes(updatedResumes)
  return updatedResumes
}

// Cover Letters
export const getCoverLetters = (): CoverLetterData[] => {
  if (!isBrowser()) return []
  return getScopedValue<CoverLetterData[]>(STORAGE_KEYS.COVER_LETTERS, [])
}

export const saveCoverLetters = (letters: CoverLetterData[]): void => {
  if (!isBrowser()) return
  setScopedValue(STORAGE_KEYS.COVER_LETTERS, letters)
}

export const addCoverLetter = (letter: CoverLetterData): CoverLetterData[] => {
  const letters = getCoverLetters()
  const updatedLetters = [...letters, letter]
  saveCoverLetters(updatedLetters)
  return updatedLetters
}

export const updateCoverLetter = (updatedLetter: CoverLetterData): CoverLetterData[] => {
  const letters = getCoverLetters()
  const updatedLetters = letters.map((letter) => (letter.id === updatedLetter.id ? updatedLetter : letter))
  saveCoverLetters(updatedLetters)
  return updatedLetters
}

export const deleteCoverLetter = (letterId: string): CoverLetterData[] => {
  const letters = getCoverLetters()
  const updatedLetters = letters.filter((letter) => letter.id !== letterId)
  saveCoverLetters(updatedLetters)
  return updatedLetters
}

// User Profile
export const getUserProfile = (): UserProfile => {
  if (!isBrowser()) {
    return createEmptyProfile()
  }

  const profile = getScopedValue<UserProfile>(STORAGE_KEYS.USER_PROFILE, getActiveUserProfile())

  // Ensure arrays exist
  return {
    ...createEmptyProfile(),
    ...profile,
    skills: profile.skills ?? [],
    studies: profile.studies ?? [],
  }
}

export const saveUserProfile = (profile: UserProfile): void => {
  if (!isBrowser()) return
  setScopedValue(STORAGE_KEYS.USER_PROFILE, profile)
  updateActiveUserProfile(profile)
}

// User Settings
export const getUserSettings = (): UserSettings => {
  const fallback = createDefaultSettings()

  if (!isBrowser()) {
    return fallback
  }

  const stored = getScopedValue<UserSettings>(STORAGE_KEYS.USER_SETTINGS, fallback, { persist: true })

  const normalized: UserSettings = {
    ...fallback,
    ...stored,
    jobStates:
      stored.jobStates && stored.jobStates.length > 0
        ? stored.jobStates
        : defaultJobStates.map((state) => ({ ...state })),
  }

  if (!stored.jobStates || stored.jobStates.length === 0) {
    saveUserSettings(normalized)
  }

  return normalized
}

export const saveUserSettings = (settings: UserSettings): void => {
  if (!isBrowser()) return
  setScopedValue(STORAGE_KEYS.USER_SETTINGS, settings)

  // Apply theme change immediately
  if (settings.theme === "dark") {
    document.documentElement.classList.add("dark")
    document.documentElement.classList.remove("light")
  } else if (settings.theme === "light") {
    document.documentElement.classList.add("light")
    document.documentElement.classList.remove("dark")
  } else {
    // System theme
    document.documentElement.classList.remove("light", "dark")

    // Check system preference
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.add("light")
    }
  }
}

// Job Statistics
export const getJobStatistics = (): JobStatistics => {
  const fallbackStats = calculateStatistics(getJobs())

  if (!isBrowser()) {
    return fallbackStats
  }

  return getScopedValue<JobStatistics>(STORAGE_KEYS.JOB_STATISTICS, fallbackStats)
}

export const saveJobStatistics = (stats: JobStatistics): void => {
  if (!isBrowser()) return
  setScopedValue(STORAGE_KEYS.JOB_STATISTICS, stats)
}

export const updateStatistics = (): JobStatistics => {
  const jobs = getJobs()
  const stats = calculateStatistics(jobs)
  saveJobStatistics(stats)
  return stats
}

// Helper function to calculate statistics from jobs
const calculateStatistics = (jobs: JobData[]): JobStatistics => {
  const totalApplications = jobs.length

  // Status distribution
  const statusDistribution: Record<string, number> = {}

  // Get all job states
  const jobStates = getJobStates()

  // Initialize all states with 0
  jobStates.forEach((state) => {
    statusDistribution[state.id] = 0
  })

  // Count jobs by status
  jobs.forEach((job) => {
    if (statusDistribution[job.status] !== undefined) {
      statusDistribution[job.status]++
    } else {
      // If status doesn't exist in distribution (might be a deleted state)
      statusDistribution[job.status] = 1
    }
  })

  // Calculate rates
  const interviewCount = statusDistribution.interview || 0
  const offerCount = statusDistribution.offer || 0
  const acceptedCount = statusDistribution.accepted || 0
  const rejectedCount = statusDistribution.rejected || 0

  const appliedCount = (statusDistribution.applied || 0) + interviewCount + offerCount + acceptedCount + rejectedCount

  const interviewRate = appliedCount > 0 ? Math.round((interviewCount / appliedCount) * 100) : 0
  const offerRate = appliedCount > 0 ? Math.round(((offerCount + acceptedCount) / appliedCount) * 100) : 0

  // Extract keywords from job descriptions
  const keywords: Record<string, number> = {}
  const keywordRegex =
    /react|javascript|typescript|node\.js|next\.js|vue|angular|css|html|tailwind|bootstrap|aws|azure|gcp|sql|nosql|mongodb|postgresql|express|graphql|rest|api|git|docker|kubernetes|ci\/cd|agile|scrum/gi

  jobs.forEach((job) => {
    if (job.description) {
      const matches = job.description.match(keywordRegex) || []
      matches.forEach((match) => {
        const keyword = match.toLowerCase()
        keywords[keyword] = (keywords[keyword] || 0) + 1
      })
    }

    job.skills?.forEach((tag) => {
      const keyword = tag.toLowerCase()
      keywords[keyword] = (keywords[keyword] || 0) + 1
    })
  })

  // Convert to percentage
  const keywordAnalysis = Object.entries(keywords)
    .map(([keyword, count]) => ({
      keyword: keyword.charAt(0).toUpperCase() + keyword.slice(1),
      percentage: Math.round((count / totalApplications) * 100),
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 10)

  // Calculate applications by month
  const applicationsByMonth: Record<string, number> = {}

  jobs.forEach((job) => {
    if (job.date) {
      const date = new Date(job.date)
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`
      applicationsByMonth[monthYear] = (applicationsByMonth[monthYear] || 0) + 1
    }
  })

  // Calculate response rate by company
  const responseRateByCompany: Record<string, number> = {}

  const companiesWithResponses = new Set<string>()
  const companiesApplied = new Set<string>()

  jobs.forEach((job) => {
    if (job.company) {
      if (
        job.status === "applied" ||
        job.status === "interview" ||
        job.status === "offer" ||
        job.status === "accepted" ||
        job.status === "rejected"
      ) {
        companiesApplied.add(job.company)
      }

      if (
        job.status === "interview" ||
        job.status === "offer" ||
        job.status === "accepted" ||
        job.status === "rejected"
      ) {
        companiesWithResponses.add(job.company)
      }
    }
  })

  companiesApplied.forEach((company) => {
    responseRateByCompany[company] = companiesWithResponses.has(company) ? 100 : 0
  })

  // Calculate applications by work mode
  const applicationsByWorkMode: Record<string, number> = {
    remote: 0,
    onsite: 0,
    hybrid: 0,
    flexible: 0,
  }

  jobs.forEach((job) => {
    if (job.workMode && applicationsByWorkMode[job.workMode] !== undefined) {
      applicationsByWorkMode[job.workMode]++
    }
  })

  // Recent activity (would normally be based on a log of actions)
  const recentActivity = [
    {
      id: "1",
      type: "applied",
      description: "Applied to Frontend Developer at Vercel",
      date: "2 days ago",
      color: "bg-green-500",
    },
    {
      id: "2",
      type: "interview",
      description: "Interview scheduled with Stripe",
      date: "3 days ago",
      color: "bg-amber-500",
    },
    { id: "3", type: "rejected", description: "Rejected from Netflix", date: "1 week ago", color: "bg-red-500" },
    { id: "4", type: "wishlist", description: "Added Google to wishlist", date: "1 week ago", color: "bg-blue-500" },
  ]

  return {
    totalApplications,
    interviewRate,
    offerRate,
    averageResponseTime: 7, // This would normally be calculated from actual data
    statusDistribution,
    keywordAnalysis,
    recentActivity,
    applicationsByMonth,
    responseRateByCompany,
    topSkillsRequested: {
      technical: keywordAnalysis.filter((k) => k.percentage > 50),
      soft: [],
      requirements: [],
    },
    averageSalaryRange: {
      min: 0,
      max: 0,
      currency: "USD",
    },
    applicationsByWorkMode,
  }
}

// Export data in different formats
export const exportToJSON = (): string => {
  // Import the prepareJobsForExport function
  const { prepareJobsForExport } = require('./migration');

  // Get jobs and ensure they have proper field order and structure
  const jobs = prepareJobsForExport(getJobs());

  const data = {
    jobs: jobs,
    resumes: getResumes(),
    coverLetters: getCoverLetters(),
    userProfile: getUserProfile(),
    userSettings: getUserSettings(),
    statistics: getJobStatistics(),
    jobStates: getJobStates(),
  }

  return JSON.stringify(data, null, 2)
}

export const exportToCSV = (): string => {
  // Import the prepareJobsForExport function
  const { prepareJobsForExport } = require('./migration');

  // Get jobs and ensure they have proper work mode and location
  const jobs = prepareJobsForExport(getJobs());

  // CSV header with all fields including the new ones
  let csv = "ID,Company,Position,Location,WorkMode,SalaryMin,SalaryMax,SalaryCurrency,Date,ApplyDate,Status,Notes,URL,Priority,Skills,SoftSkills,Requirements,Description,ContactEmail,ContactPhone,Studies\n"

  // Add each job as a row
  jobs.forEach((job: JobData) => {
    const row = [
      job.id,
      `"${job.company?.replace(/"/g, '""') || ""}"`,
      `"${job.position?.replace(/"/g, '""') || ""}"`,
      job.location ? `"${job.location.replace(/"/g, '""')}"` : "",
      job.workMode || "",
      job.salaryMin || "",
      job.salaryMax || "",
      job.salaryCurrency || "",
      job.date || "",
      job.applyDate || "",
      job.status,
      job.notes ? `"${job.notes.replace(/"/g, '""')}"` : "",
      job.url ? `"${job.url.replace(/"/g, '""')}"` : "",
      job.priority || "",
      job.skills ? `"${job.skills.join(",").replace(/"/g, '""')}"` : job.tags ? `"${job.tags.join(",").replace(/"/g, '""')}"` : "",
      job.softSkills ? `"${job.softSkills.join(",").replace(/"/g, '""')}"` : "",
      job.requirements ? `"${job.requirements.join(",").replace(/"/g, '""')}"` : "",
      job.description ? `"${job.description.replace(/"/g, '""')}"` : "",
      job.contactEmail ? `"${job.contactEmail.replace(/"/g, '""')}"` : "",
      job.contactPhone ? `"${job.contactPhone.replace(/"/g, '""')}"` : "",
      job.studies ? `"${job.studies.join(",").replace(/"/g, '""')}"` : "",
    ]

    csv += row.join(",") + "\n"
  })

  return csv
}

export const exportJobsToJSON = (): string => {
  const { prepareJobsForExport } = require('./migration');
  const jobs = prepareJobsForExport(getJobs());
  return JSON.stringify(jobs, null, 2)
}

export const exportUserProfileToJSON = (): string => {
  return JSON.stringify(getUserProfile(), null, 2)
}

export const exportUserSettingsToJSON = (): string => {
  return JSON.stringify(getUserSettings(), null, 2)
}

// Import data
export const importFromJSON = (jsonData: string): void => {
  try {
    const data = JSON.parse(jsonData)

    // Import the migration function
    const { migrateJobData } = require('./migration');

    // Process jobs to ensure they use the new format
    if (data.jobs) {
      // First save the imported jobs
      saveJobs(data.jobs);

      // Then run the migration to fix any issues with location, work mode, and skill categories
      migrateJobData();
    }

    if (data.resumes) saveResumes(data.resumes)
    if (data.coverLetters) saveCoverLetters(data.coverLetters)
    if (data.userProfile) saveUserProfile(data.userProfile)
    if (data.userSettings) saveUserSettings(data.userSettings)
    if (data.statistics) saveJobStatistics(data.statistics)
    if (data.jobStates) saveJobStates(data.jobStates)
  } catch (error) {
    console.error("Error importing data:", error)
    throw new Error("Invalid JSON format")
  }
}

export const importJobsFromJSON = (jsonData: string): void => {
  try {
    const jobs = JSON.parse(jsonData)
    if (!Array.isArray(jobs)) {
      throw new Error("Jobs data must be an array")
    }

    saveJobs(jobs as JobData[])
    const { migrateJobData } = require('./migration');
    migrateJobData()
  } catch (error) {
    console.error("Error importing jobs JSON", error)
    throw new Error("Invalid jobs JSON format")
  }
}

export const importUserProfileFromJSON = (jsonData: string): void => {
  try {
    const profile = JSON.parse(jsonData)
    saveUserProfile({
      ...createEmptyProfile(),
      ...profile,
      skills: profile?.skills ?? [],
      studies: profile?.studies ?? [],
    })
  } catch (error) {
    console.error("Error importing user profile", error)
    throw new Error("Invalid profile JSON format")
  }
}

export const importUserSettingsFromJSON = (jsonData: string): void => {
  try {
    const settings = JSON.parse(jsonData)
    saveUserSettings({
      ...createDefaultSettings(),
      ...settings,
      jobStates: settings?.jobStates && settings.jobStates.length > 0
        ? settings.jobStates
        : defaultJobStates.map((state: JobState) => ({ ...state })),
    })
  } catch (error) {
    console.error("Error importing user settings", error)
    throw new Error("Invalid settings JSON format")
  }
}

// Helper function to parse salary string into structured format
export const parseSalaryString = (salaryStr: string): Partial<JobData> => {
  try {
    // Remove currency symbols and other non-numeric characters
    const cleanStr = salaryStr.replace(/[^0-9\-\s\.k]/gi, '');

    // Check for salary range format (e.g., "120k - 150k" or "120,000 - 150,000")
    const rangeMatch = cleanStr.match(/(\d+\.?\d*k?)\s*-\s*(\d+\.?\d*k?)/i);

    if (rangeMatch) {
      const min = parseKValue(rangeMatch[1]);
      const max = parseKValue(rangeMatch[2]);

      // Determine currency from original string
      const currency = determineCurrency(salaryStr);

      return {
        salaryMin: min,
        salaryMax: max,
        salaryCurrency: currency
      };
    }

    // Check for single value with plus (e.g., "120k+")
    const plusMatch = cleanStr.match(/(\d+\.?\d*k?)\+/i);
    if (plusMatch) {
      const min = parseKValue(plusMatch[1]);
      const currency = determineCurrency(salaryStr);

      return {
        salaryMin: min,
        salaryCurrency: currency
      };
    }

    // Check for single value (e.g., "120k")
    const singleMatch = cleanStr.match(/(\d+\.?\d*k?)/i);
    if (singleMatch) {
      const value = parseKValue(singleMatch[1]);
      const currency = determineCurrency(salaryStr);

      return {
        salaryMin: value,
        salaryMax: value,
        salaryCurrency: currency
      };
    }

    // Default return if no pattern matches
    return {};
  } catch (e) {
    console.error("Error parsing salary string:", e);
    return {};
  }
}

// Helper to parse values with 'k' notation (e.g., 120k -> 120000)
const parseKValue = (value: string): number => {
  if (value.toLowerCase().includes('k')) {
    return parseFloat(value.toLowerCase().replace('k', '')) * 1000;
  }
  return parseFloat(value);
}

// Helper to determine currency from salary string
const determineCurrency = (salaryStr: string): string => {
  if (salaryStr.includes('$') || salaryStr.includes('USD')) return 'USD';
  if (salaryStr.includes('€') || salaryStr.includes('EUR')) return 'EUR';
  if (salaryStr.includes('£') || salaryStr.includes('GBP')) return 'GBP';
  if (salaryStr.includes('¥') || salaryStr.includes('JPY')) return 'JPY';
  if (salaryStr.includes('₹') || salaryStr.includes('INR')) return 'INR';
  if (salaryStr.includes('C$') || salaryStr.includes('CAD')) return 'CAD';
  if (salaryStr.includes('A$') || salaryStr.includes('AUD')) return 'AUD';
  return 'USD'; // Default to USD
}

// Import from CSV
export const importFromCSV = (csvData: string): void => {
  try {
    // Split the CSV into rows
    const rows = csvData.split("\n")

    // Extract headers (first row)
    const headers = rows[0].toLowerCase().split(",")

    // Determine if this is the new format or old format
    const isNewFormat = headers.includes("workmode") || headers.includes("salarymin") || headers.includes("salarymax")

    // Process each data row
    const jobs: JobData[] = []

    for (let i = 1; i < rows.length; i++) {
      if (!rows[i].trim()) continue // Skip empty rows

      // Parse CSV row, handling quoted fields with commas
      const values: string[] = []
      let currentValue = ""
      let insideQuotes = false

      for (const char of rows[i]) {
        if (char === '"') {
          insideQuotes = !insideQuotes
        } else if (char === "," && !insideQuotes) {
          values.push(currentValue)
          currentValue = ""
        } else {
          currentValue += char
        }
      }
      values.push(currentValue) // Add the last value

      // Create job object based on the detected format
      let job: Partial<JobData>

      if (isNewFormat) {
        // Check if this is the newest format with separate skill categories
        const hasSkillCategories = headers.includes("softskills") || headers.includes("requirements");

        if (hasSkillCategories) {
          // Newest format with separate skill categories
          job = {
            id: values[0] || Date.now().toString(),
            company: values[1]?.replace(/^"|"$/g, "") || "",
            position: values[2]?.replace(/^"|"$/g, "") || "",
            location: values[3]?.replace(/^"|"$/g, "") || undefined,
            workMode: values[4] as WorkMode || undefined,
            salaryMin: values[5] ? Number(values[5]) : undefined,
            salaryMax: values[6] ? Number(values[6]) : undefined,
            salaryCurrency: values[7] || undefined,
            date: values[8] || undefined,
            applyDate: values[9] || undefined,
            status: (values[10] as any) || "wishlist",
            notes: values[11]?.replace(/^"|"$/g, "") || undefined,
            url: values[12]?.replace(/^"|"$/g, "") || undefined,
            priority: values[13] ? Number.parseInt(values[13]) : undefined,
            // Technical skills
            skills:
              values[14]
                ?.replace(/^"|"$/g, "")
                .split(",")
                .map((tag) => tag.trim()) || [],
            softSkills:
              values[15]
                ?.replace(/^"|"$/g, "")
                .split(",")
                .map((tag) => tag.trim()) || [],
            requirements:
              values[16]
                ?.replace(/^"|"$/g, "")
                .split(",")
                .map((tag) => tag.trim()) || [],
            description: values[17]?.replace(/^"|"$/g, "") || undefined,
            contactEmail: values[18]?.replace(/^"|"$/g, "") || undefined,
            contactPhone: values[19]?.replace(/^"|"$/g, "") || undefined,
            studies:
              values[20]
                ?.replace(/^"|"$/g, "")
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean) || [],
          }
        } else {
          // New format with separate location and work modality but without skill categories
          job = {
            id: values[0] || Date.now().toString(),
            company: values[1]?.replace(/^"|"$/g, "") || "",
            position: values[2]?.replace(/^"|"$/g, "") || "",
            location: values[3]?.replace(/^"|"$/g, "") || undefined,
            workMode: values[4] as WorkMode || undefined,
            salaryMin: values[5] ? Number(values[5]) : undefined,
            salaryMax: values[6] ? Number(values[6]) : undefined,
            salaryCurrency: values[7] || undefined,
            date: values[8] || undefined,
            applyDate: values[9] || undefined,
            status: (values[10] as any) || "wishlist",
            notes: values[11]?.replace(/^"|"$/g, "") || undefined,
            url: values[12]?.replace(/^"|"$/g, "") || undefined,
            priority: values[13] ? Number.parseInt(values[13]) : undefined,
            // Technical skills
            skills:
              values[14]
                ?.replace(/^"|"$/g, "")
                .split(",")
                .map((tag) => tag.trim()) || [],
            description: values[15]?.replace(/^"|"$/g, "") || undefined,
            // Initialize empty arrays for the new skill categories
            softSkills: [],
            requirements: [],
            contactEmail: values[16]?.replace(/^"|"$/g, "") || undefined,
            contactPhone: values[17]?.replace(/^"|"$/g, "") || undefined,
            studies:
              values[18]
                ?.replace(/^"|"$/g, "")
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean) || [],
          }
        }
      } else {
        // Old format with combined location/work modality and single salary field
        job = {
          id: values[0] || Date.now().toString(),
          company: values[1]?.replace(/^"|"$/g, "") || "",
          position: values[2]?.replace(/^"|"$/g, "") || "",
          location: values[3]?.replace(/^"|"$/g, "") || undefined,
          salary: values[4]?.replace(/^"|"$/g, "") || undefined,
          date: values[5] || undefined,
          status: (values[6] as any) || "wishlist",
          notes: values[7]?.replace(/^"|"$/g, "") || undefined,
          url: values[8]?.replace(/^"|"$/g, "") || undefined,
          priority: values[9] ? Number.parseInt(values[9]) : undefined,
          // Technical skills
          skills:
            values[10]
              ?.replace(/^"|"$/g, "")
              .split(",")
              .map((tag) => tag.trim()) || [],
          description: values[11]?.replace(/^"|"$/g, "") || undefined,

          // Set default work mode based on location if possible
          workMode: values[3]?.toLowerCase().includes("remote") ? "remote" :
                   values[3]?.toLowerCase().includes("hybrid") ? "hybrid" : undefined,

          // Initialize empty arrays for the new skill categories
          softSkills: [],
          requirements: [],
          contactEmail: values[12]?.replace(/^"|"$/g, "") || undefined,
          contactPhone: values[13]?.replace(/^"|"$/g, "") || undefined,
          studies:
            values[14]
              ?.replace(/^"|"$/g, "")
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean) || [],
        }
      }

      jobs.push(job as JobData)
    }

    // Save the imported jobs
    saveJobs([...getJobs(), ...jobs])

    // Import the migration function and run it to fix any issues
    const { migrateJobData } = require('./migration');
    migrateJobData();
  } catch (error) {
    console.error("Error importing CSV data:", error)
    throw new Error("Invalid CSV format")
  }
}

// ATS Analysis
export const analyzeResume = (
  resumeText: string,
  jobDescription: string,
): { score: number; missingKeywords: string[]; matchedKeywords: string[] } => {
  // Extract keywords from job description
  // Enhanced regex to catch more technical terms and variations
  const keywordRegex =
    /\b(react|javascript|typescript|node\.?js|next\.?js|vue|angular|css|html|tailwind|bootstrap|aws|azure|gcp|sql|nosql|mongodb|postgresql|express|graphql|rest|api|git|docker|kubernetes|ci\/cd|agile|scrum|java|python|c\+\+|c#|\.net|php|ruby|go|golang|swift|kotlin|flutter|mobile|android|ios|react\s?native|frontend|backend|full\s?stack|devops|cloud|testing|qa|ui\/ux|design|figma|sketch|adobe|photoshop|illustrator|xd|communication|teamwork|leadership|problem[\s-]solving|analytical|detail[\s-]oriented|time[\s-]management|project[\s-]management|jira|confluence|trello|asana)\b/gi

  // Convertir a minúsculas para comparación insensible a mayúsculas/minúsculas
  const resumeTextLower = resumeText.toLowerCase()
  const jobDescriptionLower = jobDescription.toLowerCase()

  // Extraer palabras clave únicas del texto del trabajo
  const jobKeywords = new Set<string>()
  let match

  // Reiniciar el regex para cada búsqueda
  keywordRegex.lastIndex = 0
  while ((match = keywordRegex.exec(jobDescriptionLower)) !== null) {
    jobKeywords.add(match[0].toLowerCase())
  }

  // Verificar qué palabras clave están en el resumen
  const matchedKeywords: string[] = []
  const missingKeywords: string[] = []

  jobKeywords.forEach((keyword) => {
    // Reiniciar el regex para cada palabra clave
    keywordRegex.lastIndex = 0

    // Crear un patrón para buscar la palabra clave
    const keywordPattern = new RegExp(`\\b${keyword}\\b`, "i")

    if (keywordPattern.test(resumeTextLower)) {
      matchedKeywords.push(keyword)
    } else {
      missingKeywords.push(keyword)
    }
  })

  // Calcular puntuación de coincidencia
  const score = jobKeywords.size > 0 ? Math.round((matchedKeywords.length / jobKeywords.size) * 100) : 100

  // Ordenar palabras clave alfabéticamente para mejor presentación
  matchedKeywords.sort()
  missingKeywords.sort()

  return {
    score,
    matchedKeywords,
    missingKeywords,
  }
}
