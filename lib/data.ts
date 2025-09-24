import type { JobData, ResumeData, CoverLetterData, JobState } from "./types"

export const defaultJobStates: JobState[] = [
  { id: "wishlist", name: "Wishlist", color: "#4A90E2", order: 0, isDefault: true, isSystem: true }, // Blue
  { id: "applied", name: "Applied", color: "#F5A623", order: 1, isSystem: true }, // Orange
  { id: "interview", name: "Interview", color: "#7ED321", order: 2, isSystem: true }, // Green
  { id: "rejected", name: "Rejected", color: "#D0021B", order: 3, isSystem: true }, // Red
]

export const initialJobs: JobData[] = [
  {
    id: "1",
    company: "Vercel",
    position: "Frontend Developer",
    location: "San Francisco, USA",
    workMode: "remote",
    salaryMin: 120000,
    salaryMax: 150000,
    salaryCurrency: "USD",
    date: "2024-01-12",
    applyDate: "2024-01-12",
    status: "applied",
    notes: "Applied through company website",
    url: "https://vercel.com/careers",
    priority: 5,
    skills: ["React", "Next.js", "TypeScript"],
    studies: ["Computer Science"],
    softSkills: [],
    requirements: [],
    description: "Looking for an experienced frontend developer with strong React and Next.js skills.",
    contactEmail: "talent@vercel.com",
    contactPhone: "+1 415-555-1000",
  },
  {
    id: "2",
    company: "Stripe",
    position: "Full Stack Engineer",
    location: "San Francisco, USA",
    workMode: "hybrid",
    salaryMin: 130000,
    salaryMax: 160000,
    salaryCurrency: "USD",
    date: "2024-01-05",
    applyDate: "2024-01-05",
    status: "interview",
    notes: "First interview scheduled for next week",
    url: "https://stripe.com/jobs",
    priority: 4,
    skills: ["React", "Node.js", "PostgreSQL"],
    studies: ["Software Engineering"],
    softSkills: [],
    requirements: [],
    description: "Building payment infrastructure for the internet.",
    contactEmail: "recruiting@stripe.com",
    contactPhone: "+1 650-555-0002",
  },
  {
    id: "3",
    company: "Airbnb",
    position: "Senior Frontend Engineer",
    location: "Berlin, Germany",
    workMode: "remote",
    salaryMin: 140000,
    salaryMax: 170000,
    salaryCurrency: "USD",
    date: "2023-12-18",
    status: "wishlist",
    url: "https://airbnb.com/careers",
    priority: 3,
    skills: ["React", "JavaScript", "CSS"],
    studies: ["Human Computer Interaction"],
    softSkills: [],
    requirements: [],
    description: "Join our team to build the future of travel and accommodations.",
    contactEmail: "careers@airbnb.com",
  },
  {
    id: "4",
    company: "Netflix",
    position: "UI Engineer",
    location: "Los Gatos, CA",
    salary: "$150k - $180k",
    date: "2023-12-01",
    applyDate: "2023-11-15",
    status: "rejected",
    notes: "Rejected after technical interview",
    url: "https://netflix.com/jobs",
    priority: 2,
    skills: ["React", "JavaScript", "A/B Testing"],
    studies: ["Computer Science"],
    softSkills: [],
    requirements: [],
    description: "Creating engaging user interfaces for our streaming platform.",
    contactEmail: "jobs@netflix.com",
  },
]

export const initialResumes: ResumeData[] = [
  {
    id: "1",
    title: "Software Developer Resume",
    originalName: "software_dev_resume.pdf",
    lastUpdated: "2023-08-01",
    format: "PDF",
    size: "245 KB",
    content:
      "Frontend developer with 5+ years of experience building responsive web applications with React, TypeScript, and modern CSS frameworks. Proficient in Next.js, Node.js, and GraphQL. Strong problem-solving skills and experience working in agile teams.",
  },
  {
    id: "2",
    title: "Frontend Developer Resume",
    originalName: "frontend_dev_resume.pdf",
    lastUpdated: "2023-07-15",
    format: "PDF",
    size: "198 KB",
    content:
      "Experienced frontend developer specializing in React, JavaScript, and CSS. Created responsive web applications with modern frameworks like Next.js and Tailwind CSS. Skilled in performance optimization and accessibility.",
  },
]

export const initialCoverLetters: CoverLetterData[] = [
  {
    id: "1",
    title: "Frontend Developer",
    company: "Tech Startups",
    lastUpdated: "2023-08-05",
    content:
      "Dear Hiring Manager,\n\nI am writing to express my interest in the Frontend Developer position at your company. With over 5 years of experience building responsive and accessible web applications using React, TypeScript, and modern CSS frameworks, I believe I would be a valuable addition to your team.\n\nThroughout my career, I have focused on creating exceptional user experiences while maintaining clean, efficient code. I am particularly proud of my work at...[truncated]",
  },
  {
    id: "2",
    title: "Full Stack Developer",
    company: "Enterprise Companies",
    lastUpdated: "2023-07-20",
    content:
      "Dear Hiring Team,\n\nI am writing to apply for the Full Stack Developer position at your organization. With a strong background in both frontend and backend technologies, including React, Node.js, and SQL/NoSQL databases, I am confident in my ability to contribute to your development team from day one.\n\nIn my current role at XYZ Corp, I've successfully led the development of several mission-critical applications that have improved operational efficiency by 35%. I've collaborated closely with cross-functional teams to deliver scalable solutions that meet both business requirements and technical standards.\n\nI am particularly interested in your company because of your commitment to innovation and your impressive product portfolio. I believe my technical expertise and problem-solving skills would be valuable assets to your team.",
  },
]
