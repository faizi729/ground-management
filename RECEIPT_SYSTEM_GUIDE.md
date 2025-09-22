# Receipt Generation System Guide

## Overview

The Aryen Recreation Centre booking system includes a comprehensive receipt generation and payment history system that provides detailed financial transparency for all booking transactions.

## Features

### Receipt Generation
- **Booking-Specific Receipts**: Each payment generates a unique receipt with complete booking context
- **Detailed Payment Breakdown**: Shows total booking amount, discounts applied, previous payments, current payment, and remaining balance
- **Multiple Formats**: HTML preview and PDF download options for all receipts
- **Professional Layout**: Branded receipt template with clear formatting and financial summaries

### Payment History
- **Complete Payment Tracking**: All payments for a booking are tracked with timestamps and transaction details
- **Payment History Modal**: Accessible from payment pages showing comprehensive payment records
- **Individual Receipt Access**: Preview and download receipts for any previous payment
- **Financial Summary**: Real-time calculation of total paid, discounts applied, and remaining balances

## Architecture

### Backend Components

#### Receipt Data Generation (`server/routes.ts`)
```typescript
async function generateReceiptData(paymentId: number): Promise<ReceiptData> {
  // Fetches payment, booking, and user data
  // Calculates payment history and totals
  // Returns comprehensive receipt data object
}
```

#### Receipt Generator (`server/receipt.ts`)
```typescript
class ReceiptGenerator {
  static generateReceiptHTML(receiptData: ReceiptData): string
  static generateReceiptPDF(receiptData: ReceiptData): Buffer
}
```

### API Endpoints

#### Receipt Generation
- `POST /api/receipts/generate` - Generate receipt with SMS/email options
- `GET /api/receipts/:paymentId/preview` - HTML preview of receipt
- `GET /api/receipts/:paymentId/pdf` - PDF download of receipt

#### Payment History
- `GET /api/bookings/:bookingId/payment-history` - Get all payments for a booking

### Frontend Components

#### ReceiptModal (`client/src/components/ReceiptModal.tsx`)
- Displays receipt data with detailed payment breakdown
- Shows booking information and payment details
- Provides PDF download and print options

#### PaymentHistoryModal (`client/src/components/PaymentHistoryModal.tsx`)
- Lists all payments for a specific booking
- Shows booking summary with financial totals
- Provides receipt preview and download for each payment
- Displays payment status and transaction details

## Receipt Data Structure

### Financial Breakdown Fields
```typescript
interface ReceiptData {
  receiptId: string;
  bookingId: number;
  paymentId: number;
  totalBookingAmount: number;      // Original booking total + discount
  discountAmount: number;          // Discount applied
  totalPaidBeforeThis: number;     // Sum of previous payments
  totalAmount: number;             // Due amount before this payment
  paidAmount: number;              // Current payment amount
  balanceAmount: number;           // Remaining balance after payment
  // ... other booking and customer details
}
```

### Payment Breakdown Display
1. **Total Booking Amount**: Original booking cost including any discounts
2. **Discount Applied**: Amount discounted (shown as negative)
3. **Amount After Discount**: Net booking amount after discount
4. **Total Paid (Before This Payment)**: Sum of all previous payments
5. **Due Amount (Before This Payment)**: Outstanding amount before current payment
6. **Amount Paid This Transaction**: Current payment being processed
7. **Remaining Balance**: Outstanding amount after current payment

## Implementation Details

### Receipt Generation Process
1. **Payment Processing**: When a payment is completed
2. **Data Collection**: Gather booking, user, and payment history data
3. **Financial Calculations**: Calculate payment totals and remaining balances
4. **Receipt Generation**: Create HTML and PDF versions
5. **Delivery Options**: Email, SMS, or direct download

### Payment History Process
1. **Request Payment History**: User clicks "Payment History" button
2. **Data Fetching**: Retrieve all payments for the booking
3. **Display**: Show comprehensive payment records with receipt access
4. **Receipt Access**: Users can preview or download any payment receipt

## User Experience

### From Payment Page
- Users see "Payment History" button in payment page header
- Click opens modal with complete payment history
- Each payment record shows amount, date, status, and receipt options

### From Receipt Modal
- After payment completion, users see detailed receipt
- Receipt includes comprehensive financial breakdown
- Options to download PDF, print, or view payment history

### Receipt Content
- **Header**: Aryen Recreation Centre branding
- **Receipt Details**: Unique receipt ID and date
- **Customer Information**: Name, email, phone
- **Booking Details**: Facility, sport, date, time, participants
- **Payment Summary**: Detailed financial breakdown table
- **Payment Details**: Method, transaction ID, status
- **Footer**: Thank you message and contact information

## Security & Access Control

### Authorization
- Users can only access receipts for their own bookings
- Admins can access receipts for all bookings
- Payment history requires authentication

### Data Privacy
- No sensitive payment information stored in receipts
- Transaction IDs are masked for security
- Only authorized users can access payment records

## Configuration

### Environment Variables
```env
SENDGRID_API_KEY=your_api_key_here  # For email receipt delivery
```

### Receipt Customization
- Receipt template can be customized in `server/receipt.ts`
- Branding, colors, and layout are configurable
- Additional fields can be added to receipt data structure

## Best Practices

### Receipt Generation
1. Always generate receipts immediately after payment confirmation
2. Include comprehensive financial breakdown for transparency
3. Ensure receipt data is booking-specific and accurate
4. Provide multiple download/access options

### Payment History
1. Display payments in chronological order
2. Include payment status and method information
3. Provide easy access to individual receipts
4. Show running totals and balance calculations

### User Experience
1. Make payment history easily accessible from payment pages
2. Provide clear financial summaries and breakdowns
3. Offer multiple receipt formats (HTML preview, PDF download)
4. Ensure consistent styling and branding across all receipt formats