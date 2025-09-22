import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/NotFound";
import Landing from "@/pages/landing";
import Login from "@/pages/login";

import Home from "@/pages/home";
import Facilities from "@/pages/facilities";
import Booking from "@/pages/booking";
import EnhancedBooking from "@/pages/EnhancedBooking";
import Profile from "@/pages/profile";
import TestPaymentHistory from "@/pages/TestPaymentHistory";
import Payment from "@/pages/Payment";
import PaymentPage from "@/pages/PaymentPage";
import PendingPayments from "@/pages/PendingPayments";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminSports from "@/pages/admin/sports";
import AdminGrounds from "@/pages/admin/grounds";
import AdminPlans from "@/pages/admin/plans";
import AdminTimeSlots from "@/pages/admin/timeslots";
import AdminFacilities from "@/pages/admin/facilities";
import AdminBookings from "@/pages/admin/bookings";
import AdminUsers from "@/pages/admin/users";
import AdminPayments from "@/pages/admin/payments";
import AdminReports from "@/pages/admin/reports";
import NotificationManagement from "@/pages/admin/NotificationManagement";
import UserDashboard from "@/pages/user/Dashboard";


function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Don't show loading spinner for unauthenticated users - just show the landing page
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/login" component={Login} />
          <Route path="/facilities" component={Facilities} />
          <Route path="/booking/:facilityId?" component={Booking} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/dashboard" component={UserDashboard} />
          <Route path="/facilities" component={Facilities} />
          <Route path="/booking/:facilityId?" component={Booking} />
          <Route path="/enhanced-booking" component={EnhancedBooking} />
          <Route path="/profile" component={Profile} />
          <Route path="/payment/:bookingId" component={PaymentPage} />
          <Route path="/pending-payments" component={PendingPayments} />
          
          <Route path="/test-payment-history" component={TestPaymentHistory} />
          
          {/* Admin routes */}
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <>
              <Route path="/admin" component={AdminDashboard} />
              <Route path="/admin/sports" component={AdminSports} />
              <Route path="/admin/grounds" component={AdminGrounds} />
              <Route path="/admin/plans" component={AdminPlans} />
              <Route path="/admin/timeslots" component={AdminTimeSlots} />
              <Route path="/admin/facilities" component={AdminFacilities} />
              <Route path="/admin/bookings" component={AdminBookings} />
              <Route path="/admin/users" component={AdminUsers} />
              <Route path="/admin/payments" component={AdminPayments} />
              <Route path="/admin/reports" component={AdminReports} />
              <Route path="/admin/notifications" component={NotificationManagement} />
            </>
          )}
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
