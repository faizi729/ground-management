// PAYMENT INTEGRATION - CURRENTLY COMMENTED OUT
// Uncomment and configure when ready to enable payments

/*
import { useState, useEffect } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

// Load Stripe with your publishable key
// Make sure to add VITE_STRIPE_PUBLIC_KEY to your .env file
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

interface PaymentFormProps {
  bookingId: number;
  amount: number;
  currency?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

// Main payment form component that handles Stripe payment processing
const CheckoutForm = ({ bookingId, amount, currency = 'inr', onSuccess, onCancel }: PaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      toast({
        title: "Payment Error",
        description: "Payment system not ready. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/booking-success?booking=${bookingId}`,
        },
        redirect: 'if_required', // Stay on page if possible
      });
      
      if (error) {
        // Payment failed
        console.error('Payment failed:', error);
        toast({
          title: "Payment Failed",
          description: error.message || "Payment could not be processed",
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded
        toast({
          title: "Payment Successful",
          description: "Your booking has been confirmed!",
        });
        onSuccess();
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred during payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Secure Payment</CardTitle>
        <p className="text-sm text-gray-600">
          Amount: {currency.toUpperCase()} {amount.toLocaleString()}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Stripe Payment Element - handles all payment methods */}
          <PaymentElement 
            options={{
              layout: 'tabs',
              paymentMethodOrder: ['card', 'apple_pay', 'google_pay']
            }}
          />
          
          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!stripe || isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay ${currency.toUpperCase()} ${amount.toLocaleString()}`
              )}
            </Button>
          </div>
        </form>
        
        {/* Security badges */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
            <span>🔒 Secured by Stripe</span>
            <span>🛡️ PCI Compliant</span>
            <span>🔐 256-bit SSL</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Wrapper component that creates payment intent and provides Stripe context
export const PaymentForm = (props: PaymentFormProps) => {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Create payment intent when component mounts
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            // Add CSRF token if you're using one
          },
          credentials: 'include', // Include cookies for authentication
          body: JSON.stringify({
            bookingId: props.bookingId,
            amount: props.amount,
            currency: props.currency || 'inr'
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          throw new Error('No client secret received');
        }
      } catch (err) {
        console.error('Error creating payment intent:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize payment');
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [props.bookingId, props.amount, props.currency]);

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading payment form...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-8 text-center">
          <p className="text-red-600 mb-4">Error loading payment form</p>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!clientSecret) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-8 text-center">
          <p className="text-red-600">Payment initialization failed</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Stripe Elements options for enhanced security and UX
  const stripeOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#0570de',
        colorBackground: '#ffffff',
        colorText: '#30313d',
        colorDanger: '#df1b41',
        fontFamily: 'Ideal Sans, system-ui, sans-serif',
        spacingUnit: '2px',
        borderRadius: '4px',
      },
    },
    loader: 'auto' as const,
  };

  return (
    <Elements stripe={stripePromise} options={stripeOptions}>
      <CheckoutForm {...props} />
    </Elements>
  );
};

// Export types for use in other components
export type { PaymentFormProps };
*/

// PLACEHOLDER COMPONENT - Remove when enabling payments
export const PaymentForm = () => {
  return (
    <div className="w-full max-w-md mx-auto p-4 border rounded-lg bg-gray-50">
      <h3 className="font-semibold mb-2">Payment Integration</h3>
      <p className="text-sm text-gray-600">
        Payment processing is ready to be enabled with Stripe integration.
        Uncomment the code above and configure your Stripe keys.
      </p>
    </div>
  );
};