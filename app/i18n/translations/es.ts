export const es = {
  // Job Card Actions
  editJobDetails: "Editar Detalles del Trabajo",
  removeJobApplication: "Eliminar Solicitud",
  viewJobPosting: "Ver Publicación",
  deleteJobApplication: "Eliminar Solicitud de Trabajo",
  areYouSureDelete: "¿Estás seguro de que quieres eliminar",
  at: "en",
  thisActionCannotBeUndone: "Esta acción no se puede deshacer.",
  cancel: "Cancelar",
  yesDelete: "Sí, Eliminar",

  // Job Card Info
  appliedOn: "Fecha",
  applied: "Fecha",
  priorities: {
    1: "Prioridad Baja",
    2: "Prioridad Media-Baja",
    3: "Prioridad Media",
    4: "Prioridad Media-Alta",
    5: "Prioridad Alta"
  },
  workModes: {
    remote: "Remoto",
    onsite: "Presencial",
    hybrid: "Híbrido",
    flexible: "Flexible"
  },

  // Tooltips
  addJobToColumn: "Añadir trabajo a {{columnName}}",
  dragToMove: "Arrastrar para mover",
  clickToEdit: "Clic para editar",
  clickToDelete: "Clic para eliminar",
  openInNewTab: "Abrir en nueva pestaña",
  moreTags: "+{{count}} más",

  // Column Features
  applicationCount: "Aplicaciones",
  dragToReorder: "Arrastra para reordenar columnas",
  addJobToStatus: "Añadir trabajo a {{statusName}}",
  noJobsInColumn: "No hay trabajos en {{columnName}}",
  addJobToThisColumn: "Haz clic en el botón de abajo para añadir un trabajo a esta columna de {{columnName}}",

  // Add/Edit Modal
  error: "Error",
  pleaseEnterValidUrl: "Por favor, introduce una URL válida",
  descriptionExtracted: "Descripción Extraída",
  jobDescriptionExtractedSuccessfully: "La descripción del trabajo ha sido extraída exitosamente",
  noResults: "Sin Resultados",
  couldNotExtractJobDescription: "No se pudo extraer la descripción del trabajo de esta URL",
  errorProcessingUrl: "Ocurrió un error al procesar la URL",
  analysisComplete: "Análisis Completado",
  foundSkillsAndRequirements: "Se encontraron {{technicalCount}} habilidades técnicas, {{softCount}} habilidades blandas y {{requirementsCount}} requisitos",
  addNewJobApplication: "Añadir Nueva Solicitud de Trabajo",
  enterJobApplicationDetails: "Introduce los detalles para tu nueva solicitud de trabajo",
  jobDetails: "Detalles del Trabajo",
  description: "Descripción",
  skillsAndTags: "Habilidades y Etiquetas",
  extractFromUrl: "Extraer de URL",
  company: "Empresa",
  position: "Posición",
  location: "Ubicación",
  searchLocation: "Buscar ubicación",
  salary: "Salario",
  salaryPlaceholder: "ej. $80k - $100k",
  status: "Estado",
  selectStatus: "Seleccionar estado",
  selectTheCurrentStatusOfYourApplication: "Selecciona el estado actual de tu solicitud",
  date: "Fecha",
  dateApplied: "Fecha",
  selectDate: "Seleccionar fecha",
  selectDateApplied: "Seleccionar fecha",
  workMode: "Modalidad de Trabajo",
  selectWorkMode: "Seleccionar modalidad",
  remote: "Remoto",
  onsite: "Presencial",
  hybrid: "Híbrido",
  flexible: "Flexible",
  jobUrl: "URL del Trabajo",
  jobUrlPlaceholder: "https://ejemplo.com/trabajo",
  extract: "Extraer",
  analyze: "Analizar",
  automaticallyExtractJobDescriptionFromWebsite: "Extraer automáticamente la descripción del trabajo del sitio web",
  priority: "Prioridad",
  notes: "Notas",
  notesPlaceholder: "Añade cualquier nota sobre esta solicitud",
  jobDescription: "Descripción del Trabajo",
  analyzeDescription: "Analizar Descripción",
  automaticallyExtractSkillsAndRequirementsFromDescription: "Extraer automáticamente habilidades y requisitos de la descripción",
  pasteJobDescriptionHere: "Pega la descripción del trabajo aquí",
  pasteFullJobDescription: "Pega la descripción completa del trabajo para extraer automáticamente habilidades y requisitios.",
  currentTags: "Etiquetas Actuales",
  addCustomTagPlaceholder: "Añadir o buscar habilidades...",
  addSkillsQuickly: "Añadir Habilidades Rápidamente",
  saveJob: "Guardar Trabajo",
  skillsAutoDetected: "Habilidades Autodetectadas",
  relevantSkillsAddedFromDescription: "Se han añadido habilidades relevantes desde la descripción.",

  // Status Management
  manageStatuses: "Gestionar Columnas de Estado",
  manageStatusesDescription: "Arrastra para reordenar, edita o añade nuevas columnas de estado",
  addStatus: "Añadir Estado",
  addNewStatus: "Añadir Nuevo Estado",
  createNewStatusDescription: "Crear una nueva columna de estado para solicitudes",
  editStatus: "Editar Estado",
  editStatusDescription: "Modificar propiedades de la columna de estado",
  deleteStatus: "Eliminar Estado",
  confirmDeleteStatus: "¿Eliminar Estado?",
  deleteStatusWarning: "Los trabajos con este estado se moverán al estado predeterminado. Esta acción no se puede deshacer.",
  statusActions: "Acciones de Columna de Estado",
  statusName: "Nombre del Estado",
  statusNamePlaceholder: "Ingresa nombre del estado...",
  statusColor: "Color",
  defaultStatus: "Establecer como estado predeterminado",
  systemStatusWarning: "Este es un estado del sistema. Algunas propiedades no pueden modificarse.",
  statusOrderUpdated: "El orden de los estados ha sido actualizado",
  noStatusesDefined: "No hay columnas de estado definidas. Añade una para comenzar.",
  saveChanges: "Guardar Cambios",

  // New / Updated for Modals
  skillsKeywordsAndRequirements: "Habilidades",
  attemptExtractFromUrlTooltip: "Intentar extraer datos del trabajo desde la URL. Puede que no funcione para todos los sitios web.",
  analyzeDescriptionTooltip: "Analizar descripción para auto-sugerir habilidades y requisitos.",
  backToJobDetailsTooltip: "Volver a Detalles del Trabajo",
  closeDialogTooltip: "Cerrar",
  addRelevantSkillsInfo: "Añade habilidades, palabras clave y requisitos relevantes para este trabajo",

  // New / Updated for Job Card
  priorityTooltip: "Prioridad: {{jobPriority}} de 5",

  // Job Column (existing, ensure they are good)
  filterColumn: "Filtrar y Ordenar Columna",
  sortByDate: "Ordenar por Fecha",
  sortBySalary: "Ordenar por Salario",
  sortByExcitement: "Ordenar por Prioridad",
  sortByLocation: "Ordenar por Ubicación",
  filterRemoteOnly: "Filtrar: Solo Remoto",
  filterOnsiteOnly: "Filtrar: Solo Presencial",
  columnSettings: "Configuración de Columna",

  // Job Board
  searchJobs: "Buscar Trabajos...",
  jobApplications: "Solicitudes de Trabajo",

  // Notifications
  changesSaved: "Cambios guardados correctamente",

  // Job States Manager specific (Spanish translations)
  deleteStatusConfirmation: "Esta acción eliminará el estado \"{{statusName}}\" y moverá todas las postulaciones asociadas al estado predeterminado. Esta acción no se puede deshacer.",
  restoreDefaultsFinalWarning: "Esto restablecerá todos los estados de trabajo a los predefinidos. Las postulaciones en estados personalizados se moverán a \"{{fallbackStatusName}}\". ¿Estás absolutamente seguro?",
  statusesRestoredTitle: "Estados Restaurados",
  statusesRestoredDescription: "Los estados de trabajo han sido restaurados a los valores predeterminados exitosamente.",
  jobStatusesTitle: "Estados de Trabajo",
  restoreDefaultStatusesButton: "Restaurar Predeterminados",
  // addStatusButton: "Añadir Estado", // Re-using 'addStatus'
  addNewStatusTitle: "Añadir Nuevo Estado", // Re-using
  // createNewStatusDescription: "Crear una nueva columna de estado para solicitudes", // Already exists
  nameLabel: "Nombre",
  // statusNamePlaceholder: "ej. Entrevista Técnica", // Using existing 'statusNamePlaceholder'
  colorLabel: "Color",
  defaultStatusLabel: "Estado predeterminado",
  // cancelButton: "Cancelar", // Already exists
  defaultBadge: "Predeterminado",
  systemBadge: "Sistema",
  moveUpTooltip: "Mover arriba",
  moveDownTooltip: "Mover abajo",
  editStatusTitle: "Editar Estado", // Re-using
  // modifyStatusPropertiesDescription: "Modificar propiedades de la columna de estado", // Already exists as 'editStatusDescription'
  // systemStatusWarning: "Este es un estado del sistema. Algunas propiedades no pueden modificarse.", // Already exists
  // saveChangesButton: "Guardar Cambios", // Already exists
  areYouSureTitle: "¿Estás seguro?",
  deleteButton: "Eliminar",
  // noStatusesDefined: "No hay columnas de estado definidas. Añade una para comenzar.", // Already exists
  restoreDefaultStatusesTitle: "Restaurar Estados Predeterminados",
  restoreDefaultsWarning1: "Esta acción eliminará todos los estados de trabajo personalizados y los restablecerá a los predefinidos.",
  restoreDefaultsChooseFallback: "Por favor, elige un estado de respaldo para las postulaciones que actualmente se encuentran en estados personalizados que serán eliminados:",
  continueButton: "Continuar",
  restoreButton: "Restaurar",

  // Navigation
  statistics: "Estadísticas",

  // Resume Page (Spanish)
  myResumes: "Mis Currículums",
  uploadResume: "Subir Currículum",
  fileTooLarge: "Archivo Demasiado Grande",
  fileTooLargeDescription: "El archivo seleccionado excede el tamaño máximo permitido de {{maxSize}}.",
  resumeUploaded: "Currículum Subido",
  resumeUploadedSuccess: "\"{{name}}\" se ha subido correctamente.",
  uploadError: "Error al Subir",
  uploadErrorDescription: "Ocurrió un error al subir el currículum. Por favor, inténtalo de nuevo.",
  resumeRenamed: "Currículum Renombrado",
  resumeRenamedSuccess: "\"{{oldName}}\" ha sido renombrado a \"{{newName}}\".",
  resumeDeleted: "Currículum Eliminado",
  resumeDeletedSuccess: "\"{{name}}\" ha sido eliminado correctamente.",
  downloadError: "Error de Descarga",
  noContentToDownload: "No hay contenido disponible para descargar para este currículum.",
  downloadStarted: "Descarga Iniciada",
  downloadStartedSuccess: "La descarga de \"{{name}}\" ha comenzado.",
  errorPreparingDownload: "Ocurrió un error al preparar la descarga.",
  previewNotAvailable: "Vista Previa No Disponible",
  previewNotAvailableDescription: "La vista previa directa no está disponible para este tipo de archivo. Por favor, descárgalo para verlo.",
  previewError: "Error de Vista Previa",
  noContentToPreview: "No hay contenido disponible para previsualizar para este currículum.",
  uploadingInProgress: "Subiendo",
  noResumesUploaded: "Aún No Has Subido Currículums",
  getStartedByUploading: "Comienza subiendo tu primer currículum.",
  displayName: "Nombre a Mostrar",
  originalFileName: "Nombre Original del Archivo",
  fileType: "Tipo de Archivo",
  size: "Tamaño",
  // lastUpdated: "Última Actualización", // Assuming 'date' or similar is used from existing
  actions: "Acciones",
  previewResume: "Previsualizar Currículum",
  // downloadResume: "Descargar Currículum", // Assuming covered by existing 'download'
  renameResume: "Renombrar Currículum",
  deleteResume: "Eliminar Currículum",
  newResumeNameLabel: "Nuevo Nombre del Currículum",
  enterNewName: "Introduce el nuevo nombre a mostrar",
  // confirmDeletion: "Confirmar Eliminación", // Assuming covered by existing
  areYouSureDeleteResume: "¿Estás seguro de que quieres eliminar el currículum \"{{name}}\"?",
  previewTitle: "Vista Previa",
  previewNotAvailableForType: "La vista previa no está disponible para archivos {{type}}.",
  downloadToView: "Descargar para Ver",
  openPreview: "Abrir Vista Previa Completa"
}
