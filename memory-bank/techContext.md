# Tech Context: Job Tracker Application

## 1. Core Technologies

*   **Framework:** Next.js (v15.2.4, using App Router as per `README.md` and `tsconfig.json` "next" plugin)
*   **Language:** TypeScript (v5, as per `devDependencies` in `package.json` and `tsconfig.json`)
*   **UI Library:** React (v19, as per `dependencies` in `package.json`)
*   **Styling:**
    *   Tailwind CSS (v3.4.17, as per `devDependencies` and `tailwind.config.ts`)
    *   `tailwindcss-animate` plugin for animations.
    *   CSS Modules or global CSS (`app/globals.css` mentioned in `README.md`).
*   **Package Manager:** pnpm (inferred from `pnpm-lock.yaml` and `README.md` commands)

## 2. Key Dependencies (from `package.json`)

*   **UI Components (Radix UI & shadcn/ui ecosystem):**
    *   A comprehensive suite of Radix UI components (`@radix-ui/react-*`) for building accessible UI primitives (e.g., Dialog, DropdownMenu, Select, Tabs, Tooltip).
    *   `lucide-react` for icons.
    *   `class-variance-authority`, `clsx`, `tailwind-merge` for utility-first CSS class management, typical with shadcn/ui.
    *   `sonner` for toasts/notifications.
    *   `vaul` for drawers.
    *   `recharts` for charts/statistics.
    *   `embla-carousel-react` for carousels.
*   **Forms:**
    *   `react-hook-form` (v7.54.1) for form management.
    *   `@hookform/resolvers` with `zod` (v3.24.1) for schema validation.
*   **Drag and Drop:**
    *   `react-dnd` and `react-dnd-html5-backend` for implementing drag-and-drop functionality (Kanban board).
*   **Date Management:**
    *   `date-fns` for date utilities.
    *   `react-day-picker` for calendar/date picking.
*   **State Management & Data Persistence:**
    *   Primarily client-side using browser Local Storage, as stated in `README.md`.
    *   Custom hooks (`hooks/` directory) likely play a role (e.g., `use-local-storage.ts`).
    *   `next-themes` for theme (dark/light mode) management.
*   **Animation:**
    *   `framer-motion` for more complex animations.
*   **Layout:**
    *   `react-resizable-panels` for creating resizable panel layouts.
*   **Input:**
    *   `input-otp` for one-time password style inputs.

## 3. Development Environment & Tooling

*   **Node.js:** Prerequisite (16.x or later, as per `README.md`).
*   **Build Tool:** Next.js CLI (`next dev`, `next build`).
*   **Linting:** ESLint (configured via `next lint` script, `eslint.ignoreDuringBuilds` in `next.config.mjs`).
*   **TypeScript Configuration (`tsconfig.json`):**
    *   Targets `es5` for broader compatibility but uses `esnext` for module system and libraries.
    *   Strict mode enabled (`strict: true`).
    *   JSX `preserve` mode.
    *   Path alias `@/*` configured to `./*`.
    *   `skipLibCheck: true`.
    *   `noEmit: true` (Next.js handles transpilation).
*   **Next.js Configuration (`next.config.mjs`):**
    *   `reactStrictMode: true`.
    *   `swcMinify: true` (using SWC for faster minification).
    *   `eslint.ignoreDuringBuilds: true`.
    *   `typescript.ignoreBuildErrors: true` (allows building even with TS errors, potentially for faster iteration or CI).
    *   `images.unoptimized: true` (disables Next.js Image Optimization, perhaps for simplicity in local storage context or specific deployment needs).

## 4. Project Structure Highlights (from `README.md`)

*   `app/`: Next.js App Router directory structure.
    *   `api/`: Backend API routes (e.g., `job-scraper`).
*   `components/`: Reusable React components.
    *   `ui/`: Likely shadcn/ui components.
*   `lib/`: Utility functions, type definitions, and shared logic (e.g., `storage.ts`, `job-analyzer.ts`).
*   `hooks/`: Custom React hooks.
*   `public/`: Static assets.
*   `scripts/`: Utility scripts (e.g., `setup.sh`).

## 5. Technical Constraints & Considerations

*   **Client-Side Focus:** Core functionality relies on browser local storage, meaning data is not synced across devices or browsers without manual export/import.
*   **No Backend Database (for core features):** Simplifies setup but limits scalability and server-side processing beyond API routes.
*   **Build Process:** Standard Next.js build process. Ignoring ESLint and TypeScript errors during build (`ignoreDuringBuilds: true`, `ignoreBuildErrors: true`) might lead to runtime issues if not carefully managed.
*   **Internationalization (i18n):** Presence of `app/i18n/translations/` and `lib/i18n/` suggests i18n support is implemented or planned. Files like `en.ts`, `es.ts`, `index.ts` in these directories confirm this.

This document provides a snapshot of the technical landscape of the Job Tracker Application. It should be updated as the technology stack evolves.
