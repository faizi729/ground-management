import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import AdminSidebar from "@/components/AdminSidebar";
import { MockPaymentForm } from "@/components/MockPaymentForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  IndianRupee, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Plus,
  User,
  Calendar,
  Building2,
  Download,
  FileText,
  FileSpreadsheet,
  Printer,
  Eye,
  Receipt,
  History
} from "lucide-react";
import { exportPaymentsToPDF, exportPaymentsToExcel, printPayments } from "@/lib/exportUtils";
import { PaymentHistoryModal } from "@/components/PaymentHistoryModal";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface Payment {
  id: number;
  bookingId: number;
  userId: string;
  amount: string;
  paymentMethod: string;
  transactionId?: string;
  status: string;
  discountAmount?: string;
  discountReason?: string;
  processedAt?: string;
  createdAt: string;
  userName: string;
  userEmail: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
}

interface PendingPayment {
  id: number;
  userId: string;
  groundId: number;
  bookingType: string;
  planType: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  participantCount: number;
  totalAmount: string;
  paidAmount?: string;
  discountAmount?: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  createdAt: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  groundName: string;
  sportName: string;
  pendingAmount: number;
}

// Export functions for pending payments
const exportPendingPaymentsToPDF = (data: PendingPayment[]) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text('Pending Payments Report', 20, 20);
  
  // Add generation date
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 20, 30);
  
  // Prepare table data
  const tableData = data.map(payment => [
    payment.id.toString(),
    payment.userName,
    payment.groundName,
    new Date(payment.bookingDate).toLocaleDateString(),
    `${payment.startTime} - ${payment.endTime}`,
    `₹${Number(payment.totalAmount).toLocaleString()}`,
    `₹${payment.pendingAmount.toLocaleString()}`,
    payment.paymentStatus.charAt(0).toUpperCase() + payment.paymentStatus.slice(1)
  ]);
  
  // Add table
  autoTable(doc, {
    head: [['ID', 'Customer', 'Facility', 'Date', 'Time', 'Total', 'Pending', 'Status']],
    body: tableData,
    startY: 40,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] }
  });
  
  doc.save('pending-payments-report.pdf');
};

const exportPendingPaymentsToExcel = (data: PendingPayment[]) => {
  const worksheetData = data.map(payment => ({
    'Booking ID': payment.id,
    'Customer': payment.userName,
    'Email': payment.userEmail,
    'Facility': payment.groundName,
    'Sport': payment.sportName,
    'Date': new Date(payment.bookingDate).toLocaleDateString(),
    'Time': `${payment.startTime} - ${payment.endTime}`,
    'Total Amount': Number(payment.totalAmount),
    'Pending Amount': payment.pendingAmount,
    'Payment Status': payment.paymentStatus,
    'Created': new Date(payment.createdAt).toLocaleDateString()
  }));
  
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pending Payments');
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const data_blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(data_blob, 'pending-payments-report.xlsx');
};

const printPendingPayments = (data: PendingPayment[]) => {
  const printContent = `
    <html>
      <head>
        <title>Pending Payments Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #1f2937; margin-bottom: 10px; }
          .meta { color: #6b7280; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
          th { background-color: #f3f4f6; font-weight: bold; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <h1>Pending Payments Report</h1>
        <div class="meta">Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>Facility</th>
              <th>Date</th>
              <th>Time</th>
              <th>Total</th>
              <th>Pending</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(payment => `
              <tr>
                <td>${payment.id}</td>
                <td>${payment.userName}</td>
                <td>${payment.groundName}</td>
                <td>${new Date(payment.bookingDate).toLocaleDateString()}</td>
                <td>${payment.startTime} - ${payment.endTime}</td>
                <td>₹${Number(payment.totalAmount).toLocaleString()}</td>
                <td>₹${payment.pendingAmount.toLocaleString()}</td>
                <td>${payment.paymentStatus.charAt(0).toUpperCase() + payment.paymentStatus.slice(1)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;
  
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  }
};

// Export functions for all payments
const exportAllPaymentsToPDF = (data: Payment[]) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text('All Payments Report', 20, 20);
  
  // Add generation date
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 20, 30);
  
  // Prepare table data
  const tableData = data.map(payment => [
    payment.id.toString(),
    payment.bookingId.toString(),
    payment.userName,
    `₹${Number(payment.amount).toLocaleString()}`,
    payment.paymentMethod,
    payment.transactionId || 'N/A',
    payment.status.charAt(0).toUpperCase() + payment.status.slice(1),
    new Date(payment.createdAt).toLocaleDateString()
  ]);
  
  // Add table
  autoTable(doc, {
    head: [['Payment ID', 'Booking ID', 'Customer', 'Amount', 'Method', 'Transaction ID', 'Status', 'Date']],
    body: tableData,
    startY: 40,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] }
  });
  
  doc.save('all-payments-report.pdf');
};

const exportAllPaymentsToExcel = (data: Payment[]) => {
  const worksheetData = data.map(payment => ({
    'Payment ID': payment.id,
    'Booking ID': payment.bookingId,
    'Customer': payment.userName,
    'Email': payment.userEmail,
    'Amount': Number(payment.amount),
    'Payment Method': payment.paymentMethod,
    'Transaction ID': payment.transactionId || '',
    'Status': payment.status,
    'Discount Amount': Number(payment.discountAmount || 0),
    'Discount Reason': payment.discountReason || '',
    'Processed At': payment.processedAt ? new Date(payment.processedAt).toLocaleDateString() : '',
    'Created': new Date(payment.createdAt).toLocaleDateString()
  }));
  
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'All Payments');
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const data_blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(data_blob, 'all-payments-report.xlsx');
};

const printAllPayments = (data: Payment[]) => {
  const printContent = `
    <html>
      <head>
        <title>All Payments Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #1f2937; margin-bottom: 10px; }
          .meta { color: #6b7280; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
          th { background-color: #f3f4f6; font-weight: bold; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <h1>All Payments Report</h1>
        <div class="meta">Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
        <table>
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>Booking ID</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Transaction ID</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(payment => `
              <tr>
                <td>${payment.id}</td>
                <td>${payment.bookingId}</td>
                <td>${payment.userName}</td>
                <td>₹${Number(payment.amount).toLocaleString()}</td>
                <td>${payment.paymentMethod}</td>
                <td>${payment.transactionId || 'N/A'}</td>
                <td>${payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}</td>
                <td>${new Date(payment.createdAt).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;
  
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  }
};

export default function AdminPayments() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [collectDialogOpen, setCollectDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<PendingPayment | null>(null);
  
  // Filtering and sorting state
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<string>("desc");

  // Fetch all payments
  const { data: payments = [], isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ["/api/admin/payments"],
    enabled: !!user && user.role === 'admin',
  });

  // Fetch pending payments
  const { data: pendingPayments = [], isLoading: pendingLoading } = useQuery<PendingPayment[]>({
    queryKey: ["/api/admin/pending-payments"],
    enabled: !!user && user.role === 'admin',
  });

  // Filter and sort payments  
  const filteredPayments = payments.filter(payment => {
    if (statusFilter !== "all" && payment.status !== statusFilter) return false;
    if (methodFilter !== "all" && payment.paymentMethod !== methodFilter) return false;
    return true;
  }).sort((a, b) => {
    let aValue: string | number, bValue: string | number;
    
    switch (sortBy) {
      case "amount":
        aValue = Number(a.amount);
        bValue = Number(b.amount);
        break;
      case "date":
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      case "status":
        aValue = a.status;
        bValue = b.status;
        break;
      default:
        aValue = a.id;
        bValue = b.id;
    }
    
    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Calculate summary statistics - only count completed payments to match dashboard and reports
  const totalRevenue = payments.reduce((sum, payment) => 
    sum + (payment.status === 'completed' ? Number(payment.amount) : 0), 0
  );
  
  const pendingAmount = pendingPayments.reduce((sum, payment) => 
    sum + payment.pendingAmount, 0
  );
  
  const totalDiscounts = payments.reduce((sum, payment) => 
    sum + Number(payment.discountAmount || 0), 0
  );



  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
      completed: { color: "bg-green-100 text-green-800", icon: <CheckCircle className="h-3 w-3" /> },
      paid: { color: "bg-green-100 text-green-800", icon: <CheckCircle className="h-3 w-3" /> },
      pending: { color: "bg-yellow-100 text-yellow-800", icon: <Clock className="h-3 w-3" /> },
      failed: { color: "bg-red-100 text-red-800", icon: <XCircle className="h-3 w-3" /> },
      partial: { color: "bg-orange-100 text-orange-800", icon: <AlertCircle className="h-3 w-3" /> },
      refunded: { color: "bg-blue-100 text-blue-800", icon: <AlertCircle className="h-3 w-3" /> },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatCurrency = (amount: string | number) => {
    return `₹${Number(amount).toLocaleString()}`;
  };

  return (
   <div className="flex min-h-screen bg-gray-50">
  {/* Sidebar - Hidden on mobile, shown on desktop */}
  <div className=" lg:block lg:w-64">
    <AdminSidebar />
  </div>
  
  {/* Mobile sidebar overlay would go here if needed */}
  
  <div className="flex-1 p-4 lg:p-8">
    <div className="mb-6 lg:mb-8">
      <h1 className="text-2xl lg:text-3xl font-bold">Payments Management</h1>
      <p className="text-gray-600 mt-2 text-sm lg:text-base">Manage all payments and collect pending amounts</p>
    </div>

    {/* Summary Cards */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6 lg:mb-8">
      <Card>
        <CardContent className="p-3 lg:p-6">
          <div className="flex items-center">
            <CheckCircle className="h-6 w-6 lg:h-8 lg:w-8 text-green-500" />
            <div className="ml-2 lg:ml-4">
              <p className="text-xs lg:text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-lg lg:text-2xl font-bold text-green-600">₹{totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-3 lg:p-6">
          <div className="flex items-center">
            <Clock className="h-6 w-6 lg:h-8 lg:w-8 text-orange-500" />
            <div className="ml-2 lg:ml-4">
              <p className="text-xs lg:text-sm font-medium text-gray-600">Outstanding Amount</p>
              <p className="text-lg lg:text-2xl font-bold text-orange-600">₹{pendingAmount.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-3 lg:p-6">
          <div className="flex items-center">
            <IndianRupee className="h-6 w-6 lg:h-8 lg:w-8 text-blue-500" />
            <div className="ml-2 lg:ml-4">
              <p className="text-xs lg:text-sm font-medium text-gray-600">Total Discounts</p>
              <p className="text-lg lg:text-2xl font-bold text-blue-600">₹{totalDiscounts.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-3 lg:p-6">
          <div className="flex items-center">
            <CreditCard className="h-6 w-6 lg:h-8 lg:w-8 text-purple-500" />
            <div className="ml-2 lg:ml-4">
              <p className="text-xs lg:text-sm font-medium text-gray-600">Total Payments</p>
              <p className="text-lg lg:text-2xl font-bold text-purple-600">{payments.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <Tabs defaultValue="pending" className="space-y-4 lg:space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="pending" className="text-xs lg:text-sm">
          Pending ({pendingPayments.length})
        </TabsTrigger>
        <TabsTrigger value="completed" className="text-xs lg:text-sm">
          All Payments ({filteredPayments.length}/{payments.length})
        </TabsTrigger>
      </TabsList>

      {/* Pending Payments Tab */}
      <TabsContent value="pending">
        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                Pending Payments
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => printPendingPayments(pendingPayments)}
                  className="flex items-center gap-2 flex-1 lg:flex-initial"
                  disabled={pendingPayments.length === 0}
                >
                  <Printer className="h-4 w-4" />
                  <span className="hidden sm:inline">Print</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportPendingPaymentsToPDF(pendingPayments)}
                  className="flex items-center gap-2 flex-1 lg:flex-initial"
                  disabled={pendingPayments.length === 0}
                >
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">PDF</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportPendingPaymentsToExcel(pendingPayments)}
                  className="flex items-center gap-2 flex-1 lg:flex-initial"
                  disabled={pendingPayments.length === 0}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span className="hidden sm:inline">Excel</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {pendingLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p>Loading pending payments...</p>
              </div>
            ) : pendingPayments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p>No pending payments found!</p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="lg:hidden space-y-4">
                  {pendingPayments.map((booking: PendingPayment) => (
                    <Card key={booking.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">#{booking.id}</div>
                            <div className="text-sm text-gray-500">{booking.userName}</div>
                            <div className="text-xs text-gray-400">{booking.userEmail}</div>
                          </div>
                          {getStatusBadge(booking.paymentStatus)}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Facility:</span>
                            <span className="text-sm font-medium">{booking.groundName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Sport:</span>
                            <span className="text-sm font-medium">{booking.sportName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Date:</span>
                            <span className="text-sm font-medium">
                              {new Date(booking.bookingDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Time:</span>
                            <span className="text-sm font-medium">
                              {booking.startTime} - {booking.endTime}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Total:</span>
                            <span className="text-sm font-medium">{formatCurrency(booking.totalAmount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Pending:</span>
                            <span className="text-sm font-bold text-orange-600">
                              {formatCurrency(booking.pendingAmount)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setCollectDialogOpen(true);
                            }}
                            className="bg-green-600 hover:bg-green-700 flex-1"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Collect
                          </Button>
                          <PaymentHistoryModal bookingId={booking.id} />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Booking ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Facility</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Pending Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingPayments.map((booking: PendingPayment) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium">#{booking.id}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{booking.userName}</div>
                              <div className="text-sm text-gray-500">{booking.userEmail}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{booking.groundName}</div>
                              <div className="text-sm text-gray-500">{booking.sportName}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {new Date(booking.bookingDate).toLocaleDateString()}
                              </div>
                              <div className="text-sm text-gray-500">
                                {booking.startTime} - {booking.endTime}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrency(booking.totalAmount)}</TableCell>
                          <TableCell className="font-medium text-orange-600">
                            {formatCurrency(booking.pendingAmount)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(booking.paymentStatus)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedBooking(booking);
                                  setCollectDialogOpen(true);
                                }}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Collect
                              </Button>
                              <PaymentHistoryModal bookingId={booking.id} />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* All Payments Tab */}
      <TabsContent value="completed">
        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-500" />
                All Payments
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => printPayments(payments, "All Payments Report")}
                  className="flex items-center gap-2 flex-1 lg:flex-initial"
                  disabled={payments.length === 0}
                >
                  <Printer className="h-4 w-4" />
                  <span className="hidden sm:inline">Print</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportPaymentsToPDF(payments, "All Payments Report")}
                  className="flex items-center gap-2 flex-1 lg:flex-initial"
                  disabled={payments.length === 0}
                >
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">PDF</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportPaymentsToExcel(payments, "All Payments Report")}
                  className="flex items-center gap-2 flex-1 lg:flex-initial"
                  disabled={payments.length === 0}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span className="hidden sm:inline">Excel</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          
          {/* Filter Controls */}
          <div className="px-4 lg:px-6 py-4 border-b">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="status-filter" className="text-sm">Filter by Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status-filter" className="mt-1">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="method-filter" className="text-sm">Filter by Method</Label>
                <Select value={methodFilter} onValueChange={setMethodFilter}>
                  <SelectTrigger id="method-filter" className="mt-1">
                    <SelectValue placeholder="All Methods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="sort-by" className="text-sm">Sort by</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger id="sort-by" className="mt-1">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="amount">Amount</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="id">Payment ID</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="sort-order" className="text-sm">Order</Label>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger id="sort-order" className="mt-1">
                    <SelectValue placeholder="Order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Newest First</SelectItem>
                    <SelectItem value="asc">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <CardContent>
            {paymentsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p>Loading payments...</p>
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CreditCard className="h-12 w-12 mx-auto mb-4" />
                <p>No payments found!</p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="lg:hidden space-y-4">
                  {filteredPayments.map((payment: Payment) => (
                    <Card key={payment.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">#{payment.id}</div>
                            <div className="text-sm text-gray-500">Booking #{payment.bookingId}</div>
                            <div className="text-sm text-gray-500">{payment.userName}</div>
                            <div className="text-xs text-gray-400">{payment.userEmail}</div>
                          </div>
                          {getStatusBadge(payment.status)}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Amount:</span>
                            <div className="text-right">
                              <span className="text-sm font-medium">{formatCurrency(payment.amount)}</span>
                              {payment.discountAmount && Number(payment.discountAmount) > 0 && (
                                <div className="text-xs text-green-600">
                                  Discount: {formatCurrency(payment.discountAmount)}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Method:</span>
                            <span className="text-sm font-medium capitalize">{payment.paymentMethod}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Transaction ID:</span>
                            <span className="text-xs font-mono">{payment.transactionId || '-'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Date:</span>
                            <span className="text-sm font-medium">
                              {new Date(payment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/api/receipts/${payment.id}/preview`, '_blank')}
                            className="flex-1 flex items-center justify-center gap-1"
                            title="View Receipt"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/api/receipts/${payment.id}/pdf`, '_blank')}
                            className="flex-1 flex items-center justify-center gap-1"
                            title="Download Receipt PDF"
                          >
                            <Receipt className="h-4 w-4" />
                            PDF
                          </Button>
                          <PaymentHistoryModal bookingId={payment.bookingId} />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Payment ID</TableHead>
                        <TableHead>Booking ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.map((payment: Payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">#{payment.id}</TableCell>
                          <TableCell>#{payment.bookingId}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{payment.userName}</div>
                              <div className="text-sm text-gray-500">{payment.userEmail}</div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(payment.amount)}
                            {payment.discountAmount && Number(payment.discountAmount) > 0 && (
                              <div className="text-xs text-green-600">
                                Discount: {formatCurrency(payment.discountAmount)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="capitalize">{payment.paymentMethod}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {payment.transactionId || '-'}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(payment.status)}
                          </TableCell>
                          <TableCell>
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(`/api/receipts/${payment.id}/preview`, '_blank')}
                                className="flex items-center gap-1"
                                title="View Receipt"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(`/api/receipts/${payment.id}/pdf`, '_blank')}
                                className="flex items-center gap-1"
                                title="Download Receipt PDF"
                              >
                                <Receipt className="h-4 w-4" />
                              </Button>
                              <PaymentHistoryModal bookingId={payment.bookingId} />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>

    {/* Unified Payment Dialog */}
    <Dialog open={collectDialogOpen} onOpenChange={setCollectDialogOpen}>
      <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle className="text-lg lg:text-xl">
            Collect Payment - Booking #{selectedBooking?.id}
          </DialogTitle>
        </DialogHeader>
        {selectedBooking && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Booking Summary */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Booking Details</h3>
              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Booking ID:</span>
                  <span className="font-medium">#{selectedBooking.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Customer:</span>
                  <span className="font-medium">{selectedBooking.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Email:</span>
                  <span className="font-medium text-right break-all">{selectedBooking.userEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Facility:</span>
                  <span className="font-medium text-right">{selectedBooking.groundName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Sport:</span>
                  <span className="font-medium">{selectedBooking.sportName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Date & Time:</span>
                  <span className="font-medium text-right">
                    {new Date(selectedBooking.bookingDate).toLocaleDateString()} 
                    <br />
                    {selectedBooking.startTime} - {selectedBooking.endTime}
                  </span>
                </div>
                <hr />
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Amount:</span>
                  <span className="font-medium">{formatCurrency(selectedBooking.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Amount Paid:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency((parseFloat(selectedBooking.totalAmount) - selectedBooking.pendingAmount).toString())}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pending Amount:</span>
                  <span className="font-bold text-orange-600">
                    {formatCurrency(selectedBooking.pendingAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Unified Payment Form */}
            <div>
              <MockPaymentForm
                bookingId={selectedBooking.id}
                amount={selectedBooking.pendingAmount}
                currency="INR"
                onSuccess={() => {
                  setCollectDialogOpen(false);
                  // Refresh data
                  queryClient.invalidateQueries({ queryKey: ["/api/admin/payments"] });
                  queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-payments"] });
                }}
                onCancel={() => setCollectDialogOpen(false)}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  </div>
</div>
  );
}