import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import FacilityCard from "@/components/FacilityCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CalendarDays, Clock, TrendingUp, Users, Eye, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { Link } from "wouter";
import type { Facility, Booking } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();
  
  // State for booking management modals
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: facilities } = useQuery<Facility[]>({
    queryKey: ["/api/facilities"],
    enabled: isAuthenticated,
    refetchInterval: 60000, // Real-time updates every minute
  });

  // Get popular facilities with real-time updates from master tables
  const { data: popularFacilitiesData } = useQuery<Facility[]>({
    queryKey: ["/api/facilities/popular"],
    enabled: isAuthenticated,
    refetchInterval: 30000, // Real-time updates every 30 seconds
  });

  const { data: userBookings } = useQuery<Booking[]>({
    queryKey: ["/api/bookings/user"],
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const upcomingBookings = userBookings?.filter(booking => {
    const bookingDate = new Date(booking.bookingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
    bookingDate.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
    
    return booking.status !== 'cancelled' && bookingDate >= today;
  }).slice(0, 3) || [];

  // Use master table data or fallback to facilities
  const popularFacilities = popularFacilitiesData || facilities?.slice(0, 6) || [];

  // Delete booking mutation
  const deleteBookingMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      return await apiRequest("DELETE", `/api/bookings/${bookingId}`);
    },
    onSuccess: async (response) => {
      const result = await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/user"] });
      
      toast({
        title: "Booking Cancelled Successfully",
        description: `${result.policy}. ${result.refundAmount > 0 ? `Refund: ₹${result.refundAmount.toLocaleString()}` : 'No refund applicable'}`,
        duration: 8000,
      });
      
      setShowDeleteDialog(false);
      setSelectedBooking(null);
    },
    onError: (error: any) => {
      toast({
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel booking",
        variant: "destructive",
      });
    },
  });

  // Handle booking actions
  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowViewDialog(true);
  };

  const handleEditBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowEditDialog(true);
  };

  const handleDeleteBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDeleteDialog(true);
  };

  // Calculate cancellation charges based on booking timing and payment status
  const calculateCancellationPolicy = (booking: Booking) => {
    if (!booking.bookingDate) return { canCancel: false, deduction: 0, policy: "Cannot determine cancellation policy" };
    
    const bookingDate = new Date(booking.bookingDate);
    const currentDate = new Date();
    const hoursUntilBooking = (bookingDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60);
    
    // Check if payment is complete
    const isPaymentComplete = booking.paymentStatus === 'completed' || booking.paidAmount >= booking.totalAmount;
    
    if (!isPaymentComplete) {
      return { 
        canCancel: true, 
        deduction: 0, 
        policy: "Free cancellation - No payment completed yet" 
      };
    }
    
    // Cancellation policy for paid bookings
    if (hoursUntilBooking >= 24) {
      return { 
        canCancel: true, 
        deduction: 0.1, // 10% cancellation fee
        policy: "10% cancellation fee (24+ hours before booking)" 
      };
    } else if (hoursUntilBooking >= 12) {
      return { 
        canCancel: true, 
        deduction: 0.25, // 25% cancellation fee
        policy: "25% cancellation fee (12-24 hours before booking)" 
      };
    } else if (hoursUntilBooking >= 2) {
      return { 
        canCancel: true, 
        deduction: 0.5, // 50% cancellation fee
        policy: "50% cancellation fee (2-12 hours before booking)" 
      };
    } else {
      return { 
        canCancel: false, 
        deduction: 1, // No refund
        policy: "No refund available (less than 2 hours before booking)" 
      };
    }
  };

  const confirmDeleteBooking = () => {
    if (selectedBooking) {
      deleteBookingMutation.mutate(selectedBooking.id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.firstName}! 👋
          </h1>
          <p className="text-gray-600">
            Ready for your next sports session? Check out <strong>your personal bookings</strong> below or explore our facilities.
          </p>
        </div>

        {/* Personal Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                  <CalendarDays className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">My Upcoming Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {upcomingBookings.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">My Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {userBookings?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Available Facilities</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {facilities?.filter(f => f.isActive).length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Member Since</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {user?.createdAt ? new Date(user.createdAt).getFullYear() : '2024'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Bookings */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>My Upcoming Bookings</CardTitle>
                  <Link href="/profile">
                    <Button variant="outline" size="sm">View All</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {upcomingBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarDays className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No upcoming bookings</p>
                    <Link href="/facilities">
                      <Button className="btn-sports-primary">Book a Facility</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{booking.facilityName}</p>
                              <p className="text-sm text-gray-600">
                                Booking #{booking.id} - {booking.planType.charAt(0).toUpperCase() + booking.planType.slice(1)}
                              </p>
                              <p className="text-sm text-gray-500">
                                {booking.bookingDate ? 
                                  `${new Date(booking.bookingDate).toLocaleDateString()} at ${booking.startTime?.substring(0, 5) || 'TBD'}` :
                                  'Date TBD'
                                }
                              </p>
                              <p className="text-sm text-gray-500">
                                {booking.planType === 'hourly' ? 
                                  `Duration: ${booking.duration || 1} hour(s)` :
                                  `${booking.planType.charAt(0).toUpperCase() + booking.planType.slice(1)} Plan`
                                }
                              </p>
                            </div>
                            <div className="text-right flex items-center gap-3">
                              <div>
                                <p className="font-semibold text-primary">
                                  ₹{Number(booking.totalAmount).toLocaleString()}
                                </p>
                                <Badge variant={
                                  booking.status === 'confirmed' ? 'default' :
                                  booking.status === 'pending' ? 'secondary' : 'outline'
                                }>
                                  {booking.status}
                                </Badge>
                              </div>
                              
                              {/* Action Menu */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewBooking(booking)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditBooking(booking)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Booking
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteBooking(booking)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Cancel Booking
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href="/facilities">
                  <Button className="w-full btn-sports-primary">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    Book a Facility
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="outline" className="w-full">
                    <Clock className="mr-2 h-4 w-4" />
                    View Booking History
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full">
                    <Users className="mr-2 h-4 w-4" />
                    My Dashboard
                  </Button>
                </Link>

              </CardContent>
            </Card>
          </div>
        </div>

        {/* Popular Facilities */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Popular Facilities</h2>
            <Link href="/facilities">
              <Button variant="outline">View All Facilities</Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularFacilities.map((facility) => (
              <FacilityCard key={facility.id} facility={facility} />
            ))}
          </div>
        </div>
      </div>

      {/* View Booking Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>Complete information about your booking</DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Booking ID</p>
                  <p className="text-sm">#{selectedBooking.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <Badge variant={
                    selectedBooking.status === 'confirmed' ? 'default' :
                    selectedBooking.status === 'pending' ? 'secondary' : 'outline'
                  }>
                    {selectedBooking.status}
                  </Badge>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Facility</p>
                <p className="text-sm">{selectedBooking.facilityName}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Plan Type</p>
                <p className="text-sm capitalize">{selectedBooking.planType}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Date</p>
                  <p className="text-sm">
                    {selectedBooking.bookingDate ? 
                      new Date(selectedBooking.bookingDate).toLocaleDateString() : 
                      'TBD'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Time</p>
                  <p className="text-sm">
                    {selectedBooking.startTime?.substring(0, 5) || 'TBD'}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Participants</p>
                  <p className="text-sm">{selectedBooking.participantCount} people</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Duration</p>
                  <p className="text-sm">
                    {selectedBooking.planType === 'hourly' ? 
                      `${selectedBooking.duration || 1} hour(s)` :
                      `${selectedBooking.planType} plan`
                    }
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Total Amount</p>
                <p className="text-lg font-semibold text-primary">
                  ₹{Number(selectedBooking.totalAmount).toLocaleString()}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Payment Method</p>
                <p className="text-sm capitalize">{selectedBooking.paymentMethod || 'Credit Card'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Booking Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Booking</DialogTitle>
            <DialogDescription>Modify your booking details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Booking editing feature is coming soon! For now, please contact our support team 
              to make changes to your booking.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => setShowEditDialog(false)} variant="outline" className="flex-1">
                Close
              </Button>
              <Button className="flex-1">
                Contact Support
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Booking Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p className="mb-4">Review the cancellation details for your booking:</p>
                {selectedBooking && (
                  <div className="space-y-4">
                    {/* Booking Details */}
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm"><strong>Facility:</strong> {selectedBooking.facilityName}</p>
                      <p className="text-sm"><strong>Date:</strong> {selectedBooking.bookingDate ? new Date(selectedBooking.bookingDate).toLocaleDateString() : 'TBD'}</p>
                      <p className="text-sm"><strong>Total Amount:</strong> ₹{Number(selectedBooking.totalAmount).toLocaleString()}</p>
                      <p className="text-sm"><strong>Payment Status:</strong> 
                        <span className={`ml-1 ${
                          selectedBooking.paymentStatus === 'completed' || selectedBooking.paidAmount >= selectedBooking.totalAmount
                            ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          {selectedBooking.paymentStatus === 'completed' || selectedBooking.paidAmount >= selectedBooking.totalAmount
                            ? 'Paid' : 'Pending'
                          }
                        </span>
                      </p>
                    </div>

                    {/* Cancellation Policy */}
                    {(() => {
                      const policy = calculateCancellationPolicy(selectedBooking);
                      const refundAmount = selectedBooking.totalAmount * (1 - policy.deduction);
                      
                      return (
                        <div className={`p-3 rounded-lg border ${
                          policy.canCancel ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'
                        }`}>
                          <p className="text-sm font-medium mb-2">Cancellation Policy:</p>
                          <p className="text-sm mb-2">{policy.policy}</p>
                          
                          {policy.canCancel && (
                            <div className="text-sm">
                              {policy.deduction > 0 ? (
                                <>
                                  <p><strong>Cancellation Fee:</strong> ₹{(selectedBooking.totalAmount * policy.deduction).toLocaleString()}</p>
                                  <p><strong>Refund Amount:</strong> <span className="text-green-600 font-medium">₹{refundAmount.toLocaleString()}</span></p>
                                </>
                              ) : (
                                <p><strong>Full Refund:</strong> <span className="text-green-600 font-medium">₹{selectedBooking.totalAmount.toLocaleString()}</span></p>
                              )}
                            </div>
                          )}
                          
                          {!policy.canCancel && (
                            <p className="text-sm text-red-600 font-medium">
                              This booking cannot be cancelled at this time.
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
            {selectedBooking && calculateCancellationPolicy(selectedBooking).canCancel && (
              <AlertDialogAction 
                onClick={confirmDeleteBooking}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteBookingMutation.isPending}
              >
                {deleteBookingMutation.isPending ? "Processing..." : "Confirm Cancellation"}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
