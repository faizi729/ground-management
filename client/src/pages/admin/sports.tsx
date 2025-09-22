import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import AdminSidebar from "@/components/AdminSidebar";
import { Plus, Pencil, Trash2, Trophy, Image, PauseCircle, PlayCircle } from "lucide-react";
import { z } from "zod";
import type { Sport } from "@shared/schema";
import { insertSportSchema } from "@shared/schema";

// Form schema for sports with comprehensive validation
const sportFormSchema = insertSportSchema.extend({
  sportCode: z.string()
    .min(1, "Sport code is required")
    .min(2, "Sport code must be at least 2 characters")
    .max(10, "Sport code must be at most 10 characters")
    .regex(/^[A-Z0-9]+$/, "Sport code must contain only uppercase letters and numbers"),
  sportName: z.string()
    .min(1, "Sport name is required")
    .min(2, "Sport name must be at least 2 characters")
    .max(100, "Sport name must be at most 100 characters")
    .trim(),
  bookingType: z.enum(["per-person", "full-ground", "both"], { required_error: "Please select a booking type" }),
  description: z.string().optional(),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type SportFormData = z.infer<typeof sportFormSchema>;

function isUnauthorizedError(error: any): boolean {
  return error?.status === 401 || error?.message?.includes("Unauthorized");
}

function getBookingTypeDisplay(bookingType: string): string {
  switch (bookingType) {
    case "per-person": return "Per Person Only";
    case "full-ground": return "Full Ground Only";
    case "both": return "Both Options";
    default: return "Full Ground";
  }
}

export default function AdminSports() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);

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

  const { data: sports, isLoading: sportsLoading } = useQuery<Sport[]>({
    queryKey: ["/api/admin/sports"],
    enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'manager'),
  });

  const form = useForm<SportFormData>({
    resolver: zodResolver(sportFormSchema),
    defaultValues: {
      sportCode: "",
      sportName: "",
      bookingType: "full-ground",
      description: "",
      imageUrl: "",
      isActive: true,
    },
  });

  const createSportMutation = useMutation({
    mutationFn: async (data: SportFormData) => {
      return await apiRequest("POST", "/api/admin/sports", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sports"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Sport Created",
        description: "The sport has been created successfully.",
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

  const updateSportMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<SportFormData> }) => {
      return await apiRequest("PATCH", `/api/admin/sports/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sports"] });
      setIsEditDialogOpen(false);
      setSelectedSport(null);
      form.reset();
      toast({
        title: "Sport Updated",
        description: "The sport has been updated successfully.",
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

  const deleteSportMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/admin/sports/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sports"] });
      toast({
        title: "Sport Deleted",
        description: "The sport has been deleted successfully.",
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

  const handleEdit = (sport: Sport) => {
    setSelectedSport(sport);
    form.reset({
      sportCode: sport.sportCode,
      sportName: sport.sportName,
      bookingType: sport.bookingType as "per-person" | "full-ground" | "both" || "full-ground",
      description: sport.description || "",
      imageUrl: sport.imageUrl || "",
      isActive: sport.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const handleToggleActive = (sport: Sport) => {
    updateSportMutation.mutate({
      id: sport.id,
      data: {
        sportCode: sport.sportCode,
        sportName: sport.sportName,
        bookingType: sport.bookingType as "per-person" | "full-ground" | "both",
        description: sport.description || "",
        imageUrl: sport.imageUrl || "",
        isActive: !sport.isActive,
      }
    });
  };

  const handleDelete = async (sport: Sport) => {
    if (window.confirm(`Are you sure you want to delete "${sport.sportName}"? This action cannot be undone.`)) {
      deleteSportMutation.mutate(sport.id);
    }
  };

  const onSubmit = (data: SportFormData) => {
    if (selectedSport) {
      updateSportMutation.mutate({ id: selectedSport.id, data });
    } else {
      createSportMutation.mutate(data);
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

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 lg:ml-64 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Sports Management</h1>
  <p className="text-sm lg:text-base text-gray-600">Manage sport types and categories</p>
</div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  form.reset({
                    sportCode: "",
                    sportName: "",
                    bookingType: "full-ground",
                    description: "",
                    imageUrl: "",
                    isActive: true,
                  });
                  setSelectedSport(null);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Sport
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Sport</DialogTitle>
                  <DialogDescription>
                    Create a new sport type for your facility booking system.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="sportCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sport Code</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., BTN, FB, BB" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="sportName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sport Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Badminton, Football" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="bookingType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Booking Type</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select booking type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="per-person">Per Person Only</SelectItem>
                              <SelectItem value="full-ground">Full Ground Only</SelectItem>
                              <SelectItem value="both">Both Options</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Sport description..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Active Status</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Enable this sport for bookings
                            </div>
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
                    
                    <div className="flex gap-3 pt-4">
                      <Button 
                        type="submit" 
                        disabled={createSportMutation.isPending}
                        className="flex-1"
                      >
                        {createSportMutation.isPending ? "Creating..." : "Create Sport"}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsCreateDialogOpen(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {sportsLoading ? (
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
              {sports?.map((sport) => (
                <Card key={sport.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="flex items-center gap-3">
                      {sport.imageUrl ? (
                        <img 
                          src={sport.imageUrl} 
                          alt={sport.sportName}
                          className="w-10 h-10 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Trophy className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-lg">{sport.sportName}</CardTitle>
                        <CardDescription>{sport.sportCode} • {getBookingTypeDisplay(sport.bookingType || "full-ground")}</CardDescription>
                      </div>
                    </div>
                    <Badge variant={sport.isActive ? "default" : "secondary"}>
                      {sport.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {sport.description || "No description available"}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(sport)}
                        className="flex-1"
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(sport)}
                        className={sport.isActive ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50" : "text-green-600 hover:text-green-700 hover:bg-green-50"}
                      >
                        {sport.isActive ? <PauseCircle className="h-3 w-3" /> : <PlayCircle className="h-3 w-3" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(sport)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {sports && sports.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No sports found</h3>
                <p className="text-gray-600 mb-6">Get started by adding your first sport.</p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Sport
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
            <DialogTitle>Edit Sport</DialogTitle>
            <DialogDescription>
              Update the sport information.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="sportCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sport Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., BTN, FB, BB" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="sportName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sport Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Badminton, Football" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="bookingType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Booking Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select booking type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="per-person">Per Person Only</SelectItem>
                        <SelectItem value="full-ground">Full Ground Only</SelectItem>
                        <SelectItem value="both">Both Options</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Sport description..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Active Status</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Enable this sport for bookings
                      </div>
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
              
              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  disabled={updateSportMutation.isPending}
                  className="flex-1"
                >
                  {updateSportMutation.isPending ? "Updating..." : "Update Sport"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setSelectedSport(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}