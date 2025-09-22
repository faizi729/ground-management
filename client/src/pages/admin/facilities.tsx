import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import AdminSidebar from "@/components/AdminSidebar";
import BookingModal from "@/components/BookingModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Clock,
  PauseCircle,
  PlayCircle,
  MapPin,
  Settings,
  TrendingUp,
  TrendingDown,
  Star,
  BarChart3,
  Calendar,
  IndianRupee,
  Activity,
  Eye,
  RefreshCw,
  Award,
  Target
} from "lucide-react";

// Enhanced facility analytics interface
interface FacilityPopularityData {
  facilityId: number;
  facilityName: string;
  facilityType: string;
  totalBookings: number;
  totalRevenue: number;
  avgBookingValue: number;
  weeklyBookings: number;
  monthlyBookings: number;
  popularTimeSlots: string[];
  occupancyRate: number;
  customerRating: number;
  isActive: boolean;
  lastBookingDate: string;
  trendDirection: 'up' | 'down' | 'stable';
  revenueGrowth: number;
  bookingGrowth: number;
}

// Legacy facilities interface for backward compatibility
interface LegacyFacility {
  id: number;
  name: string;
  type: string;
  description: string;
  capacity: number;
  hourlyRate: number;
  location: string;
  amenities: string[];
  images: string[];
  isActive: boolean;
  isPopular: boolean;
  isPremium: boolean;
  createdAt: string;
  updatedAt: string;
}

function isUnauthorizedError(error: any): boolean {
  return error?.status === 401 || error?.message?.includes("Unauthorized");
}

export default function AdminFacilities() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const queryClient = useQueryClient();
  
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("popularity");
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // Admin booking modal state
  const [selectedFacilityForBooking, setSelectedFacilityForBooking] = useState<any>(null);
  const [isAdminBookingModalOpen, setIsAdminBookingModalOpen] = useState(false);

  // Redirect if not authenticated or not admin/manager
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'manager'))) {
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
  }, [isAuthenticated, authLoading, user, toast]);

  // Fetch facilities data from master tables integration
  const { data: facilities, isLoading: facilitiesLoading, refetch: refetchFacilities } = useQuery<any[]>({
    queryKey: ["/api/admin/facilities"],
    enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'manager'),
    refetchInterval: 30000, // Real-time updates every 30 seconds
  });

  // Fetch facility analytics and popularity data
  const { data: facilityStats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ["/api/admin/facility-stats"],
    enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'manager'),
  });

  // Fetch bookings data for analytics
  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ["/api/admin/bookings", { limit: 1000 }],
    enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'manager'),
  });

  // Calculate facility popularity analytics from bookings data
  const calculateFacilityAnalytics = (): FacilityPopularityData[] => {
    if (!facilities || !bookingsData || !Array.isArray(bookingsData.bookings)) return [];
    
    return facilities.map((facility) => {
      const facilityBookings = bookingsData.bookings.filter(
        (booking: any) => booking.facilityId === facility.id || booking.groundId === facility.groundId
      );
      
      const totalBookings = facilityBookings.length;
      const totalRevenue = facilityBookings.reduce(
        (sum: number, booking: any) => sum + Number(booking.totalAmount || 0), 0
      );
      
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const weeklyBookings = facilityBookings.filter(
        (booking: any) => new Date(booking.createdAt) >= weekAgo
      ).length;
      
      const monthlyBookings = facilityBookings.filter(
        (booking: any) => new Date(booking.createdAt) >= monthAgo
      ).length;
      
      const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
      const occupancyRate = Math.min((totalBookings / 100) * 100, 100); // Mock calculation
      
      return {
        facilityId: facility.id,
        facilityName: facility.name,
        facilityType: facility.type,
        totalBookings,
        totalRevenue,
        avgBookingValue,
        weeklyBookings,
        monthlyBookings,
        popularTimeSlots: ['09:00-12:00', '18:00-21:00'], // Mock data
        occupancyRate,
        customerRating: 4.2 + Math.random() * 0.8, // Mock rating
        isActive: facility.isActive,
        lastBookingDate: facilityBookings.length > 0 
          ? new Date(Math.max(...facilityBookings.map((b: any) => new Date(b.createdAt).getTime()))).toISOString()
          : '',
        trendDirection: weeklyBookings > 5 ? 'up' : weeklyBookings < 2 ? 'down' : 'stable',
        revenueGrowth: Math.random() * 40 - 20, // Mock growth
        bookingGrowth: Math.random() * 30 - 15, // Mock growth
      };
    });
  };

  const popularityData = calculateFacilityAnalytics();

  // Filter and sort facilities directly from API data
  const filteredFacilities = facilities
    ? facilities
        .filter((facility) => {
          const matchesType = filterType === "all" || facility.type?.toLowerCase().includes(filterType.toLowerCase());
          return matchesType;
        })
        .sort((a, b) => {
          switch (sortBy) {
            case 'popularity': return (b.capacity || 0) - (a.capacity || 0);
            case 'revenue': return (b.hourlyRate || 0) - (a.hourlyRate || 0);
            case 'rating': return b.name.localeCompare(a.name);
            case 'occupancy': return (b.capacity || 0) - (a.capacity || 0);
            default: return b.name.localeCompare(a.name);
          }
        })
    : [];

  const dataLoading = facilitiesLoading || statsLoading || bookingsLoading;

  // Toggle facility status
  const toggleFacilityStatus = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      return apiRequest(`/api/admin/facilities/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Facility status updated successfully" });
      refetchFacilities();
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to update facility status", 
        variant: "destructive" 
      });
    },
  });

  if (authLoading || dataLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <AdminSidebar />
        <div className="flex-1 lg:ml-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
   <div className="flex h-screen bg-gray-50">
  <AdminSidebar />
  <div className="flex-1 lg:ml-64 p-4 lg:p-6 overflow-auto">
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Facilities Management</h1>
          <p className="text-sm lg:text-base text-gray-600">Analytics and management for all facilities (Legacy + Master Tables)</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              refetchFacilities();
              refetchStats();
            }}
            disabled={dataLoading}
            className="flex-1 sm:flex-initial"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${dataLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button 
            onClick={() => window.location.href = '/admin/grounds'}
            variant="outline"
            className="flex-1 sm:flex-initial"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Add Facility</span>
          </Button>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Filter:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm flex-1 sm:flex-initial"
            >
              <option value="all">All Types</option>
              <option value="badminton">Badminton</option>
              <option value="football">Football</option>
              <option value="basketball">Basketball</option>
              <option value="tennis">Tennis</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm flex-1 sm:flex-initial"
            >
              <option value="popularity">Popularity</option>
              <option value="revenue">Revenue</option>
              <option value="rating">Rating</option>
              <option value="occupancy">Occupancy</option>
            </select>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="flex-1 sm:flex-initial"
          >
            Grid
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
            className="flex-1 sm:flex-initial"
          >
            Table
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6 lg:mb-8">
        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center">
              <Building2 className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600" />
              <div className="ml-3 lg:ml-4">
                <p className="text-xs lg:text-sm font-medium text-gray-600">Total Facilities</p>
                <p className="text-lg lg:text-2xl font-bold text-gray-900">{facilityStats?.totalFacilities || facilities?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center">
              <BarChart3 className="h-6 w-6 lg:h-8 lg:w-8 text-green-600" />
              <div className="ml-3 lg:ml-4">
                <p className="text-xs lg:text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-lg lg:text-2xl font-bold text-gray-900">
                  {facilityStats?.totalBookings || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center">
              <IndianRupee className="h-6 w-6 lg:h-8 lg:w-8 text-purple-600" />
              <div className="ml-3 lg:ml-4">
                <p className="text-xs lg:text-sm font-medium text-gray-600">Revenue Collected</p>
                <p className="text-lg lg:text-2xl font-bold text-gray-900">
                  ₹{facilityStats?.totalRevenue?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center">
              <Star className="h-6 w-6 lg:h-8 lg:w-8 text-orange-600" />
              <div className="ml-3 lg:ml-4">
                <p className="text-xs lg:text-sm font-medium text-gray-600">Avg Capacity</p>
                <p className="text-lg lg:text-2xl font-bold text-gray-900">
                  {facilityStats?.avgCapacity || 
                    (facilities?.length 
                      ? (facilities.reduce((sum, f) => sum + (f.capacity || 0), 0) / facilities.length).toFixed(0)
                      : '0'
                    )
                  } people
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Facilities Content */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {filteredFacilities.map((facility) => (
            <Card key={facility.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-8 h-8 lg:w-10 lg:h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Building2 className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
                    </div>
                    {facility.capacity > 8 && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 lg:w-4 lg:h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                        <Star className="h-1.5 w-1.5 lg:h-2 lg:w-2 text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-base lg:text-lg">
                      {facility.name}
                    </CardTitle>
                    <p className="text-xs lg:text-sm text-gray-600 capitalize">{facility.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={facility.isActive}
                    onCheckedChange={(checked) => 
                      toggleFacilityStatus.mutate({ id: facility.id, isActive: checked })
                    }
                  />
                  {facility.trendDirection === 'up' ? (
                    <TrendingUp className="h-3 w-3 lg:h-4 lg:w-4 text-green-500" />
                  ) : facility.trendDirection === 'down' ? (
                    <TrendingDown className="h-3 w-3 lg:h-4 lg:w-4 text-red-500" />
                  ) : (
                    <Activity className="h-3 w-3 lg:h-4 lg:w-4 text-gray-400" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Popularity Metrics */}
                  <div className="grid grid-cols-2 gap-3 lg:gap-4">
                    <div className="text-center p-2 lg:p-3 bg-blue-50 rounded-lg">
                      <p className="text-xl lg:text-2xl font-bold text-blue-600">{facility.capacity || 0}</p>
                      <p className="text-xs text-gray-600">Capacity</p>
                    </div>
                    <div className="text-center p-2 lg:p-3 bg-green-50 rounded-lg">
                      <p className="text-xl lg:text-2xl font-bold text-green-600">₹{(facility.hourlyRate || 0).toLocaleString()}</p>
                      <p className="text-xs text-gray-600">Hourly Rate</p>
                    </div>
                  </div>

                  {/* Rating and Occupancy */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Type:</span>
                      <span className="font-medium capitalize text-sm">{facility.type || 'General'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className={`font-medium text-sm ${facility.isActive ? 'text-green-600' : 'text-red-600'}`}>
                        {facility.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Location and Source */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-center">
                      <p className="font-medium text-blue-600">{facility.location || 'Not specified'}</p>
                      <p className="text-gray-500">Location</p>
                    </div>
                    <div className="text-center">
                      <p className={`font-medium ${facility.source === 'master' ? 'text-green-600' : 'text-orange-600'}`}>
                        {facility.source === 'master' ? 'Master Tables' : 'Legacy System'}
                      </p>
                      <p className="text-gray-500">Data Source</p>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="pt-2 border-t space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Amenities:</span>
                      <span className="font-medium">{facility.amenities?.length || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">{facility.createdAt ? new Date(facility.createdAt).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                  
                  {/* Action Buttons - Mobile: Stacked, Desktop: Row */}
                 <div className="flex flex-col sm:flex-row gap-2 mt-4 w-full">
  <Button
    variant="default"
    size="sm"
    onClick={() => {
      setSelectedFacilityForBooking(facility);
      setIsAdminBookingModalOpen(true);
    }}
    className="flex-1 min-w-0 w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
  >
    <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
    <span className="truncate hidden sm:inline">Book as Admin</span>
    <span className="sm:hidden">Book</span>
  </Button>
  <Button
    variant="outline"
    size="sm"
    onClick={() => window.location.href = `/admin/bookings?facility=${facility.facilityId}`}
    className="flex-1 min-w-0 w-full sm:w-auto"
  >
    <Eye className="h-3 w-3 mr-1 flex-shrink-0" />
    <span className="truncate hidden sm:inline">View Bookings</span>
    <span className="sm:hidden">View</span>
  </Button>
  <Button
    variant="outline"
    size="sm"
    onClick={() => window.location.href = `/admin/facilities/${facility.facilityId}/edit`}
    className="flex-1 min-w-0 w-full sm:w-auto"
  >
    <Edit className="h-3 w-3 mr-1 flex-shrink-0" />
    <span className="truncate hidden sm:inline">Edit</span>
    <span className="sm:hidden">Edit</span>
  </Button>
</div>

                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Mobile List View */}
          <div className="lg:hidden space-y-4">
            {filteredFacilities.map((facility) => (
              <Card key={facility.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-8 w-8 text-gray-400" />
                      <div>
                        <p className="font-medium">{facility.name}</p>
                        <p className="text-sm text-gray-500">ID: {facility.id}</p>
                        <p className="text-sm text-gray-500 capitalize">{facility.type}</p>
                      </div>
                    </div>
                    <Switch
                      checked={facility.isActive}
                      onCheckedChange={(checked) => 
                        toggleFacilityStatus.mutate({ id: facility.facilityId, isActive: checked })
                      }
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Capacity:</span>
                        <span className="font-bold">{facility.capacity || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Rate:</span>
                        <span className="font-bold text-green-600">₹{(facility.hourlyRate || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Location:</span>
                        <span className="font-medium">{facility.location || 'Not specified'}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Type:</span>
                        <span className="font-medium capitalize">{facility.type || 'General'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Source:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${facility.source === 'master' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                          {facility.source === 'master' ? 'Master' : 'Legacy'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={() => {
                        setSelectedFacilityForBooking(facility);
                        setIsAdminBookingModalOpen(true);
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      Book
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.location.href = `/admin/bookings?facility=${facility.facilityId}`}
                      className="flex-1"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.location.href = `/admin/facilities/${facility.facilityId}/edit`}
                      className="flex-1"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop Table View */}
          <Card className="hidden lg:block">
            <CardHeader>
              <CardTitle>Facilities Performance Table</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Facility</th>
                      <th className="text-left py-3 px-4">Type</th>
                      <th className="text-left py-3 px-4">Capacity</th>
                      <th className="text-left py-3 px-4">Hourly Rate</th>
                      <th className="text-left py-3 px-4">Category</th>
                      <th className="text-left py-3 px-4">Location</th>
                      <th className="text-left py-3 px-4">Source</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFacilities.map((facility) => (
                      <tr key={facility.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <Building2 className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="font-medium">{facility.name}</p>
                              <p className="text-sm text-gray-500">ID: {facility.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 capitalize">{facility.type}</td>
                        <td className="py-4 px-4">
                          <div className="text-center">
                            <p className="font-bold text-lg">{facility.capacity || 0}</p>
                            <p className="text-xs text-gray-500">Capacity</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-center">
                            <p className="font-bold text-lg text-green-600">₹{(facility.hourlyRate || 0).toLocaleString()}</p>
                            <p className="text-xs text-gray-500">Hourly Rate</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1">
                            <Building2 className="h-4 w-4 text-blue-500" />
                            <span className="font-medium capitalize">{facility.type || 'General'}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-center">
                            <p className="font-medium">{facility.location || 'Not specified'}</p>
                            <p className="text-xs text-gray-500">Location</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${facility.source === 'master' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                              {facility.source === 'master' ? 'Master' : 'Legacy'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Switch
                            checked={facility.isActive}
                            onCheckedChange={(checked) => 
                              toggleFacilityStatus.mutate({ id: facility.facilityId, isActive: checked })
                            }
                          />
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex gap-1">
                            <Button 
                              variant="default" 
                              size="sm" 
                              onClick={() => {
                                setSelectedFacilityForBooking(facility);
                                setIsAdminBookingModalOpen(true);
                              }}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Calendar className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => window.location.href = `/admin/bookings?facility=${facility.facilityId}`}>
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => window.location.href = `/admin/facilities/${facility.facilityId}/edit`}>
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {filteredFacilities.length === 0 && (
        <Card className="text-center py-8 lg:py-12">
          <CardContent>
            <Building2 className="h-10 w-10 lg:h-12 lg:w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No facilities found</h3>
            <p className="text-sm lg:text-base text-gray-600 mb-4 lg:mb-6">
              {filterType !== "all" 
                ? "No facilities match your current filter criteria." 
                : "Create facilities to get started with bookings and analytics."
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              {filterType !== "all" && (
                <Button variant="outline" onClick={() => setFilterType("all")} className="flex-1 sm:flex-initial">
                  Clear Filters
                </Button>
              )}
              <Button onClick={() => window.location.href = '/admin/grounds'} className="flex-1 sm:flex-initial">
                <Plus className="h-4 w-4 mr-2" />
                Add Facility
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  </div>

  {/* Admin Booking Modal */}
  {selectedFacilityForBooking && (
    <BookingModal
      facility={selectedFacilityForBooking}
      isOpen={isAdminBookingModalOpen}
      onClose={() => {
        setIsAdminBookingModalOpen(false);
        setSelectedFacilityForBooking(null);
      }}
      isAdminBooking={true}
    />
  )}
</div>
  );
}