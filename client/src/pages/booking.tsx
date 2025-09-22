import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import FacilityCard from "@/components/FacilityCard";
import BookingModal from "@/components/BookingModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Clock, Users, MapPin } from "lucide-react";
import { Link } from "wouter";
// Import facility type from API response

export default function Booking() {
  const { facilityId } = useParams<{ facilityId?: string }>();
  const [selectedFacility, setSelectedFacility] = useState<any | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const { data: facilities, isLoading } = useQuery<any[]>({
    queryKey: ["/api/facilities"],
  });

  const { data: facility, isLoading: facilityLoading } = useQuery<any>({
    queryKey: ["/api/facilities", facilityId],
    enabled: !!facilityId,
  });

  // If facilityId is provided and facility is loaded, open booking modal automatically
  useEffect(() => {
    if (facility && facilityId && !selectedFacility) {
      setSelectedFacility(facility);
      setIsBookingModalOpen(true);
    }
  }, [facility, facilityId, selectedFacility]);

  const handleFacilitySelect = (facility: any) => {
    setSelectedFacility(facility);
    setIsBookingModalOpen(true);
  };

  const facilityImages: Record<string, string> = {
    badminton: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600",
    soccer: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600",
    basketball: "https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600",
    swimming: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600",
    cricket: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600",
    "multi-purpose": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600"
  };

  const getStatusBadge = (facility: any) => {
    if (!facility.isActive) {
      return <Badge variant="destructive">Closed</Badge>;
    }
    return <Badge className="bg-secondary text-white">Available</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link href="/facilities">
            <Button variant="ghost" size="sm" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Facilities
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Book a Facility</h1>
            <p className="text-gray-600">
              {facilityId ? "Complete your booking" : "Choose a facility to get started"}
            </p>
          </div>
        </div>

        {/* Specific Facility View */}
        {facilityId && facility && (
          <Card className="mb-8 overflow-hidden">
            <div className="md:flex">
              <div className="md:flex-shrink-0">
                <img 
                  className="h-48 w-full object-cover md:h-full md:w-48"
                  src={facility.imageUrl || facilityImages[facility.type] || facilityImages['multi-purpose']} 
                  alt={facility.name}
                />
              </div>
              <CardContent className="p-8 flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{facility.name}</h2>
                    <p className="text-gray-600 mb-4">{facility.description}</p>
                  </div>
                  {getStatusBadge(facility)}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-primary mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Capacity</p>
                      <p className="font-medium">{facility.capacity} people</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-primary mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Operating Hours</p>
                      <p className="font-medium">6:00 AM - 10:00 PM</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-primary mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Type</p>
                      <p className="font-medium capitalize">{facility.type.replace('-', ' ')}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Starting from</p>
                      <p className="text-2xl font-bold text-primary">
                        ₹{Number(facility.hourlyRate).toLocaleString()}/hour
                      </p>
                    </div>
                    {facility.monthlyRate && (
                      <div>
                        <p className="text-sm text-gray-500">Monthly</p>
                        <p className="text-lg font-semibold text-gray-700">
                          ₹{Number(facility.monthlyRate).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    onClick={() => handleFacilitySelect(facility)}
                    className="btn-sports-primary"
                    disabled={!facility.isActive}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Book This Facility
                  </Button>
                </div>

                {/* Amenities */}
                {facility.amenities && Array.isArray(facility.amenities) && facility.amenities.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold mb-3">Amenities</h3>
                    <div className="flex flex-wrap gap-2">
                      {facility.amenities.map((amenity: any, index: number) => (
                        <Badge key={index} variant="outline">
                          {String(amenity)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </div>
          </Card>
        )}

        {/* All Facilities Grid */}
        {!facilityId && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose Your Facility</h2>
            
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
                    <div className="w-full h-48 bg-gray-300"></div>
                    <div className="p-6">
                      <div className="h-4 bg-gray-300 rounded mb-2"></div>
                      <div className="h-3 bg-gray-300 rounded mb-4 w-3/4"></div>
                      <div className="flex justify-between">
                        <div className="h-4 bg-gray-300 rounded w-20"></div>
                        <div className="h-8 bg-gray-300 rounded w-24"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : facilities && facilities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {facilities.map((facility: any) => (
                  <div key={facility.id} onClick={() => handleFacilitySelect(facility)}>
                    <FacilityCard facility={facility} />
                  </div>
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No facilities available</h3>
                  <p className="text-gray-500">Please check back later or contact support.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Booking Process Info */}
        <Card className="mt-12">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">How to Book</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Choose Facility</h3>
                <p className="text-gray-600">Select your preferred sports facility and check availability</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Pick Date & Time</h3>
                <p className="text-gray-600">Choose your booking date, time slot, and duration</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Complete Payment</h3>
                <p className="text-gray-600">Pay securely online and receive instant confirmation</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booking Modal */}
      <BookingModal
        facility={selectedFacility}
        isOpen={isBookingModalOpen}
        onClose={() => {
          console.log("Booking page: onClose called - navigating to home");
          setIsBookingModalOpen(false);
          setSelectedFacility(null);
          // The modal will handle navigation to home screen
        }}
      />
    </div>
  );
}
