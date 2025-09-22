import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, CreditCard, Clock, AlertCircle, Search, Filter, Calendar, MapPin, Users } from "lucide-react";

interface PendingBooking {
  id: number;
  facilityName: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  participants: number;
  totalAmount: number;
  balanceDue: number;
  paidAmount: number;
  discountAmount: number;
  planType: string;
  bookingType: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function PendingPayments() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_desc");
  const [activeTab, setActiveTab] = useState<string>("pending");

  // Fetch pending payments
  const { data: pendingBookings = [], isLoading: pendingLoading, error: pendingError } = useQuery<PendingBooking[]>({
    queryKey: ["/api/bookings/pending-payments"],
    queryFn: async () => {
      const response = await fetch("/api/bookings/pending-payments", {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch pending payments');
      return response.json();
    },
    enabled: isAuthenticated,
  });

  // Fetch all payments
  const { data: allBookings = [], isLoading: allLoading, error: allError } = useQuery<PendingBooking[]>({
    queryKey: ["/api/bookings/all-payments"],
    queryFn: async () => {
      const response = await fetch("/api/bookings/all-payments", {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch all payments');
      return response.json();
    },
    enabled: isAuthenticated,
  });

  // Get current bookings based on active tab
  const currentBookings = activeTab === "pending" ? pendingBookings : allBookings;
  const isLoading = activeTab === "pending" ? pendingLoading : allLoading;
  const error = activeTab === "pending" ? pendingError : allError;

  // Filter and sort bookings
  const filteredBookings = currentBookings
    .filter(booking => {
      const matchesSearch = 
        booking.facilityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.id.toString().includes(searchTerm) ||
        `${booking.user.firstName} ${booking.user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || booking.paymentStatus === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "created_desc":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "created_asc":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "amount_desc":
          return b.totalAmount - a.totalAmount;
        case "amount_asc":
          return a.totalAmount - b.totalAmount;
        case "date_desc":
          return new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime();
        case "date_asc":
          return new Date(a.bookingDate).getTime() - new Date(b.bookingDate).getTime();
        default:
          return 0;
      }
    });

  const handlePayNow = (bookingId: number) => {
    setLocation(`/payment/${bookingId}`);
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
              <p className="text-gray-600 mb-4">Please log in to view pending payments.</p>
              <Button onClick={() => window.location.href = "/api/login"}>
                Log In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Loading pending payments...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto text-center">
            <Card>
              <CardContent className="p-8">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Error Loading Payments</h2>
                <p className="text-gray-600 mb-4">Failed to load pending payments. Please try again.</p>
                <Button onClick={() => window.location.reload()}>
                  Retry
                </Button>
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
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setLocation('/profile?tab=bookings')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Payment Management</h1>
              <p className="text-gray-600">
                Manage your payments and payment history
              </p>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending Payments ({pendingBookings.length})
              </TabsTrigger>
              <TabsTrigger value="all" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                All Payments ({allBookings.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-6">
              <PaymentContent 
                bookings={pendingBookings}
                isLoading={pendingLoading}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                sortBy={sortBy}
                setSortBy={setSortBy}
                handlePayNow={handlePayNow}
                isPending={true}
              />
            </TabsContent>

            <TabsContent value="all" className="space-y-6">
              <PaymentContent 
                bookings={allBookings}
                isLoading={allLoading}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                sortBy={sortBy}
                setSortBy={setSortBy}
                handlePayNow={handlePayNow}
                isPending={false}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// PaymentContent component for both tabs
interface PaymentContentProps {
  bookings: PendingBooking[];
  isLoading: boolean;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  handlePayNow: (bookingId: number) => void;
  isPending: boolean;
}

function PaymentContent({ 
  bookings, 
  isLoading, 
  searchTerm, 
  setSearchTerm, 
  statusFilter, 
  setStatusFilter, 
  sortBy, 
  setSortBy, 
  handlePayNow, 
  isPending 
}: PaymentContentProps) {
  // Filter and sort bookings
  const filteredBookings = bookings
    .filter(booking => {
      const matchesSearch = 
        (booking.facilityName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        booking.id.toString().includes(searchTerm) ||
        `${booking.user?.firstName || ''} ${booking.user?.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || booking.paymentStatus === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "created_desc":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "created_asc":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "amount_desc":
          return b.totalAmount - a.totalAmount;
        case "amount_asc":
          return a.totalAmount - b.totalAmount;
        case "date_desc":
          return new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime();
        case "date_asc":
          return new Date(a.bookingDate).getTime() - new Date(b.bookingDate).getTime();
        default:
          return 0;
      }
    });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_desc">Newest First</SelectItem>
                <SelectItem value="created_asc">Oldest First</SelectItem>
                <SelectItem value="amount_desc">Highest Amount</SelectItem>
                <SelectItem value="amount_asc">Lowest Amount</SelectItem>
                <SelectItem value="date_desc">Latest Booking Date</SelectItem>
                <SelectItem value="date_asc">Earliest Booking Date</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="text-sm text-gray-600 flex flex-col">
              {isPending ? (
                <>
                  <div>Outstanding Amount: ₹{filteredBookings.reduce((sum, booking) => sum + Number(booking.balanceDue || 0), 0).toLocaleString()}</div>
                  <div>Total Booking Value: ₹{filteredBookings.reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0).toLocaleString()}</div>
                </>
              ) : (
                <>
                  <div>Total Revenue: ₹{filteredBookings.reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0).toLocaleString()}</div>
                  <div>Amount Collected: ₹{filteredBookings.reduce((sum, booking) => sum + Number(booking.paidAmount || 0), 0).toLocaleString()}</div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      {filteredBookings.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {isPending ? "No Pending Payments" : "No Payments Found"}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== "all" 
                ? "No payments match your current filters." 
                : isPending 
                  ? "All your bookings are paid up! Great job staying on top of your payments."
                  : "You don't have any payment records yet."}
            </p>
            {(searchTerm || statusFilter !== "all") && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredBookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Booking Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold">{booking.facilityName}</h3>
                      <Badge variant={
                        booking.paymentStatus === 'paid' ? 'default' :
                        booking.paymentStatus === 'partial' ? 'secondary' :
                        booking.paymentStatus === 'pending' ? 'destructive' :
                        booking.paymentStatus === 'failed' ? 'destructive' :
                        'outline'
                      }>
                        {booking.paymentStatus}
                      </Badge>
                      <Badge variant="outline">
                        #{booking.id}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <div>
                          <div className="font-medium">
                            {booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString() : 'Invalid Date'}
                          </div>
                          <div>{booking.startTime || 'N/A'} - {booking.endTime || 'N/A'}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{Math.round((booking.duration || 0) / 60)}h duration</div>
                          <div className="capitalize">{booking.planType} plan</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{booking.participants} people</div>
                          <div className="capitalize">{booking.bookingType}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <div>
                          <div className="font-medium">Total</div>
                          <div>₹{Number(booking.totalAmount || 0).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Payment Info and Action */}
                  <div className="flex flex-col lg:flex-row items-end lg:items-center gap-4">
                    <div className="text-right">
                      {isPending || Number(booking.balanceDue || 0) > 0 ? (
                        <div className="text-2xl font-bold text-red-600">
                          ₹{Number(booking.balanceDue || 0).toLocaleString()}
                        </div>
                      ) : (
                        <div className="text-2xl font-bold text-green-600">
                          Fully Paid
                        </div>
                      )}
                      <div className="text-sm text-gray-600">
                        {isPending || Number(booking.balanceDue || 0) > 0 ? "Due Amount" : "Status"}
                      </div>
                      {Number(booking.paidAmount || 0) > 0 && (
                        <div className="text-xs text-green-600">
                          ₹{Number(booking.paidAmount || 0).toLocaleString()} paid
                        </div>
                      )}
                      {Number(booking.discountAmount || 0) > 0 && (
                        <div className="text-xs text-blue-600">
                          ₹{Number(booking.discountAmount || 0).toLocaleString()} discount
                        </div>
                      )}
                    </div>
                    
                    {(isPending || Number(booking.balanceDue || 0) > 0) && (
                      <Button
                        onClick={() => handlePayNow(booking.id)}
                        className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pay Now
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}