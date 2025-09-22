import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import AdminSidebar from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  PieChart, 
  Calendar, 
  Users, 
  IndianRupee, 
  TrendingUp, 
  Activity,
  Download,
  Filter,
  FileText,
  FileSpreadsheet,
  Printer
} from "lucide-react";
import {
  exportRevenueToPDF,
  exportRevenueBysportToPDF,
  exportFacilityUsageToPDF,
  exportMemberBookingsToPDF,
  exportMemberPaymentsToPDF,
  exportCouponUsageToPDF,
  exportRevenueToExcel,
  exportRevenueBySportToExcel,
  exportFacilityUsageToExcel,
  exportMemberBookingsToExcel,
  exportMemberPaymentsToExcel,
  exportCouponUsageToExcel,
  printRevenue,
  printRevenueBySport,
  printFacilityUsage,
  printMemberBookings,
  printMemberPayments,
  printCouponUsage
} from "@/lib/exportUtils";

interface ReportFilters {
  period: 'day' | 'week' | 'month';
  startDate: string;
  endDate: string;
  userId?: string;
}

export default function AdminReports() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<ReportFilters>({
    period: 'month',
    startDate: '',
    endDate: '',
  });

  // Revenue Report
  const { data: revenueReport = [], isLoading: revenueLoading } = useQuery({
    queryKey: [`/api/admin/reports/revenue?period=${filters.period}&startDate=${filters.startDate}&endDate=${filters.endDate}`],
    enabled: !!user && user.role === 'admin',
  });

  // Debug logging
  console.log('Reports Debug:', {
    revenueReport,
    revenueLoading,
    user: user?.role,
    filters
  });

  // Revenue by Sport Report
  const { data: revenueBySportReport = [], isLoading: revenueBySportLoading } = useQuery({
    queryKey: [`/api/admin/reports/revenue-by-sport?period=${filters.period}&startDate=${filters.startDate}&endDate=${filters.endDate}`],
    enabled: !!user && user.role === 'admin',
  });

  // Facility Usage Report
  const { data: facilityUsageReport = [], isLoading: facilityUsageLoading } = useQuery({
    queryKey: [`/api/admin/reports/facility-usage?period=${filters.period}&startDate=${filters.startDate}&endDate=${filters.endDate}`],
    enabled: !!user && user.role === 'admin',
  });

  // Member Booking Report
  const { data: memberBookingReport = [], isLoading: memberBookingLoading } = useQuery({
    queryKey: [`/api/admin/reports/member-bookings?userId=${filters.userId || ''}&startDate=${filters.startDate}&endDate=${filters.endDate}`],
    enabled: !!user && user.role === 'admin',
  });

  // Member Payment Report
  const { data: memberPaymentReport = [], isLoading: memberPaymentLoading } = useQuery({
    queryKey: [`/api/admin/reports/member-payments?userId=${filters.userId || ''}&startDate=${filters.startDate}&endDate=${filters.endDate}`],
    enabled: !!user && user.role === 'admin',
  });

  // Coupon Usage Report
  const { data: couponUsageReport = [], isLoading: couponUsageLoading } = useQuery({
    queryKey: [`/api/admin/reports/coupon-usage?startDate=${filters.startDate}&endDate=${filters.endDate}`],
    enabled: !!user && user.role === 'admin',
  });

  const formatCurrency = (amount: string | number) => {
    return `₹${Number(amount).toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const FilterSection = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Report Filters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="period">Time Period</Label>
            <Select value={filters.period} onValueChange={(value) => setFilters({ ...filters, period: value as 'day' | 'week' | 'month' })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Daily</SelectItem>
                <SelectItem value="week">Weekly</SelectItem>
                <SelectItem value="month">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="userId">Specific User (Optional)</Label>
            <Input
              id="userId"
              placeholder="Enter user ID"
              value={filters.userId || ''}
              onChange={(e) => setFilters({ ...filters, userId: e.target.value || undefined })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
  {/* Sidebar */}
  <div className="lg:w-64  lg:block ">
    <AdminSidebar />
  </div>
  {/* Mobile Sidebar Toggle (Optional) */}
  {/* <div className="lg:hidden p-4">
    <button
      className="text-gray-600 focus:outline-none"
     
    >
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
      </svg>
    </button>
  </div> */}

  <div className="flex-1 p-4 sm:p-6 lg:p-8">
    <div className="mb-6 sm:mb-8">
      <h1 className="text-2xl sm:text-3xl font-bold">Reports & Analytics</h1>
      <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
        Comprehensive business insights and performance metrics
      </p>
    </div>

    <FilterSection />

    {/* Summary Stats */}
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center">
            <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {facilityUsageReport.reduce((sum, row) => sum + Number(row.total_bookings || 0), 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center">
            <IndianRupee className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Transactions</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {revenueReport.reduce((sum, row) => sum + Number(row.transaction_count || 0), 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center">
            <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Revenue Collected</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {formatCurrency(revenueReport.reduce((sum, row) => sum + Number(row.total_revenue || 0), 0))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center">
            <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Pending Payments</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {memberPaymentReport.filter(row => row.payment_status === 'pending').length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Explanation Card */}
    <Card className="mb-6 bg-blue-50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="bg-blue-500 rounded-full p-1">
            <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h4 className="font-medium text-blue-900 text-sm sm:text-base">Report Numbers Explained</h4>
            <p className="text-xs sm:text-sm text-blue-700 mt-1">
              <strong>Total Bookings:</strong> All reservations made by customers. <br />
              <strong>Total Transactions:</strong> Actual payments received for bookings. <br />
              <strong>Pending Payments:</strong> Bookings created but payment not yet processed.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Tabs defaultValue="revenue" className="space-y-6">
      <TabsList className="grid grid-cols-3 sm:grid-cols-5 gap-2 w-full overflow-x-auto">
        <TabsTrigger value="revenue" className="flex items-center gap-2 text-xs sm:text-sm">
          <IndianRupee className="h-4 w-4" />
          Revenue
        </TabsTrigger>
        <TabsTrigger value="facility" className="flex items-center gap-2 text-xs sm:text-sm">
          <Activity className="h-4 w-4" />
          Facility Usage
        </TabsTrigger>
        <TabsTrigger value="members" className="flex items-center gap-2 text-xs sm:text-sm">
          <Users className="h-4 w-4" />
          Member Reports
        </TabsTrigger>
        <TabsTrigger value="payments" className="flex items-center gap-2 text-xs sm:text-sm">
          <BarChart className="h-4 w-4" />
          Payment Analysis
        </TabsTrigger>
        <TabsTrigger value="coupons" className="flex items-center gap-2 text-xs sm:text-sm">
          <PieChart className="h-4 w-4" />
          Coupon Usage
        </TabsTrigger>
      </TabsList>

      {/* Revenue Reports Tab */}
      <TabsContent value="revenue">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Overall Revenue Report */}
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Revenue Trends
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => printRevenue(revenueReport, 'Revenue Trends Report')}
                    disabled={revenueReport.length === 0}
                  >
                    <Printer className="h-4 w-4 mr-1" />
                    Print
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => exportRevenueToPDF(revenueReport, 'Revenue Trends Report')}
                    disabled={revenueReport.length === 0}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => exportRevenueToExcel(revenueReport, 'Revenue Trends Report')}
                    disabled={revenueReport.length === 0}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-1" />
                    Excel
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {revenueLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                  <p>Loading revenue data...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">Period</TableHead>
                        <TableHead className="text-xs sm:text-sm">Transactions</TableHead>
                        <TableHead className="text-xs sm:text-sm">Total Revenue</TableHead>
                        <TableHead className="text-xs sm:text-sm">Avg Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {revenueReport.map((row: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium text-xs sm:text-sm">{row.period_label}</TableCell>
                          <TableCell className="text-xs sm:text-sm">{row.transaction_count}</TableCell>
                          <TableCell className="text-green-600 font-semibold text-xs sm:text-sm">
                            {formatCurrency(row.total_revenue)}
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm">{formatCurrency(row.avg_transaction_value)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue by Sport Report */}
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-blue-500" />
                  Revenue by Sport
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => printRevenueBySport(revenueBySportReport, 'Revenue by Sport Report')}
                    disabled={revenueBySportReport.length === 0}
                  >
                    <Printer className="h-4 w-4 mr-1" />
                    Print
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => exportRevenueBysportToPDF(revenueBySportReport, 'Revenue by Sport Report')}
                    disabled={revenueBySportReport.length === 0}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => exportRevenueBySportToExcel(revenueBySportReport, 'Revenue by Sport Report')}
                    disabled={revenueBySportReport.length === 0}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-1" />
                    Excel
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {revenueBySportLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                  <p>Loading sport revenue data...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">Sport</TableHead>
                        <TableHead className="text-xs sm:text-sm">Period</TableHead>
                        <TableHead className="text-xs sm:text-sm">Revenue</TableHead>
                        <TableHead className="text-xs sm:text-sm">Transactions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {revenueBySportReport.map((row: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium text-xs sm:text-sm">{row.sport_name}</TableCell>
                          <TableCell className="text-xs sm:text-sm">{row.period_label}</TableCell>
                          <TableCell className="text-green-600 font-semibold text-xs sm:text-sm">
                            {formatCurrency(row.total_revenue)}
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm">{row.transaction_count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Facility Usage Tab */}
      <TabsContent value="facility">
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-500" />
                Facility Usage Statistics
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => printFacilityUsage(facilityUsageReport, 'Facility Usage Report')}
                  disabled={facilityUsageReport.length === 0}
                >
                  <Printer className="h-4 w-4 mr-1" />
                  Print
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportFacilityUsageToPDF(facilityUsageReport, 'Facility Usage Report')}
                  disabled={facilityUsageReport.length === 0}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  PDF
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportFacilityUsageToExcel(facilityUsageReport, 'Facility Usage Report')}
                  disabled={facilityUsageReport.length === 0}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-1" />
                  Excel
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {facilityUsageLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p>Loading facility usage data...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Sport</TableHead>
                      <TableHead className="text-xs sm:text-sm">Ground</TableHead>
                      <TableHead className="text-xs sm:text-sm">Period</TableHead>
                      <TableHead className="text-xs sm:text-sm">Total Bookings</TableHead>
                      <TableHead className="text-xs sm:text-sm">Participants</TableHead>
                      <TableHead className="text-xs sm:text-sm">Confirmed</TableHead>
                      <TableHead className="text-xs sm:text-sm">Utilization</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facilityUsageReport.map((row: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium text-xs sm:text-sm">{row.sport_name}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{row.ground_name}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{row.period_label}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{row.total_bookings}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{row.total_participants}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{row.confirmed_bookings}</TableCell>
                        <TableCell>
                          <Badge variant={Number(row.utilization_rate) > 70 ? "default" : "secondary"} className="text-xs sm:text-sm">
                            {row.utilization_rate}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Member Reports Tab */}
      <TabsContent value="members">
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-500" />
                Member Booking Analytics
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => printMemberBookings(memberBookingReport, 'Member Booking Report')}
                  disabled={memberBookingReport.length === 0}
                >
                  <Printer className="h-4 w-4 mr-1" />
                  Print
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportMemberBookingsToPDF(memberBookingReport, 'Member Booking Report')}
                  disabled={memberBookingReport.length === 0}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  PDF
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportMemberBookingsToExcel(memberBookingReport, 'Member Booking Report')}
                  disabled={memberBookingReport.length === 0}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-1" />
                  Excel
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {memberBookingLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p>Loading member booking data...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Member</TableHead>
                      <TableHead className="text-xs sm:text-sm">Email</TableHead>
                      <TableHead className="text-xs sm:text-sm">Total Bookings</TableHead>
                      <TableHead className="text-xs sm:text-sm">Booking Value</TableHead>
                      <TableHead className="text-xs sm:text-sm">Confirmed</TableHead>
                      <TableHead className="text-xs sm:text-sm">Sports Played</TableHead>
                      <TableHead className="text-xs sm:text-sm">Member Since</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {memberBookingReport.map((row: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium text-xs sm:text-sm">
                          {row.first_name} {row.last_name}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">{row.email}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{row.total_bookings}</TableCell>
                        <TableCell className="text-green-600 font-semibold text-xs sm:text-sm">
                          {formatCurrency(row.total_booking_value)}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">{row.confirmed_bookings}</TableCell>
                        <TableCell className="max-w-24 sm:max-w-32 truncate text-xs sm:text-sm">
                          {row.sports_played}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">{formatDate(row.first_booking_date)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Payment Analysis Tab */}
      <TabsContent value="payments">
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BarChart className="h-5 w-5 text-red-500" />
                Member Payment Analysis
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => printMemberPayments(memberPaymentReport, 'Member Payment Analysis')}
                  disabled={memberPaymentReport.length === 0}
                >
                  <Printer className="h-4 w-4 mr-1" />
                  Print
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportMemberPaymentsToPDF(memberPaymentReport, 'Member Payment Analysis')}
                  disabled={memberPaymentReport.length === 0}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  PDF
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportMemberPaymentsToExcel(memberPaymentReport, 'Member Payment Analysis')}
                  disabled={memberPaymentReport.length === 0}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-1" />
                  Excel
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {memberPaymentLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p>Loading payment analysis...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Member</TableHead>
                      <TableHead className="text-xs sm:text-sm">Email</TableHead>
                      <TableHead className="text-xs sm:text-sm">Total Paid</TableHead>
                      <TableHead className="text-xs sm:text-sm">Cash</TableHead>
                      <TableHead className="text-xs sm:text-sm">UPI</TableHead>
                      <TableHead className="text-xs sm:text-sm">Card</TableHead>
                      <TableHead className="text-xs sm:text-sm">Bank Transfer</TableHead>
                      <TableHead className="text-xs sm:text-sm">Avg Payment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {memberPaymentReport.map((row: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium text-xs sm:text-sm">
                          {row.first_name} {row.last_name}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">{row.email}</TableCell>
                        <TableCell className="text-green-600 font-semibold text-xs sm:text-sm">
                          {formatCurrency(row.total_paid)}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">{formatCurrency(row.cash_payments)}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{formatCurrency(row.upi_payments)}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{formatCurrency(row.card_payments)}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{formatCurrency(row.bank_transfer_payments)}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{formatCurrency(row.avg_payment_amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Coupon Usage Tab */}
      <TabsContent value="coupons">
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-indigo-500" />
                Coupon Usage Report
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => printCouponUsage(couponUsageReport, 'Coupon Usage Report')}
                >
                  <Printer className="h-4 w-4 mr-1" />
                  Print
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportCouponUsageToPDF(couponUsageReport, 'Coupon Usage Report')}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  PDF
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportCouponUsageToExcel(couponUsageReport, 'Coupon Usage Report')}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-1" />
                  Excel
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {couponUsageLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p>Loading coupon usage data...</p>
              </div>
            ) : couponUsageReport.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <PieChart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No coupon usage data found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Coupon Code</TableHead>
                      <TableHead className="text-xs sm:text-sm">Discount Type</TableHead>
                      <TableHead className="text-xs sm:text-sm">Discount Value</TableHead>
                      <TableHead className="text-xs sm:text-sm">Times Used</TableHead>
                      <TableHead className="text-xs sm:text-sm">Total Discount Given</TableHead>
                      <TableHead className="text-xs sm:text-sm">Booking Value</TableHead>
                      <TableHead className="text-xs sm:text-sm">Discount %</TableHead>
                      <TableHead className="text-xs sm:text-sm">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {couponUsageReport.map((row: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium text-xs sm:text-sm">{row.coupon_code}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs sm:text-sm">
                            {row.discount_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          {row.discount_type === 'percentage' ? `${row.discount_value}%` : formatCurrency(row.discount_value)}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">{row.total_bookings_used}</TableCell>
                        <TableCell className="text-red-600 font-semibold text-xs sm:text-sm">
                          -{formatCurrency(row.total_discount_given)}
                        </TableCell>
                        <TableCell className="text-green-600 text-xs sm:text-sm">
                          {formatCurrency(row.total_booking_value)}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">{row.discount_percentage}%</TableCell>
                        <TableCell>
                          <Badge variant={row.used_count >= row.max_uses ? "destructive" : "default"} className="text-xs sm:text-sm">
                            {row.used_count >= row.max_uses ? "Expired" : "Active"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
</div>
  );
}