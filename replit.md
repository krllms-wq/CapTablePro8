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

## Demo Company System - FULLY FUNCTIONAL ✅
- **Working Demo**: Example LLC with comprehensive rich demo data
- **Demo User**: demo@example.com (password: hello) - FIXED ACCESS ✅
- **Rich Sample Data**: 
  - Alice Founder (3M shares), Bob Founder (2M shares)
  - Jane Employee (200K ISO options + 50K RSUs)  
  - Demo Ventures (SAFE + convertible note + preferred shares)
  - Corporate actions: 2:1 stock split, $2M seed round, secondary sales
- **Database Integration**: FIXED PostgresStorage getUserCompanies to include owned companies
- **Authentication**: Fixed password hashing and token generation for demo access
- **Cap Table Stats**: 8M shares, 285K options, 350K convertibles, 9 stakeholders

## Recent Bug Fixes & Enhancements - Aug 22, 2025 ✅

### Issue Shares Dialog Redesign - COMPLETED ✅
- **New Input Model**: Changed from "quantity + consideration" to "consideration + valuation" input model for clearer user workflow
- **Auto-Calculated Values**: Quantity and Price per Share now automatically calculated from Consideration and Company Valuation inputs
- **Override System**: Added toggle controls for manual override of both Quantity and Price per Share calculations
- **Conflict Detection**: Smart validation when manual values don't align with calculated values, with tolerance-based warnings
- **Eliminated Duplicates**: Removed duplicate fields (Quantity, Round Name, Issue Date) that appeared in multiple sections
- **Enhanced UX**: Added "Derived" badges, mobile-friendly numeric keyboards, and comprehensive help tooltips
- **Fixed Infinite Recursion**: Resolved "Maximum call stack size exceeded" error by breaking circular dependencies in form watching logic
- **Real-time Updates**: Calculations update instantly as user types with proper validation and error handling

### Authentication System Fixed - COMPLETED ✅
- **Resolved User Login Issues**: Fixed authentication system that was preventing existing users from logging in with correct credentials
- **Database Storage Integration**: Switched from MemStorage to DatabaseStorage for proper PostgreSQL user authentication
- **Password Hash Verification**: Fixed password verification system and updated demo account hashes
- **Proper User Lookup**: User authentication now correctly queries PostgreSQL database instead of empty in-memory storage
- **Confirmed Working Credentials**: 
  - `work@me.com` / `123456` ✅ 
  - `demo@example.com` / `hello` ✅
- **Session Management**: User sessions and JWT tokens now properly validated and maintained

### Enhanced Activity Feed & Event Logging - COMPLETED ✅
- **Fixed "Unknown Action Unknown undefined" Display**: Implemented comprehensive event formatting with robust fallback handling for all event types
- **Enhanced Transaction Logging**: Added complete metadata for all transaction types including shares, equity awards, convertibles, and secondary transfers
- **Human-Readable Event Descriptions**: Activity feed now displays detailed descriptions like "Issued 50,000 Common shares to Bob Founder for $100,000 on 8/22/2025"
- **Comprehensive Event Coverage**: Added formatting for stakeholder events, company events, corporate actions, and system events
- **Debug Logging System**: Added extensive debugging to identify and resolve activity feed display issues
- **Enhanced Metadata**: All transaction logging now includes stakeholder types, security classes, consideration amounts, and transaction dates
- **Real-time Activity Updates**: Feed automatically refreshes and displays new events with proper date grouping and relative timestamps

## Recent Bug Fixes & Enhancements - Aug 22, 2025 ✅

### SAFE Conversion Mathematics - COMPLETED ✅
- **Anti-Dilution Protection**: SAFEs convert at pre-money valuation to preserve new investor ownership
- **Pre-Money Conversion Sequence**: SAFEs convert first, then new investors receive shares
- **Mathematical Correctness**: Conversion price respects discount rates and valuation caps
- **Documentation Added**: Created comprehensive SAFE conversion logic documentation
- **No New Investor Dilution**: New investors get their exact target ownership percentage
- **Enhanced Debugging**: Added comprehensive logging for SAFE conversion calculations

### UI/UX Improvements - COMPLETED ✅  
- **Percentage Formatting**: All percentages now display with exactly two decimal places (e.g., 22.06% instead of 22.0588%)
- **Mobile Keyboard Support**: Added `inputMode="numeric"` to all money, shares, and percentage input fields for optimal mobile experience
- **Mobile Navigation**: Fixed disappearing navigation on mobile devices by adding hamburger menu with slide-out navigation panel
- **Responsive Design**: Navigation automatically switches between desktop horizontal menu and mobile slide-out menu at md breakpoint (768px)
- **Cap Table Display**: Fixed stakeholder ownership calculations to properly show convertibles separately from current ownership
- **Enhanced Form Validation**: Improved numeric field validation and formatting across all dialogs

## Recent Bug Fixes & Enhancements - Aug 19, 2025 ✅

### Price Math Helper Implementation - COMPLETED
- **Centralized Price Utilities**: Created `client/src/utils/priceMath.ts` with comprehensive money/shares parsing and calculation functions
- **Money Parsing**: `parseMoneyLoose()` strips currency symbols, commas, spaces and validates positive numbers
- **Shares Parsing**: `parseSharesLoose()` handles up to 6 decimal places with comma/space stripping
- **Precision Rounding**: `roundMoney()` (4dp default) and `roundShares()` (6dp default) with half-up rounding
- **PPS Derivation**: `derivePpsFromValuation()` and `derivePpsFromConsideration()` for price-per-share calculations
- **Conflict Resolution**: `reconcilePps()` reconciles multiple PPS sources with tolerance-based warning system (50bps default)
- **Comprehensive Testing**: 29 unit tests covering all functions and edge cases, all passing ✅
### RSU Strike Price Bug - RESOLVED
- **Fixed Schema**: Updated `insertEquityAwardSchema` to allow null strike prices for RSUs
- **Fixed Routes**: Backend properly handles RSU creation without strike price requirement  
- **Fixed Forms**: Grant options dialog conditionally shows/hides strike price field for RSUs
- **Fixed Validation**: RSUs can be created without strike price, options still require it

### Activity Feed Reliability - ENHANCED  
- **Stable Pagination**: Implemented proper ordering (createdAt DESC, id DESC) for reliable feed
- **Real-time Updates**: Activity feed component with 30-second refresh intervals
- **Date Grouping**: Events grouped by date with relative time formatting

### Cap Table Valuation Math - CORRECTED
- **No Double Counting**: Fixed ownership calculations to prevent double counting shares + options
- **Proper RSU Handling**: Configurable RSU inclusion modes (none/granted/vested)
- **Accurate Fully Diluted**: Only unallocated option pool added to denominator
- **Valuation Calculator**: Server-side utilities for current and fully diluted company valuations

### Frontend Libraries
- **Radix UI**: Accessible component primitives
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form state management with validation
- **Zod**: Runtime type validation and schema parsing
- **Wouter**: Lightweight client-side routing
- **date-fns**: Date manipulation and formatting utilities

### Utility Libraries
- **Price Math Helper**: Centralized utilities for consistent money/shares parsing, rounding, and price-per-share calculations with conflict reconciliation (`client/src/utils/priceMath.ts`)

### Backend Services
- **Drizzle ORM**: Type-safe PostgreSQL database toolkit
- **Express.js**: Web application framework

### Development Tools
- **Vite**: Frontend build tool
- **TypeScript**: Static type checking
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: JavaScript bundler