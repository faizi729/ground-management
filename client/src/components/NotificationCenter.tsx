import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bell, 
  Check, 
  Clock, 
  Calendar, 
  CreditCard, 
  Info,
  X,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { format } from "date-fns";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  metadata?: any;
  relatedBookingId?: number;
}

export default function NotificationCenter() {
  const [filter, setFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return await apiRequest("PATCH", `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_confirmation':
      case 'booking_reminder':
        return <Calendar className="h-4 w-4" />;
      case 'payment_reminder':
        return <CreditCard className="h-4 w-4" />;
      case 'booking_cancelled':
        return <X className="h-4 w-4" />;
      case 'queue_update':
        return <Clock className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationBadge = (type: string) => {
    const config = {
      'booking_confirmation': { variant: 'default' as const, color: 'text-green-600' },
      'booking_reminder': { variant: 'secondary' as const, color: 'text-blue-600' },
      'payment_reminder': { variant: 'destructive' as const, color: 'text-orange-600' },
      'booking_cancelled': { variant: 'destructive' as const, color: 'text-red-600' },
      'queue_update': { variant: 'outline' as const, color: 'text-purple-600' },
    };

    const typeConfig = config[type as keyof typeof config] || config.booking_confirmation;
    
    return (
      <Badge variant={typeConfig.variant} className="text-xs">
        <span className={typeConfig.color}>
          {type.replace('_', ' ').toUpperCase()}
        </span>
      </Badge>
    );
  };

  const filteredNotifications = notifications?.filter(notification => {
    if (filter === "all") return true;
    if (filter === "unread") return !notification.isRead;
    return notification.type === filter;
  }) || [];

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  return (
    <div className="w-full max-w-7xl mx-auto">
   <Card className="">
  <CardHeader>
    {/* Header: title left, filters right (stacks on mobile) */}
    <div className="flex flex-col sm:flex-col sm:items-center sm:justify-between w-full gap-3">
      <div className="flex items-center gap-3">
        <Bell className="h-5 w-5" />
        <h3 className="text-lg font-semibold leading-none">Notifications</h3>
        {unreadCount > 0 && (
          <Badge variant="destructive" className="ml-1">
            {unreadCount}
          </Badge>
        )}
      </div>

      {/* Filters: full width on mobile (below title), right-aligned on desktop */}
      <div className="w-full sm:w-auto flex justify-start sm:justify-end">
        <div className="inline-flex flex-wrap items-center gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button
            variant={filter === "unread" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("unread")}
          >
            Unread ({unreadCount})
          </Button>
          <Button
            variant={filter === "booking_reminder" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("booking_reminder")}
          >
            Reminders
          </Button>
          <Button
            variant={filter === "payment_reminder" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("payment_reminder")}
          >
            Payments
          </Button>
        </div>
      </div>
    </div>
  </CardHeader>

  <CardContent>
    {isLoading ? (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    ) : filteredNotifications.length === 0 ? (
      <div className="text-center py-8 text-gray-500">
        <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>No notifications found</p>
      </div>
    ) : (
      <ScrollArea className="h-96 pr-2">
       <div className="space-y-4 w-full  ">
  {filteredNotifications.map((notification) => (
    <div
      key={notification.id}
      className={`p-4 border rounded-lg transition-colors ${
        notification.isRead
          ? "bg-gray-50 border-gray-200"
          : "bg-blue-50 border-blue-200"
      }`}
    >
      {/* Make everything stack in column layout */}
      <div className="flex flex-col gap-3">
        {/* Icon + Title + Badge */}
        <div className="flex items-start gap-3">
          <div
            className={`mt-1 ${
              notification.isRead ? "text-gray-400" : "text-blue-600"
            }`}
          >
            {getNotificationIcon(notification.type)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4
                className={`font-medium truncate ${
                  notification.isRead ? "text-gray-700" : "text-gray-900"
                }`}
                title={notification.title}
              >
                {notification.title}
              </h4>

              <span className="shrink-0">
                {getNotificationBadge(notification.type)}
              </span>
            </div>

            <p
              className={`text-md ${
                notification.isRead ? "text-gray-600" : "text-gray-800"
              } break-words`}
            >
              {notification.message}
            </p>
          </div>
        </div>

        {/* Footer: date + booking ID */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <span>
            {format(new Date(notification.createdAt), "MMM dd, yyyy h:mm a")}
          </span>
          {notification.relatedBookingId && (
            <span>Booking #{notification.relatedBookingId}</span>
          )}
        </div>

        {/* Actions (Mark Read / Check icon) */}
        <div className="flex items-center">
          {!notification.isRead ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAsReadMutation.mutate(notification.id)}
              disabled={markAsReadMutation.isPending}
            >
              <Check className="h-3 w-3 mr-1" />
              Mark Read
            </Button>
          ) : (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
        </div>
      </div>
    </div>
  ))}
</div>

      </ScrollArea>
    )}
  </CardContent>
</Card>
</div>

  );
}