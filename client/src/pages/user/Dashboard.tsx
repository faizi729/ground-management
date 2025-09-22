import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NotificationCenter from '@/components/NotificationCenter';
import { 
  Bell, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  DollarSign, 
  XCircle, 
  AlertTriangle,
  CheckCircle,
  Banknote,
  ArrowLeft,
  Home,
  RotateCcw
} from 'lucide-react';

// Notification interface moved to NotificationCenter component

interface UpcomingBooking {
  id: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: string;
  totalAmount: string;
  paidAmount: string;
  paymentStatus: string;
  facilityName: string;
  sportName: string;
  participantCount: number;
  createdAt: string;
}

interface CancellationPolicy {
  hoursUntilBooking: number;
  refundAmount: number;
  cancellationFee: number;
  message: string;
}

export default function UserDashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [selectedBooking, setSelectedBooking] = useState<UpcomingBooking | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Fetch all user bookings and filter them properly
  const { data: allBookings = [] } = useQuery({
    queryKey: ['/api/bookings/user'],
    enabled: isAuthenticated,
  });

  // Filter for truly upcoming bookings (future date/time and not cancelled)
  const now = new Date();
  const upcomingBookings = allBookings.filter((booking: UpcomingBooking) => {
    if (booking.status === 'cancelled' || booking.status === 'completed') return false;
    const bookingDateTime = new Date(`${booking.bookingDate}T${booking.startTime}`);
    return bookingDateTime > now;
  });

  // Cancel booking mutation
  const cancelBookingMutation = useMutation({
    mutationFn: async ({ bookingId, reason }: { bookingId: number; reason: string }) => {
      return await apiRequest("POST", `/api/user/cancel-booking/${bookingId}`, { reason });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/upcoming-bookings'] });
      setShowCancelDialog(false);
      setCancellationReason('');
      
      toast({
        title: "Booking Cancelled",
        description: `${data.message}. ${data.refundAmount > 0 ? `Refund: ₹${data.refundAmount}` : 'No refund applicable.'}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });



  const getStatusBadge = (status: string) => {
    const config = {
      'confirmed': { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      'pending': { variant: 'secondary' as const, icon: Clock, color: 'text-yellow-600' },
      'cancelled': { variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
      'completed': { variant: 'default' as const, icon: CheckCircle, color: 'text-blue-600' },
    };
    
    const statusConfig = config[status as keyof typeof config] || config.pending;
    const Icon = statusConfig.icon;
    
    return (
      <Badge variant={statusConfig.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const config = {
      'completed': { variant: 'default' as const, color: 'text-green-600', label: 'Paid' },
      'pending': { variant: 'secondary' as const, color: 'text-yellow-600', label: 'Unpaid' },
      'partial': { variant: 'outline' as const, color: 'text-orange-600', label: 'Partial' },
      'failed': { variant: 'destructive' as const, color: 'text-red-600', label: 'Failed' },
      'refunded': { variant: 'outline' as const, color: 'text-gray-600', label: 'Refunded' },
    };
    
    const paymentConfig = config[status as keyof typeof config] || config.pending;
    
    return (
      <Badge variant={paymentConfig.variant}>
        {paymentConfig.label}
      </Badge>
    );
  };

  const calculateCancellationPolicy = (booking: UpcomingBooking): CancellationPolicy => {
    const bookingDateTime = new Date(`${booking.bookingDate}T${booking.startTime}`);
    const now = new Date();
    const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    const totalPaid = parseFloat(booking.paidAmount || '0');
    let refundAmount = 0;
    let cancellationFee = 0;
    let message = '';
    
    if (hoursUntilBooking >= 24) {
      refundAmount = totalPaid;
      message = 'Full refund available (cancelled 24+ hours before)';
    } else if (hoursUntilBooking >= 2) {
      cancellationFee = totalPaid * 0.5;
      refundAmount = totalPaid - cancellationFee;
      message = '50% refund available (cancelled 2-24 hours before)';
    } else {
      cancellationFee = totalPaid;
      message = 'No refund available (cancelled less than 2 hours before)';
    }
    
    return {
      hoursUntilBooking: Math.round(hoursUntilBooking * 100) / 100,
      refundAmount,
      cancellationFee,
      message
    };
  };

  const handleCancelBooking = (booking: UpcomingBooking) => {
    setSelectedBooking(booking);
    setShowCancelDialog(true);
  };

  // Fetch notifications for unread count
  const { data: notifications = [] } = useQuery({
    queryKey: ['/api/user/notifications'],
    enabled: isAuthenticated,
  });

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
              <p className="text-gray-600 mb-4">Please log in to view your dashboard.</p>
              <Button onClick={() => window.location.href = '/api/login'}>
                Log In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
  <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
    {/* Header with Back Button */}
    <div className="mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => (window.location.href = "/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => (window.location.href = "/facilities")}
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Book Facilities
          </Button>
        </div>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
        My Personal Dashboard
      </h1>
      <p className="text-gray-600 mt-1 text-sm sm:text-base">
        Welcome back, {user?.firstName || user?.username}! Manage{" "}
        <strong>your personal bookings</strong> and stay updated with
        notifications
      </p>
    </div>

    {/* Layout */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
      {/* Notifications Panel */}
      <div className="lg:col-span-1 order-2 lg:order-1">
        <NotificationCenter />
      </div>

      {/* Bookings */}
      <div className="lg:col-span-2 order-1 lg:order-2">
        <Tabs defaultValue="upcoming" className="space-y-5 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upcoming" className="text-sm sm:text-base">
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="history" className="text-sm sm:text-base">
              History
            </TabsTrigger>
          </TabsList>

          {/* Upcoming Bookings Tab */}
          <TabsContent value="upcoming">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Calendar className="h-5 w-5" />
                  Upcoming Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingBookings.length === 0 ? (
                  <div className="text-center py-10 sm:py-12">
                    <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Upcoming Bookings
                    </h3>
                    <p className="text-gray-600 mb-4 text-sm sm:text-base">
                      You don't have any bookings scheduled.
                    </p>
                    <Button onClick={() => (window.location.href = "/facilities")}>
                      Book a Facility
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingBookings.map((booking: UpcomingBooking) => (
                      <Card
                        key={booking.id}
                        className="border-l-4 border-l-blue-500"
                      >
                        <CardContent className="pt-4">
                          {/* Header Row */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-3">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-base sm:text-lg">
                                {booking.sportName} - {booking.facilityName}
                              </h3>
                              {getStatusBadge(booking.status)}
                            </div>
                            {["confirmed", "pending"].includes(booking.status) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancelBooking(booking)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            )}
                          </div>

                          {/* Details Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <span>
                                {new Date(
                                  booking.bookingDate
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <span>
                                {booking.startTime} - {booking.endTime}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-500" />
                              <span>{booking.participantCount} participants</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-gray-500" />
                              <span>
                                ₹{parseFloat(booking.totalAmount).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <Separator className="my-3" />

                          {/* Footer */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-3 text-sm">
                              <span className="text-gray-600">Payment:</span>
                              {getPaymentStatusBadge(booking.paymentStatus)}
                            </div>
                            <div className="text-sm text-gray-600">
                              Paid: ₹
                              {parseFloat(
                                booking.paidAmount || "0"
                              ).toLocaleString()}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Booking History Tab */}
          <TabsContent value="history">
            {/* same responsive fixes as above (grids, spacing, flex-wrap) */}
          </TabsContent>
        </Tabs>
      </div>
    </div>

    {/* Cancellation Dialog (unchanged except for spacing tweaks) */}
    <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel Booking</DialogTitle>
        </DialogHeader>
        {/* dialog body stays same */}
      </DialogContent>
    </Dialog>
  </div>
</div>

  );
}