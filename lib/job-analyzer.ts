/**
 * Utility functions for analyzing job descriptions
 */
import {
  technicalSkills,
  softSkills,
  requirements,
  isValidSkill,
  normalizeSkillName,
  stopwords,
} from "./skill-categories"

/**
 * Analyzes a job description to extract technical skills, soft skills, and requirements
 * @param description The job description text
 * @returns Object containing arrays of extracted skills and requirements
 */
export function analyzeJobDescription(description: string): {
  technicalSkills: string[]
  softSkills: string[]
  requirements: string[]
} {
  if (!description) {
    return {
      technicalSkills: [],
      softSkills: [],
      requirements: [],
    }
  }

  // Create sets to store unique skills
  const extractedTechnicalSkills = new Set<string>()
  const extractedSoftSkills = new Set<string>()
  const extractedRequirements = new Set<string>()

  // Convert description to lowercase for case-insensitive matching
  const descriptionLower = description.toLowerCase()

  // Match technical skills
  technicalSkills.forEach((skill) => {
    const skillLower = skill.toLowerCase()
    // Escape special regex characters in the skill name
    const escapedSkill = skillLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    // Use word boundary to match whole words only
    const regex = new RegExp(`\\b${escapedSkill}\\b`, "i")
    if (regex.test(descriptionLower)) {
      extractedTechnicalSkills.add(normalizeSkillName(skill))
    }
  })

  // Match soft skills
  softSkills.forEach((skill) => {
    const skillLower = skill.toLowerCase()
    // Escape special regex characters in the skill name
    const escapedSkill = skillLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    // Use word boundary to match whole words only
    const regex = new RegExp(`\\b${escapedSkill}\\b`, "i")
    if (regex.test(descriptionLower)) {
      extractedSoftSkills.add(normalizeSkillName(skill))
    }
  })

  // Match requirements
  requirements.forEach((req) => {
    const reqLower = req.toLowerCase()
    // Escape special regex characters in the requirement name
    const escapedReq = reqLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    // Use word boundary to match whole words only
    const regex = new RegExp(`\\b${escapedReq}\\b`, "i")
    if (regex.test(descriptionLower)) {
      extractedRequirements.add(normalizeSkillName(req))
    }
  })

  // Extract additional potential skills using regex patterns
  // This helps catch skills that might not be in our predefined lists
  const additionalSkillsRegex = /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*|[A-Z]{2,})\b/g
  const potentialSkills = [...description.matchAll(additionalSkillsRegex)]
    .map((match) => match[0])
    .filter((term) => isValidSkill(term) && !stopwords.includes(term.toLowerCase()) && term.length > 2)

  // Categorize additional skills
  potentialSkills.forEach((skill) => {
    const normalized = normalizeSkillName(skill)

    // Skip if already categorized
    if (
      extractedTechnicalSkills.has(normalized) ||
      extractedSoftSkills.has(normalized) ||
      extractedRequirements.has(normalized)
    ) {
      return
    }

    // Try to categorize based on context
    if (
      /\b(language|framework|library|tool|platform|database|programming|code|develop|software|web|app|cloud|server|frontend|backend)\b/i.test(
        description,
      )
    ) {
      extractedTechnicalSkills.add(normalized)
    } else if (
      /\b(skill|communicate|team|collaborate|manage|lead|organize|solve|think|creative|adapt|flexible)\b/i.test(
        description,
      )
    ) {
      extractedSoftSkills.add(normalized)
    } else if (
      /\b(require|need|must|should|prefer|experience|year|degree|education|qualification)\b/i.test(description)
    ) {
      extractedRequirements.add(normalized)
    }
  })

  // Look for specific patterns for years of experience
  const experienceRegex = /\b(\d+)(?:\+)?\s*(?:to|-)?\s*\d*\s*(?:years?|yrs?)(?:\s+of)?\s+(?:experience|exp)\b/gi
  const experienceMatches = [...description.matchAll(experienceRegex)]

  experienceMatches.forEach((match) => {
    if (match[0]) {
      extractedRequirements.add(normalizeSkillName(match[0]))
    }
  })

  // Look for education requirements
  const educationRegex = /\b(?:bachelor'?s?|master'?s?|phd|doctorate|bs|ms|ba|mba|degree)\s+(?:in|of)?\s+[a-z\s]+\b/gi
  const educationMatches = [...description.matchAll(educationRegex)]

  educationMatches.forEach((match) => {
    if (match[0]) {
      extractedRequirements.add(normalizeSkillName(match[0]))
    }
  })

  return {
    technicalSkills: Array.from(extractedTechnicalSkills),
    softSkills: Array.from(extractedSoftSkills),
    requirements: Array.from(extractedRequirements),
  }
}

// Function to extract keywords in real-time as the user types
export function extractKeywordsFromText(text: string): string[] {
  if (!text || text.length < 10) return []

  const { technicalSkills, softSkills, requirements } = analyzeJobDescription(text)
  return [...technicalSkills, ...softSkills, ...requirements]
}
