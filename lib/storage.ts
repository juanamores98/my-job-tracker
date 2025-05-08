import type { JobData, ResumeData, CoverLetterData, UserProfile, UserSettings, JobStatistics, JobState } from "./types"
import { initialJobs } from "./data"

// Keys for localStorage
const STORAGE_KEYS = {
  JOBS: "job-tracker-jobs",
  RESUMES: "job-tracker-resumes",
  COVER_LETTERS: "job-tracker-cover-letters",
  USER_PROFILE: "job-tracker-user-profile",
  USER_SETTINGS: "job-tracker-user-settings",
  JOB_STATISTICS: "job-tracker-statistics",
  JOB_STATES: "job-tracker-job-states",
}

// Default job states
export const DEFAULT_JOB_STATES: JobState[] = [
  { id: "wishlist", name: "Wishlist", color: "#3b82f6", order: 0, isDefault: true, isSystem: true },
  { id: "bookmarked", name: "Bookmarked", color: "#8b5cf6", order: 1, isSystem: true },
  { id: "applying", name: "Applying", color: "#ec4899", order: 2, isSystem: true },
  { id: "applied", name: "Applied", color: "#6366f1", order: 3, isSystem: true },
  { id: "interview", name: "Interview", color: "#f59e0b", order: 4, isSystem: true },
  { id: "offer", name: "Offer", color: "#10b981", order: 5, isSystem: true },
  { id: "accepted", name: "Accepted", color: "#059669", order: 6, isSystem: true },
  { id: "rejected", name: "Rejected", color: "#ef4444", order: 7, isSystem: true },
]

// Jobs
export const getJobs = (): JobData[] => {
  if (typeof window === "undefined") return initialJobs

  const storedJobs = localStorage.getItem(STORAGE_KEYS.JOBS)
  return storedJobs ? JSON.parse(storedJobs) : initialJobs
}

export const saveJobs = (jobs: JobData[]): void => {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs))
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
  if (typeof window === "undefined") return DEFAULT_JOB_STATES

  const storedStates = localStorage.getItem(STORAGE_KEYS.JOB_STATES)
  return storedStates ? JSON.parse(storedStates) : DEFAULT_JOB_STATES
}

export const saveJobStates = (states: JobState[]): void => {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS.JOB_STATES, JSON.stringify(states))
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
  if (typeof window === "undefined") return []

  const storedResumes = localStorage.getItem(STORAGE_KEYS.RESUMES)
  return storedResumes ? JSON.parse(storedResumes) : []
}

// Update the saveResumes function to handle File objects
export const saveResumes = (resumes: ResumeData[]): void => {
  if (typeof window === "undefined") return

  // Create a serializable version of resumes without File objects
  const serializableResumes = resumes.map((resume) => {
    const { file, ...rest } = resume
    return rest
  })

  localStorage.setItem(STORAGE_KEYS.RESUMES, JSON.stringify(serializableResumes))
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
  if (typeof window === "undefined") return []

  const storedLetters = localStorage.getItem(STORAGE_KEYS.COVER_LETTERS)
  return storedLetters ? JSON.parse(storedLetters) : []
}

export const saveCoverLetters = (letters: CoverLetterData[]): void => {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS.COVER_LETTERS, JSON.stringify(letters))
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
  if (typeof window === "undefined") {
    return {
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      title: "Frontend Developer",
      bio: "Frontend developer with 5+ years of experience building responsive web applications with React, TypeScript, and modern CSS frameworks.",
      skills: ["React", "TypeScript", "Next.js", "Tailwind CSS", "Node.js"],
      social: {},
    }
  }

  const storedProfile = localStorage.getItem(STORAGE_KEYS.USER_PROFILE)
  if (!storedProfile) {
    const defaultProfile = {
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      title: "Frontend Developer",
      bio: "Frontend developer with 5+ years of experience building responsive web applications with React, TypeScript, and modern CSS frameworks.",
      skills: ["React", "TypeScript", "Next.js", "Tailwind CSS", "Node.js"],
      social: {},
    }
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(defaultProfile))
    return defaultProfile
  }

  return JSON.parse(storedProfile)
}

export const saveUserProfile = (profile: UserProfile): void => {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile))
}

// User Settings
export const getUserSettings = (): UserSettings => {
  if (typeof window === "undefined") {
    return {
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
      jobStates: DEFAULT_JOB_STATES,
    }
  }

  const storedSettings = localStorage.getItem(STORAGE_KEYS.USER_SETTINGS)
  if (!storedSettings) {
    const defaultSettings = {
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
      jobStates: DEFAULT_JOB_STATES,
    }
    localStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(defaultSettings))
    return defaultSettings
  }

  const settings = JSON.parse(storedSettings)

  // Ensure job states are present
  if (!settings.jobStates) {
    settings.jobStates = DEFAULT_JOB_STATES
    localStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(settings))
  }

  return settings
}

export const saveUserSettings = (settings: UserSettings): void => {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(settings))

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
  if (typeof window === "undefined") {
    return {
      totalApplications: 24,
      interviewRate: 33,
      offerRate: 12.5,
      averageResponseTime: 7,
      statusDistribution: {
        wishlist: 2,
        applied: 10,
        interview: 6,
        offer: 3,
        rejected: 3,
      },
      keywordAnalysis: [
        { keyword: "React", percentage: 85 },
        { keyword: "TypeScript", percentage: 72 },
        { keyword: "Next.js", percentage: 68 },
        { keyword: "Tailwind CSS", percentage: 65 },
      ],
      recentActivity: [
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
        {
          id: "4",
          type: "wishlist",
          description: "Added Google to wishlist",
          date: "1 week ago",
          color: "bg-blue-500",
        },
      ],
      applicationsByMonth: {},
      responseRateByCompany: {},
      topSkillsRequested: {
        technical: [],
        soft: [],
        requirements: [],
      },
      averageSalaryRange: {
        min: 0,
        max: 0,
        currency: "USD",
      },
      applicationsByWorkMode: {
        remote: 0,
        onsite: 0,
        hybrid: 0,
        flexible: 0,
      },
    }
  }

  const storedStats = localStorage.getItem(STORAGE_KEYS.JOB_STATISTICS)
  if (!storedStats) {
    // Calculate statistics based on jobs
    const jobs = getJobs()
    const stats = calculateStatistics(jobs)
    localStorage.setItem(STORAGE_KEYS.JOB_STATISTICS, JSON.stringify(stats))
    return stats
  }

  return JSON.parse(storedStats)
}

export const saveJobStatistics = (stats: JobStatistics): void => {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS.JOB_STATISTICS, JSON.stringify(stats))
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

    job.tags?.forEach((tag) => {
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
  const data = {
    jobs: getJobs(),
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
  const jobs = getJobs()

  // CSV header
  let csv = "ID,Company,Position,Location,Salary,Date,Status,Notes,URL,Priority,Tags,Description\n"

  // Add each job as a row
  jobs.forEach((job) => {
    const row = [
      job.id,
      `"${job.company?.replace(/"/g, '""') || ""}"`,
      `"${job.position?.replace(/"/g, '""') || ""}"`,
      job.location ? `"${job.location.replace(/"/g, '""')}"` : "",
      job.salary
        ? `  '""') || ""}"\`,
      job.location ? \`"${job.location.replace(/"/g, '""')}"`
        : "",
      job.salary ? `"${job.salary.replace(/"/g, '""')}"` : "",
      job.date || "",
      job.status,
      job.notes ? `"${job.notes.replace(/"/g, '""')}"` : "",
      job.url ? `"${job.url.replace(/"/g, '""')}"` : "",
      job.priority || "",
      job.tags ? `"${job.tags.join(",").replace(/"/g, '""')}"` : "",
      job.description ? `"${job.description.replace(/"/g, '""')}"` : "",
    ]

    csv += row.join(",") + "\n"
  })

  return csv
}

// Import data
export const importFromJSON = (jsonData: string): void => {
  try {
    const data = JSON.parse(jsonData)

    if (data.jobs) saveJobs(data.jobs)
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

// Import from CSV
export const importFromCSV = (csvData: string): void => {
  try {
    // Split the CSV into rows
    const rows = csvData.split("\n")

    // Extract headers (first row)
    const headers = rows[0].split(",")

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

      // Create job object
      const job: Partial<JobData> = {
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
        tags:
          values[10]
            ?.replace(/^"|"$/g, "")
            .split(",")
            .map((tag) => tag.trim()) || [],
        description: values[11]?.replace(/^"|"$/g, "") || undefined,
      }

      jobs.push(job as JobData)
    }

    // Save the imported jobs
    saveJobs([...getJobs(), ...jobs])
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
