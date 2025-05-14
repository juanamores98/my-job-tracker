import type { JobData, ResumeData, CoverLetterData, UserProfile, UserSettings, JobStatistics, JobState, WorkMode } from "./types"
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
}

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
  if (typeof window === "undefined") return defaultJobStates

  const storedStates = localStorage.getItem(STORAGE_KEYS.JOB_STATES)
  return storedStates ? JSON.parse(storedStates) : defaultJobStates
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
      theme: "system" as "light" | "dark" | "system",
      compactView: false,
      animations: true,
      defaultView: "kanban" as "kanban" | "table" | "calendar",
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
      defaultJobView: "kanban" as "kanban" | "table" | "calendar",
      defaultSortField: "date",
      defaultSortOrder: "desc" as "asc" | "desc",
      defaultFilters: {},
      jobStates: defaultJobStates,
    }
  }

  const storedSettings = localStorage.getItem(STORAGE_KEYS.USER_SETTINGS)
  if (!storedSettings) {
    const defaultSettings = {
      theme: "system" as "light" | "dark" | "system",
      compactView: false,
      animations: true,
      defaultView: "kanban" as "kanban" | "table" | "calendar",
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
      defaultJobView: "kanban" as "kanban" | "table" | "calendar",
      defaultSortField: "date",
      defaultSortOrder: "desc" as "asc" | "desc",
      defaultFilters: {},
      jobStates: defaultJobStates,
    }
    localStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(defaultSettings))
    return defaultSettings
  }

  const settings = JSON.parse(storedSettings)

  // Ensure job states are present
  if (!settings.jobStates || settings.jobStates.length === 0) {
    settings.jobStates = defaultJobStates
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
  let csv = "ID,Company,Position,Location,WorkMode,SalaryMin,SalaryMax,SalaryCurrency,Date,ApplyDate,Status,Notes,URL,Priority,Skills,SoftSkills,Requirements,Description\n"

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
    ]

    csv += row.join(",") + "\n"
  })

  return csv
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
            requirements: []
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
          requirements: []
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
