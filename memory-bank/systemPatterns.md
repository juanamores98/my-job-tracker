# System Patterns: Job Tracker Application

## 1. Overall Architecture

*   **Client-Server Model (Next.js):** The application is built using Next.js, leveraging its App Router for page-based routing and server-side rendering/static site generation capabilities where applicable.
*   **Frontend-Heavy Application:** The core job tracking functionality is primarily client-side, with data persisted in the browser's Local Storage.
*   **API Routes for Specific Backend Tasks:** Next.js API routes (under `app/api/`) are used for operations that require server-side logic, such as the `job-scraper` for web mining.
*   **Monolithic Frontend:** The frontend code is organized within a single Next.js project.

## 2. Component Architecture

*   **Directory Structure:**
    *   `app/`: Contains page components and layouts, following Next.js App Router conventions.
    *   `components/`: Houses reusable React components.
        *   `components/ui/`: Contains UI primitives, likely sourced from shadcn/ui, built upon Radix UI. These are general-purpose UI elements (Button, Card, Dialog, etc.).
        *   `components/`: Contains higher-level, feature-specific components (e.g., `job-board.tsx`, `add-job-modal.tsx`, `keyword-suggestions.tsx`).
*   **Component-Based Design:** The UI is built by composing smaller, reusable components.
*   **Props for Data Flow:** Data is primarily passed down from parent to child components via props.
*   **Event Handling:** Child components communicate events or data changes to parent components via callback functions passed as props.

## 3. State Management

*   **Local Storage for Core Data:** Job application data, user settings (like custom job states), and potentially other user-specific information are stored in the browser's Local Storage.
    *   `lib/storage.ts` likely provides an abstraction layer for interacting with Local Storage.
    *   `hooks/use-local-storage.ts` is probably a custom hook to simplify state synchronization with Local Storage.
*   **React Context API:** Likely used for global or shared state that doesn't need to be persisted directly or for managing cross-cutting concerns.
    *   `next-themes` (for theme management) uses React Context.
    *   Custom contexts might be defined for managing application-wide state like job data, UI state, or internationalization.
*   **Component-Local State:** React's `useState` and `useReducer` hooks are used for managing state within individual components.
*   **Form State:** `react-hook-form` is used for managing form state, validation, and submission.

## 4. Data Flow & Management

*   **Client-Side Data Hydration:** On application load, data is likely read from Local Storage and hydrated into the application's state (e.g., via React Context or top-level component state).
*   **CRUD Operations:**
    *   **Create/Update/Delete:** User actions trigger functions that modify the state (in memory and Local Storage).
    *   **Read:** Components read data from the central state (Context or props) to render the UI.
*   **Data Transformation:** Utility functions in `lib/` (e.g., `job-analyzer.ts`) are used for processing and transforming data (e.g., for keyword suggestions).
*   **Export/Import:** Functionality exists to serialize application data to JSON/CSV and deserialize it back, allowing for manual backup and data transfer.

## 5. Key Feature Implementation Patterns

*   **Kanban Board (`components/job-board.tsx`, `job-column.tsx`, `job-card.tsx`):**
    *   Uses `react-dnd` for drag-and-drop functionality between columns and for reordering cards/columns.
    *   State for jobs and columns is managed centrally and passed down.
*   **Web Mining (`app/api/job-scraper/route.ts`, `components/enhanced-job-extractor.tsx`):**
    *   Client-side component (`enhanced-job-extractor.tsx`) makes a request to a Next.js API route (`/api/job-scraper`).
    *   The API route performs the actual web scraping (details of the scraping mechanism are not yet known but would involve fetching and parsing HTML from the target URL).
*   **Keyword Suggestions (`components/keyword-suggestions.tsx`, `lib/job-analyzer.ts`, `lib/skill-categories.ts`):**
    *   Job description text is processed by `lib/job-analyzer.ts`.
    *   `lib/skill-categories.ts` likely contains predefined lists or patterns for categorizing skills.
    *   The `keyword-suggestions.tsx` component displays these categorized suggestions.
*   **Internationalization (i18n):**
    *   Translation files are stored in `app/i18n/translations/` (e.g., `en.ts`, `es.ts`).
    *   `lib/i18n/index.ts` likely sets up the i18n context and provides functions/hooks for accessing translations.
    *   A React Context provider probably wraps the application to make translations available throughout the component tree.

## 6. Styling and Theming

*   **Tailwind CSS:** Utility-first CSS framework for styling.
*   **CSS Variables:** Used for theming (colors, border radius), as seen in `tailwind.config.ts` (e.g., `hsl(var(--primary))`).
*   **Dark Mode:** Implemented using Tailwind's `darkMode: ["class"]` strategy, managed by `next-themes`.
*   **Component-Scoped Styles:** While Tailwind is utility-first, global styles (`app/globals.css`) and potentially CSS Modules could be used for more complex or component-specific styling.

## 7. Error Handling and Validation

*   **Form Validation:** `zod` schemas are used with `react-hook-form` for client-side input validation.
*   **API Error Handling:** Client-side code calling API routes needs to handle potential network errors or errors returned by the API.
*   **UI Feedback:** `sonner` (toasts) is likely used to provide feedback to the user about successful operations or errors.

This document outlines the primary system patterns observed. Further code analysis may reveal more detailed patterns or specific implementations.
