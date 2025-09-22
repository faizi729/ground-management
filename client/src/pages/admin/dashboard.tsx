import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import AdminSidebar from "@/components/AdminSidebar";
import StatsCard from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CalendarDays, 
  IndianRupee, 
  Users, 
  Building2, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Activity,
  BarChart3,
  RefreshCw,
  RotateCcw,
  Eye,
  Menu,
  X
} from "lucide-react";

interface DashboardStats {
  todayBookings: number;
  todayRevenue: number;
  totalBookings: number;
  totalRevenue: number;
  activeUsers: number;
  activeGrounds: number;
  liveSessions: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  completed: number;
}

interface BookingData {
  id: number;
  userName: string;
  userEmail: string;
  userPhone?: string;
  facilityName: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  totalAmount: string;
  status: string;
  paymentStatus: string;
}

interface BookingsResponse {
  bookings: BookingData[];
  total: number;
}

// Component for updating past bookings
function UpdatePastBookingsButton() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updatePastBookingsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/update-past-bookings');
      return await response.json();
    },
    onSuccess: (data: any) => {
      // Show detailed results based on payment validation
      if (data.updated > 0 && data.skipped === 0) {
        toast({
          title: "✅ All Bookings Updated",
          description: `Successfully completed ${data.updated} past bookings`,
        });
      } else if (data.updated > 0 && data.skipped > 0) {
        toast({
          title: "⚠️ Partial Update",
          description: `Updated ${data.updated} bookings. ${data.skipped} bookings have outstanding payments`,
          variant: "default",
        });
      } else if (data.skipped > 0) {
        toast({
          title: "⚠️ Payment Issues Found",
          description: `${data.skipped} bookings have outstanding payments. Please collect payments first`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "ℹ️ No Updates Needed",
          description: "No past confirmed bookings found to update",
        });
      }

      // Log payment issues for admin review
      if (data.paymentIssues && data.paymentIssues.length > 0) {
        console.log("Payment issues requiring attention:", data.paymentIssues);
      }

      // Refresh dashboard data
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update past bookings",
        variant: "destructive",
      });
    },
  });

  return (
    <Button 
      variant="secondary" 
      size="sm" 
      onClick={() => updatePastBookingsMutation.mutate()}
      disabled={updatePastBookingsMutation.isPending}
    >
      <RotateCcw className={`h-4 w-4 mr-2 ${updatePastBookingsMutation.isPending ? 'animate-spin' : ''}`} />
      Complete Past Bookings
    </Button>
  );
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
   const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Redirect if not authenticated or not admin/manager
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'manager'))) {
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
  }, [isAuthenticated, isLoading, user, toast]);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats"],
    enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'manager'),
    retry: false,
  });

  const { data: recentBookings, isLoading: bookingsLoading, refetch: refetchBookings } = useQuery<BookingsResponse>({
    queryKey: ["/api/admin/bookings?limit=10"],
    enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'manager'),
    retry: false,
  });

  if (isLoading || statsLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <AdminSidebar />
        <div className="flex-1 lg:ml-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Confirmed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200"><CheckCircle className="h-3 w-3 mr-1" />Paid</Badge>;
      case 'partial':
        return <Badge className="bg-orange-100 text-orange-800 border border-orange-200"><AlertCircle className="h-3 w-3 mr-1" />Partial</Badge>;
      case 'pending':
        return <Badge className="bg-rose-100 text-rose-800 border border-rose-200"><Clock className="h-3 w-3 mr-1" />Unpaid</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 border border-red-200"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'refunded':
        return <Badge className="bg-gray-100 text-gray-800 border border-gray-200"><RotateCcw className="h-3 w-3 mr-1" />Refunded</Badge>;
      default:
        return <Badge variant="outline" className="text-gray-600"><AlertCircle className="h-3 w-3 mr-1" />{status}</Badge>;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
  {/* Sidebar for desktop */}
  <AdminSidebar className="hidden lg:block fixed left-0 top-0 h-full w-64 shadow-md" />

  {/* Sidebar Drawer for mobile */}
  {mobileSidebarOpen && (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={() => setMobileSidebarOpen(false)}
      />
      {/* Drawer */}
      <div className="relative w-64 bg-white shadow-lg z-50">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Menu</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <AdminSidebar />
      </div>
    </div>
  )}

  {/* Main Content */}
  <div className="flex-1 lg:ml-64 overflow-auto">
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Management Dashboard
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Welcome back, {user?.firstName}! Here's the overview for all users
            and bookings at Aryen Sports Arena.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchStats();
              refetchBookings();
            }}
            disabled={statsLoading || bookingsLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${
                statsLoading || bookingsLoading ? "animate-spin" : ""
              }`}
            />
            Refresh
          </Button>

          {/* Mobile Sidebar Trigger */}
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <StatsCard
          title="System: Today's Bookings"
          value={stats?.todayBookings || 0}
          icon={CalendarDays}
          iconColor="bg-blue-500"
          description="All users' bookings today"
        />
        <StatsCard
          title="System: Today's Revenue"
          value={`₹${(stats?.todayRevenue || 0).toLocaleString()}`}
          icon={IndianRupee}
          iconColor="bg-green-500"
          description="Total earnings from all users today"
        />
        <StatsCard
          title="Live Sessions"
          value={stats?.liveSessions || 0}
          icon={Activity}
          iconColor="bg-red-500"
          description="Currently active"
        />
        <StatsCard
          title="Active Users"
          value={stats?.activeUsers || 0}
          icon={Users}
          iconColor="bg-purple-500"
          description="Registered members"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <StatsCard
          title="Total Bookings"
          value={stats?.totalBookings || 0}
          icon={BarChart3}
          iconColor="bg-indigo-500"
          description="All users' bookings (lifetime)"
        />
        <StatsCard
          title="Total Revenue"
          value={`₹${(stats?.totalRevenue || 0).toLocaleString()}`}
          icon={TrendingUp}
          iconColor="bg-amber-500"
          description="All time earnings"
        />
        <StatsCard
          title="Available Facilities"
          value={stats?.activeGrounds || 0}
          icon={Building2}
          iconColor="bg-teal-500"
          description="Active facilities"
        />
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center">
              <CalendarDays className="h-5 w-5 mr-2" />
              Recent Bookings
            </div>
            <div className="flex items-center gap-2">
              <UpdatePastBookingsButton />
              <Button
                variant="outline"
                size="sm"
                onClick={() => (window.location.href = "/admin/bookings")}
              >
                <Eye className="h-4 w-4 mr-2" />
                View All
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bookingsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center space-x-4 animate-pulse"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-300 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 sm:h-4 bg-gray-300 rounded w-2/3 sm:w-3/4"></div>
                    <div className="h-2 sm:h-3 bg-gray-300 rounded w-1/2"></div>
                  </div>
                  <div className="h-5 sm:h-6 bg-gray-300 rounded w-16 sm:w-20"></div>
                </div>
              ))}
            </div>
          ) : recentBookings?.bookings &&
            recentBookings.bookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm sm:text-base min-w-[600px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Facility
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentBookings?.bookings
                    ?.slice(0, 10)
                    .map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-full flex items-center justify-center text-white font-medium">
                              {booking.userName
                                ?.charAt(0)
                                ?.toUpperCase() || "U"}
                            </div>
                            <div className="ml-3 sm:ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {booking.userName || "Unknown User"}
                              </div>
                              <div className="text-xs sm:text-sm text-gray-500">
                                {booking.userPhone || booking.userEmail}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {booking.facilityName}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(
                              booking.bookingDate
                            ).toLocaleDateString()}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500">
                            {booking.startTime} - {booking.endTime}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            ₹{Number(booking.totalAmount).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(booking.status)}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          {getPaymentStatusBadge(booking.paymentStatus)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <CalendarDays className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No recent bookings found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  </div>
</div>

  );
}
