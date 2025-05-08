import { NextResponse } from "next/server"

// Función para extraer la descripción del trabajo de diferentes sitios
async function scrapeJobDescription(url: string): Promise<{ description: string; error?: string }> {
  try {
    // Realizar la solicitud para obtener el HTML de la página
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    if (!response.ok) {
      return {
        description: "",
        error: `Error al acceder a la URL: ${response.status} ${response.statusText}`,
      }
    }

    const html = await response.text()

    // Detectar el sitio web y aplicar la estrategia de extracción adecuada
    if (url.includes("linkedin.com")) {
      return extractFromLinkedIn(html)
    } else if (url.includes("indeed.com")) {
      return extractFromIndeed(html)
    } else if (url.includes("glassdoor.com")) {
      return extractFromGlassdoor(html)
    } else {
      // Intento genérico para otros sitios
      return extractGeneric(html)
    }
  } catch (error) {
    console.error("Error scraping job description:", error)
    return {
      description: "",
      error: "Error al procesar la URL. Asegúrate de que es una URL válida de oferta de trabajo.",
    }
  }
}

// Función para extraer la descripción de LinkedIn
function extractFromLinkedIn(html: string): { description: string; error?: string } {
  try {
    // Buscar la sección de descripción del trabajo en LinkedIn
    const descriptionRegex = /<div class="[^"]*show-more-less-html[^"]*">([\s\S]*?)<\/div>/i
    const match = html.match(descriptionRegex)

    if (match && match[1]) {
      // Limpiar HTML y formatear el texto
      return {
        description: cleanHtml(match[1]),
      }
    }

    // Intentar con otro selector si el primero falla
    const altDescriptionRegex = /<section class="[^"]*description[^"]*">([\s\S]*?)<\/section>/i
    const altMatch = html.match(altDescriptionRegex)

    if (altMatch && altMatch[1]) {
      return {
        description: cleanHtml(altMatch[1]),
      }
    }

    return {
      description: "",
      error: "No se pudo encontrar la descripción del trabajo en LinkedIn.",
    }
  } catch (error) {
    return {
      description: "",
      error: "Error al procesar la página de LinkedIn.",
    }
  }
}

// Función para extraer la descripción de Indeed
function extractFromIndeed(html: string): { description: string; error?: string } {
  try {
    // Buscar la sección de descripción del trabajo en Indeed
    const descriptionRegex = /<div id="jobDescriptionText"[^>]*>([\s\S]*?)<\/div>/i
    const match = html.match(descriptionRegex)

    if (match && match[1]) {
      return {
        description: cleanHtml(match[1]),
      }
    }

    return {
      description: "",
      error: "No se pudo encontrar la descripción del trabajo en Indeed.",
    }
  } catch (error) {
    return {
      description: "",
      error: "Error al procesar la página de Indeed.",
    }
  }
}

// Función para extraer la descripción de Glassdoor
function extractFromGlassdoor(html: string): { description: string; error?: string } {
  try {
    // Buscar la sección de descripción del trabajo en Glassdoor
    const descriptionRegex = /<div class="[^"]*jobDescriptionContent[^"]*">([\s\S]*?)<\/div>/i
    const match = html.match(descriptionRegex)

    if (match && match[1]) {
      return {
        description: cleanHtml(match[1]),
      }
    }

    return {
      description: "",
      error: "No se pudo encontrar la descripción del trabajo en Glassdoor.",
    }
  } catch (error) {
    return {
      description: "",
      error: "Error al procesar la página de Glassdoor.",
    }
  }
}

// Función para intentar extraer la descripción de cualquier sitio
function extractGeneric(html: string): { description: string; error?: string } {
  try {
    // Intentar encontrar secciones comunes que podrían contener la descripción del trabajo
    const possibleSelectors = [
      /<div[^>]*job[^>]*description[^>]*>([\s\S]*?)<\/div>/i,
      /<section[^>]*job[^>]*description[^>]*>([\s\S]*?)<\/section>/i,
      /<div[^>]*description[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*jobDesc[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*details[^>]*>([\s\S]*?)<\/div>/i,
    ]

    for (const selector of possibleSelectors) {
      const match = html.match(selector)
      if (match && match[1]) {
        return {
          description: cleanHtml(match[1]),
        }
      }
    }

    // Si no se encuentra ninguna descripción específica, extraer el contenido principal
    const mainContentRegex = /<main[^>]*>([\s\S]*?)<\/main>/i
    const mainMatch = html.match(mainContentRegex)

    if (mainMatch && mainMatch[1]) {
      return {
        description: cleanHtml(mainMatch[1]).substring(0, 5000), // Limitar a 5000 caracteres
      }
    }

    return {
      description: "",
      error: "No se pudo encontrar la descripción del trabajo en esta página.",
    }
  } catch (error) {
    return {
      description: "",
      error: "Error al procesar la página.",
    }
  }
}

// Función para limpiar el HTML y formatear el texto
function cleanHtml(html: string): string {
  // Eliminar todas las etiquetas HTML
  let text = html.replace(/<[^>]*>/g, " ")

  // Reemplazar entidades HTML comunes
  text = text.replace(/&nbsp;/g, " ")
  text = text.replace(/&amp;/g, "&")
  text = text.replace(/&lt;/g, "<")
  text = text.replace(/&gt;/g, ">")
  text = text.replace(/&quot;/g, '"')
  text = text.replace(/&#39;/g, "'")

  // Eliminar espacios en blanco múltiples
  text = text.replace(/\s+/g, " ")

  // Eliminar espacios al principio y al final
  text = text.trim()

  return text
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: "Se requiere una URL" },
        {
          status: 400,
        },
      )
    }

    const result = await scrapeJobDescription(url)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in job scraper API:", error)
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      {
        status: 500,
      },
    )
  }
}
