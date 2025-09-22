import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  LayoutDashboard, 
  Building2, 
  Calendar,
  Users, 
  Settings,
  Menu,
  Dumbbell,
  ChevronLeft,
  Trophy,
  MapPin,
  CreditCard,
  Clock,
  IndianRupee,
  BarChart3,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const sidebarItems: SidebarItem[] = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "Sports Management",
    href: "/admin/sports",
    icon: Trophy,
  },
  {
    name: "Grounds Management",
    href: "/admin/grounds",
    icon: MapPin,
  },
  {
    name: "Pricing Plans",
    href: "/admin/plans",
    icon: CreditCard,
  },
  {
    name: "Time Slots",
    href: "/admin/timeslots",
    icon: Clock,
  },
  {
    name: "Facilities",
    href: "/admin/facilities",
    icon: Building2,
  },
  {
    name: "Booking Management",
    href: "/admin/bookings",
    icon: Calendar,
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    name: "Payments",
    href: "/admin/payments",
    icon: IndianRupee,
  },
  {
    name: "Reports",
    href: "/admin/reports",
    icon: BarChart3,
  },
  {
    name: "Notifications",
    href: "/admin/notifications",
    icon: Bell,
  },
];

interface AdminSidebarProps {
  className?: string;
}

export default function AdminSidebar({ className }: AdminSidebarProps) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center px-6 py-4 border-b border-gray-200">
        <Dumbbell className="h-8 w-8 text-primary mr-3" />
        <div>
          <h1 className="font-bold text-lg">Aryen Sports Arena</h1>
          <p className="text-xs text-gray-500">Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || (item.href !== '/admin' && location.startsWith(item.href));
          
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start h-11",
                  isActive && "bg-primary text-white hover:bg-primary hover:text-white"
                )}
                onClick={() => setMobileOpen(false)}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.name}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Back to Site */}
      <div className="p-4 border-t border-gray-200">
        <Link href="/">
          <Button variant="outline" className="w-full" onClick={() => setMobileOpen(false)}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Site
          </Button>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-80">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className={cn("hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0", className)}>
        <SidebarContent />
      </div>
    </>
  );
}
