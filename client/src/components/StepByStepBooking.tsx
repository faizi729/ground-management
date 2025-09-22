import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ArrowLeft, ArrowRight, Check, Calendar as CalendarIcon, Clock, Users, CreditCard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface StepByStepBookingProps {
  isOpen: boolean;
  onClose: () => void;
  isAdminBooking?: boolean;
}

interface Sport {
  id: number;
  sportName: string;
  bookingType: string;
  description?: string;
  imageUrl?: string;
}

interface Ground {
  id: number;
  sportId: number;
  groundName: string;
  location?: string;
  maxCapacity?: number;
  facilities?: string;
  imageUrl?: string;
}

interface Plan {
  id: number;
  groundId: number;
  planName: string;
  planType: string;
  durationDays: number;
  basePrice: number;
  peakHourMultiplier: number;
  weekendMultiplier: number;
  description?: string;
}

interface TimeSlot {
  id: string;
  facilityId: number;
  timeSlotId: number;
  startTime: string;
  endTime: string;
  slotName: string;
  isPeakHour: boolean;
  isAvailable: boolean;
  availableCapacity: number;
  maxCapacity: number;
  totalPrice: number;
}

export default function StepByStepBooking({ isOpen, onClose, isAdminBooking = false }: StepByStepBookingProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);
  const [selectedGround, setSelectedGround] = useState<Ground | null>(null);
  const [selectedBookingMode, setSelectedBookingMode] = useState<"per-person" | "full-ground">("per-person");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [numberOfPersons, setNumberOfPersons] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [numberOfHours, setNumberOfHours] = useState(1);

  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Step 1: Fetch all sports
  const { data: sports = [], isLoading: sportsLoading } = useQuery<Sport[]>({
    queryKey: ["/api/sports"],
    queryFn: async () => {
      const response = await fetch("/api/sports", { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch sports');
      return response.json();
    },
    enabled: isOpen,
  });

  // Step 2: Fetch grounds for selected sport
  const { data: grounds = [], isLoading: groundsLoading } = useQuery<Ground[]>({
    queryKey: ["/api/grounds", selectedSport?.id],
    queryFn: async () => {
      const response = await fetch(`/api/grounds?sportId=${selectedSport?.id}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch grounds');
      return response.json();
    },
    enabled: !!selectedSport?.id,
  });

  // Step 4: Fetch plans for selected ground
  const { data: plans = [], isLoading: plansLoading } = useQuery<Plan[]>({
    queryKey: ["/api/plans", selectedGround?.id],
    queryFn: async () => {
      const response = await fetch(`/api/plans?groundId=${selectedGround?.id}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch plans');
      return response.json();
    },
    enabled: !!selectedGround?.id,
  });

  // Step 6: Fetch time slots with availability
  const { data: timeSlots = [], isLoading: timeSlotsLoading } = useQuery<TimeSlot[]>({
    queryKey: ["/api/facilities", selectedGround?.id, "slots", selectedDate?.toISOString().split('T')[0]],
    queryFn: async () => {
      if (!selectedGround?.id || !selectedDate) return [];
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await fetch(`/api/facilities/${selectedGround.id}/slots?date=${dateStr}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch time slots');
      return response.json();
    },
    enabled: !!selectedGround?.id && !!selectedDate && currentStep >= 6,
  });

  // Calculate end date when plan or date changes
  useEffect(() => {
    if (selectedPlan && selectedDate) {
      if (selectedPlan.planType === 'hourly') {
        setEndDate(selectedDate);
      } else {
        const calculatedEndDate = new Date(selectedDate);
        calculatedEndDate.setDate(calculatedEndDate.getDate() + selectedPlan.durationDays - 1);
        setEndDate(calculatedEndDate);
      }
    }
  }, [selectedPlan, selectedDate]);

  // Get available booking modes for selected sport
  const getAvailableBookingModes = () => {
    if (!selectedSport) return [];
    
    const modes = [];
    if (selectedSport.bookingType === "per-person") modes.push("per-person");
    if (selectedSport.bookingType === "full-ground") modes.push("full-ground");
    if (selectedSport.bookingType === "both") {
      modes.push("per-person");
      modes.push("full-ground");
    }
    
    return modes;
  };

  // Filter plans based on booking mode
  const getFilteredPlans = () => {
    if (!plans.length) return [];
    
    return plans.filter(plan => {
      const planName = plan.planName.toLowerCase();
      const modeKeyword = selectedBookingMode === "per-person" ? "person" : "court";
      return planName.includes(modeKeyword);
    });
  };

  // Calculate total price
  const calculateTotalPrice = () => {
    if (!selectedPlan || !selectedTimeSlots.length || !timeSlots.length) return 0;
    
    let total = 0;
    selectedTimeSlots.forEach(slotId => {
      const slot = timeSlots.find(s => s.id === slotId);
      if (slot) {
        const basePrice = selectedPlan.basePrice;
        const participants = selectedBookingMode === "per-person" ? numberOfPersons : 1;
        const peakMultiplier = slot.isPeakHour ? selectedPlan.peakHourMultiplier : 1;
        const isWeekend = selectedDate ? [0, 6].includes(selectedDate.getDay()) : false;
        const weekendMultiplier = isWeekend ? selectedPlan.weekendMultiplier : 1;
        
        total += basePrice * participants * peakMultiplier * weekendMultiplier;
      }
    });
    
    return total;
  };

  // Handle next step
  const handleNext = () => {
    if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Check if current step is valid
  const isStepValid = () => {
    switch (currentStep) {
      case 1: return !!selectedSport;
      case 2: return !!selectedGround && selectedGround.sportId === selectedSport?.id;
      case 3: return !!selectedBookingMode && getAvailableBookingModes().includes(selectedBookingMode);
      case 4: return !!selectedPlan && (selectedBookingMode === "full-ground" || numberOfPersons > 0);
      case 5: return !!selectedDate;
      case 6: return selectedTimeSlots.length > 0;
      case 7: return true;
      default: return false;
    }
  };

  // Handle booking submission
  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      return await apiRequest("POST", "/api/bookings", bookingData);
    },
    onSuccess: async (response) => {
      const booking = await response.json();
      toast({
        title: "Booking Created Successfully!",
        description: `Your booking has been created with ID: ${booking.id}`,
      });
      
      // Navigate to payment page
      const total = calculateTotalPrice();
      setLocation(`/payment/${booking.id}?total=${total}&isAdmin=${isAdminBooking}`);
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create booking",
        variant: "destructive",
      });
    },
  });

  const handleBookNow = () => {
    if (!selectedSport || !selectedGround || !selectedPlan || !selectedDate || !selectedTimeSlots.length) {
      toast({
        title: "Invalid Selection",
        description: "Please complete all required fields",
        variant: "destructive",
      });
      return;
    }

    const bookingData = {
      sportId: selectedSport.id,
      groundId: selectedGround.id,
      bookingType: selectedBookingMode,
      planType: selectedPlan.planType,
      planId: selectedPlan.id,
      bookingDate: selectedDate.toISOString().split('T')[0],
      participantCount: selectedBookingMode === "per-person" ? numberOfPersons : 1,
      timeSlots: selectedTimeSlots,
      totalAmount: calculateTotalPrice(),
      status: "pending",
    };

    createBookingMutation.mutate(bookingData);
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setSelectedSport(null);
      setSelectedGround(null);
      setSelectedBookingMode("per-person");
      setSelectedPlan(null);
      setNumberOfPersons(1);
      setSelectedDate(new Date());
      setEndDate(null);
      setSelectedTimeSlots([]);
      setNumberOfHours(1);
    }
  }, [isOpen]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 1: Select Sport</h3>
            {sportsLoading ? (
              <div className="text-center py-8">Loading sports...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sports.map((sport) => (
                  <Card 
                    key={sport.id} 
                    className={`cursor-pointer transition-all ${selectedSport?.id === sport.id ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md'}`}
                    onClick={() => setSelectedSport(sport)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        {sport.imageUrl && (
                          <img src={sport.imageUrl} alt={sport.sportName} className="w-12 h-12 object-cover rounded" />
                        )}
                        <div>
                          <h4 className="font-medium">{sport.sportName}</h4>
                          {sport.description && (
                            <p className="text-sm text-gray-600">{sport.description}</p>
                          )}
                          <Badge variant="outline" className="mt-1 text-xs">
                            {sport.bookingType}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 2: Select Ground</h3>
            <p className="text-sm text-gray-600">Sport: {selectedSport?.sportName}</p>
            {groundsLoading ? (
              <div className="text-center py-8">Loading grounds...</div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {grounds.map((ground) => (
                  <Card 
                    key={ground.id} 
                    className={`cursor-pointer transition-all ${selectedGround?.id === ground.id ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md'}`}
                    onClick={() => setSelectedGround(ground)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{ground.groundName}</h4>
                          {ground.location && (
                            <p className="text-sm text-gray-600">{ground.location}</p>
                          )}
                          {ground.facilities && (
                            <p className="text-sm text-gray-500 mt-1">{ground.facilities}</p>
                          )}
                        </div>
                        <div className="text-right">
                          {ground.maxCapacity && (
                            <Badge variant="secondary">
                              <Users className="w-3 h-3 mr-1" />
                              Max: {ground.maxCapacity}
                            </Badge>
                          )}
                          <div className="mt-2 space-x-1">
                            <Badge variant="outline" className="text-xs">
                              {selectedSport?.bookingType === "both" ? "Both Modes" : 
                               selectedSport?.bookingType === "per-person" ? "Per Person" : 
                               selectedSport?.bookingType === "full-ground" ? "Full Ground" : "Available"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 3: Select Booking Mode</h3>
            <p className="text-sm text-gray-600">Ground: {selectedGround?.groundName}</p>
            <RadioGroup 
              value={selectedBookingMode} 
              onValueChange={(value) => setSelectedBookingMode(value as "per-person" | "full-ground")}
            >
              {getAvailableBookingModes().map((mode) => (
                <div key={mode} className="flex items-center space-x-2">
                  <RadioGroupItem value={mode} id={mode} />
                  <Label htmlFor={mode} className="cursor-pointer">
                    {mode === "per-person" ? "Per Person Booking" : "Full Ground Booking"}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 4: Select Plan & Number of Persons</h3>
            <p className="text-sm text-gray-600">Booking Mode: {selectedBookingMode}</p>
            
            {plansLoading ? (
              <div className="text-center py-8">Loading plans...</div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label>Select Plan</Label>
                  <div className="grid grid-cols-1 gap-3 mt-2">
                    {getFilteredPlans().map((plan) => (
                      <Card 
                        key={plan.id} 
                        className={`cursor-pointer transition-all ${selectedPlan?.id === plan.id ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md'}`}
                        onClick={() => setSelectedPlan(plan)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium">{plan.planName}</h4>
                              <p className="text-sm text-gray-600">₹{plan.basePrice} - {plan.planType}</p>
                              {plan.description && (
                                <p className="text-xs text-gray-500 mt-1">{plan.description}</p>
                              )}
                            </div>
                            <Badge variant={plan.planType === 'hourly' ? 'default' : 'secondary'}>
                              {plan.durationDays} {plan.planType === 'hourly' ? 'hour' : 'days'}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {selectedBookingMode === "per-person" && selectedGround?.maxCapacity && (
                  <div>
                    <Label>Number of Persons</Label>
                    <Select 
                      value={numberOfPersons.toString()} 
                      onValueChange={(value) => setNumberOfPersons(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: selectedGround.maxCapacity }, (_, i) => i + 1).map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} {num === 1 ? 'Person' : 'Persons'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 5: Select Date</h3>
            <p className="text-sm text-gray-600">Plan: {selectedPlan?.planName}</p>
            
            <div className="space-y-4">
              <div>
                <Label>
                  {selectedPlan?.planType === 'hourly' ? 'Booking Date' : 'Start Date'}
                </Label>
                <div className="mt-2">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    className="rounded-md border"
                  />
                </div>
              </div>

              {selectedPlan?.planType !== 'hourly' && endDate && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Calculated End Date</span>
                  </div>
                  <p className="text-blue-700 mt-1">
                    Your {selectedPlan?.planType} plan will end on: {endDate.toLocaleDateString()}
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    Duration: {selectedPlan?.durationDays} days
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 6: Select Time Slots</h3>
            <p className="text-sm text-gray-600">
              Date: {selectedDate?.toLocaleDateString()}
              {selectedPlan?.planType === 'hourly' && (
                <span className="ml-4">
                  Select {numberOfHours} slot{numberOfHours > 1 ? 's' : ''}
                </span>
              )}
            </p>

            {selectedPlan?.planType === 'hourly' && (
              <div className="mb-4">
                <Label>Number of Hours</Label>
                <Select 
                  value={numberOfHours.toString()} 
                  onValueChange={(value) => {
                    setNumberOfHours(parseInt(value));
                    setSelectedTimeSlots([]); // Reset selection when changing hours
                  }}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((hours) => (
                      <SelectItem key={hours} value={hours.toString()}>
                        {hours} {hours === 1 ? 'Hour' : 'Hours'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {timeSlotsLoading ? (
              <div className="text-center py-8">Loading time slots...</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {timeSlots.map((slot) => {
                  const isSelected = selectedTimeSlots.includes(slot.id);
                  const isAvailable = selectedBookingMode === "full-ground" 
                    ? slot.isAvailable 
                    : slot.isAvailable && slot.availableCapacity >= numberOfPersons;
                  const canSelect = isAvailable && (
                    selectedPlan?.planType !== 'hourly' || selectedTimeSlots.length < numberOfHours || isSelected
                  );

                  return (
                    <Card 
                      key={slot.id}
                      className={`cursor-pointer transition-all ${
                        isSelected 
                          ? 'ring-2 ring-primary bg-primary/5' 
                          : canSelect 
                            ? 'hover:shadow-md' 
                            : 'opacity-50 cursor-not-allowed'
                      }`}
                      onClick={() => {
                        if (!canSelect) return;
                        
                        if (isSelected) {
                          setSelectedTimeSlots(prev => prev.filter(id => id !== slot.id));
                        } else {
                          if (selectedPlan?.planType === 'hourly' && selectedTimeSlots.length >= numberOfHours) {
                            return; // Can't select more slots than hours
                          }
                          setSelectedTimeSlots(prev => [...prev, slot.id]);
                        }
                      }}
                    >
                      <CardContent className="p-3">
                        <div className="text-center">
                          <div className="font-medium">{slot.slotName}</div>
                          <div className="text-sm text-gray-600">
                            {slot.startTime} - {slot.endTime}
                          </div>
                          {slot.isPeakHour && (
                            <Badge variant="destructive" className="text-xs mt-1">Peak</Badge>
                          )}
                          {selectedBookingMode === "per-person" && (
                            <div className="text-xs text-gray-500 mt-1">
                              Available: {slot.availableCapacity}/{slot.maxCapacity}
                            </div>
                          )}
                          <div className="text-sm font-medium text-green-600 mt-1">
                            ₹{slot.totalPrice || 0}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Step 7: Booking Summary</h3>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Booking Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-gray-600">Sport</Label>
                    <p className="font-medium">{selectedSport?.sportName}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Ground</Label>
                    <p className="font-medium">{selectedGround?.groundName}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Booking Mode</Label>
                    <p className="font-medium">{selectedBookingMode}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Plan</Label>
                    <p className="font-medium">{selectedPlan?.planName}</p>
                  </div>
                  {selectedBookingMode === "per-person" && (
                    <div>
                      <Label className="text-gray-600">Number of Persons</Label>
                      <p className="font-medium">{numberOfPersons}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-gray-600">Date</Label>
                    <p className="font-medium">{selectedDate?.toLocaleDateString()}</p>
                  </div>
                  {endDate && selectedPlan?.planType !== 'hourly' && (
                    <div>
                      <Label className="text-gray-600">End Date</Label>
                      <p className="font-medium">{endDate.toLocaleDateString()}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-gray-600">Time Slots</Label>
                    <div className="space-y-1">
                      {selectedTimeSlots.map(slotId => {
                        const slot = timeSlots.find(s => s.id === slotId);
                        return slot ? (
                          <p key={slotId} className="font-medium text-sm">
                            {slot.slotName} ({slot.startTime} - {slot.endTime})
                            {slot.isPeakHour && <Badge variant="destructive" className="ml-2 text-xs">Peak</Badge>}
                          </p>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    Total: ₹{calculateTotalPrice().toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Including peak hour and weekend charges if applicable
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleBookNow}
                disabled={createBookingMutation.isPending}
                className="flex-1"
              >
                {createBookingMutation.isPending ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Creating Booking...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Book Now
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isAdminBooking ? "Admin Booking" : "Book Facility"} - Step {currentStep} of 7
          </DialogTitle>
          <DialogDescription>
            Follow the step-by-step process to complete your booking
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            {[1, 2, 3, 4, 5, 6, 7].map((step) => (
              <div
                key={step}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step < currentStep ? <Check className="w-4 h-4" /> : step}
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep - 1) / 6) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        {currentStep < 7 && (
          <div className="flex justify-between pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <Button 
              onClick={handleNext}
              disabled={!isStepValid()}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}