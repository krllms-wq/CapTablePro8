# Cap Table Web Application

## Overview

This is a comprehensive capitalization table (cap table) web application designed for startups and investors to model, maintain, and share company ownership structures throughout the business lifecycle. The application supports complex equity instruments including common shares, preferred shares, options, RSUs, warrants, SAFEs, and convertible notes. Built with a modern tech stack, it provides real-time calculations, scenario modeling, and role-based access control for different stakeholder types.

## Recent Changes (January 2025)

✓ **Dual-Mode Cap Table Implementation**: Added Current/Historical toggle for cap table viewing
  - Current mode: Shows investment amounts per stakeholder with shares and ownership percentages
  - Historical mode: Displays stakeholders in rows with ownership changes across time periods

✓ **Navigation Enhancement**: Added consistent navigation component across all pages (stakeholders, transactions, equity-awards, scenarios)

✓ **Funding Round Modeling Overhaul**: Converted modal-based funding round modeling to full-page experience
  - Multiple investor support with individual names and investment amounts
  - Number formatting with commas for thousands and dots for decimals
  - Side-by-side before/after cap table comparison
  - Real-time calculation of round impact

✓ **Transaction History Improvements**: Enhanced transaction page with proper date handling and navigation integration

✓ **Stakeholder Management**: Added functional edit and delete buttons with user confirmation

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Full-Stack Architecture
The application follows a monorepo structure with clear separation between client, server, and shared components. The frontend is built with React and TypeScript, while the backend uses Express.js with a Node.js runtime. The shared directory contains common schemas and types used across both frontend and backend.

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development and bundling
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Custom component library built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: React Query (TanStack Query) for server state management and data fetching
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Styling**: Tailwind CSS with CSS variables for theming and shadcn/ui component patterns

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **API Design**: RESTful endpoints with consistent error handling and request/response patterns
- **Storage Layer**: Abstracted storage interface allowing for multiple implementations
- **Development**: Hot module replacement and development middleware integration

### Database Design
The schema supports complex cap table structures with entities for:
- Companies with multi-currency and jurisdiction support
- Security classes with liquidation preferences, participation rights, and voting structures
- Stakeholders (individuals and entities) with role-based attributes
- Share ledger entries for ownership tracking
- Equity awards with vesting schedules and exercise tracking
- Convertible instruments and funding rounds
- Corporate actions and audit logging

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

### Development & Build Process
- TypeScript compilation with strict type checking
- ESBuild for production bundling with platform-specific optimizations
- Development server with hot reload and error overlay
- Database migrations managed through Drizzle Kit

## External Dependencies

### Database & Infrastructure
- **Neon Database**: Serverless PostgreSQL database with connection pooling
- **Google Cloud Storage**: File storage and document management
- **Uppy**: File upload components with AWS S3 integration

### Frontend Libraries
- **Radix UI**: Accessible component primitives for complex UI elements
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form state management with validation
- **Zod**: Runtime type validation and schema parsing
- **Wouter**: Lightweight client-side routing
- **date-fns**: Date manipulation and formatting utilities

### Backend Services
- **Drizzle ORM**: Type-safe PostgreSQL database toolkit
- **Express.js**: Web application framework with middleware support

### Development Tools
- **Vite**: Frontend build tool with development server
- **TypeScript**: Static type checking and compilation
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: JavaScript bundler for production builds
- **Replit Integration**: Development environment with cartographer and error modal plugins