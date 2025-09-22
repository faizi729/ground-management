import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Clock, Users, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface TimeSlot {
  slotId: number;
  slotName: string;
  startTime: string;
  endTime: string;
  isPeakHour: boolean;
  slotOrder: number;
  isActive: boolean;
}

interface Ground {
  id: number;
  groundName: string;
  groundCode: string;
  location?: string;
  maxCapacity?: number;
  imageUrl?: string;
}

interface Plan {
  id: number;
  planName: string;
  planType: string;
  bookingType: string;
  amount: string;
  peakHourMultiplier: string;
  weekendMultiplier: string;
}

interface PricingDetail {
  date: string;
  slotId: number;
  price: number;
  isPeakHour: boolean;
  dayType: string;
}

export default function EnhancedBooking() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [selectedSport, setSelectedSport] = useState<number | null>(null);
  const [selectedGround, setSelectedGround] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [bookingMode, setBookingMode] = useState<'per_person' | 'full_ground'>('per_person');
  const [participantCount, setParticipantCount] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>();
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [showPricing, setShowPricing] = useState(false);

  // Data queries
  const { data: sports } = useQuery({
    queryKey: ['/api/sports'],
    enabled: true
  });

  const { data: grounds } = useQuery({
    queryKey: ['/api/grounds'],
    enabled: !!selectedSport
  });

  const { data: plans } = useQuery({
    queryKey: ['/api/plans'],
    enabled: !!selectedGround
  });

  const { data: timeSlots } = useQuery({
    queryKey: ['/api/time-slots/master'],
    enabled: true
  });

  // Availability check mutation
  const availabilityMutation = useMutation({
    mutationFn: async (params: any) => {
      const response = await fetch('/api/bookings/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      return response.json();
    },
  });

  // Pricing calculation mutation
  const pricingMutation = useMutation({
    mutationFn: async (params: any) => {
      const response = await fetch('/api/bookings/calculate-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      return response.json();
    },
  });

  // Enhanced booking creation mutation
  const bookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const response = await fetch('/api/bookings/enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
        credentials: 'include'
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Booking Created",
        description: "Your enhanced booking has been created successfully with dynamic pricing.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create booking",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setSelectedSport(null);
    setSelectedGround(null);
    setSelectedPlan(null);
    setSelectedSlots([]);
    setShowPricing(false);
    setParticipantCount(1);
  };

  const handleSlotToggle = (slotId: number) => {
    setSelectedSlots(prev => 
      prev.includes(slotId) 
        ? prev.filter(id => id !== slotId)
        : [...prev, slotId]
    );
  };

  const calculatePricing = async () => {
    if (!selectedGround || !selectedPlan || !selectedDate || selectedSlots.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please select ground, plan, date, and time slots",
        variant: "destructive",
      });
      return;
    }

    const params = {
      groundId: selectedGround,
      planId: selectedPlan,
      startDate: format(selectedDate, 'yyyy-MM-dd'),
      endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
      slotIds: selectedSlots,
      bookingMode,
      noOfPersons: participantCount
    };

    try {
      await pricingMutation.mutateAsync(params);
      setShowPricing(true);
    } catch (error) {
      console.error('Pricing calculation failed:', error);
    }
  };

  const checkAvailability = async () => {
    if (!selectedGround || selectedSlots.length === 0) {
      return;
    }

    const params = {
      groundId: selectedGround,
      startDate: format(selectedDate, 'yyyy-MM-dd'),
      endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
      slotIds: selectedSlots,
      bookingMode,
      noOfPersons: participantCount
    };

    try {
      await availabilityMutation.mutateAsync(params);
    } catch (error) {
      console.error('Availability check failed:', error);
    }
  };

  const handleBookingSubmit = async () => {
    if (!selectedGround || !selectedPlan || selectedSlots.length === 0) {
      toast({
        title: "Incomplete Form",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    const bookingData = {
      groundId: selectedGround,
      planId: selectedPlan,
      bookingMode,
      startDate: format(selectedDate, 'yyyy-MM-dd'),
      endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
      slotIds: selectedSlots,
      participantCount: bookingMode === 'per_person' ? participantCount : undefined,
      paymentMethod: 'pending',
      notes: `Enhanced booking for ${selectedSlots.length} slots with dynamic pricing`
    };

    try {
      await bookingMutation.mutateAsync(bookingData);
    } catch (error) {
      console.error('Booking creation failed:', error);
    }
  };

  // Get available grounds based on selected sport
  // Note: booking mode is now determined by sport.bookingType, not ground-level fields
  const availableGrounds = Array.isArray(grounds) ? grounds : [];

  // Get available plans based on selected ground and booking mode
  const availablePlans = Array.isArray(plans) ? plans.filter((plan: Plan) => 
    plan.bookingType === bookingMode
  ) : [];

  const selectedGroundData = Array.isArray(grounds) ? grounds.find((g: Ground) => g.id === selectedGround) : undefined;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Enhanced Booking System
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Book sports facilities with dynamic pricing, multi-slot support, and flexible booking modes
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sport & Ground Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Sport & Ground Selection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Sport</Label>
                    <Select value={selectedSport?.toString()} onValueChange={(value) => setSelectedSport(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sport" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(sports) && sports.map((sport: any) => (
                          <SelectItem key={sport.id} value={sport.id.toString()}>
                            {sport.sportName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Booking Mode</Label>
                    <Select value={bookingMode} onValueChange={(value: 'per_person' | 'full_ground') => setBookingMode(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="per_person">Per Person</SelectItem>
                        <SelectItem value="full_ground">Full Ground</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Ground</Label>
                  <Select value={selectedGround?.toString()} onValueChange={(value) => setSelectedGround(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ground" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableGrounds?.map((ground: Ground) => (
                        <SelectItem key={ground.id} value={ground.id.toString()}>
                          {ground.groundName} 
                          {ground.maxCapacity && ` (Capacity: ${ground.maxCapacity})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedGroundData && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>Ground:</strong> {selectedGroundData.groundName}
                    </p>
                    {selectedGroundData.location && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Location:</strong> {selectedGroundData.location}
                      </p>
                    )}
                    {selectedGroundData.maxCapacity && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Max Capacity:</strong> {selectedGroundData.maxCapacity} persons
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Date & Time Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Date & Time Selection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => date && setSelectedDate(date)}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label>Participants</Label>
                    <Input
                      type="number"
                      min="1"
                      max={selectedGroundData?.maxCapacity || 50}
                      value={participantCount}
                      onChange={(e) => setParticipantCount(parseInt(e.target.value) || 1)}
                      disabled={bookingMode === 'full_ground'}
                    />
                  </div>
                </div>

                <div>
                  <Label>Available Time Slots</Label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 mt-2">
                    {Array.isArray(timeSlots) && timeSlots.map((slot: TimeSlot) => (
                      <button
                        key={slot.slotId}
                        onClick={() => handleSlotToggle(slot.slotId)}
                        className={cn(
                          "p-2 text-xs border rounded-lg transition-colors",
                          selectedSlots.includes(slot.slotId)
                            ? "bg-blue-500 text-white border-blue-500"
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700",
                          slot.isPeakHour && "border-orange-300 bg-orange-50 dark:bg-orange-900/20"
                        )}
                      >
                        <div className="text-center">
                          <div className="font-medium">{slot.startTime}</div>
                          {slot.isPeakHour && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              Peak
                            </Badge>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Plan Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Pricing Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {availablePlans?.map((plan: Plan) => (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={cn(
                        "p-4 border rounded-lg cursor-pointer transition-colors",
                        selectedPlan === plan.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{plan.planName}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                            {plan.planType} • {plan.bookingType.replace('_', ' ')}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">₹{plan.amount}</div>
                          <div className="text-xs text-gray-500">
                            Peak: {parseFloat(plan.peakHourMultiplier) * 100}% | 
                            Weekend: {parseFloat(plan.weekendMultiplier) * 100}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary & Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Mode:</span>
                    <span className="capitalize">{bookingMode.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Date:</span>
                    <span>{selectedDate ? format(selectedDate, 'MMM dd, yyyy') : 'Not selected'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Slots:</span>
                    <span>{selectedSlots.length} selected</span>
                  </div>
                  {bookingMode === 'per_person' && (
                    <div className="flex justify-between text-sm">
                      <span>Participants:</span>
                      <span>{participantCount}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={calculatePricing}
                    disabled={!selectedGround || !selectedPlan || selectedSlots.length === 0}
                    className="w-full"
                    variant="outline"
                  >
                    Calculate Pricing
                  </Button>

                  <Button
                    onClick={checkAvailability}
                    disabled={!selectedGround || selectedSlots.length === 0}
                    className="w-full"
                    variant="outline"
                  >
                    Check Availability
                  </Button>
                </div>

                {/* Availability Status */}
                {availabilityMutation.data && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium">Available</span>
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      All selected slots are available for booking
                    </p>
                  </div>
                )}

                {/* Pricing Details */}
                {pricingMutation.data && showPricing && (
                  <div className="space-y-3">
                    <div className="border-t pt-3">
                      <h4 className="font-medium mb-2">Pricing Breakdown</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Base Amount:</span>
                          <span>₹{pricingMutation.data?.baseAmount || 0}</span>
                        </div>
                        <div className="flex justify-between font-bold border-t pt-1">
                          <span>Total Amount:</span>
                          <span>₹{pricingMutation.data?.totalAmount || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Slot Details:</h5>
                      {pricingMutation.data?.slotPricing?.slice(0, 3).map((slot: PricingDetail, index: number) => (
                        <div key={index} className="flex justify-between text-xs">
                          <span>
                            Slot {slot.slotId} {slot.isPeakHour && '(Peak)'} {slot.dayType}
                          </span>
                          <span>₹{slot.price}</span>
                        </div>
                      ))}
                      {(pricingMutation.data?.slotPricing?.length || 0) > 3 && (
                        <div className="text-xs text-gray-500">
                          +{(pricingMutation.data?.slotPricing?.length || 0) - 3} more slots
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleBookingSubmit}
                  disabled={!selectedGround || !selectedPlan || selectedSlots.length === 0 || bookingMutation.isPending}
                  className="w-full"
                >
                  {bookingMutation.isPending ? 'Creating Booking...' : 'Create Enhanced Booking'}
                </Button>
              </CardContent>
            </Card>

            {/* Features Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Enhanced Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Dynamic pricing with peak hour rates</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Weekend pricing multipliers</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Multi-slot booking support</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Per-person & full-ground modes</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Real-time availability checking</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}