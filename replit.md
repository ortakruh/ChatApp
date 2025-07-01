# Discord Clone Application

## Overview

This is a full-stack Discord clone web application built with modern web technologies. The application features a React frontend with TypeScript, an Express.js backend, and PostgreSQL database with Drizzle ORM. It implements Discord-like functionality including user authentication, friend management, and a chat interface with Discord's visual styling.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom Discord color scheme
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM modules
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: Express sessions with PostgreSQL store
- **API Design**: RESTful API with JSON responses

### Authentication & Authorization
- **Strategy**: Session-based authentication with secure cookies
- **User Management**: Email/username and password authentication
- **Friend System**: Unique friend codes for user discovery
- **Session Storage**: PostgreSQL-backed session store using connect-pg-simple

## Key Components

### Database Schema
- **Users Table**: Stores user credentials, profiles, and unique friend codes
- **Friendships Table**: Manages friend relationships with status tracking (pending, accepted, blocked)
- **Schema Validation**: Zod schemas for runtime type checking and validation

### Frontend Pages
- **Landing Page**: Discord-style hero section with gradient backgrounds
- **Authentication Page**: Combined login/register forms with tab switching
- **Chat Page**: Main application interface with Discord-like sidebar and messaging area
- **Profile Management**: Modal-based profile editing with avatar support

### Backend Services
- **Storage Layer**: Abstracted storage interface with in-memory implementation
- **User Operations**: CRUD operations for user management and authentication
- **Friend System**: Friend request handling, status management, and discovery

### UI/UX Features
- **Discord Theming**: Custom CSS variables matching Discord's color palette
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints
- **Component Library**: Comprehensive set of reusable UI components
- **Form Validation**: Client-side validation with server-side verification

## Data Flow

### Authentication Flow
1. User submits login/register form
2. Frontend validates input using Zod schemas
3. API request sent to backend with credentials
4. Backend validates and creates/verifies user session
5. Session stored in PostgreSQL with secure cookie
6. User state managed in frontend auth service

### Friend Management Flow
1. User enters friend code in add friend modal
2. System validates friend code format and existence
3. Friend request created with pending status
4. Target user can accept/reject request
5. Status updates reflected in real-time UI
6. Friend lists updated via React Query cache invalidation

### Profile Management Flow
1. User opens profile modal with current data
2. Form pre-populated with existing profile information
3. Changes validated client-side before submission
4. API updates user profile in database
5. Local auth state updated with new profile data
6. UI reflects changes immediately

## External Dependencies

### Database & Infrastructure
- **Neon Database**: Serverless PostgreSQL for production deployment
- **Drizzle Kit**: Database migrations and schema management
- **PostgreSQL**: Primary data storage with ACID compliance

### Development Tools
- **Vite**: Fast build tool with HMR for development
- **TypeScript**: Static typing across frontend and backend
- **ESBuild**: Production bundling for backend code
- **Replit Integration**: Development environment with cartographer plugin

### UI & Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible primitive components
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Component variant management

### Utilities & Libraries
- **Date-fns**: Date manipulation and formatting
- **Nanoid**: Unique ID generation for various use cases
- **CLSX & Tailwind Merge**: Conditional styling utilities

## Deployment Strategy

### Development Environment
- **Hot Module Replacement**: Vite dev server with instant updates
- **TypeScript Checking**: Real-time type checking during development
- **Database Migrations**: Drizzle push for schema synchronization
- **Environment Variables**: DATABASE_URL for database connection

### Production Build
- **Frontend**: Vite build process generating optimized static assets
- **Backend**: ESBuild bundling for Node.js deployment
- **Asset Serving**: Express static file serving for production
- **Database**: Automatic migration application on deployment

### Scalability Considerations
- **Database**: PostgreSQL with connection pooling via Neon
- **Session Management**: Database-backed sessions for horizontal scaling
- **Static Assets**: CDN-ready build output structure
- **API Design**: Stateless REST endpoints for load balancing

## Changelog
- July 01, 2025. Initial setup
- July 01, 2025. Major fixes and improvements:
  - Fixed login validation to properly check password matching username/email
  - Implemented friend request system with pending/accept/reject functionality
  - Added remember me feature with localStorage persistence
  - Added real-time updates for friend requests (2-second polling)
  - Fixed friend code validation and case handling
  - Implemented tabbed friend interface (All, Online, Pending, Blocked)
  - Added proper friend request flow with accept/reject buttons
  - Fixed TypeScript errors and data type handling

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Issues Fixed
- Login system now properly validates password must match username or email
- Friend requests work with proper verification system
- Remember me checkbox prevents logout on page refresh
- Real-time friend request updates without manual page refresh
- Pending requests show proper user names and accept/reject options
- Friend codes now work with case-insensitive matching