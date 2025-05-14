import { getJobs, saveJobs } from "./storage";
import type { JobData, WorkMode } from "./types";

// Import the parseSalaryString function from storage
// This is to ensure it's used and not flagged as unused
import { parseSalaryString } from "./storage";

/**
 * Migrates job data to ensure proper separation between location and work mode
 * and proper categorization of skills
 * This function should be called on application startup to fix any legacy data
 */
export function migrateJobData(): void {
  // Skip if not in browser environment
  if (typeof window === "undefined") return;

  // Get all jobs from localStorage
  const jobs = getJobs();
  let hasChanges = false;

  // Process each job to ensure proper format
  const migratedJobs = jobs.map(job => {
    // Create a copy of the job to modify
    const updatedJob = { ...job };

    // Migrate skills data
    if (job.tags) {
      // Convert tags to skills (rename field for better clarity)
      if (!job.skills) {
        updatedJob.skills = [...job.tags];
      }
      // Remove the tags field after conversion
      delete updatedJob.tags;
      hasChanges = true;
    }

    // Ensure softSkills and requirements are initialized
    if (!job.softSkills || !job.requirements) {
      if (!job.softSkills) updatedJob.softSkills = [];
      if (!job.requirements) updatedJob.requirements = [];
      hasChanges = true;
    }

    // Case 1: Job has location but no workMode
    if (job.location && !job.workMode) {
      hasChanges = true;
      const locationLower = job.location.toLowerCase();

      // Check for work mode keywords in location
      const isRemote = locationLower.includes('remote');
      const isHybrid = locationLower.includes('hybrid');
      const isFlexible = locationLower.includes('flexible');

      // Set work mode based on location text
      if (isRemote) {
        updatedJob.workMode = 'remote';
        // Clean location if it only contains work mode info
        if (locationLower.trim() === 'remote') {
          updatedJob.location = '';
        } else {
          // Remove work mode keyword from location
          updatedJob.location = job.location.replace(/remote/i, '').trim();
          // Remove any trailing commas
          updatedJob.location = updatedJob.location.replace(/,\s*$/, '');
        }
      } else if (isHybrid) {
        updatedJob.workMode = 'hybrid';
        // Clean location if it only contains work mode info
        if (locationLower.trim() === 'hybrid') {
          updatedJob.location = '';
        } else {
          // Remove work mode keyword from location
          updatedJob.location = job.location.replace(/hybrid/i, '').trim();
          // Remove any trailing commas
          updatedJob.location = updatedJob.location.replace(/,\s*$/, '');
        }
      } else if (isFlexible) {
        updatedJob.workMode = 'flexible';
        // Clean location if it only contains work mode info
        if (locationLower.trim() === 'flexible') {
          updatedJob.location = '';
        } else {
          // Remove work mode keyword from location
          updatedJob.location = job.location.replace(/flexible/i, '').trim();
          // Remove any trailing commas
          updatedJob.location = updatedJob.location.replace(/,\s*$/, '');
        }
      } else {
        // Default to onsite if location doesn't contain work mode info
        updatedJob.workMode = 'onsite';
      }
    }

    // Case 2: Job has no location but has workMode
    if (!job.location && job.workMode) {
      // No changes needed, this is already in the correct format
    }

    // Case 3: Job has neither location nor workMode
    if (!job.location && !job.workMode) {
      hasChanges = true;
      // Default to remote for jobs with no location or work mode
      updatedJob.workMode = 'remote';
    }

    // Case 4: Job has salary string but no structured salary
    if (job.salary && (!job.salaryMin || !job.salaryMax)) {
      hasChanges = true;
      // Parse the salary string to get structured values
      const parsedSalary = parseSalaryString(job.salary);
      if (parsedSalary.salaryMin) updatedJob.salaryMin = parsedSalary.salaryMin;
      if (parsedSalary.salaryMax) updatedJob.salaryMax = parsedSalary.salaryMax;
      if (parsedSalary.salaryCurrency) updatedJob.salaryCurrency = parsedSalary.salaryCurrency;
    }

    return updatedJob;
  });

  // Save the migrated jobs if any changes were made
  if (hasChanges) {
    saveJobs(migratedJobs);
    console.log('Job data migration completed: Location, work mode, and skill categories updated');
  }
}

/**
 * Ensures proper formatting of job data when exporting
 * This function should be called before exporting jobs
 */
export function prepareJobsForExport(jobs: JobData[]): JobData[] {
  return jobs.map(job => {
    const exportJob = { ...job };

    // Ensure work mode is set
    if (!exportJob.workMode) {
      if (exportJob.location) {
        const locationLower = exportJob.location.toLowerCase();
        if (locationLower.includes('remote')) {
          exportJob.workMode = 'remote';
        } else if (locationLower.includes('hybrid')) {
          exportJob.workMode = 'hybrid';
        } else if (locationLower.includes('flexible')) {
          exportJob.workMode = 'flexible';
        } else {
          exportJob.workMode = 'onsite';
        }
      } else {
        // Default to remote if no location info
        exportJob.workMode = 'remote';
      }
    }

    // Ensure skill categories are set
    if (!exportJob.softSkills) {
      exportJob.softSkills = [];
    }

    if (!exportJob.requirements) {
      exportJob.requirements = [];
    }

    // Handle skills/tags conversion
    if (exportJob.tags && !exportJob.skills) {
      // Convert tags to skills for backward compatibility
      exportJob.skills = [...exportJob.tags];
    } else if (!exportJob.skills) {
      exportJob.skills = [];
    }

    // Remove tags field after conversion
    if (exportJob.tags) {
      delete exportJob.tags;
    }

    // Ensure proper field order by recreating the object with fields in the desired order
    const orderedJob = {
      id: exportJob.id,
      company: exportJob.company,
      position: exportJob.position,
      location: exportJob.location,
      salary: exportJob.salary,
      date: exportJob.date,
      status: exportJob.status,
      notes: exportJob.notes,
      url: exportJob.url,
      priority: exportJob.priority,
      skills: exportJob.skills,
      softSkills: exportJob.softSkills,
      requirements: exportJob.requirements,
      description: exportJob.description,
      workMode: exportJob.workMode,
      salaryMin: exportJob.salaryMin,
      salaryMax: exportJob.salaryMax,
      salaryCurrency: exportJob.salaryCurrency,
      applyDate: exportJob.applyDate,
      followUpDate: exportJob.followUpDate,
      contactPerson: exportJob.contactPerson,
      contactEmail: exportJob.contactEmail,
      benefits: exportJob.benefits,
      interviewNotes: exportJob.interviewNotes,
    };

    // Return the ordered job object
    return orderedJob;
  });
}
