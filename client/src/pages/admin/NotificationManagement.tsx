import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import AdminSidebar from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bell,
  Send,
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  Users
} from "lucide-react";

export default function NotificationManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Send booking reminders mutation
  const sendBookingRemindersMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/send-booking-reminders");
    },
    onSuccess: (data) => {
      toast({
        title: "Booking Reminders Sent",
        description: data.message,
      });
      setIsProcessing(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send booking reminders",
        variant: "destructive",
      });
      setIsProcessing(null);
    },
  });

  // Send payment reminders mutation
  const sendPaymentRemindersMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/send-payment-reminders");
    },
    onSuccess: (data) => {
      toast({
        title: "Payment Reminders Sent",
        description: data.message,
      });
      setIsProcessing(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send payment reminders",
        variant: "destructive",
      });
      setIsProcessing(null);
    },
  });

  // Process expired bookings mutation
  const processExpiredBookingsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/process-expired-bookings");
    },
    onSuccess: (data) => {
      toast({
        title: "Expired Bookings Processed",
        description: data.message,
      });
      setIsProcessing(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process expired bookings",
        variant: "destructive",
      });
      setIsProcessing(null);
    },
  });

  const handleSendBookingReminders = () => {
    setIsProcessing("booking-reminders");
    sendBookingRemindersMutation.mutate();
  };

  const handleSendPaymentReminders = () => {
    setIsProcessing("payment-reminders");
    sendPaymentRemindersMutation.mutate();
  };

  const handleProcessExpiredBookings = () => {
    setIsProcessing("expired-bookings");
    processExpiredBookingsMutation.mutate();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 lg:ml-64 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notification Management</h1>
              <p className="text-gray-600">Send reminders and manage notifications</p>
            </div>
          </div>

          {/* Notification Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            
            {/* Booking Reminders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Booking Reminders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Send day-before reminders to users with confirmed bookings for tomorrow. 
                    Includes payment reminders for pending payments.
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Auto-sends to upcoming bookings
                    </Badge>
                  </div>
                  
                  <Button
                    onClick={handleSendBookingReminders}
                    disabled={isProcessing === "booking-reminders"}
                    className="w-full"
                  >
                    {isProcessing === "booking-reminders" ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Booking Reminders
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Payment Reminders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-orange-600" />
                  Payment Reminders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Send payment reminders to users with confirmed bookings that have 
                    pending or partial payment status.
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Targets unpaid bookings
                    </Badge>
                  </div>
                  
                  <Button
                    onClick={handleSendPaymentReminders}
                    disabled={isProcessing === "payment-reminders"}
                    variant="outline"
                    className="w-full"
                  >
                    {isProcessing === "payment-reminders" ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Payment Reminders
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Expired Bookings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  Expired Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Automatically cancel bookings that are past their scheduled time 
                    and still have pending payment status.
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Auto-cancels overdue bookings
                    </Badge>
                  </div>
                  
                  <Button
                    onClick={handleProcessExpiredBookings}
                    disabled={isProcessing === "expired-bookings"}
                    variant="destructive"
                    className="w-full"
                  >
                    {isProcessing === "expired-bookings" ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Process Expired Bookings
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Information Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification System Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Automated Features</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Day-before booking reminders
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Payment pending notifications
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Booking cancellation alerts
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Queue position updates
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Smart Prevention</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      Duplicate notification prevention
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      Auto-expiry of overdue bookings
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      Payment deadline enforcement
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      Real-time notification delivery
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Ready for Email Integration</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      The notification system is prepared for SendGrid email integration. 
                      Once configured, notifications will be sent via email alongside in-app delivery.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}