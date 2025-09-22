# Sports Facility Booking System - Codebase Guide

## Overview
This comprehensive guide documents all files in the Aryen Recreation Centre booking system, their purposes, and key implementation details.

---

## 📁 Root Directory Files

### Package Management
- **`package.json`** - Node.js dependencies and scripts for both frontend/backend
- **`package-lock.json`** - Locked dependency versions for reproducible builds
- **`tsconfig.json`** - TypeScript configuration for the entire project

### Build & Development Tools
- **`vite.config.ts`** - Vite bundler configuration with React and path aliases
- **`postcss.config.js`** - PostCSS configuration for Tailwind CSS processing
- **`tailwind.config.ts`** - Tailwind CSS configuration with custom themes and colors
- **`components.json`** - shadcn/ui component library configuration
- **`drizzle.config.ts`** - Drizzle ORM configuration for database operations

### Environment & Deployment
- **`.env.example`** - Template for environment variables (DATABASE_URL, SESSION_SECRET)
- **`.replit`** - Replit platform configuration for deployment
- **`.gitignore`** - Git ignore patterns for node_modules, build files, etc.

---

## 📁 Server Directory (`/server`)

### Core Server Files
- **`index.ts`** - Main Express server entry point
  - Configures Express app with middleware
  - Sets up Replit authentication 
  - Integrates Vite development server
  - Starts HTTP server on port 5000

- **`routes.ts`** - Complete API routing system (1500+ lines)
  - Authentication routes (`/api/login`, `/api/logout`, `/api/signup`)
  - User management (`/api/users`, `/api/admin/users`)
  - Sports master data (`/api/sports`, `/api/admin/sports`)
  - Grounds management (`/api/grounds`, `/api/admin/grounds`) 
  - Plans and pricing (`/api/plans`, `/api/admin/plans`)
  - Booking system (`/api/bookings`, `/api/admin/bookings`)
  - Payment processing (`/api/payments`, `/api/admin/payments`)
  - Notification system (`/api/notifications`)
  - Queue management (`/api/queue`)
  - Analytics and reports (`/api/admin/reports`)

- **`storage.ts`** - Database abstraction layer (1000+ lines)
  - IStorage interface defining all database operations
  - DatabaseStorage class implementing PostgreSQL operations
  - Complete CRUD methods for all entities
  - Complex queries with joins and aggregations
  - User statistics and analytics calculations

### Authentication & Database
- **`replitAuth.ts`** - Replit OpenID Connect authentication setup
  - OIDC strategy configuration
  - User profile synchronization
  - Session management integration

- **`db.ts`** - Database connection configuration
  - Drizzle ORM setup with PostgreSQL
  - Connection to Neon database via DATABASE_URL

- **`vite.ts`** - Development server integration
  - Vite middleware setup for hot reloading
  - Static file serving for production builds
  - Frontend/backend unified serving

### Utilities
- **`seed.ts`** - Database seeding with sample data
  - Demo users (client and admin accounts)
  - Sports, grounds, and pricing plans

### Payment & Receipt System
- **`receipt.ts`** - Comprehensive receipt generation system
  - ReceiptGenerator class for HTML and PDF receipt creation
  - Detailed payment breakdown calculations
  - Professional receipt templates with branding
  - Financial transparency with discount and balance tracking

- **`notifications.ts`** - Notification and receipt delivery system
  - Email receipt delivery via SendGrid integration
  - SMS notifications for payment confirmations
  - Automated receipt generation and sending
  - Sample bookings and payments
  - Time slots and facility configurations

---

## 📁 Client Directory (`/client`)

### Entry Points
- **`index.html`** - Main HTML template with React app mount point
- **`src/main.tsx`** - React application bootstrap
  - Query client setup for TanStack Query
  - Tooltip provider configuration
  - Root app component mounting

- **`src/App.tsx`** - Main application router
  - Wouter-based routing configuration
  - Authentication-based route protection
  - Public routes (landing, login, facilities)
  - Protected user routes (dashboard, bookings, payments)
  - Admin-only routes (management panels)

### Styling
- **`src/index.css`** - Global styles and Tailwind CSS imports
  - CSS custom properties for theming
  - Global component overrides
  - Dark mode support variables

---

## 📁 Client Pages (`/client/src/pages`)

### Public Pages
- **`landing.tsx`** - Homepage for unauthenticated users
  - Hero section with facility showcase
  - Featured facilities display
  - Call-to-action buttons for booking

- **`login.tsx`** - Enhanced authentication interface
  - Separate client and admin login forms
  - User registration with validation
  - Forgot password functionality
  - Password visibility toggles
  - Demo credentials display

- **`facilities.tsx`** - Facility browsing and filtering
  - Grid display of available sports facilities
  - Search and filter functionality
  - Capacity and availability indicators
  - Navigation to booking interface

### User Pages
- **`home.tsx`** - Main dashboard for authenticated users
  - Recent bookings overview
  - Quick booking shortcuts
  - Notification center
  - Popular facilities display

- **`booking.tsx`** - Facility booking interface
  - Calendar-based date selection
  - Time slot availability display
  - Participant count selection
  - Conflict detection and queue options

- **`profile.tsx`** - User account management
  - Profile information editing
  - Booking history display
  - Payment records
  - Notification preferences

### Payment System
- **`Payment.tsx`** - Payment processing interface
- **`PaymentPage.tsx`** - Dedicated payment completion page
- **`PendingPayments.tsx`** - Outstanding payment management

### Enhanced Features
- **`EnhancedBooking.tsx`** - Advanced booking interface with queue integration
- **`BookingQueue.tsx`** - Waiting list management for users
- **`user/Dashboard.tsx`** - Personal dashboard with notifications and booking management

### Admin Pages (`/client/src/pages/admin`)
- **`dashboard.tsx`** - Administrative overview with statistics
- **`sports.tsx`** - Sports master data management
- **`grounds.tsx`** - Physical facility management  
- **`plans.tsx`** - Pricing plan configuration
- **`timeslots.tsx`** - Time slot management
- **`facilities.tsx`** - Legacy facility management (deprecated)
- **`bookings.tsx`** - Booking oversight and management
- **`users.tsx`** - User account administration
- **`payments.tsx`** - Payment collection and tracking
- **`reports.tsx`** - Analytics dashboard with export capabilities
- **`NotificationManagement.tsx`** - System notification controls

### Utility Pages
- **`not-found.tsx`** - 404 error page
- **`NotFound.tsx`** - Alternative 404 implementation

---

## 📁 Client Components (`/client/src/components`)

### UI Components (`/client/src/components/ui`)
Complete shadcn/ui component library (50+ components):
- **Form controls**: `button.tsx`, `input.tsx`, `label.tsx`, `textarea.tsx`
- **Layout**: `card.tsx`, `sheet.tsx`, `sidebar.tsx`, `separator.tsx`
- **Navigation**: `navigation-menu.tsx`, `menubar.tsx`, `breadcrumb.tsx`
- **Data display**: `table.tsx`, `badge.tsx`, `avatar.tsx`, `calendar.tsx`
- **Feedback**: `toast.tsx`, `alert.tsx`, `progress.tsx`, `skeleton.tsx`
- **Overlays**: `dialog.tsx`, `popover.tsx`, `tooltip.tsx`, `drawer.tsx`
- **Advanced**: `carousel.tsx`, `chart.tsx`, `command.tsx`, `tabs.tsx`

### Custom Components
- **`AdminSidebar.tsx`** - Administrative navigation sidebar
  - Role-based menu items
  - Active route highlighting
  - Collapsible sections

- **`BookingModal.tsx`** - Booking creation dialog
  - Form validation and submission
  - Conflict detection
  - Queue integration options

- **`FacilityCard.tsx`** - Facility display component
  - Image and description rendering
  - Availability status indicators
  - Quick booking actions

- **`HeroSection.tsx`** - Landing page hero component
  - Background imagery
  - Call-to-action elements
  - Responsive design

- **`Navbar.tsx`** - Main navigation component
  - Authentication-aware menu items
  - User profile dropdown
  - Mobile-responsive design

- **`NotificationCenter.tsx`** - Notification management
  - Real-time notification display
  - Mark as read functionality
  - Notification filtering

- **`PaymentForm.tsx`** - Payment processing form
  - Multiple payment method support
  - Validation and error handling
  - Stripe integration ready

- **`ReceiptModal.tsx`** - Comprehensive receipt display system
  - Detailed payment breakdown with booking-specific data
  - Professional receipt formatting with company branding
  - PDF download and print functionality
  - Complete financial transparency including discounts and balances

- **`PaymentHistoryModal.tsx`** - Payment history management interface
  - Complete payment tracking for individual bookings
  - Comprehensive booking summary with financial totals
  - Individual receipt access for all past payments
  - Payment status tracking and transaction details
  - Seamless integration with receipt generation system

- **`StatsCard.tsx`** - Dashboard statistics display
  - Metric visualization
  - Icon and color theming
  - Responsive layout

---

## 📁 Client Hooks (`/client/src/hooks`)

- **`useAuth.ts`** - Authentication state management
  - User session tracking
  - Login/logout functionality
  - Role-based access control

- **`use-mobile.tsx`** - Responsive design utilities
  - Mobile device detection
  - Breakpoint management

- **`use-toast.ts`** - Toast notification system
  - Success/error message display
  - Customizable styling
  - Auto-dismiss functionality

---

## 📁 Client Libraries (`/client/src/lib`)

- **`utils.ts`** - Utility functions
  - CSS class name merging
  - Common helper functions
  - Type utilities

- **`queryClient.ts`** - TanStack Query configuration
  - API request handling
  - Cache management
  - Error handling defaults

- **`authUtils.ts`** - Authentication utilities
  - Token management
  - User role checking
  - Permission validation

- **`exportUtils.ts`** - Data export functionality
  - PDF generation utilities
  - Excel export helpers
  - Print formatting

---

## 📁 Shared Directory (`/shared`)

- **`schema.ts`** - Database schema definitions (1000+ lines)
  - Drizzle ORM table definitions
  - TypeScript type exports
  - Zod validation schemas
  - Complete data model for:
    - Users and authentication
    - Sports master data
    - Grounds and facilities
    - Pricing plans
    - Booking system
    - Payment tracking
    - Notification system
    - Queue management
    - Time slots and scheduling

---

## 📁 Documentation Files

### Project Documentation
- **`replit.md`** - Comprehensive project documentation
  - Architecture overview
  - System status and recent changes
  - User preferences and development guidelines
  - Feature roadmap and technical decisions

### Technical Guides
- **`BOOKING_QUEUE_SYSTEM.md`** - Queue system implementation
- **`BOOKING_STATUS_LOGIC.md`** - Booking lifecycle management
- **`INSTANT_BOOKING_FLOW.md`** - Immediate booking confirmation
- **`PAYMENT_INTEGRATION.md`** - Payment system architecture
- **`STRIPE_SETUP_GUIDE.md`** - Payment processor setup
- **`LOCAL_SETUP.md`** - Development environment setup

### Assets
- **`attached_assets/`** - Project images and documentation
- **`cookies.txt`** - Session management reference

---

## 🔧 System Architecture Summary

### Frontend Stack
- **React 18** with TypeScript for type safety
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management
- **Tailwind CSS** with shadcn/ui for consistent design
- **Vite** for fast development and optimized builds

### Backend Stack
- **Node.js** with Express.js server framework
- **TypeScript** throughout for type consistency
- **Drizzle ORM** with PostgreSQL for data persistence
- **Replit Auth** with OpenID Connect for authentication
- **Session-based** authentication with PostgreSQL storage

### Database Design
- **Master table architecture** (sports_master, grounds_master, plans_master)
- **Booking system** with slot-based scheduling
- **Payment tracking** with multiple method support
- **Notification system** for user communications
- **Queue management** for conflict resolution

### Key Features
- **Instant booking confirmation** without approval delays
- **Capacity-aware scheduling** with overbooking prevention
- **Real-time availability** with color-coded indicators
- **Comprehensive admin panel** with analytics and reports
- **Export capabilities** (PDF, Excel, Print)
- **Mobile-responsive design** for all devices
- **Role-based access control** (client, admin, manager)

---

## 📊 File Statistics

- **Total Files**: ~150+ source files
- **Lines of Code**: ~15,000+ lines
- **Main Technologies**: React, TypeScript, Express, PostgreSQL, Tailwind CSS
- **Component Library**: 50+ UI components
- **API Endpoints**: 60+ REST endpoints
- **Database Tables**: 15+ normalized tables
- **Admin Features**: 8 management panels
- **User Features**: 10+ customer-facing pages

This codebase represents a production-ready sports facility booking system with comprehensive features for both users and administrators, built with modern web technologies and best practices.