import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Calendar, Clock, Users, MapPin, CreditCard, Smartphone, Building2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { MockPaymentForm } from '@/components/MockPaymentForm';

interface BookingDetails {
  id: number;
  facilityName: string;
  facilityType: string;
  startDate: string;
  endDate: string;
  participantCount: number;
  totalAmount: number;
  paidAmount: number;
  discountAmount: number;
  paymentStatus: string;
  planType: string;
  groundLocation?: string;
  bookingType: string;
  slots?: Array<{
    bookingDate: string;
    startTime: string;
    endTime: string;
  }>;
}

export default function PaymentPage() {
  const [location, setLocation] = useLocation();
  const [match, params] = useRoute('/payment/:bookingId');
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const { user } = useAuth();

  useEffect(() => {
    if (!params?.bookingId) {
      setError('No booking ID provided');
      setLoading(false);
      return;
    }

    const fetchBookingDetails = async () => {
      try {
        const response = await fetch(`/api/bookings/${params.bookingId}`, {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error('Failed to fetch booking details');
        }
        const bookingData = await response.json();
        setBooking(bookingData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load booking');
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [params?.bookingId]);





  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p>Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-red-600 mb-4">Error loading booking</p>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <Button onClick={() => setLocation('/profile?tab=bookings')}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate remaining balance
  const remainingBalance = booking.totalAmount - (booking.paidAmount || 0) - (booking.discountAmount || 0);
  const isPartiallyPaid = (booking.paidAmount || 0) > 0;
  
  // Get the first slot for display (since booking might have multiple slots)
  const firstSlot = booking.slots?.[0];
  const bookingDate = firstSlot ? firstSlot.bookingDate : booking.startDate;
  const startTime = firstSlot ? firstSlot.startTime : "00:00";
  const endTime = firstSlot ? firstSlot.endTime : "23:59";

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/profile?tab=bookings')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Bookings
          </Button>
          <h1 className="text-2xl font-bold">
            {isPartiallyPaid ? 'Complete Remaining Payment' : 'Complete Payment'}
          </h1>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Booking Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{booking.facilityName || 'Sports Facility'}</h3>
                <p className="text-gray-600">{booking.facilityType || 'Sports Activity'}</p>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{new Date(bookingDate).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{startTime} - {endTime}</span>
                </div>
                
                <div className="flex items-center text-sm">
                  <Users className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{booking.participantCount} participant(s)</span>
                </div>
                
                <div className="flex items-center text-sm">
                  <Building2 className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="capitalize">{booking.bookingType} booking</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Plan Type</span>
                  <span className="capitalize">{booking.planType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Amount</span>
                  <span>₹{booking.totalAmount.toLocaleString()}</span>
                </div>
                {isPartiallyPaid && (
                  <>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Amount Paid</span>
                      <span>₹{(booking.paidAmount || 0).toLocaleString()}</span>
                    </div>
                    {(booking.discountAmount || 0) > 0 && (
                      <div className="flex justify-between text-sm text-blue-600">
                        <span>Discount Applied</span>
                        <span>₹{booking.discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between font-semibold text-lg text-red-600 border-t pt-2">
                  <span>{isPartiallyPaid ? 'Remaining Balance' : 'Amount Due'}</span>
                  <span>₹{remainingBalance.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Status */}
              <div className={`mt-6 p-4 rounded-lg ${
                booking.paymentStatus === 'pending' ? 'bg-yellow-50' :
                booking.paymentStatus === 'partial' ? 'bg-orange-50' :
                'bg-green-50'
              }`}>
                <h4 className={`font-medium mb-2 ${
                  booking.paymentStatus === 'pending' ? 'text-yellow-900' :
                  booking.paymentStatus === 'partial' ? 'text-orange-900' :
                  'text-green-900'
                }`}>
                  Payment Status: {booking.paymentStatus?.toUpperCase()}
                </h4>
                <div className={`text-sm space-y-1 ${
                  booking.paymentStatus === 'pending' ? 'text-yellow-700' :
                  booking.paymentStatus === 'partial' ? 'text-orange-700' :
                  'text-green-700'
                }`}>
                  <p>User: {user?.firstName || 'User'}</p>
                  <p>Email: {user?.email || 'Not provided'}</p>
                  <p>Booking ID: #{booking.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <MockPaymentForm
            bookingId={booking.id}
            amount={remainingBalance}
            newAmount={booking.totalAmount}
            currency="INR"
            onSuccess={() => {
              setLocation('/profile?tab=bookings');
            }}
            onCancel={() => {
              setLocation('/profile?tab=bookings');
            }}
          />
        </div>
      </div>
    </div>
  );
}