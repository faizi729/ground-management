import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentHistoryModal } from "@/components/PaymentHistoryModal";
import { ArrowLeft, History } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function TestPaymentHistory() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Payment History Button Test</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">This page demonstrates where the Payment History button should appear:</p>
              
              {/* Test Header Layout */}
              <div className="border rounded-lg p-4 bg-white">
                <h3 className="font-semibold mb-4">Payment Page Header Layout:</h3>
                
                <div className="flex items-center justify-between mb-6 p-4 border rounded bg-gray-50">
                  <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <div>
                      <h1 className="text-2xl font-bold">Complete Payment</h1>
                      <p className="text-gray-600">Booking ID: #36</p>
                    </div>
                  </div>
                  
                  {/* Test Payment History Button */}
                  <div className="border-2 border-red-500 border-dashed p-1">
                    <Button variant="outline" size="sm">
                      <History className="h-4 w-4 mr-2" />
                      Payment History
                    </Button>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600">
                  The Payment History button (outlined in red dashed border above) should appear in the 
                  <strong> top-right corner</strong> of the payment page header.
                </p>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-2">Actual PaymentHistoryModal Component Test:</h4>
                <p className="mb-2">Click this button to test the actual component:</p>
                <PaymentHistoryModal bookingId={36} />
              </div>
              
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-semibold mb-2">Navigation Instructions:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Navigate to <code>/payment/36</code> in the URL</li>
                  <li>Make sure you're logged in as a user with access to booking #36</li>
                  <li>Look for the "Payment History" button in the top-right corner</li>
                  <li>If you don't see it, check browser developer tools for errors</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}