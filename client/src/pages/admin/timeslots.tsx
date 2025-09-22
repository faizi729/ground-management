import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import AdminSidebar from "@/components/AdminSidebar";
import { Plus, Pencil, Trash2, Clock, PauseCircle, PlayCircle } from "lucide-react";
import { z } from "zod";

// Time slot interface for master table
interface TimeSlotMaster {
  id: number;
  slotName: string;
  startTime: string;
  endTime: string;
  isPeakHour: boolean;
  isActive: boolean;
  slotOrder?: number;
  createdAt?: string;
}

// Form schema for time slots (master table)
const timeSlotFormSchema = z.object({
  slotName: z.string()
    .min(1, "Slot name is required")
    .min(2, "Slot name must be at least 2 characters")
    .max(50, "Slot name must be at most 50 characters"),
  startTime: z.string()
    .min(1, "Start time is required")
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please enter a valid time (HH:MM)"),
  endTime: z.string()
    .min(1, "End time is required")
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please enter a valid time (HH:MM)"),
  isPeakHour: z.boolean().default(false),
  slotOrder: z.number().min(1, "Slot order must be at least 1").optional(),
  isActive: z.boolean().default(true),
});

type TimeSlotFormData = z.infer<typeof timeSlotFormSchema>;

function isUnauthorizedError(error: any): boolean {
  return error?.status === 401 || error?.message?.includes("Unauthorized");
}

export default function AdminTimeSlots() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlotMaster | null>(null);

  // Redirect if not authenticated or not admin/manager
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'manager'))) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  const { data: timeSlots, isLoading: timeSlotsLoading } = useQuery<TimeSlotMaster[]>({
    queryKey: ["/api/admin/timeslots"],
    enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'manager'),
  });

  const form = useForm<TimeSlotFormData>({
    resolver: zodResolver(timeSlotFormSchema),
    defaultValues: {
      slotName: "",
      startTime: "",
      endTime: "",
      isPeakHour: false,
      slotOrder: 1,
      isActive: true,
    },
  });

  const createTimeSlotMutation = useMutation({
    mutationFn: async (data: TimeSlotFormData) => {
      return await apiRequest("POST", "/api/admin/timeslots", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/timeslots"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Time Slot Created",
        description: "The time slot has been created successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateTimeSlotMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: TimeSlotFormData }) => {
      return await apiRequest("PATCH", `/api/admin/timeslots/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/timeslots"] });
      setIsEditDialogOpen(false);
      setSelectedTimeSlot(null);
      form.reset();
      toast({
        title: "Time Slot Updated",
        description: "The time slot has been updated successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTimeSlotMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/admin/timeslots/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/timeslots"] });
      toast({
        title: "Time Slot Deleted",
        description: "The time slot has been deleted successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (timeSlot: TimeSlotMaster) => {
    setSelectedTimeSlot(timeSlot);
    form.reset({
      slotName: timeSlot.slotName,
      startTime: timeSlot.startTime,
      endTime: timeSlot.endTime,
      isPeakHour: timeSlot.isPeakHour,
      slotOrder: timeSlot.slotOrder || 1,
      isActive: timeSlot.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (timeSlot: TimeSlotMaster) => {
    if (window.confirm(`Are you sure you want to delete "${timeSlot.slotName}"? This action cannot be undone.`)) {
      deleteTimeSlotMutation.mutate(timeSlot.id);
    }
  };

  const handleToggleActive = (timeSlot: TimeSlotMaster) => {
    updateTimeSlotMutation.mutate({
      id: timeSlot.id,
      data: {
        slotName: timeSlot.slotName,
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        isPeakHour: timeSlot.isPeakHour,
        slotOrder: timeSlot.slotOrder,
        isActive: !timeSlot.isActive,
      }
    });
  };

  const handleTogglePeakHour = (timeSlot: TimeSlotMaster) => {
    updateTimeSlotMutation.mutate({
      id: timeSlot.id,
      data: {
        slotName: timeSlot.slotName,
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        isPeakHour: !timeSlot.isPeakHour,
        slotOrder: timeSlot.slotOrder,
        isActive: timeSlot.isActive,
      }
    });
  };

  const onSubmit = (data: TimeSlotFormData) => {
    // Validate that start time is before end time
    const start = new Date(`2000-01-01T${data.startTime}:00`);
    const end = new Date(`2000-01-01T${data.endTime}:00`);
    
    if (start >= end) {
      toast({
        title: "Invalid Time Range",
        description: "Start time must be before end time.",
        variant: "destructive",
      });
      return;
    }

    if (selectedTimeSlot) {
      updateTimeSlotMutation.mutate({ id: selectedTimeSlot.id, data });
    } else {
      createTimeSlotMutation.mutate(data);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <AdminSidebar />
        <div className="flex-1 lg:ml-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const TimeSlotForm = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="slotName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slot Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Morning Session" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="slotOrder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slot Order</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="1" 
                  placeholder="Display order (1, 2, 3...)" 
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isPeakHour"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Peak Hour</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Mark this slot as a peak hour for pricing
                </p>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Enable this time slot for bookings
                </p>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setIsCreateDialogOpen(false);
              setIsEditDialogOpen(false);
              setSelectedTimeSlot(null);
              form.reset();
            }}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createTimeSlotMutation.isPending || updateTimeSlotMutation.isPending}>
            {selectedTimeSlot ? "Update" : "Create"} Time Slot
          </Button>
        </div>
      </form>
    </Form>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 lg:ml-64 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
           <div>
  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Time Slots Management</h1>
  <p className="text-sm lg:text-base text-gray-600">Manage available booking time slots</p>
</div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  form.reset({
                    slotName: "",
                    startTime: "",
                    endTime: "",
                    isPeakHour: false,
                    slotOrder: 1,
                    isActive: true,
                  });
                  setSelectedTimeSlot(null);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Time Slot
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Time Slot</DialogTitle>
                  <DialogDescription>
                    Create a new time slot for ground bookings.
                  </DialogDescription>
                </DialogHeader>
                <TimeSlotForm />
              </DialogContent>
            </Dialog>
          </div>

          {timeSlotsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-20 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {timeSlots?.map((timeSlot) => (
                <Card key={timeSlot.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {timeSlot.slotName}
                        </CardTitle>
                        <CardDescription>
                          {timeSlot.startTime} - {timeSlot.endTime}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={timeSlot.isActive ? "default" : "secondary"}>
                        {timeSlot.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {timeSlot.isPeakHour && (
                        <Badge variant="destructive">Peak</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">
                        <strong>Order:</strong> {timeSlot.slotOrder || 'N/A'}
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(timeSlot)}
                          className="flex-1"
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTogglePeakHour(timeSlot)}
                          className={timeSlot.isPeakHour ? "text-red-600 hover:text-red-700 hover:bg-red-50" : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"}
                          title="Toggle Peak Hour"
                        >
                          {timeSlot.isPeakHour ? "🔥" : "⭐"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(timeSlot)}
                          className={timeSlot.isActive ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50" : "text-green-600 hover:text-green-700 hover:bg-green-50"}
                        >
                          {timeSlot.isActive ? <PauseCircle className="h-3 w-3" /> : <PlayCircle className="h-3 w-3" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(timeSlot)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {timeSlots && timeSlots.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No time slots found</h3>
                <p className="text-gray-600 mb-6">Get started by adding your first time slot.</p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Time Slot
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Time Slot</DialogTitle>
            <DialogDescription>
              Update the time slot information.
            </DialogDescription>
          </DialogHeader>
          <TimeSlotForm />
        </DialogContent>
      </Dialog>
    </div>
  );
}