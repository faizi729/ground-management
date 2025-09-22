# Sports Facility Booking System - Aryen Recreation Centre

## Overview
This is a comprehensive sports facility booking system for Aryen Recreation Centre, a full-stack web application. It enables users to book various sports facilities online with a modern, responsive design. The system includes a capacity-aware booking system, integrated payment architecture, and a comprehensive reporting suite. The business vision is to provide a seamless and efficient online booking experience, enhance facility utilization, and offer robust administrative tools for recreation center management.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React.js with TypeScript
- **Routing**: Wouter
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state
- **Build Tool**: Vite
- **UI Components**: Radix UI primitives

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Authentication**: Replit Auth with OpenID Connect (OIDC)
- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple

### Authentication Strategy
Replit's built-in authentication system is used, providing seamless OAuth integration, PostgreSQL-backed session management, user profile data from Replit accounts, and role-based access control (client, admin, manager).

### Database Schema
The system uses a clean master table architecture:
- **Sports Master**: Sport types with flexible booking types and admin controls.
- **Grounds Master**: Physical facilities linked to sports with capacity configuration.
- **Plans Master**: Pricing plans per ground with durationDays field for flexible booking periods.
- **Time Slots Master**: Standard time slot definitions (6 AM - 10 PM hourly slots) used by all facilities.
- **Bookings**: Master booking records with startDate/endDate fields for flexible date ranges.
- **Booking Slots**: Individual date/time combinations supporting multiple slots per booking.
- **Supporting Tables**: Users, Payments, Coupons, Notifications, Sessions.

### Recent Changes (January 2025)
- **Fixed Database Design**: Booking modes now determined by sport.bookingType instead of ground-level fields
- **Removed Redundant Fields**: Eliminated per_person_booking and full_ground_booking from grounds_master
- **Updated Booking Schema**: Changed from bookingDate/startTime/endTime to startDate/endDate for better date range support
- **Simplified Booking Slots**: Removed redundant status field - slots inherit status from parent booking
- **Enhanced Logic**: All facilities for the same sport inherit consistent booking capabilities
- **Unified Booking Interface**: Replaced StepByStepBooking with BookingModal across all pages for consistent user experience
- **Cleaned Payment Flow**: Removed admin-specific fields (discount, payment method) from booking screens - moved to Payment page
- **Payment Interface Consistency (August 2025)**: Unified payment interface across all modules with proper partial payment support, custom amount input, and accurate balance calculations
- **Payment Management Enhancement (August 2025)**: Complete payment management system with tabbed interface for pending vs all payments, proper financial summaries with descriptive captions (Outstanding Amount, Total Revenue, etc.), and filter options aligned with database values (pending, completed, partial, failed, refunded)
- **Discount System Implementation (August 2025)**: Complete discount functionality with proper storage in both booking and payment tables, accurate pending amount calculations (Total - Paid - Discount), and correct payment status updates when discounts are applied. Fixed critical validation logic issue where payment records must be created before booking status updates to prevent status override.
- **Receipt Generation Enhancement (August 2025)**: Fixed receipt preview/PDF generation to display booking-specific payment data with detailed breakdown including Total Booking Amount, Discount Applied, Amount After Discount, Total Paid (Before This Payment), Due Amount, Amount Paid This Transaction, and Remaining Balance
- **Payment History Feature (August 2025)**: Complete payment history system with modal interface showing all payments for a specific booking, comprehensive booking summary with financial details, individual payment records with receipt preview/download options, and seamless integration with the payment page
- **Admin Receipt Management (August 2025)**: Enhanced admin payment management with direct receipt viewing capabilities, added Actions column to All Payments table with View Receipt, Download PDF, and Payment History buttons for complete administrative oversight of payment documentation
- **Payment History Calculation Fix (August 2025)**: Fixed payment history financial calculations to properly handle discounts with correct formulas - Total Amount (original before discount), Net Amount (after discount), and Balance Due (net amount - paid amount). Updated both backend API and frontend display logic for accurate financial reporting

### Frontend Pages
- **Landing Page**: Public homepage.
- **Home Dashboard**: Authenticated user dashboard.
- **Facilities**: Browse and filter facilities.
- **Booking**: Facility booking interface.
- **Profile**: User account management.
- **Admin Panel**: Administrative interface for management and reporting.

### API Structure
APIs support CRUD operations for master tables (Sports, Grounds, Plans, Bookings) and include supporting APIs for Authentication, User, Payment, and Admin functionalities. All routes directly utilize the master tables.

### Data Flow
- **User Authentication**: Via Replit OAuth, data synchronized with local DB, role-based permissions, PostgreSQL session.
- **Step-by-Step Booking Process**: (1) Sport selection → (2) Ground selection filtered by sport → (3) Booking mode selection based on ground capabilities → (4) Plan selection with participant count validation → (5) Date selection with automatic end date calculation for non-hourly plans → (6) Time slot availability checking with real-time capacity calculation → (7) Booking summary with pricing details and confirmation.
- **Capacity Management**: Available capacity calculated from booking_slot table by summing existing participants and deducting from ground max capacity for per-person bookings. Full-ground bookings check simple availability without capacity calculations.
- **Admin Operations**: Facility management, booking oversight, user management, analytics with enhanced payment processing options.

### System Enhancements
- **Step-by-Step Booking System**: Complete redesign of booking flow with 7 sequential steps: (1) Sport selection, (2) Ground selection based on sport, (3) Booking mode selection (per-person/full-ground), (4) Plan selection with person count, (5) Date selection with end date calculation, (6) Time slot availability with capacity checking, (7) Booking summary and confirmation.
- **Booking Queue System**: `booking_queue` table for priority-based waiting list management with conflict detection and automated notifications.
- **Notification System**: Database-backed system for booking reminders and auto-cancellation of expired pending bookings.
- **Admin Interface**: Comprehensive sorting, color-coded status indicators (Confirmed, Pending, Completed, Cancelled for bookings; Paid, Partial, Unpaid, Failed, Refunded for payments), and real-time statistics.
- **Login System**: Professional login interface with separate client/admin options, signup, and simulated password recovery.
- **Reporting System**: Comprehensive reports for revenue, facility usage, member analytics, payment methods, and coupon usage, with PDF, Excel, and Print export options.
- **Payment System**: Integrated mock payment system for testing with comprehensive partial payment support, custom amount input, proper balance calculations, and consistent interface across all application modules (booking, admin, payment pages).
- **Receipt Generation System**: Complete receipt management with PDF/HTML generation, booking-specific payment breakdowns, SMS/email delivery capabilities, and accurate financial calculations including discount handling and payment history tracking.
- **Payment History System**: Comprehensive payment tracking with modal interface displaying all payments for bookings, detailed payment records with receipt access, booking summaries with financial totals, and seamless integration across payment workflows.
- **Enhanced Booking Logic**: Plans table includes `durationDays` field for flexible booking periods. Monthly/yearly bookings create individual slot records for each day (30 for monthly, 365 for yearly) with proper date calculation from start date.

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Database connectivity.
- **drizzle-orm**: Type-safe database operations.
- **@tanstack/react-query**: Server state management.
- **@radix-ui/react-***: Accessible UI primitives.
- **tailwindcss**: Utility-first CSS framework.
- **wouter**: Lightweight client-side routing.

### Development Tools
- **vite**: Fast build tool and dev server.
- **typescript**: Type safety.
- **drizzle-kit**: Database migration and schema management.

### Authentication
- **openid-client**: OIDC authentication with Replit.
- **express-session**: Session management.
- **connect-pg-simple**: PostgreSQL session store.

### Reporting & Export
- **jsPDF**: PDF generation.
- **jsPDF-AutoTable**: Table formatting for PDFs.
- **XLSX**: Excel file generation.
- **file-saver**: File saving functionality.