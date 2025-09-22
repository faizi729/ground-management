import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, Receipt, Download, Eye } from "lucide-react";

interface PaymentHistoryModalProps {
  bookingId: number;
}

interface PaymentRecord {
  id: number;
  amount: number;
  paymentMethod: string;
  status: string;
  processedAt: string;
  transactionId?: string;
}

interface PaymentHistoryData {
  bookingId: number;
  bookingDetails: {
    facilityName: string;
    sportName: string;
    totalAmount: number;
    discountAmount: number;
    paidAmount: number;
    netAmount: number;
    balanceDue: number;
    paymentStatus: string;
  };
  payments: PaymentRecord[];
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString()}`;
}

function getStatusBadge(status: string) {
  const statusColors = {
    completed: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    failed: "bg-red-100 text-red-800",
    partial: "bg-blue-100 text-blue-800"
  };

  return (
    <Badge className={statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

export function PaymentHistoryModal({ bookingId }: PaymentHistoryModalProps) {
  const [open, setOpen] = useState(false);

  const { data: paymentHistory, isLoading } = useQuery<PaymentHistoryData>({
    queryKey: [`/api/bookings/${bookingId}/payment-history`],
    queryFn: async () => {
      const response = await fetch(`/api/bookings/${bookingId}/payment-history`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch payment history');
      }
      return response.json();
    },
    enabled: open && !!bookingId,
  });

  const handlePreviewReceipt = (paymentId: number) => {
    window.open(`/api/receipts/${paymentId}/preview`, '_blank');
  };

  const handleDownloadReceipt = (paymentId: number) => {
    window.open(`/api/receipts/${paymentId}/pdf`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="h-4 w-4 mr-2" />
          Payment History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payment History - Booking #{bookingId}</DialogTitle>
          <DialogDescription>
            View all payments made for this booking and download receipts
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="text-center py-8">
            <div className="text-muted-foreground">Loading payment history...</div>
          </div>
        )}

        {paymentHistory && (
          <div className="space-y-6">
            {/* Booking Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="font-medium">{paymentHistory.bookingDetails.facilityName}</div>
                    <div className="text-sm text-muted-foreground">{paymentHistory.bookingDetails.sportName}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {formatCurrency(paymentHistory.bookingDetails.totalAmount)} 
                      {paymentHistory.bookingDetails.discountAmount > 0 && (
                        <span className="text-green-600 ml-2">
                          (-{formatCurrency(paymentHistory.bookingDetails.discountAmount)})
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Net: {formatCurrency(paymentHistory.bookingDetails.netAmount || paymentHistory.bookingDetails.totalAmount)}
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <span>Payment Status:</span>
                  {getStatusBadge(paymentHistory.bookingDetails.paymentStatus)}
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span>Total Paid:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(paymentHistory.bookingDetails.paidAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Balance Due:</span>
                  <span className="font-semibold text-red-600">
                    {formatCurrency(paymentHistory.bookingDetails.balanceDue || Math.max(0, (paymentHistory.bookingDetails.netAmount || paymentHistory.bookingDetails.totalAmount) - paymentHistory.bookingDetails.paidAmount))}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Records */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Records ({paymentHistory.payments.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {paymentHistory.payments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No payments found for this booking
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paymentHistory.payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <span className="font-semibold">{formatCurrency(payment.amount)}</span>
                              {getStatusBadge(payment.status)}
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <div>Payment Method: {payment.paymentMethod}</div>
                              <div>Date: {new Date(payment.processedAt).toLocaleDateString()} at {new Date(payment.processedAt).toLocaleTimeString()}</div>
                              {payment.transactionId && (
                                <div>Transaction ID: {payment.transactionId}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePreviewReceipt(payment.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Preview
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadReceipt(payment.id)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}