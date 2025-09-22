import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CreditCard, Shield, Lock, CheckCircle, Clock, AlertCircle, Receipt, History } from "lucide-react";
import { Link } from "wouter";
import { ReceiptModal } from "@/components/ReceiptModal";
import { PaymentHistoryModal } from "@/components/PaymentHistoryModal";

interface PaymentData {
  bookingId: number;
  amount: string;
  paymentMethod: string;
  discountAmount?: string;
  discountReason?: string;
}

interface BookingDetails {
  id: number;
  facilityName: string;
  facilityType: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  participants: number;
  participantCount: number;
  totalAmount: number;
  paidAmount: number;
  discountAmount: number;
  paymentStatus: string;
  bookingType: string;
  planType: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function Payment() {
  const { bookingId } = useParams<{ bookingId?: string }>();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get URL parameters for payment configuration
  const urlParams = new URLSearchParams(window.location.search);
  const totalFromUrl = parseFloat(urlParams.get('total') || '0');
  const discountFromUrl = parseFloat(urlParams.get('discount') || '0');
  const discountReasonFromUrl = decodeURIComponent(urlParams.get('discountReason') || '');
  const isAdminBooking = urlParams.get('isAdmin') === 'true';
  const callingModule = urlParams.get('module') || 'booking'; // booking, pending-payment, etc.
  const loginId = user?.id || 'unknown';

  // Debug URL parameters
  console.log('Payment page debug:', {
    userRole: user?.role,
    isAdminBooking,
    callingModule,
    urlParams: Object.fromEntries(urlParams),
  });

  const [paymentMethod, setPaymentMethod] = useState<"credit_card" | "upi" | "cash">("credit_card");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [processing, setProcessing] = useState(false);
  
  // Payment calculation states
  const [discountAmount, setDiscountAmount] = useState(discountFromUrl);
  const [discountReason, setDiscountReason] = useState(discountReasonFromUrl);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Receipt states
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastPaymentId, setLastPaymentId] = useState<number | null>(null);
  const [receiptData, setReceiptData] = useState<any>(null);

  // Fetch booking details
  const { data: booking, isLoading: bookingLoading, error: bookingError } = useQuery<BookingDetails>({
    queryKey: ["/api/bookings", bookingId],
    queryFn: async () => {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch booking details');
      }
      return response.json();
    },
    enabled: !!bookingId && isAuthenticated,
  });
  // src/types/razorpay.d.ts
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
}


  // Set initial payment configuration based on calling module and user role
  useEffect(() => {
    const isAdmin = user?.role === 'admin' || isAdminBooking;
    if (!isAdmin) {
      // For regular users, set paid amount to total amount minus any discount
      setPaidAmount((totalFromUrl || booking?.totalAmount || 0) - discountAmount);
    } else {
      // For admin users, check if coming from pending payment module
      if (callingModule === 'pending-payment' && booking) {
        // Show pending/due amount for pending payments
        const totalPaid = Number(booking.paidAmount || 0);
        const pendingAmount = booking.totalAmount - totalPaid - discountAmount;
        setPaidAmount(Math.max(0, pendingAmount));
      } else {
        // Regular booking flow - show full amount
        setPaidAmount((totalFromUrl || booking?.totalAmount || 0) - discountAmount);
      }
    }
  }, [booking?.totalAmount, totalFromUrl, discountAmount, user?.role, isAdminBooking, callingModule]);

  // Process payment mutation
  const processPaymentMutation = useMutation<PaymentResponse, Error, PaymentData>({
  mutationFn: async (paymentData: PaymentData): Promise<PaymentResponse> => {
    const response = await apiRequest("POST", "/api/payments", paymentData);

    if (!response.ok) {
      throw new Error("Payment processing failed");
    }

    const payment: PaymentResponse = await response.json();
    return payment;
  },
  onSuccess: (payment) => {
    toast.success("Payment successful!");
    console.log("Payment response:", payment);
  },
  onError: (error) => {
    toast.error(error.message || "Payment failed");
  },
});
const handleRazorpayPayment = async () => {
  if (!booking) return;

  // 1. Create order on backend
  const response = await apiRequest("POST", "/api/create-order", {
    amount: booking.totalPrice,
  });
  const order = await response.json();

  // 2. Open Razorpay Checkout
  const options: RazorpayOptions = {
    key: import.meta.env.VITE_RAZORPAY_KEY_ID, // from .env
    amount: order.amount,
    currency: order.currency,
    name: "My App",
    description: `Payment for ${booking.eventName}`,
    order_id: order.id,
    handler: async function (response: {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    }) {
      // Verify payment on backend
      await apiRequest("POST", "/api/verify-payment", {
        bookingId: booking.id,
        ...response,
      });

      toast.success("Payment successful!");
    },
    prefill: {
      name: booking.students?.name,
      email: booking.students?.email,
      contact: booking.students?.phone,
    },
    theme: {
      color: "#3399cc",
    },
  };

  const rzp = new (window as any).Razorpay(options);
  rzp.open();
};


  const handlePayment = async () => {
    if (!booking) return;

    // Validate paid amount
    if (paidAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to pay.",
        variant: "destructive",
      });
      return;
    }

    const maxPayable = Math.max(0, (totalFromUrl || booking.totalAmount) - discountAmount);
    if (paidAmount > maxPayable) {
      toast({
        title: "Amount Exceeds Balance",
        description: `Maximum payable amount is ₹${maxPayable.toLocaleString()}.`,
        variant: "destructive",
      });
      return;
    }

    // Validate payment method specific fields
    if (paymentMethod === "credit_card") {
      if (!cardNumber || !expiryDate || !cvv || !cardName) {
        toast({
          title: "Invalid Card Details",
          description: "Please fill in all card details.",
          variant: "destructive",
        });
        return;
      }
    }

    if (paymentMethod === "upi" && !upiId) {
      toast({
        title: "Invalid UPI ID",
        description: "Please enter a valid UPI ID.",
        variant: "destructive",
      });
      return;
    }

    const paymentData: PaymentData = {
      bookingId: booking.id,
      amount: paidAmount.toString(),
      paymentMethod,
      discountAmount: discountAmount.toString(),
      discountReason: discountReason,
    };

    processPaymentMutation.mutate(paymentData);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8">
              <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
              <p className="text-gray-600 mb-4">Please log in to access the payment page.</p>
              <Button onClick={() => window.location.href = "/api/login"}>
                Log In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (bookingLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Loading payment details...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (bookingError || (!bookingLoading && !booking)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <Card>
              <CardContent className="p-8">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Error Loading Booking</h2>
                <p className="text-gray-600 mb-4">
                  {bookingError instanceof Error ? bookingError.message : "The booking you're trying to pay for could not be found."}
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Booking ID: {bookingId || "Not provided"}
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => window.location.reload()} variant="outline">
                    Try Again
                  </Button>
                  <Link href="/">
                    <Button>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Home
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link href="/profile?tab=bookings">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Complete Payment</h1>
                <p className="text-gray-600">Booking ID: #{booking?.id}</p>
              </div>
            </div>
            
            {/* Payment History Button - Always show for debugging */}
            <div className="flex items-center gap-2">
              {booking ? (
                <PaymentHistoryModal bookingId={booking.id} />
              ) : (
                <div className="text-sm text-red-500">
                  Payment History (booking data loading...)
                </div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Booking Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Booking Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Facility:</span>
                  <span className="font-medium">{booking?.facilityName}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{new Date(booking?.bookingDate || '').toLocaleDateString()}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-medium">{booking?.startTime} - {booking?.endTime}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{booking?.duration} hours</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Participants:</span>
                  <span className="font-medium">{booking?.participants || booking?.participantCount}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan Type:</span>
                  <Badge variant="outline">{booking?.planType}</Badge>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant={booking?.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                    {booking?.paymentStatus}
                  </Badge>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-medium">₹{(totalFromUrl || booking?.totalAmount || 0).toLocaleString()}</span>
                  </div>
                  
                  {discountAmount > 0 && (
                    <>
                      <div className="flex justify-between text-green-600">
                        <span>Discount Applied:</span>
                        <span className="font-medium">-₹{discountAmount.toLocaleString()}</span>
                      </div>
                      {discountReason && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Discount Reason:</span>
                          <span className="font-medium text-sm">{discountReason}</span>
                        </div>
                      )}
                    </>
                  )}
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Amount to be Paid:</span>
                    <span className="text-primary">₹{Math.max(0, (totalFromUrl || booking?.totalAmount || 0) - discountAmount).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-green-500" />
                  Secure Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Payment Method Selection */}
                <div>
                  <Label className="text-base font-medium">Payment Method</Label>
                  <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)} className="mt-3">
                    <div className="space-y-3">
                     <Button onClick={handleRazorpayPayment} disabled={processPaymentMutation.isPending}>
  Pay with Razorpay
</Button>

                      {/* Cash option only for admin users */}
                      {(user?.role === 'admin' || user?.role === 'manager') && (
                        <Label className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:border-primary [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-blue-50">
                          <RadioGroupItem value="cash" />
                          <span className="text-xl">💵</span>
                          <div>
                            <div className="font-medium">Cash</div>
                            <div className="text-sm text-gray-500">Admin Only</div>
                          </div>
                        </Label>
                      )}
                    </div>
                  </RadioGroup>
                </div>

                {/* Admin-only Partial Payment Section - Show for admin/manager users */}
                {(user?.role === 'admin' || user?.role === 'manager') && (
                  <div className="space-y-4 border-t pt-4">
                    <Label className="text-base font-medium">Payment Details</Label>
                    
                    {/* Discount Section - Only for Admin */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Discount Amount (₹)</Label>
                        <Input
                          type="number"
                          min={0}
                          max={totalFromUrl || booking?.totalAmount || 0}
                          value={discountAmount}
                          onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label>Discount Reason</Label>
                        <Input
                          type="text"
                          value={discountReason}
                          onChange={(e) => setDiscountReason(e.target.value)}
                          placeholder="e.g., Staff discount, Loyalty bonus"
                        />
                      </div>
                    </div>

                    {/* Paid Amount and Payment Date */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Paid Amount (₹)</Label>
                        <Input
                          type="number"
                          min={0}
                          max={Math.max(0, (totalFromUrl || booking?.totalAmount || 0) - discountAmount)}
                          value={paidAmount}
                          onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
                          placeholder="Enter amount to pay now"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Maximum: ₹{Math.max(0, (totalFromUrl || booking?.totalAmount || 0) - discountAmount).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <Label>Payment Date</Label>
                        <Input
                          type="date"
                          value={paymentDate}
                          onChange={(e) => setPaymentDate(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Balance Display */}
                    {paidAmount > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Total Amount:</span>
                          <span>₹{(totalFromUrl || booking?.totalAmount || 0).toLocaleString()}</span>
                        </div>
                        {discountAmount > 0 && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Discount:</span>
                            <span>-₹{discountAmount.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span>Amount to Pay:</span>
                          <span>₹{Math.max(0, (totalFromUrl || booking?.totalAmount || 0) - discountAmount).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium">
                          <span>Paying Now:</span>
                          <span>₹{paidAmount.toLocaleString()}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-semibold">
                          <span>Balance Due:</span>
                          <span className={`${Math.max(0, (totalFromUrl || booking?.totalAmount || 0) - discountAmount - paidAmount) > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                            ₹{Math.max(0, (totalFromUrl || booking?.totalAmount || 0) - discountAmount - paidAmount).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  </div>
                )}

                {/* Credit Card Form */}
                {paymentMethod === "credit_card" && (
                  <div className="space-y-4">
                    <div>
                      <Label>Card Number</Label>
                      <Input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        maxLength={19}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Expiry Date</Label>
                        <Input
                          type="text"
                          placeholder="MM/YY"
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                          maxLength={5}
                        />
                      </div>
                      <div>
                        <Label>CVV</Label>
                        <Input
                          type="text"
                          placeholder="123"
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value.replace(/[^0-9]/g, '').substring(0, 3))}
                          maxLength={3}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label>Cardholder Name</Label>
                      <Input
                        type="text"
                        placeholder="John Doe"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* UPI Form */}
                {paymentMethod === "upi" && (
                  <div>
                    <Label>UPI ID</Label>
                    <Input
                      type="text"
                      placeholder="yourname@paytm"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                    />
                  </div>
                )}

                {/* Cash Payment (Admin Only) */}
                {paymentMethod === "cash" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-800">Cash Payment (Admin)</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      This payment will be marked as cash payment by admin. No online processing required.
                    </p>
                  </div>
                )}

                {/* Security Notice */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Secure Payment</span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    Your payment information is encrypted and secure.
                  </p>
                </div>

                {/* Pay Button */}
                <Button 
                  onClick={handlePayment}
                  disabled={processing || processPaymentMutation.isPending || paidAmount <= 0}
                  className="w-full h-12 text-lg font-semibold"
                  size="lg"
                >
                  {processing || processPaymentMutation.isPending ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Processing Payment...
                    </>
                  ) : paidAmount <= 0 ? (
                    "Enter amount to pay"
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Pay ₹{paidAmount.toLocaleString()} Now
                    </>
                  )}
                </Button>
                
                {Math.max(0, (totalFromUrl || booking?.totalAmount || 0) - discountAmount - paidAmount) > 0 && paidAmount > 0 && (
                  <div className="text-center text-sm text-gray-600 mt-2">
                    <p>Remaining balance of ₹{Math.max(0, (totalFromUrl || booking?.totalAmount || 0) - discountAmount - paidAmount).toLocaleString()} can be paid later</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {lastPaymentId && (
        <ReceiptModal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          paymentId={lastPaymentId}
          receiptData={receiptData}
        />
      )}
    </div>
  );
}