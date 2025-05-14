# Project Brief: Job Tracker Application

## 1. Project Overview

The Job Tracker Application is a comprehensive tool designed to help users manage and organize their job search process effectively. It provides a centralized platform for tracking job applications, managing resumes and cover letters, and leveraging advanced features to streamline the job hunting experience.

## 2. Core Requirements and Goals

The primary goal of this project is to provide a user-friendly and feature-rich application that simplifies the complexities of job searching.

Key requirements include:

*   **Job Application Tracking:**
    *   Implement a Kanban-style board for visualizing job application statuses.
    *   Allow users to add, edit, delete, and move job applications between different stages.
    *   Store essential job details: title, company, location, salary, job description, URL, application date, and notes.
*   **Data Management:**
    *   Enable users to export their job application data to common formats (JSON, CSV).
    *   Allow users to import job data from these formats.
    *   Persist data locally using browser local storage for privacy and simplicity (no backend database required for core functionality).
*   **Advanced Features:**
    *   **Web Mining:** Develop a system to extract job details automatically from URLs of job postings.
    *   **Keyword Suggestions:** Analyze job descriptions and suggest relevant keywords, categorized by type (e.g., technical skills, soft skills, requirements).
    *   **Customizable Job States:** Allow users to define and customize the stages (columns) in their Kanban board, including names and color-coding.
*   **Document Management:**
    *   Provide sections for managing resumes and cover letters.
*   **Analytics and Insights:**
    *   Offer statistics and analytics related to the job application process.
*   **User Experience:**
    *   Ensure a fully responsive design for usability across mobile, tablet, and desktop devices.
    *   Implement a dark theme option.
    *   Provide an intuitive and easy-to-use interface, including drag-and-drop functionality for job cards and columns.

## 3. Target Audience

Individuals actively searching for jobs, including:
*   New graduates
*   Professionals seeking new opportunities
*   Freelancers managing multiple applications

## 4. Key Technologies (Inferred from README.md and file structure)

*   **Frontend Framework:** Next.js (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS, global CSS
*   **UI Components:** shadcn/ui (indicated by `components.json` and `components/ui/`)
*   **State Management:** Likely React Context or custom hooks, given local storage persistence.
*   **Development Environment:** Node.js, pnpm

## 5. Project Scope (Initial)

The initial scope focuses on delivering the core features listed above, providing a robust client-side application. Future enhancements could include backend integration for data synchronization across devices, user accounts, and more advanced analytics.

## 6. Non-Goals (Implicit)

*   Real-time collaboration features (initially).
*   Complex user authentication system beyond basic needs (if any, for local data).
*   Direct integration with job board APIs for posting applications (focus is on tracking).

This document serves as the foundational understanding of the project. It will be updated as the project evolves or new requirements are identified.
