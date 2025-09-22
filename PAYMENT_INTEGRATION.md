# Secure Payment Integration Guide

## Overview

This guide covers integrating secure payment processing for your sports facility booking system using Stripe, which provides bank-grade security and encryption for handling payments.

## Why Stripe for Payment Security?

✅ **PCI DSS Level 1 Compliant** - Highest level of payment security certification
✅ **Bank-grade encryption** - All data encrypted with AES-256
✅ **No sensitive data storage** - Payment details never touch your servers
✅ **Fraud detection** - Built-in machine learning fraud prevention
✅ **Global compliance** - Meets international banking regulations
✅ **Real bank account support** - Direct bank transfers, not just cards

## Security Architecture

```
User Browser → Stripe Secure Form → Stripe Servers → Your Backend
     ↓                                      ↓
Your Database (No card data)     ←     Encrypted Tokens Only
```

**Key Security Features:**
- Payment details are tokenized by Stripe before reaching your servers
- Your database never stores actual card/bank account numbers
- All communication uses HTTPS/TLS encryption
- Stripe handles all PCI compliance requirements

## Step 1: Stripe Account Setup

### Create Stripe Account
1. Go to https://stripe.com and create an account
2. Complete business verification (required for bank payments)
3. Enable your preferred payment methods:
   - **Credit/Debit Cards** (Visa, Mastercard, etc.)
   - **Bank Transfers** (ACH in US, SEPA in Europe)
   - **Digital Wallets** (Apple Pay, Google Pay)
   - **Local Payment Methods** (UPI, Net Banking for India)

### Get API Keys
1. Go to https://dashboard.stripe.com/apikeys
2. Copy your keys:
   - **Publishable Key** (starts with `pk_`) - Safe for frontend
   - **Secret Key** (starts with `sk_`) - Keep secret on backend only

## Step 2: Environment Configuration

Add to your `.env` file:
```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
VITE_STRIPE_PUBLIC_KEY=pk_test_your_publishable_key_here

# For production, use live keys:
# STRIPE_SECRET_KEY=sk_live_your_live_secret_key
# VITE_STRIPE_PUBLIC_KEY=pk_live_your_live_publishable_key
```

## Step 3: Install Stripe Dependencies

```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
```

## Step 4: Backend Payment Processing

### Update server/routes.ts

Add secure payment intent creation:

```typescript
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// Create payment intent for booking
app.post("/api/create-payment-intent", isAuthenticated, async (req, res) => {
  try {
    const { bookingId, amount, currency = "inr" } = req.body;
    
    // Validate booking belongs to user
    const booking = await storage.getBookingDetails(bookingId);
    if (!booking || booking.userId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized booking access" });
    }
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to smallest currency unit
      currency: currency,
      metadata: {
        bookingId: bookingId.toString(),
        userId: req.user.id,
        facilityName: booking.facilityName
      },
      payment_method_types: ['card', 'us_bank_account'], // Enable bank accounts
    });
    
    res.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error: any) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({ 
      message: "Error creating payment intent: " + error.message 
    });
  }
});

// Webhook for payment confirmation (most secure)
app.post("/api/stripe-webhook", express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig!, webhookSecret!);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const bookingId = parseInt(paymentIntent.metadata.bookingId);
    
    // Update booking payment status
    await storage.updateBookingPaymentStatus(bookingId, 'paid', paymentIntent.id);
    console.log('Payment confirmed for booking:', bookingId);
  }
  
  res.json({received: true});
});
```

## Step 5: Frontend Payment Component

### Create client/src/components/PaymentForm.tsx

```typescript
import { useState } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface PaymentFormProps {
  bookingId: number;
  amount: number;
  onSuccess: () => void;
}

const CheckoutForm = ({ bookingId, amount, onSuccess }: PaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) return;
    
    setIsProcessing(true);
    
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/booking-success`,
        },
      });
      
      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Successful",
          description: "Your booking has been confirmed!",
        });
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full"
      >
        {isProcessing ? 'Processing...' : `Pay ₹${amount}`}
      </Button>
    </form>
  );
};

export const PaymentForm = (props: PaymentFormProps) => {
  const [clientSecret, setClientSecret] = useState<string>('');
  
  useEffect(() => {
    // Create payment intent
    fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: props.bookingId,
        amount: props.amount
      })
    })
    .then(res => res.json())
    .then(data => setClientSecret(data.clientSecret));
  }, [props.bookingId, props.amount]);

  if (!clientSecret) {
    return <div>Loading payment form...</div>;
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm {...props} />
    </Elements>
  );
};
```

## Step 6: Bank Account Integration

### Enable ACH/Bank Transfers

```typescript
// In your payment intent creation
const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(amount * 100),
  currency: "usd", // or "inr" for India
  payment_method_types: [
    'card',
    'us_bank_account', // For US bank accounts
    'sepa_debit',      // For European bank accounts
    'bacs_debit'       // For UK bank accounts
  ],
  payment_method_options: {
    us_bank_account: {
      verification_method: 'instant' // Instant verification
    }
  }
});
```

### Indian Banking Integration (UPI, Net Banking)

```typescript
// For Indian market
payment_method_types: [
  'card',
  'upi',           // UPI payments
  'netbanking',    // Net banking
  'wallet'         // Digital wallets
]
```

## Step 7: Security Best Practices

### Backend Security
```typescript
// Rate limiting for payment endpoints
import rateLimit from 'express-rate-limit';

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 payment attempts per windowMs
  message: 'Too many payment attempts, please try again later'
});

app.use('/api/create-payment-intent', paymentLimiter);
```

### Environment Security
```env
# Production environment variables
NODE_ENV=production
STRIPE_SECRET_KEY=sk_live_... # Live secret key
STRIPE_WEBHOOK_SECRET=whsec_... # Webhook signing secret
DATABASE_URL=postgres://... # Encrypted connection
SESSION_SECRET=... # Strong random secret
```

### HTTPS Enforcement
```typescript
// In production, enforce HTTPS
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

## Step 8: Webhook Security

### Setup Webhook Endpoint
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe-webhook`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy webhook signing secret

### Secure Webhook Verification
```typescript
// Verify webhook authenticity
const sig = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
```

## Step 9: Testing

### Test Mode
- Use test API keys (pk_test_, sk_test_)
- Test card numbers:
  - Success: `4242 4242 4242 4242`
  - Decline: `4000 0000 0000 0002`
  - Bank account: Use Stripe's test routing numbers

### Test Bank Accounts
```
Routing number: 110000000
Account number: 000123456789
Account type: Checking
```

## Step 10: Production Deployment

### Before Going Live
1. ✅ Complete Stripe account verification
2. ✅ Switch to live API keys
3. ✅ Enable HTTPS on your domain
4. ✅ Set up webhook endpoints
5. ✅ Test with small real transactions
6. ✅ Configure proper error handling
7. ✅ Set up monitoring and alerts

### Production Checklist
- [ ] Live Stripe keys configured
- [ ] Webhook endpoints verified
- [ ] HTTPS certificate installed
- [ ] Database backups enabled
- [ ] Error monitoring setup
- [ ] Payment confirmation emails
- [ ] Refund handling process
- [ ] Customer support process

## Security Guarantees

When properly implemented, this setup provides:

🔒 **End-to-end encryption** - All payment data encrypted in transit
🔒 **No sensitive data storage** - Your servers never see card/bank details
🔒 **PCI compliance** - Stripe handles all compliance requirements
🔒 **Fraud protection** - Machine learning fraud detection
🔒 **Webhook security** - Cryptographically signed webhooks
🔒 **Regulatory compliance** - Meets banking regulations globally

## Cost Structure

**Stripe Fees:**
- Cards: 2.9% + 30¢ per transaction
- ACH/Bank transfers: 0.8% (capped at $5)
- International: Additional 1.5%

## Support and Monitoring

- Stripe Dashboard for transaction monitoring
- Real-time fraud alerts
- Automatic retry for failed payments
- Detailed analytics and reporting
- 24/7 technical support

This implementation ensures your payment processing is as secure as major banks and e-commerce platforms while remaining compliant with all financial regulations.