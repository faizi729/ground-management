import { Button } from "@/components/ui/button";
import { CalendarPlus, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function HeroSection() {
  const { isAuthenticated } = useAuth();

  const scrollToFacilities = () => {
    const element = document.querySelector('#facilities');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleBookNow = () => {
    // Always redirect to facilities - users can explore before login
    window.location.href = '/facilities';
  };

  return (
    <section id="home" className="relative h-screen flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat" 
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080')"
        }}
      />
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      
      <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Welcome to <br /><span className="text-black">Aryen Sports Arena</span>
        </h1>
        <p className="text-xl md:text-2xl mb-8 text-gray-200">
          Book premium sports facilities online. Play badminton, soccer, basketball, swim, and more!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={handleBookNow}
            className="bg-primary hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all transform hover:scale-105"
            size="lg"
          >
            <CalendarPlus className="mr-2 h-5 w-5" />
            Book a Slot Now
          </Button>
          <Button 
            onClick={scrollToFacilities}
            variant="outline"
            className="bg-transparent border-2 border-white hover:bg-white hover:text-gray-900 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all"
            size="lg"
          >
            <Search className="mr-2 h-5 w-5" />
            Explore Facilities
          </Button>
        </div>
      </div>
      
      {/* Floating scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <button 
          onClick={scrollToFacilities}
          className="text-white hover:text-accent transition-colors"
        >
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse" />
          </div>
        </button>
      </div>
    </section>
  );
}
