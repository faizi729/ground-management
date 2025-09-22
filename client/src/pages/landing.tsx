import { useState } from "react";
import HeroSection from "@/components/HeroSection";
import Navbar from "@/components/Navbar";
import FacilityCard from "@/components/FacilityCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Dumbbell, Users, Award, Clock, MapPin, Phone, Mail, Facebook, Twitter, Instagram, Youtube, HelpCircle, FileText, ChevronDown, ChevronUp, Shield, AlertCircle, RefreshCw, Calendar } from "lucide-react";
import type { Ground as Facility } from "@shared/schema";


export default function Landing() {
  const { data: facilities, isLoading } = useQuery<Facility[]>({
    queryKey: ["/api/facilities"],
  });

  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <HeroSection />
      
      {/* Facilities Section */}
      <section id="facilities" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Premium Facilities
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              State-of-the-art sports facilities designed for all skill levels. Book your favorite sport and enjoy world-class amenities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 6 }).map((_, i) => (
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
              ))
            ) : facilities && facilities.length > 0 ? (
              facilities.map((facility) => (
                <FacilityCard key={facility.id} facility={facility} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-lg">No facilities available at the moment.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                About Aryen Sports Arena
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Established with a vision to promote sports and fitness in our community, Aryen Sports Arena 
                offers state-of-the-art facilities for athletes and sports enthusiasts of all levels.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Award className="h-6 w-6 text-secondary mr-3" />
                  <span className="text-gray-700">Professional-grade equipment and facilities</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-6 w-6 text-secondary mr-3" />
                  <span className="text-gray-700">Experienced coaches and trainers available</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-6 w-6 text-secondary mr-3" />
                  <span className="text-gray-700">Flexible booking options to suit your schedule</span>
                </div>
                <div className="flex items-center">
                  <Dumbbell className="h-6 w-6 text-secondary mr-3" />
                  <span className="text-gray-700">Clean, safe, and well-maintained environment</span>
                </div>
              </div>
            </div>
            <div>
              <img 
                src="https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt="Modern recreation centre building" 
                className="rounded-xl shadow-lg w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQs and Policy Section */}
      <section id="faqs" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              FAQs & Booking Policy
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to know about booking and using our facilities
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* FAQs Section */}
            <div>
              <div className="flex items-center mb-6">
                <HelpCircle className="h-6 w-6 text-primary mr-3" />
                <h3 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h3>
              </div>

              <div className="space-y-4">
                {[
                  {
                    question: "How do I book a facility?",
                    answer: "You can book facilities online through our website or mobile app. Simply select your preferred sport, date, time slot, and complete the payment process. You'll receive instant confirmation via email and SMS."
                  },
                  {
                    question: "What are the operating hours?",
                    answer: "Our facilities are open from 6:00 AM to 10:00 PM, Monday through Sunday. Peak hours (6:00-9:00 PM on weekdays and 8:00 AM-8:00 PM on weekends) have premium pricing."
                  },
                  {
                    question: "What payment methods do you accept?",
                    answer: "We accept all major credit/debit cards, UPI, net banking, and digital wallets. Payment is required at the time of booking to secure your slot."
                  },
                  {
                    question: "Can I modify or cancel my booking?",
                    answer: "Yes, you can modify or cancel bookings up to 4 hours before your scheduled time. Cancellations made 24+ hours in advance receive full refund, 4-24 hours receive 50% refund."
                  },
                  {
                    question: "Do you provide equipment rental?",
                    answer: "Yes, we offer equipment rental for all sports at additional cost. Equipment includes rackets, balls, protective gear, and other sport-specific items. Advance booking recommended."
                  },
                  {
                    question: "Are there membership plans available?",
                    answer: "Yes, we offer monthly and yearly membership plans with discounted rates, priority booking, and additional benefits. Contact us for detailed membership information and pricing."
                  }
                ].map((faq, index) => (
                  <Card key={index} className="border border-gray-200 hover:border-primary transition-colors">
                    <CardContent className="p-0">
                      <button
                        onClick={() => toggleFAQ(index)}
                        className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-semibold text-gray-900">{faq.question}</span>
                        {openFAQ === index ? (
                          <ChevronUp className="h-5 w-5 text-primary" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                      {openFAQ === index && (
                        <div className="px-4 pb-4">
                          <p className="text-gray-600">{faq.answer}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Booking Policy Section */}
            <div>
              <div className="flex items-center mb-6">
                <FileText className="h-6 w-6 text-primary mr-3" />
                <h3 className="text-2xl font-bold text-gray-900">Booking Policy</h3>
              </div>

              <div className="space-y-6">
                {/* Booking Terms */}
                <Card className="border-l-4 border-l-primary">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-3">
                      <Calendar className="h-5 w-5 text-primary mr-2" />
                      <h4 className="font-semibold text-gray-900">Booking Terms</h4>
                    </div>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Advance booking required for all facilities</li>
                      <li>• Maximum booking duration: 3 hours per session</li>
                      <li>• Bookings can be made up to 30 days in advance</li>
                      <li>• Minimum booking duration: 1 hour</li>
                      <li>• Group bookings (5+ people) get 10% discount</li>
                    </ul>
                  </CardContent>
                </Card>

                {/* Cancellation Policy */}
                <Card className="border-l-4 border-l-yellow-500">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-3">
                      <RefreshCw className="h-5 w-5 text-yellow-500 mr-2" />
                      <h4 className="font-semibold text-gray-900">Cancellation Policy</h4>
                    </div>
                    <ul className="space-y-2 text-gray-600">
                      <li>• <strong>24+ hours before:</strong> 100% refund</li>
                      <li>• <strong>4-24 hours before:</strong> 50% refund</li>
                      <li>• <strong>Less than 4 hours:</strong> No refund</li>
                      <li>• Weather cancellations: Full refund or reschedule</li>
                      <li>• Medical emergencies: Case-by-case review</li>
                    </ul>
                  </CardContent>
                </Card>

                {/* Facility Rules */}
                <Card className="border-l-4 border-l-red-500">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-3">
                      <Shield className="h-5 w-5 text-red-500 mr-2" />
                      <h4 className="font-semibold text-gray-900">Facility Rules</h4>
                    </div>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Proper sports attire and footwear mandatory</li>
                      <li>• No outside food and beverages allowed</li>
                      <li>• Smoking and alcohol strictly prohibited</li>
                      <li>• Clean up after use - maintain facility hygiene</li>
                      <li>• Report any damage or safety concerns immediately</li>
                    </ul>
                  </CardContent>
                </Card>

                {/* Safety Guidelines */}
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-3">
                      <AlertCircle className="h-5 w-5 text-green-500 mr-2" />
                      <h4 className="font-semibold text-gray-900">Safety Guidelines</h4>
                    </div>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Warm-up properly before playing</li>
                      <li>• Follow all safety instructions and signage</li>
                      <li>• Children under 16 must be supervised</li>
                      <li>• First aid available at reception</li>
                      <li>• Emergency contact: +91 98765 43210</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Get in Touch
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Have questions about our facilities or need assistance with booking? 
                We're here to help you get started on your fitness journey.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-gray-900">Address</h3>
                    <p className="text-gray-600">123 Sports Complex Road, Recreation District, City 560001</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                    <Phone className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-gray-900">Phone</h3>
                    <p className="text-gray-600">+91 98765 43210</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                    <Mail className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-gray-900">Email</h3>
                    <p className="text-gray-600">info@aryenrecreation.com</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-gray-900">Operating Hours</h3>
                    <p className="text-gray-600">Mon-Sun: 6:00 AM - 10:00 PM</p>
                  </div>
                </div>
              </div>
            </div>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Send us a Message</h3>
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input 
                      type="text" 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input 
                      type="email" 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input 
                      type="tel" 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <textarea 
                      rows={4} 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent" 
                      required
                    ></textarea>
                  </div>
                  <Button type="submit" className="w-full btn-sports-primary">
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Dumbbell className="h-8 w-8 text-primary mr-3" />
                <span className="font-bold text-xl">Aryen Sports Arena</span>
              </div>
              <p className="text-gray-400 mb-4">
                Your premier destination for sports and fitness. Join our community and achieve your goals.
              </p>
              <div className="flex space-x-4">
                <Facebook className="h-5 w-5 text-gray-400 hover:text-primary cursor-pointer transition-colors" />
                <Twitter className="h-5 w-5 text-gray-400 hover:text-primary cursor-pointer transition-colors" />
                <Instagram className="h-5 w-5 text-gray-400 hover:text-primary cursor-pointer transition-colors" />
                <Youtube className="h-5 w-5 text-gray-400 hover:text-primary cursor-pointer transition-colors" />
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#home" className="hover:text-primary transition-colors">Home</a></li>
                <li><a href="#facilities" className="hover:text-primary transition-colors">Facilities</a></li>
                <li><a href="#about" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#faqs" className="hover:text-primary transition-colors">FAQs & Policy</a></li>
                <li><a href="#contact" className="hover:text-primary transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Membership</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">Facilities</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-primary transition-colors">Badminton Courts</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Soccer Turf</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Basketball Court</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Swimming Pool</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Cricket Turf</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">Contact Info</h3>
              <div className="space-y-3 text-gray-400">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span className="text-sm">123 Sports Complex Road, City 560001</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  <span className="text-sm">+91 98765 43210</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  <span className="text-sm">info@aryenrecreation.com</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Aryen Sports Arena. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
