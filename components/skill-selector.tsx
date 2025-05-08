"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface SkillSelectorProps {
  onSkillsSelected: (skills: string[]) => void
}

export function SkillSelector({ onSkillsSelected }: SkillSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])

  // Common technical skills
  const technicalSkills = [
    "JavaScript",
    "TypeScript",
    "React",
    "Angular",
    "Vue.js",
    "Node.js",
    "Express",
    "Next.js",
    "HTML",
    "CSS",
    "Tailwind CSS",
    "Bootstrap",
    "SASS",
    "Python",
    "Django",
    "Flask",
    "Java",
    "Spring Boot",
    "C#",
    ".NET",
    "ASP.NET",
    "PHP",
    "Laravel",
    "Ruby",
    "Ruby on Rails",
    "Go",
    "Rust",
    "Swift",
    "Kotlin",
    "SQL",
    "PostgreSQL",
    "MySQL",
    "MongoDB",
    "Redis",
    "GraphQL",
    "REST API",
    "Docker",
    "Kubernetes",
    "AWS",
    "Azure",
    "GCP",
    "CI/CD",
    "Git",
    "GitHub",
    "GitLab",
    "Jira",
    "Agile",
    "Scrum",
    "DevOps",
    "TDD",
    "Jest",
    "Cypress",
    "Selenium",
  ]

  // Common soft skills
  const softSkills = [
    "Communication",
    "Teamwork",
    "Problem Solving",
    "Critical Thinking",
    "Time Management",
    "Adaptability",
    "Leadership",
    "Creativity",
    "Attention to Detail",
    "Organization",
    "Collaboration",
    "Interpersonal Skills",
    "Conflict Resolution",
    "Decision Making",
    "Emotional Intelligence",
    "Flexibility",
    "Negotiation",
    "Presentation Skills",
    "Project Management",
    "Self-Motivation",
    "Work Ethic",
    "Analytical Thinking",
  ]

  // Common requirements
  const requirements = [
    "Bachelor's Degree",
    "Master's Degree",
    "PhD",
    "1+ years experience",
    "2+ years experience",
    "3+ years experience",
    "5+ years experience",
    "Remote",
    "Hybrid",
    "On-site",
    "Full-time",
    "Part-time",
    "Contract",
    "Internship",
    "Entry Level",
    "Mid Level",
    "Senior Level",
    "Lead",
    "Manager",
    "Director",
    "Certification",
    "Portfolio",
    "Clearance Required",
  ]

  const handleSkillClick = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill))
    } else {
      setSelectedSkills([...selectedSkills, skill])
    }
  }

  const handleAddSelected = () => {
    if (selectedSkills.length > 0) {
      onSkillsSelected(selectedSkills)
      setSelectedSkills([])
    }
  }

  const filterSkills = (skills: string[]) => {
    if (!searchQuery) return skills
    return skills.filter((skill) => skill.toLowerCase().includes(searchQuery.toLowerCase()))
  }

  return (
    <div className="border rounded-md p-4 space-y-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search skills..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Tabs defaultValue="technical" className="w-full">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="soft">Soft Skills</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
        </TabsList>

        <TabsContent value="technical" className="h-[200px] overflow-y-auto p-2">
          <div className="flex flex-wrap gap-2">
            {filterSkills(technicalSkills).map((skill) => (
              <Badge
                key={skill}
                variant={selectedSkills.includes(skill) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => handleSkillClick(skill)}
              >
                {skill}
              </Badge>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="soft" className="h-[200px] overflow-y-auto p-2">
          <div className="flex flex-wrap gap-2">
            {filterSkills(softSkills).map((skill) => (
              <Badge
                key={skill}
                variant={selectedSkills.includes(skill) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => handleSkillClick(skill)}
              >
                {skill}
              </Badge>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="requirements" className="h-[200px] overflow-y-auto p-2">
          <div className="flex flex-wrap gap-2">
            {filterSkills(requirements).map((req) => (
              <Badge
                key={req}
                variant={selectedSkills.includes(req) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => handleSkillClick(req)}
              >
                {req}
              </Badge>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">{selectedSkills.length} skills selected</div>
        <Button type="button" onClick={handleAddSelected} disabled={selectedSkills.length === 0}>
          Add Selected Skills
        </Button>
      </div>
    </div>
  )
}
