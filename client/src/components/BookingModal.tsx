import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { User, Clock, Users, Calendar as CalendarIcon, CreditCard, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
// Remove unused imports since we use facility data from master tables

interface BookingModalProps {
  facility: any; // Master table facility data
  isOpen: boolean;
  onClose: () => void;
  isAdminBooking?: boolean;
}

// Helper functions
const getEndTime = (startTime: string, duration: number): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const endHours = hours + duration;
  return `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const calculateSlotPrice = (bookingType: string, participantCount: number, facility: any): number => {
  const baseRate = Number(facility.hourlyRate || 0);
  return bookingType === "per-person" ? baseRate * participantCount : baseRate;
};

export default function BookingModal({ facility, isOpen, onClose, isAdminBooking = false }: BookingModalProps) {
  // console.log("BookingModal rendered with isAdminBooking:", isAdminBooking);
  const [bookingType, setBookingType] = useState<"per-person" | "full-ground">("per-person");
  const [planType, setPlanType] = useState<"hourly" | "monthly" | "yearly">("hourly");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [duration, setDuration] = useState(1);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [participantCount, setParticipantCount] = useState(1);
  const [endDate, setEndDate] = useState<Date | undefined>();


  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();

  // Calculate total amount by checking each individual time slot separately
 const calculateTotal = () => {
  // console.log("Selected time slot:", selectedTimeSlot);
  // console.log("Facility:", facility);
  // console.log("Time slots:", timeSlots);
  // console.log("Filtered plans:", filteredPlans);
  // console.log("Plan type:", planType);
  // console.log("Booking type:", bookingType);
  // console.log("Participant count:", participantCount);
  // console.log("Duration:", duration);
  // console.log("Facility Plans:", facility?.plans);
  


  if (!facility || !selectedTimeSlot || !timeSlots) {
    // console.log("Returning 0 because some data is missing");
    return 0;
  }

  const currentPlan = filteredPlans.find((plan: any) => plan.planType === planType);
  if (!currentPlan) {
    // console.log("No matching plan found, returning 0");
    return 0;
  }

  const basePrice = Number(currentPlan.basePrice);
  const peakMultiplier = Number(currentPlan.peakHourMultiplier || 1);
  const weekendMultiplier = Number(currentPlan.weekendMultiplier || 1);
  const isWeekend = selectedDate ? [0, 6].includes(selectedDate.getDay()) : false;

  // console.log("Base price:", basePrice, "Peak multiplier:", peakMultiplier, "Weekend multiplier:", weekendMultiplier, "Is weekend:", isWeekend);

  if (planType === "hourly") {
    let totalAmount = 0;
    const startHour = parseInt(selectedTimeSlot.split(':')[0]);

    for (let i = 0; i < duration; i++) {
      const slotHour = startHour + i;
      const slotTimeString = `${String(slotHour).padStart(2, '0')}:00`;
      const currentSlot = timeSlots.find((slot: any) => slot.startTime === slotTimeString);
      const isSlotPeakHour = currentSlot?.peakHour === true;

      let slotPrice = basePrice;

      if (isSlotPeakHour) slotPrice *= peakMultiplier;
      if (isWeekend) slotPrice *= weekendMultiplier;

      totalAmount += slotPrice;

      // console.log(`Slot: ${slotTimeString}, Peak: ${isSlotPeakHour}, Slot Price: ${slotPrice}, Total so far: ${totalAmount}`);
    }

    const finalTotal = bookingType === "per-person" ? totalAmount * participantCount : totalAmount;
    // console.log("Final total:", finalTotal);
    return finalTotal;

  } else {
    let finalAmount = basePrice;
    const currentSlot = timeSlots.find((slot: any) => slot.startTime === selectedTimeSlot);

    if (currentSlot?.peakHour === true) finalAmount *= peakMultiplier;
    if (isWeekend) finalAmount *= weekendMultiplier;

    const finalTotal = bookingType === "per-person" ? finalAmount * participantCount : finalAmount;
    // console.log("Final total (monthly/yearly):", finalTotal);
    
    return finalTotal;
  }
};

  // Get detailed pricing breakdown for each slot
  const getPricingBreakdown = () => {
    if (!facility || !filteredPlans.length || !selectedTimeSlot || !timeSlots) return null;
    
    const currentPlan = filteredPlans.find((plan: any) => plan.planType === planType);
    
    if (!currentPlan) return null;
    
    const basePrice = Number(currentPlan.basePrice);
    const peakMultiplier = Number(currentPlan.peakHourMultiplier || 1);
    const weekendMultiplier = Number(currentPlan.weekendMultiplier || 1);
    const isWeekend = selectedDate ? [0, 6].includes(selectedDate.getDay()) : false;
    
    // For hourly plans, break down each slot
    if (planType === "hourly") {
      const startHour = parseInt(selectedTimeSlot.split(':')[0]);
      const slots = [];
      let peakSlots = 0;
      let nonPeakSlots = 0;
      
      for (let i = 0; i < duration; i++) {
        const slotHour = startHour + i;
        const slotTimeString = `${String(slotHour).padStart(2, '0')}:00`;
        const currentSlot = timeSlots.find((slot: any) => slot.startTime === slotTimeString);
        const isSlotPeakHour = currentSlot?.peakHour === true;
        
        if (isSlotPeakHour) {
          peakSlots++;
        } else {
          nonPeakSlots++;
        }
        
        slots.push({
          time: slotTimeString,
          isPeak: isSlotPeakHour
        });
      }
      
      return {
        basePrice,
        isWeekend,
        peakMultiplier,
        weekendMultiplier,
        duration,
        participantCount: bookingType === "per-person" ? participantCount : 1,
        planName: currentPlan.planName,
        slots,
        peakSlots,
        nonPeakSlots
      };
    } else {
      // For monthly/yearly plans, check if selected time slot is peak hour
      const isPeakHour = selectedTimeSlot && timeSlots ? 
        timeSlots.find((slot: any) => slot.startTime === selectedTimeSlot)?.peakHour === true : false;
      
      return {
        basePrice,
        isPeakHour,
        isWeekend,
        peakMultiplier,
        weekendMultiplier,
        duration,
        participantCount: bookingType === "per-person" ? participantCount : 1,
        planName: currentPlan.planName
      };
    }
  };

  // Get booking options based on ground capabilities from database
  const sportBookingOptions = {
    perPerson: facility?.bookingTypes?.perPerson === true,
    fullGround: facility?.bookingTypes?.fullGround !== false // Default to true if not specified
  };

  // Time slots query with proper date formatting
  const { data: timeSlots } = useQuery({
    queryKey: ["/api/facilities", facility?.id, "slots", selectedDate?.toISOString().split('T')[0]],
    queryFn: async () => {
      // Format date properly to avoid timezone issues
      const dateStr = selectedDate ? 
        `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}` :
        new Date().toISOString().split('T')[0];
      
      // console.log(`Frontend requesting slots for date: ${dateStr}`);
      const response = await fetch(`/api/facilities/${facility?.id}/slots?date=${dateStr}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch time slots');
      return response.json();
    },
    enabled: !!facility && !!selectedDate,
  });

  // Get maximum participants allowed for the selected time slot
  const getMaxParticipantsForSelectedSlot = (): number => {
    if (!selectedTimeSlot || !timeSlots) {
      return facility?.capacity || 10;
    }
    
    const selectedSlot = timeSlots.find((slot: any) => slot.startTime === selectedTimeSlot);
    if (!selectedSlot) {
      return facility?.capacity || 10;
    }
    
    // For per-person bookings, return the available capacity for that specific slot
    return Math.max(1, selectedSlot.availableCapacity || 0);
  };

  // Reset participant count when slot selection changes to ensure valid capacity
  useEffect(() => {
    if (selectedTimeSlot && bookingType === "per-person" && timeSlots) {
      const maxAllowed = getMaxParticipantsForSelectedSlot();
      if (participantCount > maxAllowed) {
        setParticipantCount(Math.max(1, maxAllowed));
        toast({
          title: "Participant count adjusted",
          description: `Reduced to ${maxAllowed} participants based on available capacity.`,
        });
      }
    }
  }, [selectedTimeSlot, bookingType, participantCount]); // Remove timeSlots from dependency array

  // Force booking type to match ground capabilities when facility changes
  useEffect(() => {
    if (facility?.bookingTypes) {
      // If per-person is not supported but currently selected, switch to full-ground
      if (bookingType === "per-person" && !facility.bookingTypes.perPerson) {
        if (facility.bookingTypes.fullGround) {
          setBookingType("full-ground");
          toast({
            title: "Booking type adjusted",
            description: "This facility only supports full ground bookings.",
          });
        }
      }
      // If full-ground is not supported but currently selected, switch to per-person
      else if (bookingType === "full-ground" && !facility.bookingTypes.fullGround) {
        if (facility.bookingTypes.perPerson) {
          setBookingType("per-person");
          toast({
            title: "Booking type adjusted", 
            description: "This facility only supports per-person bookings.",
          });
        }
      }
    }
  }, [facility?.bookingTypes, bookingType]);

  // Filter plans based on booking type (per-person vs full-ground)
 const filteredPlans = useMemo(() => {
  const facilityPlans = (facility as any)?.plans;
  if (!facilityPlans) return [];

  return facilityPlans.filter((plan: any) => {
    // Always include all plans for display
    // Optional: filter by bookingType if you want
    if (bookingType === "per-person") {
      // Example: include all plans that allow per-person booking
      return true;
    }
    if (bookingType === "full-ground") {
      // Example: include all plans that allow full-ground booking
      return true;
    }

    // Default: include everything
    return true;
  });
}, [(facility as any)?.plans, bookingType]);




  // Calculate end date automatically for monthly/yearly plans
  const calculateEndDate = (startDate: Date | undefined, planType: string): Date | undefined => {
    if (!startDate) return undefined;
    
    const calculatedEndDate = new Date(startDate);
    
    if (planType === "monthly") {
      calculatedEndDate.setDate(calculatedEndDate.getDate() + 30);
    } else if (planType === "yearly") {
      calculatedEndDate.setDate(calculatedEndDate.getDate() + 365);
    }
    
    return calculatedEndDate;
  };

  // Update end date when start date or plan type changes
  useEffect(() => {
    if (planType !== "hourly" && startDate) {
      const calculatedEndDate = calculateEndDate(startDate, planType);
      setEndDate(calculatedEndDate);
    } else {
      setEndDate(undefined);
    }
  }, [startDate, planType]);

  // Booking mutations
  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      // Always use authenticated booking endpoint
      return await apiRequest("POST", "/api/bookings", bookingData);
    },
    onSuccess: () => {
      // Invalidate booking queries for all users
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/bookings"] });
      
      // Invalidate admin dashboard stats if user is admin
      if (user?.role === 'admin' || user?.role === 'manager' || isAdminBooking) {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      }
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      return await apiRequest("POST", "/api/payments", paymentData);
    },
  });

  // Handle regular booking (Pay Later)
  const handleBooking = () => {
    if (!facility) return;

    const formatDateLocal = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const bookingDate = planType === "hourly" 
      ? (selectedDate ? formatDateLocal(selectedDate) : formatDateLocal(new Date()))
      : (startDate ? formatDateLocal(startDate) : formatDateLocal(new Date()));
    
    const slots = [{
      bookingDate,
      startTime: selectedTimeSlot || "09:00",
      endTime: selectedTimeSlot ? getEndTime(selectedTimeSlot, duration) : "10:00",
      duration: duration * 60,
      amount: calculateTotal().toString(),
      status: "pending"
    }];

    const bookingData = {
      groundId: facility.groundId || facility.id,
      bookingType,
      planType,
      participantCount,
      totalAmount: calculateTotal().toString(),
      bookingDate,
      startTime: selectedTimeSlot || "09:00",
      endTime: selectedTimeSlot ? getEndTime(selectedTimeSlot, duration) : "10:00",
      duration,
      slots
    };
    console.log(bookingData)
    

    createBookingMutation.mutate(bookingData, {
      onSuccess: async (response) => {
        const booking = await response.json();
        
        // Booking created successfully - now handle payment logic
        const bookingId = booking.booking ? booking.booking.id : booking.id;
        
        if (isAdminBooking) {
          // For admin bookings, show success message and handle payment separately
          toast({
            title: "Booking Created Successfully!",
            description: `Booking confirmed with ID: ${bookingId}. Now processing payment...`,
            duration: 3000,
          });
          
          // For admin bookings, redirect to payment page to handle payment details
          // Payment details including discounts and payment methods will be handled there
        } else {
          // For regular users, just confirm booking creation
          toast({
            title: "Booking Created Successfully!",
            description: "Your booking has been confirmed. Please complete payment to secure your slot.",
            duration: 5000,
          });
        }
        
        onClose();
        // Redirect both admin and regular users to payment page for payment processing
        setLocation(`/payment/${bookingId}`);
      }
    });
  };

  // Handle Book Now - creates booking with proper validation
const handleBookNow = () => {
  if (!facility) return;

  // Auth check
  if (!isAuthenticated && !isAdminBooking) {
    toast({
      title: "Login Required",
      description: "Please login or create an account to complete your booking.",
      duration: 5000,
    });
    onClose();
    setLocation("/login");
    console.log("User not authenticated, redirecting to login"); // 🔹
    return;
  }

  // Utility: format date YYYY-MM-DD
  const formatDateLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const formatted = `${year}-${month}-${day}`;
    console.log(`Formatting date: ${date} -> ${formatted}`); // 🔹
    return formatted;
  };

  // Check hourly booking has selected time slot
  if (planType === "hourly" && !selectedTimeSlot) {
    toast({
      title: "Select Time Slot",
      description: "Please select a time slot before proceeding with an hourly booking.",
      variant: "destructive",
    });
    console.log("Hourly booking attempted without selecting time slot"); // 🔹
    return;
  }

  // Defensive check: per-person capacity
  if (bookingType === "per-person" && selectedTimeSlot) {
    const maxAllowed = getMaxParticipantsForSelectedSlot();
    if (participantCount > maxAllowed) {
      toast({
        title: "Capacity Exceeded",
        description: `Only ${maxAllowed} participants available for ${selectedTimeSlot}.`,
        variant: "destructive",
      });
      console.log(`Per-person booking exceeds capacity: requested=${participantCount}, max=${maxAllowed}`); // 🔹
      return;
    }
  }

  // Determine booking date
  const bookingDate =
    planType === "hourly"
      ? selectedDate
        ? formatDateLocal(selectedDate)
        : formatDateLocal(new Date())
      : startDate
      ? formatDateLocal(startDate)
      : formatDateLocal(new Date());

  // Determine plan duration
  const selectedPlan = facility?.plans?.find((p: any) => p.planType === planType);
  const durationDays =
    selectedPlan?.durationDays ?? (planType === "hourly" ? 1 : planType === "monthly" ? 30 : 365);

  console.log("Booking info:", {
    planType,
    bookingType,
    bookingDate,
    durationDays,
    participantCount,
    selectedTimeSlot,
    selectedPlan,
  }); // 🔹

  // Calculate end date for non-hourly plans
  let calculatedEndDate: Date | null = null;
  if (planType !== "hourly" && startDate) {
    calculatedEndDate = new Date(startDate);
    calculatedEndDate.setDate(calculatedEndDate.getDate() + durationDays - 1);
    console.log("Calculated end date:", formatDateLocal(calculatedEndDate)); // 🔹
  }

  // Prepare slots
  const slots: any[] = [];

  if (planType === "hourly" && selectedTimeSlot) {
    const slot = {
      bookingDate,
      startTime: selectedTimeSlot,
      endTime: getEndTime(selectedTimeSlot, duration),
      duration: duration * 60,
      amount: calculateTotal().toString(),
      status: "pending",
      participantCount,
    };
    console.log("Generated hourly slot:", slot); // 🔹
    slots.push(slot);
  } else {
    // Monthly / Yearly plan
    const startObj = startDate ? new Date(startDate) : new Date();
    for (let i = 0; i < durationDays; i++) {
      const currentDate = new Date(startObj);
      currentDate.setDate(startObj.getDate() + i);

      const slot = {
        bookingDate: formatDateLocal(currentDate),
        startTime: "09:00",
        endTime: "10:00",
        duration: 60,
        amount: (calculateTotal() / durationDays).toString(),
        status: "pending",
        participantCount,
      };
      console.log(`Generated slot ${i + 1}:`, slot); // 🔹
      slots.push(slot);
    }
  }

  console.log(`Total slots generated: ${slots.length}`, slots); // 🔹

  // Prepare booking payload
  const bookingData = {
    groundId: facility.groundId || facility.id,
    bookingType,
    planType,
    participantCount,
    totalAmount: calculateTotal(),
    discountAmount: 0,
    paidAmount: 0,
    paymentMethod: "pending",
    bookingDate,
    startTime: selectedTimeSlot || "09:00",
    endTime: selectedTimeSlot ? getEndTime(selectedTimeSlot, duration) : "10:00",
    duration,
    startDate: planType !== "hourly" ? (startDate ? formatDateLocal(startDate) : bookingDate) : bookingDate,
    endDate: planType !== "hourly" && calculatedEndDate ? formatDateLocal(calculatedEndDate) : bookingDate,
    slots,
  };

  console.log("Booking payload to send:", bookingData); // 🔹

  // Send booking
  createBookingMutation.mutate(bookingData, {
    onSuccess: async (response) => {
      try {
        const booking = await response.json();
        const bookingId = booking.booking ? booking.booking.id : booking.id;
        console.log("Booking created successfully, backend response:", booking); // 🔹

        toast({
          title: "Booking Created!",
          description: isAdminBooking
            ? "Complete payment on the next screen to confirm booking."
            : "Complete payment to confirm your booking.",
          duration: 3000,
        });

        onClose();
        setLocation(
          `/payment/${bookingId}?total=${calculateTotal()}&isAdmin=${isAdminBooking}&module=booking&loginId=${encodeURIComponent(
            user?.id || ""
          )}`
        );
      } catch (e) {
        console.error("Error parsing booking response:", e);
        toast({
          title: "Booking Created",
          description: "Booking created but failed to parse response. Check bookings page.",
        });
        onClose();
      }
    },
    onError: (error) => {
      console.error("Booking creation failed:", error);

      let errorMessage = "Unable to create booking. Please try again.";

      if (error instanceof Error) {
        const fullMessage = error.message;
        if (fullMessage.includes(": ")) {
          errorMessage = fullMessage.split(": ").slice(1).join(": ");
        } else {
          errorMessage = fullMessage;
        }
        if (errorMessage.startsWith('"') && errorMessage.endsWith('"')) {
          errorMessage = errorMessage.slice(1, -1);
        }
        try {
          const parsed = JSON.parse(errorMessage);
          if (parsed.message) errorMessage = parsed.message;
          else if (parsed.error) errorMessage = parsed.error;
        } catch (e) {}
      }

      toast({
        title: "Unable to Complete Booking",
        description: errorMessage,
        variant: "destructive",
        duration: 8000,
      });
    },
  });
};



  const handleClose = () => {
    onClose();
    setLocation('/');
  };

  if (!facility) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">
            Book {facility.name}
          </DialogTitle>
          <DialogDescription>
            Complete your booking details below. Choose between immediate payment or pay later option.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Facility Information */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                  {facility.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{facility.name}</h3>
                  <p className="text-gray-600 capitalize">{facility.type} facility</p>
                  <p className="text-sm text-gray-500">Capacity: {facility.capacity} people</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Booking Type */}
              <div>
                <Label className="text-lg font-semibold">Booking Type</Label>
                <RadioGroup value={bookingType} onValueChange={(value: any) => setBookingType(value)} className="mt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <Label className={`border rounded-lg p-4 transition-colors ${
                      sportBookingOptions.perPerson 
                        ? 'cursor-pointer hover:border-primary [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-blue-50' 
                        : 'cursor-not-allowed opacity-50 bg-gray-100'
                    }`}>
                      <RadioGroupItem 
                        value="per-person" 
                        className="sr-only" 
                        disabled={!sportBookingOptions.perPerson}
                      />
                      <div className="text-center">
                        <User className={`h-6 w-6 mx-auto mb-2 ${
                          sportBookingOptions.perPerson ? 'text-primary' : 'text-gray-400'
                        }`} />
                        <div className="font-medium">Per Person</div>
                        <div className="text-sm text-gray-600">
                          {sportBookingOptions.perPerson ? 'Pay per participant' : 'Not available for this sport'}
                        </div>
                      </div>
                    </Label>
                    <Label className={`border rounded-lg p-4 transition-colors ${
                      sportBookingOptions.fullGround 
                        ? 'cursor-pointer hover:border-primary [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-blue-50' 
                        : 'cursor-not-allowed opacity-50 bg-gray-100'
                    }`}>
                      <RadioGroupItem 
                        value="full-ground" 
                        className="sr-only" 
                        disabled={!sportBookingOptions.fullGround}
                      />
                      <div className="text-center">
                        <Users className={`h-6 w-6 mx-auto mb-2 ${
                          sportBookingOptions.fullGround ? 'text-primary' : 'text-gray-400'
                        }`} />
                        <div className="font-medium">Full Ground</div>
                        <div className="text-sm text-gray-600">
                          {sportBookingOptions.fullGround ? 'Book entire facility' : 'Not available for this sport'}
                        </div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Plan Selection */}
              <div>
                <Label className="text-lg font-semibold">Choose Plan</Label>
                <RadioGroup value={planType} onValueChange={(value: any) => setPlanType(value)} className="mt-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {filteredPlans.length > 0 ? (
                      filteredPlans.map((plan: any) => {
                        const planTypeKey = plan.planType;
                        console.log(planType)
                        console.log("Filtered Plans:", filteredPlans);

                        return (
                          <Label key={plan.id} className="border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-blue-50">
                            <RadioGroupItem value={planTypeKey} className="sr-only" />
                            <div className="text-center">
                              {planTypeKey === 'hourly' && <Clock className="h-5 w-5 text-primary mx-auto mb-2" />}
                              {planTypeKey === 'monthly' && <CalendarIcon className="h-5 w-5 text-primary mx-auto mb-2" />}
                              {planTypeKey === 'yearly' && <CalendarIcon className="h-5 w-5 text-primary mx-auto mb-2" />}
                              <div className="font-medium">{planTypeKey.charAt(0).toUpperCase() + planTypeKey.slice(1)}</div>
                              <div className="text-primary font-semibold">
                                ₹{Number(plan.basePrice).toLocaleString()}/{planTypeKey === 'hourly' ? 'hour' : planTypeKey}
                              </div>
                              <div className="text-sm text-gray-600">
                                {planTypeKey === 'hourly' && 'Flexible timing'}
                                {planTypeKey === 'monthly' && '30-day access'}
                                {planTypeKey === 'yearly' && '365-day access'}
                              </div>
                            </div>
                          </Label>
                        );
                      })
                    ) : (
                      <div className="col-span-3 text-center text-gray-500 py-8">
                        No plans available for {bookingType.replace('-', ' ')} booking
                      </div>
                    )}
                  </div>
                </RadioGroup>
              </div>

              {planType === "hourly" && (
                <>
                  {/* Date Selection */}
                  <div>
                    <Label className="text-lg font-semibold">Select Date</Label>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date()}
                      className="rounded-md border w-full mt-2"
                    />
                  </div>

                  {/* Duration and Participant Count */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Duration (Hours)</Label>
                      <Select value={duration.toString()} onValueChange={(value) => setDuration(Number(value))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Hour</SelectItem>
                          <SelectItem value="2">2 Hours</SelectItem>
                          <SelectItem value="3">3 Hours</SelectItem>
                          <SelectItem value="4">4 Hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {bookingType === "per-person" && (
                      <div>
                        <Label>Participants</Label>
                        <Input
                          type="number"
                          min={1}
                          max={getMaxParticipantsForSelectedSlot()}
                          value={participantCount}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            const maxAllowed = getMaxParticipantsForSelectedSlot();
                            if (value <= maxAllowed) {
                              setParticipantCount(value);
                            } else {
                              toast({
                                title: "Capacity Exceeded",
                                description: `Only ${maxAllowed} participants available for the selected time slot.`,
                                variant: "destructive",
                              });
                            }
                          }}
                          placeholder={`Max ${getMaxParticipantsForSelectedSlot()} people`}
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          {selectedTimeSlot ? (
                            `Available for ${selectedTimeSlot}: ${getMaxParticipantsForSelectedSlot()} people`
                          ) : (
                            `Select a time slot first. Max capacity: ${facility?.capacity || 10} people`
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Start Date for Monthly/Yearly Plans */}
              {(planType === "monthly" || planType === "yearly") && (
                <>
                  <div>
                    <Label className="text-lg font-semibold">Plan Start Date</Label>
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      disabled={(date) => date < new Date()}
                      className="rounded-md border w-full mt-2"
                    />
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-sm">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-700">Plan Duration:</span>
                          <span className="text-blue-600 font-semibold">
                            {planType === "monthly" ? "30 days" : "365 days"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-700">Start Date:</span>
                          <span className="text-gray-900">
                            {startDate ? startDate.toLocaleDateString() : "Not selected"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700">End Date:</span>
                          <span className="text-green-600 font-semibold">
                            {endDate ? endDate.toLocaleDateString() : "Select start date"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Participant Count for Monthly/Yearly Plans */}
                  {bookingType === "per-person" && (
                    <div>
                      <Label>Participants</Label>
                      <Input
                        type="number"
                        min={1}
                        max={facility?.capacity || 10}
                        value={participantCount}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          if (value <= (facility?.capacity || 10)) {
                            setParticipantCount(value);
                          } else {
                            toast({
                              title: "Capacity Exceeded",
                              description: `Maximum capacity is ${facility?.capacity || 10} people.`,
                              variant: "destructive",
                            });
                          }
                        }}
                        placeholder={`Max ${facility?.capacity || 10} people`}
                      />
                      <p className="text-sm text-gray-500 mt-1">Maximum capacity: {facility?.capacity || 10} people</p>
                    </div>
                  )}
                </>
              )}


            </div>

            {/* Right Column */}
            <div className="space-y-6">
              



              {/* Time Slots */}
              <div>
                <Label className="text-lg font-semibold">
                  {planType === "hourly" ? "Available Time Slots" : "Select Your Daily Time Slot"}
                </Label>
                {planType !== "hourly" && (
                  <p className="text-sm text-gray-600 mt-1">
                    This time slot will be reserved for you every day during your {planType} membership
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {timeSlots?.map((slot: any) => {
                    // Get available capacity for color coding
                    const availableCapacity = slot.availableCapacity || 0;
                    
                    // Debug log for troubleshooting colors
                    // console.log(`Slot ${slot.startTime}: availableCapacity=${availableCapacity}, maxCapacity=${slot.maxCapacity}, isAvailable=${slot.isAvailable}`);
                    
                    // Determine background color based on absolute availability numbers
                    let bgColor = "";
                    let textColor = "";
                    let borderColor = "";
                    
                    if (!slot.isAvailable || availableCapacity === 0) {
                      // No availability - red
                      bgColor = selectedTimeSlot === slot.startTime ? "bg-red-600" : "bg-red-100 hover:bg-red-200";
                      textColor = selectedTimeSlot === slot.startTime ? "text-white" : "text-red-800";
                      borderColor = "border-red-300";
                      // console.log(`🔴 Red - Slot ${slot.startTime}: No availability (0 slots)`);
                    } else if (availableCapacity <= 2) {
                      // Low availability (1-2 slots remaining) - orange
                      bgColor = selectedTimeSlot === slot.startTime ? "bg-orange-600" : "bg-orange-100 hover:bg-orange-200";
                      textColor = selectedTimeSlot === slot.startTime ? "text-white" : "text-orange-800";
                      borderColor = "border-orange-300";
                      // console.log(`🟠 Orange - Slot ${slot.startTime}: Low availability (${availableCapacity} slots)`);
                    } else if (availableCapacity <= 4) {
                      // Medium availability (3-4 slots remaining) - yellow
                      bgColor = selectedTimeSlot === slot.startTime ? "bg-yellow-600" : "bg-yellow-100 hover:bg-yellow-200";
                      textColor = selectedTimeSlot === slot.startTime ? "text-white" : "text-yellow-800";
                      borderColor = "border-yellow-300";
                      // console.log(`🟡 Yellow - Slot ${slot.startTime}: Medium availability (${availableCapacity} slots)`);
                    } else {
                      // High availability (5+ slots remaining) - green
                      bgColor = selectedTimeSlot === slot.startTime ? "bg-green-600" : "bg-green-100 hover:bg-green-200";
                      textColor = selectedTimeSlot === slot.startTime ? "text-white" : "text-green-800";
                      borderColor = "border-green-300";
                      // console.log(`🟢 Green - Slot ${slot.startTime}: High availability (${availableCapacity} slots)`);
                    }
                    
                    return (
                      <Button
                        key={slot.id}
                        variant="outline"  
                        onClick={() => setSelectedTimeSlot(slot.startTime)}
                        className={`h-16 flex flex-col justify-center transition-colors ${bgColor} ${textColor} ${borderColor}`}
                        disabled={!slot.isAvailable}
                      >
                        <div className="text-sm font-medium">
                          {slot.startTime?.substring(0, 5)} - {slot.endTime?.substring(0, 5)}
                        </div>
                        <div className="text-xs opacity-90">
                          {slot.isAvailable ? (
                            slot.supportsPerPerson && slot.maxCapacity > 0 ? (
                              `Available: ${slot.availableCapacity}/${slot.maxCapacity}`
                            ) : 'Available'
                          ) : (
                            slot.supportsPerPerson ? 
                              `Full (${slot.bookedCount}/${slot.maxCapacity})` : 
                              'Booked'
                          )}
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Booking Summary */}
              <div>
                <Label className="text-lg font-semibold">Booking Summary</Label>
                <Card className="mt-2 bg-gray-50 border-gray-200">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Facility:</span>
                        <span className="font-medium">{facility.name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Plan:</span>
                        <span className="font-medium capitalize">{planType}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Booking Type:</span>
                        <span className="font-medium capitalize">{bookingType.replace('-', ' ')}</span>
                      </div>
                      {bookingType === "per-person" && (
                        <div className="flex justify-between text-sm">
                          <span>Participants:</span>
                          <span className="font-medium">{participantCount} people</span>
                        </div>
                      )}
                      {planType === "hourly" && (
                        <div className="flex justify-between text-sm">
                          <span>Duration:</span>
                          <span className="font-medium">{duration} hour{duration > 1 ? 's' : ''}</span>
                        </div>
                      )}
                      {selectedDate && planType === "hourly" && (
                        <div className="flex justify-between text-sm">
                          <span>Date:</span>
                          <span className="font-medium">{selectedDate.toLocaleDateString()}</span>
                        </div>
                      )}
                      {startDate && (planType === "monthly" || planType === "yearly") && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span>Start Date:</span>
                            <span className="font-medium">{startDate.toLocaleDateString()}</span>
                          </div>
                          {endDate && (
                            <div className="flex justify-between text-sm">
                              <span>End Date:</span>
                              <span className="font-medium text-green-600">{endDate.toLocaleDateString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm">
                            <span>Duration:</span>
                            <span className="font-medium text-blue-600">
                              {planType === "monthly" ? "30 days" : "365 days"}
                            </span>
                          </div>
                        </>
                      )}
                      {selectedTimeSlot && (
                        <div className="flex justify-between text-sm">
                          <span>Time:</span>
                          <span className="font-medium">{selectedTimeSlot} - {getEndTime(selectedTimeSlot, duration)}</span>
                        </div>
                      )}
                      <Separator />
                      
                      {/* Detailed Pricing Breakdown */}
                      {(() => {
                        const breakdown = getPricingBreakdown();
                        if (breakdown && selectedTimeSlot) {
                          return (
                            <>
                              <div className="text-sm font-medium text-gray-700 mb-2">Price Calculation:</div>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span>Base Price per hour:</span>
                                  <span>₹{breakdown.basePrice}</span>  
                                </div>
                                
                                {/* Show slot-by-slot breakdown for hourly plans */}
                                {planType === "hourly" && breakdown.slots && (
                                  <>
                                    {breakdown.nonPeakSlots > 0 && (
                                      <div className="flex justify-between">
                                        <span>Non-peak hours ({breakdown.nonPeakSlots}h):</span>
                                        <span>₹{(breakdown.basePrice * (breakdown.isWeekend ? breakdown.weekendMultiplier : 1) * breakdown.nonPeakSlots).toFixed(0)}</span>
                                      </div>
                                    )}
                                    {breakdown.peakSlots > 0 && (
                                      <div className="flex justify-between text-orange-600">
                                        <span>Peak hours ({breakdown.peakSlots}h) (+{((breakdown.peakMultiplier - 1) * 100).toFixed(0)}%):</span>
                                        <span>₹{(breakdown.basePrice * breakdown.peakMultiplier * (breakdown.isWeekend ? breakdown.weekendMultiplier : 1) * breakdown.peakSlots).toFixed(0)}</span>
                                      </div>
                                    )}
                                    {breakdown.isWeekend && breakdown.weekendMultiplier > 1 && (
                                      <div className="flex justify-between text-blue-600">
                                        <span>Weekend multiplier (+{((breakdown.weekendMultiplier - 1) * 100).toFixed(0)}%):</span>
                                        <span>Applied above</span>
                                      </div>
                                    )}
                                  </>
                                )}
                                
                                {/* Show old breakdown for monthly/yearly plans */}
                                {planType !== "hourly" && (
                                  <>
                                    {breakdown.isPeakHour && breakdown.peakMultiplier > 1 && (
                                      <div className="flex justify-between text-orange-600">
                                        <span>Peak Hour (+{((breakdown.peakMultiplier - 1) * 100).toFixed(0)}%):</span>
                                        <span>₹{(breakdown.basePrice * breakdown.peakMultiplier).toFixed(0)}</span>
                                      </div>
                                    )}
                                    {breakdown.isWeekend && breakdown.weekendMultiplier > 1 && (
                                      <div className="flex justify-between text-blue-600">
                                        <span>Weekend (+{((breakdown.weekendMultiplier - 1) * 100).toFixed(0)}%):</span>
                                        <span>₹{(breakdown.basePrice * (breakdown.isPeakHour ? breakdown.peakMultiplier : 1) * breakdown.weekendMultiplier).toFixed(0)}</span>
                                      </div>
                                    )}
                                  </>
                                )}
                                
                                {breakdown.participantCount > 1 && (
                                  <div className="flex justify-between">
                                    <span>× {breakdown.participantCount} participants:</span>
                                    <span>₹{calculateTotal().toFixed(0)}</span>
                                  </div>
                                )}
                              </div>
                              <Separator className="my-2" />
                            </>
                          );
                        }
                        return null;
                      })()}
       

                      <div className="flex justify-between text-lg font-bold">
                        <span>Total Amount:</span>
                        <span className="text-primary">₹{calculateTotal().toFixed(0)}</span>
                      </div>
                       
                    </div>
                  </CardContent>
                </Card>
              </div>


            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              onClick={handleClose}
              disabled={createBookingMutation.isPending}
            >
              Cancel
            </Button>
            
            <Button 
              onClick={handleBookNow} 
              className="bg-primary text-white"
              disabled={
                createBookingMutation.isPending || 
                (planType === "hourly" && (!selectedDate || !selectedTimeSlot)) ||
                ((planType === "monthly" || planType === "yearly") && !startDate) ||
                (bookingType === "per-person" && participantCount > (facility?.capacity || 10))
              }
            >
              {createBookingMutation.isPending ? "Processing..." : "Book Now"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}