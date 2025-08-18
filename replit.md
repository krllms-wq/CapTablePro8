# Cap Table Web Application

## Overview
This is a comprehensive capitalization table (cap table) web application designed for startups and investors to model, maintain, and share company ownership structures throughout the business lifecycle. The application supports complex equity instruments including common shares, preferred shares, options, RSUs, warrants, SAFEs, and convertible notes. It provides real-time calculations, scenario modeling, and role-based access control for different stakeholder types, aiming to be a critical tool for equity management.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Full-Stack Architecture
The application follows a monorepo structure with clear separation between client, server, and shared components. The frontend is built with React and TypeScript, while the backend uses Express.js with a Node.js runtime. The shared directory contains common schemas and types used across both frontend and backend.

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite
- **Routing**: Wouter for lightweight client-side routing with URL state management
- **UI Components**: Custom component library built on Radix UI primitives with enhanced UX patterns
- **State Management**: React Query (TanStack Query) for server state management and data fetching
- **Forms**: React Hook Form with Zod validation, enhanced inputs, autosave, and accessibility features
- **Styling**: Tailwind CSS with CSS variables, motion-safe utilities, and shadcn/ui component patterns
- **UX Enhancements**: Comprehensive accessibility (WCAG 2.1), undo/redo system, offline support, error boundaries, responsive design for mobile.

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **API Design**: RESTful endpoints with consistent error handling and request/response patterns
- **Storage Layer**: Abstracted storage interface allowing for multiple implementations

### Database Design
The schema supports complex cap table structures with entities for Companies, Security classes, Stakeholders, Share ledger entries, Equity awards with vesting schedules, Convertible instruments, Funding rounds, Corporate actions, and Audit logging.

### Authentication & Authorization
- Role-based access control (RBAC) with company-scoped permissions
- Support for different user types: Company Admins, Investors, Employees, and Auditors
- OAuth2 integration ready (Google/Microsoft SSO)
- Resource-scoped sharing with expiry and watermarking capabilities

### Data Processing & Calculations
- Real-time cap table calculations with support for fully diluted and outstanding share views
- Complex ownership percentage calculations considering all equity instruments
- Scenario modeling capabilities for funding rounds and corporate actions
- Financial formatting utilities with multi-currency support

### System Design Choices
- **Comprehensive UX/UI System**: Includes accessible form components, motion-safe utilities, enhanced toast system, breadcrumb navigation, URL state management, autosave & offline support, undo/redo history, CSV import system, global error boundary, and mobile navigation.
- **Robust Backend Cap Table Logic**: Correct implementation of SAFE conversion mechanics, enhanced convertible note calculations, calendar-based vesting calculations, and accurate cap table mathematics.
- **Comprehensive System Testing & Error Fixing**: Includes critical schema validation fixes, enhanced error handling via ErrorBoundary, number formatting standardization, foreign key validation, and a contextual help system.
- **Dual-Mode Cap Table Implementation**: Supports Current and Historical views of the cap table.
- **Funding Round Modeling Overhaul**: Full-page experience for modeling funding rounds with multiple investor support, real-time calculations, and side-by-side cap table comparison.
- **Scenario Management System**: Allows saving and loading of scenarios with full CRUD operations.

## External Dependencies

### Database & Infrastructure
- **Neon Database**: Serverless PostgreSQL database with connection pooling
- **Google Cloud Storage**: File storage and document management

### Frontend Libraries
- **Radix UI**: Accessible component primitives
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form state management with validation
- **Zod**: Runtime type validation and schema parsing
- **Wouter**: Lightweight client-side routing
- **date-fns**: Date manipulation and formatting utilities

### Backend Services
- **Drizzle ORM**: Type-safe PostgreSQL database toolkit
- **Express.js**: Web application framework

### Development Tools
- **Vite**: Frontend build tool
- **TypeScript**: Static type checking
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: JavaScript bundler