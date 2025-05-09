# Job Tracker Application

A comprehensive application to track job applications, manage resumes, and organize your job search process with advanced features like drag-and-drop, web mining, and keyword suggestions.

## Features

- **Kanban board** for job application tracking
- **Drag and drop** interface for job cards and columns
- **Web mining system** to extract job details from URLs
- **Keyword suggestions** with color-coded categories
- **Export/Import** job data to/from JSON and CSV
- **Customizable job states** with color options
- **Resume and cover letter management**
- **Job application statistics** and analytics
- **Dark theme** support
- **Fully responsive design** for mobile, tablet, and desktop

## Getting Started

### Prerequisites

- Node.js 16.x or later
- npm or pnpm

### Installation

#### Option 1: Using setup script (Recommended)

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/job-tracker.git
   cd job-tracker
   ```

2. Run the setup script:
   ```bash
   chmod +x scripts/setup.sh
   ./scripts/setup.sh
   ```

3. Start the development server:
   ```bash
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Option 2: Manual setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/job-tracker.git
   cd job-tracker
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   ```

4. Run the development server:
   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
job-tracker/
├── app/                  # Next.js App Router
│   ├── api/              # API routes
│   │   └── job-scraper/  # Job scraper API for web mining
│   ├── dashboard/        # Dashboard pages
│   ├── login/            # Authentication pages
│   ├── settings/         # Settings pages
│   │   └── job-states/   # Job state management
│   ├── statistics/       # Statistics pages
│   ├── resume/           # Resume management pages
│   ├── cover-letter/     # Cover letter pages
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/           # React components
│   ├── ui/               # UI components (shadcn/ui)
│   ├── job-board.tsx     # Main job board component
│   ├── job-card.tsx      # Job card component
│   ├── job-column.tsx    # Job column component
│   ├── keyword-suggestions.tsx # Keyword suggestion component
│   ├── draggable-column.tsx    # Draggable column component
│   ├── enhanced-job-extractor.tsx # Web mining component
│   └── ...               # Other components
├── lib/                  # Utility functions and types
│   ├── data.ts           # Sample data
│   ├── storage.ts        # Local storage utilities
│   ├── job-analyzer.ts   # Job analysis utilities
│   ├── skill-categories.ts # Skill categorization data
│   ├── types.ts          # TypeScript types
│   └── utils.ts          # Utility functions
├── hooks/                # Custom React hooks
├── public/               # Static assets
├── scripts/              # Setup and utility scripts
│   └── setup.sh          # Setup script
├── .env.local.example    # Environment variables template
├── next.config.mjs       # Next.js configuration
├── package.json          # Project dependencies
├── tailwind.config.ts    # Tailwind CSS configuration
└── tsconfig.json         # TypeScript configuration
```

## Key Features and Usage

### Job Tracking Kanban Board

- **Add Job**: Click the "+" button to add a new job application
- **Edit Job**: Click the pencil icon on a job card to edit details
- **Move Job**: Drag job cards between status columns
- **Delete Job**: Click the trash icon on a job card to remove it
- **View Job URL**: Click the link icon to open the job posting URL

### Web Mining

- **Extract from URL**: Click the "Extract from URL" button and enter a job posting URL
- **Auto-fill**: The system will attempt to extract job details such as title, company, location, salary, and requirements

### Keyword Suggestions

- When adding or editing a job, the system will analyze the job description and suggest relevant keywords
- Keywords are color-coded by category:
  - Blue: Technical skills
  - Rose: Soft skills
  - Amber: Requirements

### Data Management

- **Export Jobs**: Export your job data to JSON or CSV from the dashboard
- **Import Jobs**: Import previously exported job data back into the application

### Column Management

- **Add Column**: Create new status columns with custom names and colors
- **Reorder Columns**: Drag and drop columns to reorder them
- **Edit Column**: Change column name and color via the settings panel
- **Delete Column**: Remove unused columns (jobs will be moved to another column)

## Development

### Commands

- `pnpm dev` - Start the development server
- `pnpm build` - Build the application for production
- `pnpm start` - Start the production server
- `pnpm lint` - Run ESLint to check code quality

### Local Storage

This application uses browser local storage to persist data. No backend database is required for basic functionality. Data is stored locally in the browser, so it's private to your device.

## License

MIT
