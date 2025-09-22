import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import FacilityCard from "@/components/FacilityCard";
import BookingModal from "@/components/BookingModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, SortAsc, MapPin } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
// Remove unused import - using API response instead

export default function Facilities() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [filterTypes, setFilterTypes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<any | null>(null);

  const { data: facilities, isLoading } = useQuery<any[]>({
    queryKey: ["/api/facilities"],
    refetchInterval: 60000, // Real-time updates every minute
  });

  const facilityTypes = [
    { value: "badminton", label: "Badminton" },
    { value: "soccer", label: "Soccer" },
    { value: "basketball", label: "Basketball" },
    { value: "swimming", label: "Swimming" },
    { value: "cricket", label: "Cricket" },
    { value: "multi-purpose", label: "Multi-Purpose" },
  ];

  const filteredFacilities = facilities?.filter((facility) => {
    const matchesSearch = facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         facility.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterTypes.length === 0 || filterTypes.includes(facility.type);
    
    const hourlyRate = Number(facility.hourlyRate);
    const matchesPrice = hourlyRate >= priceRange[0] && hourlyRate <= priceRange[1];
    
    return matchesSearch && matchesType && matchesPrice && facility.isActive;
  });

  const sortedFacilities = filteredFacilities?.sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "price-low":
        return Number(a.hourlyRate) - Number(b.hourlyRate);
      case "price-high":
        return Number(b.hourlyRate) - Number(a.hourlyRate);
      case "capacity":
        return b.capacity - a.capacity;
      default:
        return 0;
    }
  });

  const handleTypeFilter = (type: string, checked: boolean) => {
    if (checked) {
      setFilterTypes([...filterTypes, type]);
    } else {
      setFilterTypes(filterTypes.filter(t => t !== type));
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterTypes([]);
    setPriceRange([0, 1000]);
    setSortBy("name");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Our Facilities</h1>
          <p className="text-gray-600">
            Discover and book from our wide range of premium sports facilities
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search facilities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Sort */}
              <div className="w-full lg:w-48">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SortAsc className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name (A-Z)</SelectItem>
                    <SelectItem value="price-low">Price (Low to High)</SelectItem>
                    <SelectItem value="price-high">Price (High to Low)</SelectItem>
                    <SelectItem value="capacity">Capacity</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Mobile Filter Button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    {filterTypes.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {filterTypes.length}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Filter Facilities</SheetTitle>
                    <SheetDescription>
                      Narrow down your search with these filters
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 space-y-6">
                    {/* Type Filter */}
                    <div>
                      <h3 className="font-medium mb-3">Facility Type</h3>
                      <div className="space-y-2">
                        {facilityTypes.map((type) => (
                          <div key={type.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`mobile-${type.value}`}
                              checked={filterTypes.includes(type.value)}
                              onCheckedChange={(checked) => 
                                handleTypeFilter(type.value, checked as boolean)
                              }
                            />
                            <label htmlFor={`mobile-${type.value}`} className="text-sm">
                              {type.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Price Range */}
                    <div>
                      <h3 className="font-medium mb-3">Price Range (per hour)</h3>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            placeholder="Min"
                            value={priceRange[0]}
                            onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                          />
                          <span>-</span>
                          <Input
                            type="number"
                            placeholder="Max"
                            value={priceRange[1]}
                            onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                          />
                        </div>
                      </div>
                    </div>

                    <Button onClick={clearFilters} variant="outline" className="w-full">
                      Clear Filters
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Desktop Filter Button */}
              <Button 
                variant="outline" 
                onClick={clearFilters}
                className="hidden lg:inline-flex"
                disabled={filterTypes.length === 0 && searchTerm === "" && priceRange[0] === 0 && priceRange[1] === 1000}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Desktop Filters Sidebar */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-8">
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Facility Type</h3>
                <div className="space-y-2">
                  {facilityTypes.map((type) => (
                    <div key={type.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={type.value}
                        checked={filterTypes.includes(type.value)}
                        onCheckedChange={(checked) => 
                          handleTypeFilter(type.value, checked as boolean)
                        }
                      />
                      <label htmlFor={type.value} className="text-sm">
                        {type.label}
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Price Range (per hour)</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                    />
                    <span>-</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Current range: ₹{priceRange[0]} - ₹{priceRange[1]}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Facilities Grid */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            ) : sortedFacilities && sortedFacilities.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <p className="text-gray-600">
                    Found {sortedFacilities.length} facilities
                    {filterTypes.length > 0 && (
                      <span className="ml-2">
                        filtered by: {filterTypes.join(", ")}
                      </span>
                    )}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedFacilities.map((facility) => (
                    <FacilityCard 
                      key={facility.id} 
                      facility={facility} 
                      onBookNow={() => {
                        setSelectedFacility(facility);
                        setIsBookingOpen(true);
                      }}
                    />
                  ))}
                </div>
              </>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No facilities found</h3>
                  <p className="text-gray-500 mb-4">
                    Try adjusting your search criteria or clearing the filters
                  </p>
                  <Button onClick={clearFilters} variant="outline">
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Mobile Facilities Grid */}
        <div className="lg:hidden">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
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
          ) : sortedFacilities && sortedFacilities.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <p className="text-gray-600">
                  Found {sortedFacilities.length} facilities
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sortedFacilities.map((facility) => (
                  <FacilityCard 
                    key={facility.id} 
                    facility={facility} 
                    onBookNow={() => {
                      setSelectedFacility(facility);
                      setIsBookingOpen(true);
                    }}
                  />
                ))}
              </div>
            </>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No facilities found</h3>
                <p className="text-gray-500 mb-4">
                  Try adjusting your search criteria or clearing the filters
                </p>
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {selectedFacility && (
        <BookingModal 
          isOpen={isBookingOpen}
          onClose={() => {
            setIsBookingOpen(false);
            setSelectedFacility(null);
          }}
          facility={selectedFacility}
          isAdminBooking={false}
        />
      )}
    </div>
  );
}
