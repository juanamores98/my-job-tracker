export function cn(...inputs: any[]) {
  let twClasses = ""
  for (let i = 0; i < inputs.length; i++) {
    if (typeof inputs[i] === "string") {
      twClasses += inputs[i] + " "
    } else if (typeof inputs[i] === "object" && inputs[i] !== null) {
      for (const key in inputs[i]) {
        if (inputs[i][key]) {
          twClasses += key + " "
        }
      }
    }
  }
  return twClasses.trim()
}

export const analyzeJobDescription = () => {
  return {
    technicalSkills: [],
    softSkills: [],
    requirements: [],
  }
}
