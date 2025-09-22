import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Download, Mail, MessageSquare, Printer, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import dayjs from "dayjs";

interface ReceiptData {
  receiptId: string;
  bookingId: number;
  paymentId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  facilityName: string;
  sportName: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  participants: number;
  totalAmount: number;
  paidAmount: number;
  discountAmount?: number;
  paymentMethod: string;
  transactionId?: string;
  paymentDate: string;
  balanceAmount: number;
  paymentStatus: string;

  // 👇 Add these two:
  totalBookingAmount?: number;
  totalPaidBeforeThis?: number;
}


interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentId: number;
  receiptData?: ReceiptData;
}

export function ReceiptModal({ isOpen, onClose, paymentId, receiptData }: ReceiptModalProps) {
  const [sendSMS, setSendSMS] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerateReceipt = async () => {
    if (!paymentId) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/receipts/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          paymentId,
          sendSMS,
          sendEmail
        })
      });

      const result = await response.json();
      console.log(result)
      
      if (result.success) {
        toast({
          title: "Receipt Generated",
          description: `Receipt ${result.receipt.receiptId} generated successfully. ${
            sendSMS ? (result.receipt.sent.sms ? 'SMS sent.' : 'SMS failed.') : ''
          } ${
            sendEmail ? (result.receipt.sent.email ? 'Email sent.' : 'Email failed.') : ''
          }`.trim(),
        });
      } else {
        throw new Error(result.message || 'Failed to generate receipt');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate receipt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/receipts/${paymentId}/pdf`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `receipt-${paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "Receipt PDF downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePreview = () => {
    window.open(`/api/receipts/${paymentId}/preview`, '_blank');
  };

  const handlePrint = () => {
    const printWindow = window.open(`/api/receipts/${paymentId}/preview`, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const formatCurrency = (amount?: number) => `₹${amount?.toLocaleString() ?? "0"}`;


  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { variant: "default", className: "bg-green-100 text-green-800" },
      partial: { variant: "secondary", className: "bg-yellow-100 text-yellow-800" },
      pending: { variant: "outline", className: "bg-red-100 text-red-800" },
      failed: { variant: "destructive", className: "bg-red-100 text-red-800" },
    } as const;

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge className={config.className}>
        {status ?? "NA"}
      </Badge>
    );
  };
  

  if (!receiptData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Receipt Preview</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p>Loading receipt data...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Payment Receipt</DialogTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6">
          {/* Receipt Header */}
          <Card>
            <CardHeader className="text-center bg-blue-50">
              <CardTitle className="text-2xl text-blue-900">Aryen Sports Arena</CardTitle>
              <p className="text-blue-700">Sports Facility Booking Receipt</p>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-sm text-gray-600">Receipt ID</p>
                  <p className="font-bold text-lg">{receiptData.receiptId}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-bold">{receiptData.paymentDate ? new Date(receiptData.paymentDate).toLocaleDateString() : 'Date not available'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Customer Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-semibold">{receiptData.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p>{receiptData.customerEmail || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p>{receiptData.customerPhone || 'Not provided'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Booking Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Booking Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Booking ID</p>
                  <p className="font-semibold">#{receiptData.bookingId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Facility</p>
                  <p>{receiptData.facilityName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sport</p>
                  <p>{receiptData.sportName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date & Time</p>
                  <p>{receiptData.bookingDate ? new Date(receiptData.bookingDate).toLocaleDateString() : 'Date not available'}</p>
                  <p className="text-sm">{receiptData.startTime && receiptData.endTime ? `${receiptData.startTime} - ${receiptData.endTime}` : 'Time not available'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Participants</p>
                  <p>{receiptData.participants}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Total Booking Amount</span>
                  <span className="font-semibold">{formatCurrency(receiptData.totalBookingAmount || 600)}</span>
                </div>
                {receiptData.discountAmount && receiptData.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount Applied</span>
                    <span className="font-semibold">-{formatCurrency(receiptData.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2">
                  <span>Amount After Discount</span>
                  <span className="font-semibold">{formatCurrency((receiptData.totalBookingAmount || 600) - (receiptData.discountAmount || 0))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Paid (Before This Payment)</span>
                  <span className="font-semibold text-blue-600">{formatCurrency(receiptData.totalPaidBeforeThis || ((receiptData.totalBookingAmount || 600) - (receiptData.discountAmount || 0) - receiptData.totalAmount))}</span>
                </div>
                <Separator />
                <div className="flex justify-between bg-blue-50 p-2 rounded">
                  <span className="font-medium">Due Amount (before this payment)</span>
                  <span className="font-semibold">{formatCurrency(receiptData.totalAmount)}</span>
                </div>
                <div className="flex justify-between bg-green-50 p-2 rounded">
                  <span className="font-medium">Amount Paid This Transaction</span>
                  <span className="font-semibold text-green-600">{formatCurrency(receiptData.paidAmount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold bg-gray-50 p-2 rounded">
                  <span>Remaining Balance</span>
                  <span className={receiptData.balanceAmount > 0 ? "text-red-600" : "text-green-600"}>
                    {formatCurrency(receiptData.balanceAmount)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Payment Method</span>
                <span className="font-semibold">{receiptData.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>Transaction ID</span>
                <span className="font-mono text-sm">{receiptData.transactionId || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Status</span>
                <span>{getStatusBadge(receiptData.paymentStatus)}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Date</span>
                <span>
   {receiptData.paymentDate ? new Date(receiptData.paymentDate).toLocaleDateString() : 'Date not available'}
</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Receipt Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Notification Options */}
              <div className="space-y-3">
                <h4 className="font-medium">Send Receipt Via:</h4>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="sms" 
                      checked={sendSMS} 
                      onCheckedChange={(checked) => setSendSMS(!!checked)}
                      disabled={!receiptData.customerPhone}
                    />
                    <label htmlFor="sms" className="text-sm">
                      SMS {!receiptData.customerPhone && '(No phone number)'}
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="email" 
                      checked={sendEmail} 
                      onCheckedChange={(checked) => setSendEmail(!!checked)}
                      disabled={!receiptData.customerEmail}
                    />
                    <label htmlFor="email" className="text-sm">
                      Email {!receiptData.customerEmail && '(No email address)'}
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleGenerateReceipt} disabled={isGenerating}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {isGenerating ? 'Generating...' : 'Generate & Send'}
                </Button>
                <Button variant="outline" onClick={handlePreview}>
                  <span className="h-4 w-4 mr-2">👁</span>
                  Preview
                </Button>
                <Button variant="outline" onClick={handleDownloadPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-sm text-gray-600 border-t pt-4">
            <p>Thank you for choosing Aryen Sports Arena!</p>
            <p>For any queries, contact us at support@aryenrecreation.com</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}