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
import { Plus, Pencil, Trash2, MapPin, Users, Image, PauseCircle, PlayCircle } from "lucide-react";
import { z } from "zod";
import type { Ground, Sport } from "@shared/schema";
import { insertGroundSchema } from "@shared/schema";

// Form schema for grounds
const groundFormSchema = insertGroundSchema.extend({
  sportId: z.number().min(1, "Please select a sport"),
  groundName: z.string().min(2, "Ground name must be at least 2 characters").max(100, "Ground name must be at most 100 characters"),
  groundCode: z.string().min(2, "Ground code must be at least 2 characters").max(20, "Ground code must be at most 20 characters"),
  location: z.string().min(2, "Location must be at least 2 characters").optional(),
  facilities: z.string().optional(),
  maxCapacity: z.number().min(1, "Capacity must be at least 1"),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type GroundFormData = z.infer<typeof groundFormSchema>;

function isUnauthorizedError(error: any): boolean {
  return error?.status === 401 || error?.message?.includes("Unauthorized");
}

export default function AdminGrounds() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedGround, setSelectedGround] = useState<Ground | null>(null);

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

  const { data: grounds, isLoading: groundsLoading } = useQuery<Ground[]>({
    queryKey: ["/api/admin/grounds"],
    enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'manager'),
  });

  const { data: sports } = useQuery<Sport[]>({
    queryKey: ["/api/admin/sports"],
    enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'manager'),
  });

  const form = useForm<GroundFormData>({
    resolver: zodResolver(groundFormSchema),
    defaultValues: {
      sportId: 0,
      groundName: "",
      groundCode: "",
      location: "",
      facilities: "",
      maxCapacity: 1,
      imageUrl: "",
      isActive: true,
    },
  });

  const createGroundMutation = useMutation({
    mutationFn: async (data: GroundFormData) => {
      // Check for duplicate ground code
      const existingGroundWithCode = grounds?.find(g => g.groundCode.toLowerCase() === data.groundCode.toLowerCase());
      if (existingGroundWithCode) {
        throw new Error(`Ground code "${data.groundCode}" already exists`);
      }
      
      // Check for duplicate ground name
      const existingGroundWithName = grounds?.find(g => g.groundName.toLowerCase() === data.groundName.toLowerCase());
      if (existingGroundWithName) {
        throw new Error(`Ground name "${data.groundName}" already exists`);
      }

      return await apiRequest("POST", "/api/admin/grounds", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/grounds"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Ground Created",
        description: "The ground has been created successfully.",
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

  const updateGroundMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<GroundFormData> }) => {
      return await apiRequest("PATCH", `/api/admin/grounds/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/grounds"] });
      setIsEditDialogOpen(false);
      setSelectedGround(null);
      form.reset();
      toast({
        title: "Ground Updated",
        description: "The ground has been updated successfully.",
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

  const deleteGroundMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/admin/grounds/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/grounds"] });
      toast({
        title: "Ground Deleted",
        description: "The ground has been deleted successfully.",
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

  const handleEdit = (ground: Ground) => {
    setSelectedGround(ground);
    form.reset({
      sportId: ground.sportId,
      groundName: ground.groundName,
      groundCode: ground.groundCode,
      location: ground.location || "",
      facilities: ground.facilities || "",
      maxCapacity: ground.maxCapacity || 1,
      imageUrl: ground.imageUrl || "",
      isActive: ground.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (ground: Ground) => {
    if (window.confirm(`Are you sure you want to delete "${ground.groundName}"? This action cannot be undone.`)) {
      deleteGroundMutation.mutate(ground.id);
    }
  };

  const handleToggleActive = (ground: Ground) => {
    updateGroundMutation.mutate({
      id: ground.id,
      data: {
        sportId: ground.sportId,
        groundName: ground.groundName,
        groundCode: ground.groundCode,
        location: ground.location || undefined,
        facilities: ground.facilities || undefined,
        maxCapacity: ground.maxCapacity || 1,
        imageUrl: ground.imageUrl || undefined,
        isActive: !ground.isActive,
      }
    });
  };

  const onSubmit = (data: GroundFormData) => {
    if (selectedGround) {
      updateGroundMutation.mutate({ id: selectedGround.id, data });
    } else {
      createGroundMutation.mutate(data);
    }
  };

  const getSportName = (sportId: number) => {
    return sports?.find(sport => sport.id === sportId)?.sportName || "Unknown";
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

  const GroundForm = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="sportId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sport</FormLabel>
              <Select value={field.value?.toString()} onValueChange={(value) => field.onChange(parseInt(value))}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a sport" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {sports?.filter(sport => sport.isActive).map((sport) => (
                    <SelectItem key={sport.id} value={sport.id.toString()}>
                      {sport.sportName} ({sport.sportCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="groundName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ground Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Court A, Field 1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="groundCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ground Code</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., BTN-A1, FB-F1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="Building/Area location" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="facilities"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Facilities</FormLabel>
              <FormControl>
                <Textarea placeholder="List of available facilities..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="maxCapacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Maximum Capacity *</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="Enter capacity (required)"
                  min="1"
                  value={field.value || ""} 
                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 1)}
                />
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
                  Enable this ground for bookings
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
            disabled={createGroundMutation.isPending || updateGroundMutation.isPending}
            className="flex-1"
          >
            {selectedGround 
              ? (updateGroundMutation.isPending ? "Updating..." : "Update Ground")
              : (createGroundMutation.isPending ? "Creating..." : "Create Ground")
            }
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              if (selectedGround) {
                setIsEditDialogOpen(false);
                setSelectedGround(null);
              } else {
                setIsCreateDialogOpen(false);
              }
            }}
            className="flex-1"
          >
            Cancel
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
  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Grounds Management</h1>
  <p className="text-sm lg:text-base text-gray-600">Manage physical facilities and courts</p>
</div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  form.reset({
                    sportId: 0,
                    groundName: "",
                    groundCode: "",
                    location: "",
                    facilities: "",
                    maxCapacity: 1,
                    imageUrl: "",
                    isActive: true,
                  });
                  setSelectedGround(null);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Ground
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Ground</DialogTitle>
                  <DialogDescription>
                    Create a new ground/court for your sports facility.
                  </DialogDescription>
                </DialogHeader>
                <GroundForm />
              </DialogContent>
            </Dialog>
          </div>

          {groundsLoading ? (
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
              {grounds?.map((ground) => (
                <Card key={ground.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="flex items-center gap-3">
                      {ground.imageUrl ? (
                        <img 
                          src={ground.imageUrl} 
                          alt={ground.groundName}
                          className="w-10 h-10 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-lg">{ground.groundName}</CardTitle>
                        <CardDescription>{ground.groundCode} • {getSportName(ground.sportId)}</CardDescription>
                      </div>
                    </div>
                    <Badge variant={ground.isActive ? "default" : "secondary"}>
                      {ground.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {ground.location && (
                        <p className="text-sm text-gray-600">📍 {ground.location}</p>
                      )}
                      {ground.maxCapacity && (
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Capacity: {ground.maxCapacity} people
                        </p>
                      )}

                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(ground)}
                        className="flex-1"
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(ground)}
                        className={ground.isActive ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50" : "text-green-600 hover:text-green-700 hover:bg-green-50"}
                      >
                        {ground.isActive ? <PauseCircle className="h-3 w-3" /> : <PlayCircle className="h-3 w-3" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(ground)}
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

          {grounds && grounds.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No grounds found</h3>
                <p className="text-gray-600 mb-6">Get started by adding your first ground.</p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Ground
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Ground</DialogTitle>
            <DialogDescription>
              Update the ground information.
            </DialogDescription>
          </DialogHeader>
          <GroundForm />
        </DialogContent>
      </Dialog>
    </div>
  );
}