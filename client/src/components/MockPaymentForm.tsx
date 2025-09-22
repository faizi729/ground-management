import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Banknote } from "lucide-react";
import { ReceiptModal } from "./ReceiptModal";

interface MockPaymentFormProps {
  bookingId: number;
  amount: number;
  currency?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const MockPaymentForm = ({
  bookingId,
  amount,
  currency = "INR",
  onSuccess,
  onCancel,
}: MockPaymentFormProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<"Razorpay" | "cash">(
    "Razorpay"
  );
  const [paymentOption, setPaymentOption] = useState<"half" | "full" | null>(
    null
  ); // ✅ half or full
  const [discountAmount, setDiscountAmount] = useState<string>("0");
  const [discountReason, setDiscountReason] = useState<string>("");
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastPaymentId, setLastPaymentId] = useState<number | null>(null);
  const [receiptData, setReceiptData] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const isAdmin = user?.role === "admin" || user?.role === "manager";

  // 🔧 Receipt Builder
 // 🔧 Receipt Builder
const buildReceiptData = (
  booking: any,
  payment: any,
  numericAmount: number,
  paymentStatus: string
) => {
const discount = booking.discountAmount || 0;
const totalBookingAmount = booking.totalAmount || 0;

// How much was already paid before this payment
const previouslyPaid = booking.paidAmountBeforeThisPayment || 0; // you may need to get this from backend

// Amount due before this payment
const dueAmount = Math.max(0, totalBookingAmount - discount - previouslyPaid);

// Amount paid in this transaction
const paidThisTransaction = numericAmount;

// Remaining balance after this payment
const remainingBalance = Math.max(0, totalBookingAmount - discount - (previouslyPaid + paidThisTransaction));

  const timeSlot = booking.timeSlot || "";
  const [startTime, endTime] = timeSlot.includes("-")
    ? timeSlot.split("-")
    : [timeSlot, timeSlot];
    

if (remainingBalance === 0) {
  paymentStatus = "completed";   // fully paid
} else if (paidThisTransaction > 0) {
  paymentStatus = "partial";     // paid something, but still balance left
} else {
  paymentStatus = "pending";     // nothing paid yet
}

  setReceiptData({
    receiptId: payment.receiptId,
    bookingId: booking.id,
    paymentId: payment.id,
    customerName: booking.customerName,
    customerEmail: booking.customerEmail,
    customerPhone: booking.customerPhone,
    facilityName: booking.groundName,
    sportName: booking.sportName,
    bookingDate: booking.bookingDate || booking.startDate,
    startTime: startTime.trim(),
    endTime: endTime.trim(),
    participants: booking.participantCount,
    totalBookingAmount: totalBookingAmount,
  totalPaidBeforeThis: previouslyPaid,
  totalAmount: dueAmount,
  paidAmount: paidThisTransaction,
  discountAmount: discount,
  balanceAmount: remainingBalance,                // ✅ Correct due before this txn
    amountPaidThisTransaction: numericAmount,  // ✅ This txn
    
    paymentMethod: selectedMethod,
    transactionId: payment.transactionId,
    paymentDate: payment.paymentDate,
    remainingBalance,                          // ✅ Remaining balance
    paymentStatus,                             // partial or paid
  });
};


  // 🔧 Handle Payment
  const handlePayment = async () => {
    if (!paymentOption) {
      toast({
        title: "Select Payment Option",
        description: "Please choose Half or Full payment",
        variant: "destructive",
      });
      return;
    }

    // Auto-calculate
    let numericAmount = paymentOption === "half" ? amount / 2 : amount;
    let paymentStatus = paymentOption === "half" ? "partial" : "paid";
    

    // ✅ Razorpay flow
    if (selectedMethod === "Razorpay") {
      try {
        const orderRes = await fetch("/api/payments/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId, amount: numericAmount }),
        });
        const { orderId } = await orderRes.json();

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: numericAmount * 100,
          currency: "INR",
          name: "Sports Facility Booker",
          description: "Booking Payment",
          order_id: orderId,
          handler: async (response: any) => {
            try {
              const verifyRes = await fetch("/api/test-payment-success", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ...response,
                  bookingId,
                  paymentStatus, // ✅ partial or paid
                }),
              });

              const verifyResult = await verifyRes.json();

              if (verifyResult.payment && verifyResult.booking) {
  setLastPaymentId(verifyResult.payment.id);

  buildReceiptData(
    verifyResult.booking,
    verifyResult.payment,
    numericAmount,
    verifyResult.paymentStatus
  );

  setShowReceiptModal(true);
  toast({ title: "Payment successful!", description: "Your payment has been processed." });
} else {
                toast({
                  title: "Payment verification failed",
                  variant: "destructive",
                });
              }
            } catch (err: any) {
              toast({
                title: "Verification error",
                description: err.message,
                variant: "destructive",
              });
            }
          },
          prefill: {
            name: user?.firstName || "",
            email: user?.email || "",
            contact: user?.phone || "",
          },
          theme: { color: "#3399cc" },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } catch {
        toast({ title: "Order creation failed", variant: "destructive" });
      }
      return;
    }

    // ✅ Cash (Admin only)
    setIsProcessing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const response = await fetch("/api/test-payment-success", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          bookingId,
          amount: numericAmount,
          paymentMethod: selectedMethod,
          paymentStatus, // ✅ partial or paid
          discountAmount: parseFloat(discountAmount || "0"),
          discountReason,
        }),
      });

      if (!response.ok) throw new Error("Payment processing failed");

      const result = await response.json();

      if (result.payment && result.payment.id && result.booking) {
        setLastPaymentId(result.payment.id);
        buildReceiptData(
          result.booking,
          result.payment,
          numericAmount,
          paymentStatus
        );
      }

      toast({
        title: "Payment Successful",
        description: `Your booking is ${
          paymentStatus === "partial" ? "partially paid" : "fully paid"
        }!`,
      });

      setTimeout(() => setShowReceiptModal(true), 1000);
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "Unable to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Make Payment</CardTitle>
        <p className="text-sm text-gray-600">
          Remaining Balance: {currency} ₹{amount.toLocaleString()}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Payment Option: Half or Full */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">
              Select Payment Option
            </p>

            {/* Half Payment */}
            <div
              className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                paymentOption === "half"
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => setPaymentOption("half")}
            >
              <p className="font-medium text-sm">Half Payment</p>
              <p className="text-xs text-gray-500">
                Pay 50% (₹{(amount / 2).toFixed(2)})
              </p>
            </div>

            {/* Full Payment */}
            <div
              className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                paymentOption === "full"
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => setPaymentOption("full")}
            >
              <p className="font-medium text-sm">Full Payment</p>
              <p className="text-xs text-gray-500">
                Pay 100% (₹{amount.toFixed(2)})
              </p>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">
              Select Payment Method
            </p>

            {/* Razorpay */}
            <div
              className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                selectedMethod === "Razorpay"
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => setSelectedMethod("Razorpay")}
            >
              <div className="flex items-center space-x-3">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg"
                  alt="Razorpay"
                  className="h-5"
                />
                <div>
                  <p className="font-medium text-sm">Pay with Razorpay</p>
                  <p className="text-xs text-gray-500">Card / UPI / Netbanking</p>
                </div>
                <div className="ml-auto">
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                      selectedMethod === "Razorpay"
                        ? "border-primary bg-primary"
                        : "border-gray-300"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Cash (Admin only) */}
            {isAdmin && (
              <div
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  selectedMethod === "cash"
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setSelectedMethod("cash")}
              >
                <div className="flex items-center space-x-3">
                  <Banknote className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-sm">Cash Payment</p>
                    <p className="text-xs text-gray-500">
                      Admin only - Direct cash collection
                    </p>
                  </div>
                  <div className="ml-auto">
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        selectedMethod === "cash"
                          ? "border-primary bg-primary"
                          : "border-gray-300"
                      }`}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
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
              onClick={handlePayment}
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm Payment"
              )}
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Receipt Modal */}
      {lastPaymentId && receiptData && (
        <ReceiptModal
          isOpen={showReceiptModal}
          onClose={() => {
            setShowReceiptModal(false);
            onSuccess();
          }}
          paymentId={lastPaymentId}
          receiptData={receiptData}
        />
      )}
    </Card>
  );
};
