# Changelog

## v0.2.0 - Enhanced Job Tracker (Current)

### Added
- **Drag-and-Drop Functionality**
  - Enhanced drag-and-drop for job cards between columns
  - Implemented column reordering with drag-and-drop
  
- **Web Mining System**
  - Added backend API endpoint for job data extraction (/api/job-scraper)
  - Improved job extraction logic for popular job boards (LinkedIn, Indeed, Glassdoor, etc.)
  - Auto-detection of fields from job descriptions (position, company, salary, etc.)
  
- **Keyword Suggestions**
  - Enhanced keyword suggestion system with categorization
  - Color-coded tags for technical skills (blue), soft skills (rose), and requirements (amber)
  - Tag selection and batch adding functionality
  
- **Data Management**
  - Export jobs to JSON and CSV formats
  - Import jobs from JSON and CSV formats
  - Duplicate detection when importing
  
- **UI/UX Improvements**
  - Responsive design for mobile, tablet, and desktop
  - Floating action button on mobile
  - Always-visible controls on small screens
  - Better column management with color customization
  - Tooltips for better user guidance
  
- **Developer Tools**
  - Setup script for easy local development
  - Updated documentation and project structure
  - Code optimization for better performance

### Fixed
- Modal visibility and functionality issues
- Mobile responsiveness for small screens
- Tag display and coloring uniformity
- Column management edge cases
- Error handling for job extraction

## v0.1.0 - Initial Release

### Features
- Basic Kanban board for job tracking
- Simple drag-and-drop interface
- Job status columns
- Add/edit/delete job functionality
- Dark theme support
- Basic responsive design 