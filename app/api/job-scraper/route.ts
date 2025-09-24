import { NextRequest, NextResponse } from "next/server"
import type { JobData } from "@/lib/types"

// Mock job board extractors
// In a real implementation, you would use a server-side DOM parser like Cheerio
// to extract job details from the actual HTML of these sites

type JobBoardExtractor = (url: string) => Promise<Partial<JobData>>

const linkedinExtractor: JobBoardExtractor = async (url: string) => {
  // Simulate LinkedIn job extraction
  const jobTitle = getRandomJobTitle()
  const company = getCompanyNameFromUrl(url) || "LinkedIn Company"
  
  return {
    url,
    company,
    position: jobTitle,
    location: "New York, NY",
    description: generateJobDescription(jobTitle, company),
    salary: "$130,000 - $160,000",
    workMode: "hybrid",
    tags: ["React", "TypeScript", "Node.js", "API Development", "Git", "Communication", "Problem-Solving"]
  }
}

const indeedExtractor: JobBoardExtractor = async (url: string) => {
  // Simulate Indeed job extraction
  const jobTitle = getRandomJobTitle()
  const company = getCompanyNameFromUrl(url) || "Indeed Company"
  
  return {
    url,
    company,
    position: jobTitle,
    location: "Remote",
    description: generateJobDescription(jobTitle, company),
    salary: "$110,000 - $140,000",
    workMode: "remote",
    tags: ["JavaScript", "React", "CSS", "HTML", "REST API", "Teamwork"]
  }
}

const glassdoorExtractor: JobBoardExtractor = async (url: string) => {
  // Simulate Glassdoor job extraction
  const jobTitle = getRandomJobTitle()
  const company = getCompanyNameFromUrl(url) || "Glassdoor Company"
  
  return {
    url,
    company,
    position: jobTitle,
    location: "Seattle, WA",
    description: generateJobDescription(jobTitle, company),
    salary: "$125,000 - $155,000",
    workMode: "onsite",
    tags: ["Python", "SQL", "AWS", "Docker", "Agile", "Leadership"]
  }
}

const genericExtractor: JobBoardExtractor = async (url: string) => {
  // Generic extraction for unknown job boards
  const jobTitle = getRandomJobTitle()
  const company = getCompanyNameFromUrl(url) || "Company Name"
  
  return {
    url,
    company,
    position: jobTitle,
    location: "San Francisco, CA",
    description: generateJobDescription(jobTitle, company),
    salary: "$120,000 - $150,000",
    workMode: "remote",
    tags: ["JavaScript", "React", "Node.js", "Problem-Solving", "Communication"]
  }
}

// Maps job board domains to their specific extractors
const extractors: Record<string, JobBoardExtractor> = {
  "linkedin.com": linkedinExtractor,
  "indeed.com": indeedExtractor,
  "glassdoor.com": glassdoorExtractor,
  "monster.com": genericExtractor,
  "simplyhired.com": genericExtractor,
  "ziprecruiter.com": genericExtractor,
  "dice.com": genericExtractor,
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    
    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      )
    }
    
    // Determine which extractor to use based on the URL domain
    const extractorToUse = getExtractorForUrl(url)
    
    // Extract job data using the appropriate extractor
    const jobData = await extractorToUse(url)
    
    return NextResponse.json(jobData)
  } catch (error) {
    console.error("Error processing job URL:", error)
    return NextResponse.json(
      { error: "Failed to extract job details" },
      { status: 500 }
    )
  }
}

// Helper functions

function getExtractorForUrl(url: string): JobBoardExtractor {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.replace(/^www\./, "")

    // Match exact domain or subdomain of known boards, avoid partial matches
    for (const domain in extractors) {
      if (hostname === domain || hostname.endsWith(`.${domain}`)) {
        return extractors[domain]
      }
    }

    // Default to generic extractor
    return genericExtractor
  } catch (error) {
    // If URL parsing fails, use generic extractor
    return genericExtractor
  }
}

function getCompanyNameFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.replace(/^www\./, "")
    
    // Extract domain name without TLD
    const domainParts = hostname.split(".")
    if (domainParts.length >= 2) {
      return domainParts[domainParts.length - 2]
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    }
    return null
  } catch (error) {
    return null
  }
}

function getRandomJobTitle(): string {
  const titles = [
    "Senior Software Engineer",
    "Frontend Developer",
    "Full Stack Engineer",
    "DevOps Engineer",
    "Product Manager",
    "UI/UX Designer",
    "Data Scientist",
    "Machine Learning Engineer",
    "React Developer",
    "Node.js Developer"
  ]
  
  return titles[Math.floor(Math.random() * titles.length)]
}

function generateJobDescription(position: string, company: string): string {
  return `
Job Title: ${position}
Company: ${company}
Location: San Francisco, CA
Salary Range: $120,000 - $150,000

About the Role:
We are seeking a talented ${position} to join our team at ${company}. This is a full-time position with competitive benefits and the opportunity to work on cutting-edge projects.

Requirements:
- 3+ years of experience in software development
- Proficiency in JavaScript, TypeScript, and React
- Experience with Node.js and Express
- Knowledge of database systems like MongoDB or PostgreSQL
- Strong problem-solving skills and attention to detail
- Excellent communication and teamwork abilities

Benefits:
- Competitive salary and equity options
- Comprehensive health, dental, and vision insurance
- Flexible work arrangements with remote options
- Professional development budget
- Generous PTO policy

We are an equal opportunity employer and value diversity at our company.
`.trim()
}
