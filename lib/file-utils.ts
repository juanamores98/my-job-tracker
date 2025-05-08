/**
 * Utility functions for handling files
 */

/**
 * Extract text from a file
 * @param file The file to extract text from
 * @param onProgress Progress callback
 * @returns The extracted text
 */
export async function extractTextFromFile(file: File, onProgress?: (progress: number) => void): Promise<string> {
  const fileType = file.type

  // Handle different file types
  if (fileType === "text/plain") {
    return extractTextFromTxt(file)
  } else if (fileType === "application/pdf") {
    return extractTextFromPdf(file, onProgress)
  } else if (
    fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileType === "application/msword"
  ) {
    return extractTextFromDocx(file, onProgress)
  }

  // Default: try to read as text
  try {
    return await extractTextFromTxt(file)
  } catch (error) {
    console.error("Error extracting text:", error)
    return ""
  }
}

// Add or update the extractTextFromTxt function to better handle text files
async function extractTextFromTxt(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      resolve((e.target?.result as string) || "")
    }

    reader.onerror = (e) => {
      reject(new Error("Failed to read text file"))
    }

    reader.readAsText(file)
  })
}

/**
 * Extract text from a PDF file
 * @param file The PDF file
 * @param onProgress Progress callback
 * @returns The extracted text
 */
async function extractTextFromPdf(file: File, onProgress?: (progress: number) => void): Promise<string> {
  try {
    // For browser environments, we'll use a simpler approach
    // Report initial progress
    if (onProgress) onProgress(10)

    // In a real implementation, we would use a proper PDF parsing library
    // For now, we'll use a simplified approach that works in the browser
    const reader = new FileReader()

    const textContent = await new Promise<string>((resolve, reject) => {
      reader.onload = async (e) => {
        try {
          // Simulate PDF text extraction
          if (onProgress) onProgress(50)

          // In a real implementation, we would parse the PDF here
          // For now, we'll return a placeholder message
          const text =
            "PDF text extraction is simulated. In a production environment, " +
            "we would use a proper PDF parsing library like pdf.js. " +
            "For this demo, please manually enter the resume text if needed."

          if (onProgress) onProgress(100)
          resolve(text)
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = (e) => {
        reject(new Error("Failed to read PDF file"))
      }

      reader.readAsArrayBuffer(file)
    })

    return textContent
  } catch (error) {
    console.error("Error extracting text from PDF:", error)
    return ""
  }
}

/**
 * Extract text from a DOCX file
 * @param file The DOCX file
 * @param onProgress Progress callback
 * @returns The extracted text
 */
async function extractTextFromDocx(file: File, onProgress?: (progress: number) => void): Promise<string> {
  try {
    // For browser environments, we'll use a simpler approach
    // Report initial progress
    if (onProgress) onProgress(10)

    // In a real implementation, we would use a proper DOCX parsing library
    // For now, we'll use a simplified approach that works in the browser
    const reader = new FileReader()

    const textContent = await new Promise<string>((resolve, reject) => {
      reader.onload = async (e) => {
        try {
          // Simulate DOCX text extraction
          if (onProgress) onProgress(50)

          // In a real implementation, we would parse the DOCX here
          // For now, we'll return a placeholder message
          const text =
            "DOCX text extraction is simulated. In a production environment, " +
            "we would use a proper DOCX parsing library like mammoth.js. " +
            "For this demo, please manually enter the resume text if needed."

          if (onProgress) onProgress(100)
          resolve(text)
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = (e) => {
        reject(new Error("Failed to read DOCX file"))
      }

      reader.readAsArrayBuffer(file)
    })

    return textContent
  } catch (error) {
    console.error("Error extracting text from DOCX:", error)
    return ""
  }
}

// Add a function to read file content as text
export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      resolve((e.target?.result as string) || "")
    }

    reader.onerror = () => {
      reject(new Error("Failed to read file"))
    }

    reader.readAsText(file)
  })
}
