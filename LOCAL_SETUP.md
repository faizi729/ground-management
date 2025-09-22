# Local Development Setup Guide

This guide will help you set up the Aryen Recreation Centre booking system for local development, including the complete payment processing, receipt generation, and payment history features.

## Prerequisites

Before starting, ensure you have the following installed on your system:

- **Node.js** (version 18 or higher)
- **npm** (comes with Node.js)
- **PostgreSQL** (version 12 or higher)
- **Git** (to clone the repository)

## Key Features Included

- **Complete Booking System**: Step-by-step facility booking with real-time availability
- **Payment Processing**: Multiple payment methods with partial payment support
- **Receipt Generation**: Professional PDF and HTML receipts with detailed financial breakdowns
- **Payment History**: Complete payment tracking with individual receipt access for all bookings
- **Admin Dashboard**: Comprehensive management interface with analytics and financial reporting
- **Real-time Notifications**: Booking reminders and payment confirmations

## Step 1: Download and Setup Project

1. **Download the project files** to your local machine
2. **Open terminal/command prompt** and navigate to the project directory:
   ```bash
   cd path/to/your/project
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

## Step 2: Database Setup

### Option A: Local PostgreSQL Database

1. **Install PostgreSQL** if not already installed:
   - **Windows**: Download from https://www.postgresql.org/download/windows/
   - **macOS**: `brew install postgresql` (if you have Homebrew)
   - **Linux**: `sudo apt-get install postgresql postgresql-contrib`

2. **Start PostgreSQL service**:
   - **Windows**: Use pgAdmin or start via Services
   - **macOS**: `brew services start postgresql`
   - **Linux**: `sudo systemctl start postgresql`

3. **Create a database**:
   ```bash
   # Connect to PostgreSQL as superuser
   sudo -u postgres psql
   
   # Create database and user
   CREATE DATABASE aryen_sports_booking;
   CREATE USER your_username WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE aryen_sports_booking TO your_username;
   \q
   ```

### Option B: Use Neon Database (Cloud PostgreSQL)

1. **Sign up at** https://neon.tech
2. **Create a new project** and database
3. **Copy the connection string** from the dashboard

## Step 3: Environment Configuration

1. **Create a `.env` file** in the project root:
   ```bash
   touch .env
   ```

2. **Add the following environment variables**:
   ```env
   # Database Configuration
   DATABASE_URL=postgresql://your_username:your_password@localhost:5432/aryen_sports_booking
   
   # Session Configuration
   SESSION_SECRET=your-super-secret-session-key-here
   
   # Development Environment
   NODE_ENV=development
   
   # Replit Auth Configuration (for local development)
   REPLIT_DB_URL=memory://
   
   # Optional: Receipt Email Delivery (for production)
   # SENDGRID_API_KEY=your_sendgrid_api_key_here
   
   # Optional: Stripe Payment Processing (for production)
   # STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   # VITE_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
   ```

   **Important Notes**:
   - Replace `your_username`, `your_password` with your actual PostgreSQL credentials
   - If using Neon, replace the entire `DATABASE_URL` with your Neon connection string
   - Generate a strong, random `SESSION_SECRET` (at least 32 characters)

## Step 4: Database Schema Setup

1. **Push the database schema**:
   ```bash
   npm run db:push
   ```

   This will create all the necessary tables in your database.

2. **Verify the setup** by checking if tables were created:
   ```bash
   # Connect to your database
   psql -d aryen_sports_booking -U your_username
   
   # List all tables
   \dt
   
   # You should see tables like: sports_master, grounds_master, plans_master, bookings, etc.
   \q
   ```

## Step 5: Seed Database with Sample Data

1. **Create a seed script** to populate initial data:
   ```bash
   # Connect to database and insert sample data
   psql -d aryen_sports_booking -U your_username
   ```

2. **Insert sample sports**:
   ```sql
   INSERT INTO sports_master (name, category, description, booking_type, per_person_booking, full_ground_booking, max_advance_days, is_active) VALUES
   ('Badminton', 'Racquet Sports', 'Indoor badminton courts', 'both', true, true, 30, true),
   ('Basketball', 'Team Sports', 'Full court basketball', 'full-ground', false, true, 15, true),
   ('Tennis', 'Racquet Sports', 'Outdoor tennis courts', 'both', true, true, 30, true);
   ```

3. **Insert sample grounds**:
   ```sql
   INSERT INTO grounds_master (sport_id, name, ground_code, location, description, max_capacity, per_person_booking, full_ground_booking, hourly_rate, monthly_rate, yearly_rate, is_active) VALUES
   (1, 'Badminton Court 1', 'BAD001', 'Indoor Hall A', 'Professional badminton court with wooden flooring', 10, true, true, 200.00, 5000.00, 50000.00, true),
   (2, 'Basketball Court', 'BAS001', 'Outdoor Court 1', 'Full-size basketball court', 10, false, true, 500.00, 12000.00, 120000.00, true),
   (3, 'Tennis Court 1', 'TEN001', 'Outdoor Court 2', 'Clay tennis court', 4, true, true, 300.00, 8000.00, 80000.00, true);
   ```

4. **Insert sample plans**:
   ```sql
   INSERT INTO plans_master (ground_id, plan_type, duration_hours, duration_days, price, peak_price, description, is_active) VALUES
   (1, 'hourly', 1, NULL, 200.00, 250.00, 'Hourly badminton booking', true),
   (1, 'monthly', NULL, 30, 5000.00, NULL, 'Monthly badminton membership', true),
   (2, 'hourly', 2, NULL, 500.00, 600.00, '2-hour basketball court booking', true),
   (3, 'hourly', 1, NULL, 300.00, 350.00, 'Hourly tennis booking', true);
   ```

5. **Create time slots**:
   ```sql
   INSERT INTO time_slots (start_time, end_time, duration, is_peak_hour, day_types, is_active) VALUES
   ('06:00:00', '07:00:00', 60, false, '["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]', true),
   ('07:00:00', '08:00:00', 60, false, '["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]', true),
   ('08:00:00', '09:00:00', 60, true, '["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]', true),
   ('09:00:00', '10:00:00', 60, true, '["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]', true),
   ('10:00:00', '11:00:00', 60, true, '["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]', true),
   ('18:00:00', '19:00:00', 60, true, '["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]', true),
   ('19:00:00', '20:00:00', 60, true, '["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]', true),
   ('20:00:00', '21:00:00', 60, false, '["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]', true);
   ```

6. **Exit the database**:
   ```sql
   \q
   ```

## Step 6: Authentication Setup (Simplified)

Since this was built for Replit's authentication system, for local development:

1. **Create a demo user** in the database:
   ```sql
   INSERT INTO users (id, email, username, first_name, last_name, role, is_active) VALUES
   ('demo-client-001', 'demo@example.com', 'democlient', 'Demo', 'User', 'client', true),
   ('demo-admin-001', 'admin@example.com', 'demoadmin', 'Admin', 'User', 'admin', true);
   ```

2. **For local development**, you can modify the authentication to skip Replit auth or implement a simple login form.

## Step 7: Start the Application

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Access the application**:
   - Frontend: http://localhost:5000
   - Backend API: http://localhost:5000/api

## Step 8: Verify Installation & Test Features

### Basic Functionality Testing
1. **Check if the homepage loads** with facilities
2. **Test facility browsing** without authentication
3. **Test booking flow** (should require login)
4. **Check database connections** by viewing facilities and their availability

### Payment & Receipt System Testing
1. **Complete Booking Flow**:
   - Navigate to a facility and click "Book Now"
   - Complete the step-by-step booking process
   - Proceed to payment page

2. **Test Payment Processing**:
   - Try different payment methods (Credit Card, UPI, Cash for admins)
   - Test partial payments with custom amounts
   - Verify discount application functionality

3. **Receipt Generation Verification**:
   - After payment, verify receipt modal appears with detailed breakdown
   - Check PDF download functionality
   - Test HTML receipt preview in new tab
   - Verify all financial calculations are correct

4. **Payment History Feature**:
   - Click "Payment History" button on payment pages
   - Verify all payments for a booking are listed
   - Test individual receipt preview and download for past payments
   - Check booking summary with accurate totals

### Admin Features Testing
5. **Admin Dashboard Access**:
   - Login as admin user (demo-admin-001)
   - Navigate to admin dashboard
   - Test payment management with filtering options
   - Verify financial summaries and statistics

6. **Admin Payment Management**:
   - View pending payments with proper status indicators
   - Test payment processing from admin interface
   - Verify receipt generation works from admin workflows

## Troubleshooting

### Common Issues:

1. **Database connection errors**:
   - Verify PostgreSQL is running
   - Check DATABASE_URL in .env file
   - Ensure database exists and user has permissions

2. **Port already in use**:
   ```bash
   # Kill process using port 5000
   lsof -ti:5000 | xargs kill -9
   ```

3. **Dependencies issues**:
   ```bash
   # Clear npm cache and reinstall
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Database schema issues**:
   ```bash
   # Reset and recreate schema
   npm run db:push
   ```

5. **Receipt generation errors**:
   - Verify jsPDF dependency is installed correctly
   - Check server logs for PDF generation errors
   - Ensure all receipt data fields are properly populated

6. **Payment history not loading**:
   - Check database for payment records
   - Verify API endpoint `/api/bookings/:id/payment-history` is accessible
   - Check browser console for JavaScript errors

7. **SendGrid email warnings** (normal for local development):
   ```
   SENDGRID_API_KEY not configured - email features will be disabled
   ```
   - This is expected in local development
   - Receipt emails will use mock functionality
   - For production, configure SENDGRID_API_KEY in environment

## Development Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production deployment
- `npm run db:push` - Push database schema changes to database
- `npm run db:studio` - Open Drizzle Studio (database GUI)
- `npm run db:generate` - Generate database migration files
- `npm install <package>` - Install new dependencies

## Project Structure

```
├── client/              # React frontend
├── server/              # Express backend
├── shared/              # Shared types and schemas
├── .env                 # Environment variables
├── package.json         # Dependencies and scripts
├── drizzle.config.ts    # Database configuration
└── LOCAL_SETUP.md       # This setup guide
```

## Key Features Overview

### Payment Processing System
- **Multiple Payment Methods**: Credit/Debit Cards, UPI, Cash (admin only)
- **Partial Payments**: Allow custom payment amounts with balance tracking
- **Discount System**: Apply discounts with proper financial calculations
- **Payment Status Tracking**: Real-time status updates (pending, completed, partial, failed)

### Receipt Generation System
- **Professional Receipts**: Branded PDF and HTML receipts with company details
- **Detailed Financial Breakdown**: Shows total booking amount, discounts, previous payments, current payment, and remaining balance
- **Booking-Specific Data**: Each receipt contains complete booking context and payment history
- **Multi-Format Support**: PDF download, HTML preview, and print functionality

### Payment History Feature
- **Complete Payment Tracking**: View all payments made for any booking
- **Individual Receipt Access**: Preview and download receipts for any past payment
- **Financial Transparency**: Real-time balance calculations and payment summaries
- **Admin Oversight**: Comprehensive payment management for administrators

### Admin Dashboard Features
- **Payment Management**: Comprehensive interface for managing all payments
- **Financial Reporting**: Revenue tracking, outstanding amounts, and payment analytics
- **Booking Oversight**: Complete booking management with payment integration
- **User Management**: Admin controls for user accounts and permissions

## Production Configuration

### Required Environment Variables for Full Functionality
```env
# Required for production
DATABASE_URL=your_production_database_url
SESSION_SECRET=your_strong_session_secret

# Optional but recommended for production
SENDGRID_API_KEY=your_sendgrid_api_key_for_email_receipts
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
VITE_STRIPE_PUBLIC_KEY=pk_live_your_stripe_public_key
```

### Production Deployment Checklist
- [ ] Configure production database with proper security
- [ ] Set strong session secrets and environment variables
- [ ] Configure SendGrid for email receipt delivery
- [ ] Set up Stripe for secure payment processing
- [ ] Enable HTTPS for secure authentication and payments
- [ ] Configure proper backup and monitoring systems

## Next Steps

After successful setup:
1. **Test All Features**: Complete the verification steps above to ensure everything works
2. **Customize Data**: Add your actual sports facilities, pricing plans, and time slots
3. **Configure Authentication**: Set up proper user authentication for your environment
4. **Payment Integration**: Configure Stripe for live payment processing
5. **Email Setup**: Configure SendGrid for receipt email delivery
6. **Deploy**: Deploy to your preferred hosting platform with production configuration

For any issues, check the console logs and database connection first. The system includes comprehensive error handling and logging to help diagnose problems.