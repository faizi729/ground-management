import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { Facility } from "@shared/schema";

interface FacilityCardProps {
  facility: Facility;
  onBookNow?: () => void;
}

const facilityImages: Record<string, string> = {
  badminton: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
  soccer: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
  basketball: "https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
  swimming: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
  cricket: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
  "multi-purpose": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
};

export default function FacilityCard({ facility, onBookNow }: FacilityCardProps) {
  const { isAuthenticated } = useAuth();

  const handleBookNow = () => {
    if (onBookNow) {
      onBookNow();
    } else {
      // Fallback to the old booking page if no callback provided
      window.location.href = `/booking/${facility.id}`;
    }
  };

  const getStatusBadge = () => {
    if (!facility.isActive) {
      return <Badge variant="destructive">Closed</Badge>;
    }
    
    // For now, show all active facilities as available
    // In a real app, this would check current bookings
    return <Badge className="bg-secondary text-white">Available</Badge>;
  };

  const formatPrice = (price: string | number) => {
    return `₹${Number(price).toLocaleString()}`;
  };

  return (
    <Card className="facility-card-hover cursor-pointer overflow-hidden">
      <div className="relative">
        <img 
          src={facility.imageUrl || facilityImages[facility.type] || facilityImages['multi-purpose']} 
          alt={facility.name}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-4 right-4">
          {getStatusBadge()}
        </div>
      </div>
      
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-semibold text-gray-900">{facility.name}</h3>
        </div>
        
        <p className="text-gray-600 mb-4 line-clamp-2">{facility.description}</p>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-500">
            <Users className="h-4 w-4 mr-2" />
            <span>Capacity: {facility.capacity} people</span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="h-4 w-4 mr-2" />
            <span>6:00 AM - 10:00 PM</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-primary font-semibold text-lg">
              {formatPrice(facility.hourlyRate)}/hour
            </span>
            {facility.monthlyRate && (
              <span className="text-sm text-gray-500">
                {formatPrice(facility.monthlyRate)}/month
              </span>
            )}
          </div>
          
          <Button 
            onClick={handleBookNow}
            className="btn-sports-primary"
            disabled={!facility.isActive}
          >
            Book Now
          </Button>
        </div>
        
        {facility.amenities && Array.isArray(facility.amenities) && facility.amenities.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-1">
              {facility.amenities.slice(0, 3).map((amenity, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {amenity as string}
                </Badge>
              ))}
              {facility.amenities.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{facility.amenities.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
