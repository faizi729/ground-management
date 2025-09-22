import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dumbbell, Menu, User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Navbar() {
  const { isAuthenticated, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    { name: "Home", href: "/" },
    { name: "Facilities", href: "/facilities" },
    { name: "About", href: "#about" },
    { name: "FAQs", href: "#faqs" },
    { name: "Contact", href: "#contact" },
  ];

  const userNavigationItems = isAuthenticated ? [
    { name: "Dashboard", href: "/" },
    { name: "Facilities", href: "/facilities" },
    { name: "My Bookings", href: "/profile" },
    ...(user?.role === 'admin' || user?.role === 'manager' 
      ? [{ name: "Management", href: "/admin" }] 
      : []
    ),
  ] : navigationItems;

  const scrollToSection = (href: string) => {
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center">
            <Dumbbell className="h-8 w-8 text-primary mr-3" />
            <span className="font-bold text-xl text-gray-900">Aryen Sports Arena</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {!isAuthenticated ? (
              <>
                {navigationItems.map((item) => (
                  item.href.startsWith('#') ? (
                    <button
                      key={item.name}
                      onClick={() => scrollToSection(item.href)}
                      className="text-gray-700 hover:text-primary transition-colors"
                    >
                      {item.name}
                    </button>
                  ) : (
                    <Link 
                      key={item.name}
                      href={item.href}
                      className="text-gray-700 hover:text-primary transition-colors"
                    >
                      {item.name}
                    </Link>
                  )
                ))}
                <Button asChild className="btn-sports-primary">
                  <Link href="/login">Login</Link>
                </Button>
              </>
            ) : (
              <>
                {userNavigationItems.map((item) => (
                  <Link 
                    key={item.name}
                    href={item.href}
                    className="text-gray-700 hover:text-primary transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || undefined} />
                        <AvatarFallback>
                          {user?.firstName?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.location.href = '/api/logout'}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <div className="flex flex-col space-y-4 mt-4">
                  {!isAuthenticated ? (
                    <>
                      {navigationItems.map((item) => (
                        item.href.startsWith('#') ? (
                          <button
                            key={item.name}
                            onClick={() => {
                              scrollToSection(item.href);
                              setMobileMenuOpen(false);
                            }}
                            className="text-left py-2 text-gray-700 hover:text-primary"
                          >
                            {item.name}
                          </button>
                        ) : (
                          <Link 
                            key={item.name}
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className="block py-2 text-gray-700 hover:text-primary"
                          >
                            {item.name}
                          </Link>
                        )
                      ))}
                      <Button asChild className="w-full btn-sports-primary mt-4">
                        <Link href="/login">Login</Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center space-x-3 pb-4 border-b">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || undefined} />
                          <AvatarFallback>
                            {user?.firstName?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                          <p className="text-sm text-gray-500">{user?.email}</p>
                        </div>
                      </div>
                      
                      {userNavigationItems.map((item) => (
                        <Link 
                          key={item.name}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block py-2 text-gray-700 hover:text-primary"
                        >
                          {item.name}
                        </Link>
                      ))}
                      
                      <Button
                        variant="outline"
                        onClick={() => window.location.href = '/api/logout'}
                        className="w-full mt-4"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </Button>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
