# Quick Stripe Payment Setup Guide

## When You're Ready to Enable Payments

### Step 1: Get Stripe Account
1. Create account at https://stripe.com
2. Complete business verification
3. Get your API keys from https://dashboard.stripe.com/apikeys

### Step 2: Add Environment Variables
Add to your `.env` file:
```env
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
VITE_STRIPE_PUBLIC_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### Step 3: Install Stripe Dependencies
```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
```

### Step 4: Uncomment Payment Code
1. **Backend**: Uncomment Stripe import and routes in `server/routes.ts`
2. **Frontend**: Uncomment PaymentForm component in `client/src/components/PaymentForm.tsx`
3. **Pages**: Uncomment PaymentPage in `client/src/pages/PaymentPage.tsx`

### Step 5: Add Payment Route
Add to `client/src/App.tsx`:
```typescript
<Route path="/payment/:bookingId" component={PaymentPage} />
```

### Step 6: Test with Test Data
Use these test card numbers:
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **3D Secure**: 4000 0000 0000 3220

### Step 7: Setup Webhooks (Production)
1. Add endpoint: `https://yourdomain.com/api/stripe-webhook`
2. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
3. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## Security Features Included

✅ **PCI DSS Level 1 Compliance** - Highest security standard
✅ **End-to-end Encryption** - Data encrypted in transit and at rest  
✅ **No Sensitive Data Storage** - Card details never touch your servers
✅ **Webhook Verification** - Cryptographically signed confirmations
✅ **Fraud Detection** - Machine learning fraud prevention
✅ **Multiple Payment Methods** - Cards, UPI, bank transfers, wallets

## Payment Methods Supported

- **Credit/Debit Cards** (Visa, Mastercard, American Express)
- **UPI Payments** (Google Pay, PhonePe, Paytm - India)
- **Net Banking** (All major Indian banks)
- **Digital Wallets** (Apple Pay, Google Pay)
- **Bank Transfers** (ACH for US, SEPA for Europe)

## Cost Structure

- **Cards**: 2.9% + ₹2 per transaction
- **UPI**: 2% (no fixed fee)
- **Net Banking**: 2.5% + ₹3 per transaction
- **International**: Additional 1.5%

## Production Checklist

Before going live:
- [ ] Switch to live Stripe keys (sk_live_, pk_live_)
- [ ] Enable HTTPS on your domain
- [ ] Setup webhook endpoints
- [ ] Test with small real transactions
- [ ] Configure error monitoring
- [ ] Setup customer support for payment issues

The payment system is designed for maximum security and compliance with global banking standards.