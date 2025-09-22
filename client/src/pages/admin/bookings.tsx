import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import AdminSidebar from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  Calendar, 
  Search, 
  Filter,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  Edit,
  Clock,
  IndianRupee,
  User,
  MapPin,
  Building2,
  Printer,
  FileText,
  Download,
  Users,
  DollarSign,
  Bell,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown
} from "lucide-react";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Enhanced booking interface for master table structure
interface BookingMasterView {
  id: number;
  bookingId: number;
  bookingNo: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  sportId: number;
  sportName: string;
  bookingType: string;
  groundId: number;
  groundName: string;
  groundType: string;
  planId: number;
  planName: string;
  planType: string;
  bookingMode: string;
  noOfPersons?: number;
  participantCount?: number;
  bookingDate: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  duration?: number;
  totalSlots: number;
  baseAmount: string;
  discountAmount: string;
  totalAmount: string;
  paidAmount: string;
  pendingAmount: string;
  bookingStatus: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  createdDate: string;
  createdAt: string;
  facilityName?: string;
  facilityId?: number;
  notes?: string;
  slots?: BookingSlotDetail[];
}

interface BookingSlotDetail {
  detailId: number;
  slotDate: string;
  slotId: number;
  slotName: string;
  startTime: string;
  endTime: string;
  slotPrice: string;
  status: string;
}

export default function AdminBookings() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("date_desc");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedBooking, setSelectedBooking] = useState<BookingMasterView | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  // Column sorting handler
  const handleSort = (column: string) => {
    const currentSortColumn = sortBy.replace('_asc', '').replace('_desc', '');
    const isCurrentColumn = currentSortColumn === column;
    const newDirection = isCurrentColumn && sortDirection === 'asc' ? 'desc' : 'asc';
    const newSortBy = `${column}_${newDirection}`;
    
    setSortBy(newSortBy);
    setSortDirection(newDirection);
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  // Get sort icon for column
  const getSortIcon = (column: string) => {
    const currentSortColumn = sortBy.replace('_asc', '').replace('_desc', '');
    if (currentSortColumn !== column) {
      return <ChevronsUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4 text-blue-600" /> : 
      <ChevronDown className="h-4 w-4 text-blue-600" />;
  };

  const limit = 20;

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

  // Fetch bookings with master table structure

  const { data: bookingsData, isLoading: bookingsLoading } = useQuery<{bookings: BookingMasterView[], total: number}>({
    queryKey: ['/api/admin/bookings', currentPage, statusFilter, searchTerm, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
        ...(sortBy && { sortBy: sortBy }),
      });

      const response = await fetch(`/api/admin/bookings?${params.toString()}`);
      return response.json();
    },
    enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'manager'),
  });

  // Fetch supporting data for context
  const { data: sports } = useQuery({
    queryKey: ["/api/admin/sports"],
    enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'manager'),
  });

  const { data: grounds } = useQuery({
    queryKey: ["/api/admin/grounds"],
    enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'manager'),
  });

  const { data: plans } = useQuery({
    queryKey: ["/api/admin/plans"],
    enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'manager'),
  });

  // Update booking status mutation
  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await apiRequest("PATCH", `/api/admin/bookings/${id}`, { bookingStatus: status });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      toast({
        title: "Booking Updated",
        description: data?.message || "The booking status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
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
      
      // Handle specific error cases
      if (error.status === 400) {
        toast({
          title: "Cannot Update Booking",
          description: error.response?.data?.message || error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  // Cancel expired bookings mutation
  const cancelExpiredMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/cancel-expired-bookings");
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      if (data?.cancelledCount > 0) {
        toast({
          title: "Expired Bookings Cancelled",
          description: `Successfully cancelled ${data.cancelledCount} expired pending bookings.`,
        });
      } else {
        toast({
          title: "No Expired Bookings",
          description: "No expired pending bookings found to cancel.",
        });
      }
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send reminders mutation
  const sendRemindersMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/send-reminders");
    },
    onSuccess: (data: any) => {
      toast({
        title: "Reminders Sent",
        description: `${data?.message}. Checked ${data?.totalBookingsChecked} bookings.`,
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'confirmed': { 
        icon: CheckCircle, 
        className: 'bg-green-100 text-green-800 border-green-300'
      },
      'pending': { 
        icon: AlertCircle, 
        className: 'bg-amber-100 text-amber-800 border-amber-300'
      },
      'cancelled': { 
        icon: XCircle, 
        className: 'bg-red-100 text-red-800 border-red-300'
      },
      'completed': { 
        icon: CheckCircle, 
        className: 'bg-blue-100 text-blue-800 border-blue-300'
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <div className={`flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium ${config.className}`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </div>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      'completed': { 
        className: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        label: 'Paid'
      },
      'partial': { 
        className: 'bg-orange-100 text-orange-800 border-orange-300',
        label: 'Partial'
      },
      'pending': { 
        className: 'bg-rose-100 text-rose-800 border-rose-300',
        label: 'Unpaid'
      },
      'failed': { 
        className: 'bg-red-100 text-red-800 border-red-300',
        label: 'Failed'
      },
      'refunded': { 
        className: 'bg-gray-100 text-gray-800 border-gray-300',
        label: 'Refunded'
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <div className={`px-2 py-1 rounded-full border text-xs font-medium ${config.className}`}>
        {config.label}
      </div>
    );
  };

  // Helper function to check if booking should be completed
  const isBookingCompleted = (booking: BookingMasterView) => {
    const currentDateTime = new Date();
    const bookingDate = new Date(booking.bookingDate || booking.startDate);
    
    // Handle missing endTime gracefully
    if (!booking.endTime) {
      // If no end time, just check if booking date is in the past
      return bookingDate < new Date(currentDateTime.toDateString());
    }
    
    const [endHour, endMinute] = booking.endTime.split(':').map(Number);
    
    // Set the booking end time
    const bookingEndDateTime = new Date(bookingDate);
    bookingEndDateTime.setHours(endHour, endMinute, 0, 0);
    
    // Booking can be marked completed if:
    // 1. Current time is past the booking end time, OR
    // 2. Booking date is in the past (for easier manual completion)
    return currentDateTime > bookingEndDateTime || bookingDate < new Date(currentDateTime.toDateString());
  };

  const handleViewDetails = async (booking: BookingMasterView) => {
    try {
      // Fetch booking slots detail
      const slotsResponse = await apiRequest("GET", `/api/admin/bookings/${booking.id}/slots`) as BookingSlotDetail[];
      setSelectedBooking({ ...booking, slots: slotsResponse });
      setIsDetailsDialogOpen(true);
    } catch (error) {
      console.error("Error fetching booking details:", error);
      setSelectedBooking(booking);
      setIsDetailsDialogOpen(true);
    }
  };

  const totalPages = Math.ceil((bookingsData?.total || 0) / limit);

  // Fetch admin stats for the cards
  const { data: adminStats } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'manager'),
  });

  const allBookingsStats = useMemo(() => {
    return {
      total: adminStats?.totalBookings || 0,
      confirmed: adminStats?.confirmed || 0,
      pending: adminStats?.pending || 0,
      completed: adminStats?.completed || 0,
      cancelled: adminStats?.cancelled || 0,
    };
  }, [adminStats]);

  // Export functions
  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('Bookings Report', 20, 20);
    
    // Add generation date
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);
    
    // Prepare table data
    const tableData = (bookingsData?.bookings || []).map((booking: BookingMasterView) => [
      `BK${booking.id.toString().padStart(4, '0')}`,
      booking.userName || 'N/A',
      booking.facilityName || booking.groundName || 'N/A',
      new Date(booking.bookingDate).toLocaleDateString(),
      `${booking.startTime} - ${booking.endTime}`,
      (booking.status || booking.bookingStatus).charAt(0).toUpperCase() + (booking.status || booking.bookingStatus).slice(1),
      `₹${parseFloat(booking.totalAmount || '0').toLocaleString()}`,
      booking.paymentStatus?.charAt(0).toUpperCase() + booking.paymentStatus?.slice(1) || 'N/A'
    ]);

    // Add table
    (doc as any).autoTable({
      head: [['Booking ID', 'Customer', 'Facility', 'Date', 'Time', 'Status', 'Amount', 'Payment']],
      body: tableData,
      startY: 50,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });
    
    doc.save('bookings-report.pdf');
  };

  const handleExportExcel = () => {
    const excelData = (bookingsData?.bookings || []).map((booking: BookingMasterView) => ({
      'Booking ID': `BK${booking.id.toString().padStart(4, '0')}`,
      'Customer Name': booking.userName || 'N/A',
      'Customer Email': booking.userEmail || 'N/A',
      'Customer Phone': booking.userPhone || 'N/A',
      'Facility': booking.facilityName || booking.groundName || 'N/A',
      'Booking Date': new Date(booking.bookingDate).toLocaleDateString(),
      'Start Time': booking.startTime,
      'End Time': booking.endTime,
      'Duration': booking.duration ? `${booking.duration} min` : 'Standard',
      'Participants': booking.participantCount || booking.noOfPersons || 1,
      'Plan Type': booking.planType,
      'Booking Type': booking.bookingType,
      'Status': (booking.status || booking.bookingStatus).charAt(0).toUpperCase() + (booking.status || booking.bookingStatus).slice(1),
      'Payment Status': booking.paymentStatus?.charAt(0).toUpperCase() + booking.paymentStatus?.slice(1) || 'N/A',
      'Total Amount': parseFloat(booking.totalAmount || '0').toFixed(2),
      'Paid Amount': parseFloat(booking.paidAmount || '0').toFixed(2),
      'Discount': parseFloat(booking.discountAmount || '0').toFixed(2),
      'Payment Method': booking.paymentMethod || 'N/A',
      'Created Date': new Date(booking.createdAt || booking.createdDate).toLocaleDateString(),
      'Notes': booking.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bookings');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, 'bookings-report.xlsx');
  };
const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  if (isLoading) {
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
      {/* Sidebar for desktop */}
      <AdminSidebar className="hidden lg:block" />

      {/* Sidebar drawer for mobile */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative w-64 bg-white shadow-lg z-50">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Menu</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileSidebarOpen(false)}
              >
                <XCircle className="h-5 w-5" />
              </Button>
            </div>
            <AdminSidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64 p-4 sm:p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Bookings Management
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Manage all facility bookings
              </p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => cancelExpiredMutation.mutate()}
                disabled={cancelExpiredMutation.isPending}
                className="flex items-center gap-2 text-orange-600 hover:text-orange-700"
              >
                <XCircle className="h-4 w-4" />
                {cancelExpiredMutation.isPending ? "Cancelling..." : "Cancel Expired"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendRemindersMutation.mutate()}
                disabled={sendRemindersMutation.isPending}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
              >
                <Bell className="h-4 w-4" />
                {sendRemindersMutation.isPending ? "Sending..." : "Send Reminders"}
              </Button>
              {/* Mobile sidebar toggle */}
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden"
                onClick={() => setMobileSidebarOpen(true)}
              >
                <Building2 className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            <div className="flex-1 relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by booking number, user name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {Object.entries(allBookingsStats).map(([key, value]) => {
              const iconsMap: any = {
                total: Calendar,
                confirmed: CheckCircle,
                pending: AlertCircle,
                completed: CheckCircle,
                cancelled: XCircle,
              };
              const colorsMap: any = {
                total: "text-blue-600",
                confirmed: "text-green-600",
                pending: "text-yellow-600",
                completed: "text-blue-600",
                cancelled: "text-red-600",
              };
              const labelMap: any = {
                total: "Total Bookings",
                confirmed: "Confirmed",
                pending: "Pending",
                completed: "Completed",
                cancelled: "Cancelled",
              };
              const Icon = iconsMap[key];
              return (
                <Card key={key}>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Icon className={`h-8 w-8 ${colorsMap[key]}`} />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">{labelMap[key]}</p>
                        <p className="text-2xl font-bold text-gray-900">{value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Bookings Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              {bookingsLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Booking #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Sport & Ground</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookingsData?.bookings?.map((booking) => (
                        <TableRow key={booking.id} className="hover:bg-gray-50">
                          <TableCell className="font-mono text-sm">
                            BK{booking.id?.toString().padStart(4, "0")}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{booking.userName}</div>
                              <div className="text-sm text-gray-600">{booking.userEmail}</div>
                              {booking.userPhone && (
                                <div className="text-sm text-gray-600">{booking.userPhone}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{booking.facilityName || booking.groundName}</div>
                              <div className="text-sm text-gray-600 flex items-center">
                                <Building2 className="h-3 w-3 mr-1" />
                                Ground {booking.facilityId || booking.groundId}
                              </div>
                              <Badge variant="outline" className="text-xs mt-1">
                                {booking.bookingType}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{booking.planType}</div>
                              <div className="text-sm text-gray-600">
                                {booking.duration ? `${booking.duration} min` : "Standard"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="text-sm">{new Date(booking.bookingDate).toLocaleDateString()}</div>
                              <div className="text-sm text-gray-600">
                                {booking.startTime} - {booking.endTime}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">₹{parseFloat(booking.totalAmount || "0").toLocaleString()}</div>
                              <div className="text-sm text-green-600">Paid: ₹{parseFloat(booking.paidAmount || "0").toLocaleString()}</div>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(booking.status)}</TableCell>
                          <TableCell>{getPaymentStatusBadge(booking.paymentStatus)}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(booking)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}