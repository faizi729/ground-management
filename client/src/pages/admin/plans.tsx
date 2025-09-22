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
import { Plus, Pencil, Trash2, CreditCard, Clock, Calendar, Trophy, PauseCircle, PlayCircle } from "lucide-react";
import { z } from "zod";
import type { Plan, Ground, Sport } from "@shared/schema";
import { insertPlanSchema } from "@shared/schema";

// Form schema for plans (booking type now handled at sport level)
const planFormSchema = insertPlanSchema.extend({
  groundId: z.number().min(1, "Please select a ground"),
  planName: z.string()
    .min(1, "Plan name is required")
    .min(2, "Plan name must be at least 2 characters")
    .max(100, "Plan name must be at most 100 characters")
    .trim(),
  planType: z.enum(["hourly", "monthly", "yearly"], { required_error: "Please select a plan type" }),
  basePrice: z.string()
    .min(1, "Base price is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Price must be a positive number"),
  weekendMultiplier: z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
    z
      .string()
      .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Multiplier must be a positive number")
      .optional()
  ),
  peakHourMultiplier: z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
    z
      .string()
      .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Multiplier must be a positive number")
      .optional()
  ),
  description: z.string().optional(),
});

type PlanFormData = z.infer<typeof planFormSchema>;

function isUnauthorizedError(error: any): boolean {
  return error?.status === 401 || error?.message?.includes("Unauthorized");
}

export default function AdminPlans() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

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

  const { data: plans, isLoading: plansLoading } = useQuery<Plan[]>({
    queryKey: ["/api/admin/plans"],
    enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'manager'),
  });

  const { data: grounds } = useQuery<Ground[]>({
    queryKey: ["/api/admin/grounds"],
    enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'manager'),
  });

  const { data: sports } = useQuery<Sport[]>({
    queryKey: ["/api/admin/sports"],
    enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'manager'),
  });

  const form = useForm<PlanFormData>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      groundId: 0,
      planName: "",
      planType: "hourly",
      basePrice: "",
      weekendMultiplier: "",
      peakHourMultiplier: "",
      description: "",
      isActive: true,
    },
  });

  const createPlanMutation = useMutation({
    mutationFn: async (data: PlanFormData) => {
      const planData = {
        ...data,
        basePrice: Number(data.basePrice),
        weekendMultiplier: data.weekendMultiplier ? Number(data.weekendMultiplier) : undefined,
        peakHourMultiplier: data.peakHourMultiplier ? Number(data.peakHourMultiplier) : undefined,
      };
      return await apiRequest("POST", "/api/admin/plans", planData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Plan Created",
        description: "The pricing plan has been created successfully.",
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

  const updatePlanMutation = useMutation({
  mutationFn: async ({ id, data }: { id: number; data: Partial<PlanFormData> }) => {
    const planData = {
      ...data,
      basePrice: data.basePrice ? Number(data.basePrice) : undefined,
      weekendMultiplier: data.weekendMultiplier ? Number(data.weekendMultiplier) : undefined,
      peakHourMultiplier: data.peakHourMultiplier ? Number(data.peakHourMultiplier) : undefined,
    };
    return await apiRequest("POST", `/api/admin/plans`,{ id,...planData});
  },
  onSuccess: (updatedPlan, { id, data }) => {
  queryClient.setQueryData<any[]>(["/api/admin/plans"], (old) =>
    old?.map((p) => (p.id === id ? { ...p, ...data } : p))
  );
    setIsEditDialogOpen(false);
    setSelectedPlan(null);
    // ❌ remove form.reset() here
    toast({
      title: "Plan Updated",
      description: "The pricing plan has been updated successfully.",
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

  const deletePlanMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/admin/plans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      toast({
        title: "Plan Deleted",
        description: "The pricing plan has been deleted successfully.",
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

  const handleEdit = (plan: Plan) => {
    setSelectedPlan(plan);
    form.reset({
      groundId: plan.groundId,
      planName: plan.planName,
      planType: plan.planType as "hourly" | "monthly" | "yearly",
      basePrice: plan.basePrice?.toString() || "",
      weekendMultiplier: plan.weekendMultiplier?.toString() || "",
      peakHourMultiplier: plan.peakHourMultiplier?.toString() || "",
      description: plan.description || "",
      isActive: plan.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (plan: Plan) => {
    if (window.confirm(`Are you sure you want to delete "${plan.planName}"? This action cannot be undone.`)) {
      deletePlanMutation.mutate((plan as any).planId || plan.id);
    }
  };

const handleToggleActive = (plan: Plan) => {
  updatePlanMutation.mutate(
    {
      id: (plan as any).planId || plan.id,
      data: {
        groundId: plan.groundId,
        planName: plan.planName,
        planType: plan.planType as "hourly" | "monthly" | "yearly",
        basePrice: plan.basePrice?.toString() || "",
        weekendMultiplier: plan.weekendMultiplier?.toString() || "",
        peakHourMultiplier: plan.peakHourMultiplier?.toString() || "",
        description: plan.description || "",
        isActive: !plan.isActive,
      },
    },
    {
      onSuccess: (updatedPlan) => {
        // Update local cache/state so plan doesn't disappear
        queryClient.setQueryData<Plan[]>(['plans', plan.groundId], (oldPlans) =>
          oldPlans?.map((p) =>
            p.id === plan.id ? { ...p, isActive: !p.isActive } : p
          )
        );
      },
    }
  );
};


const onSubmit = (data: PlanFormData) => {
  if (selectedPlan) {
    updatePlanMutation.mutate({
      id: (selectedPlan as any).planId || selectedPlan.id,
      data: {
        ...data,
        basePrice: data.basePrice,
        weekendMultiplier: data.weekendMultiplier || undefined,
        peakHourMultiplier: data.peakHourMultiplier || undefined,
      },
    });
  } else {
    createPlanMutation.mutate(data);
  }
};


  const getGroundInfo = (groundId: number) => {
    const ground = grounds?.find(g => ((g as any).groundId || g.id) === groundId);
    const sport = ground ? sports?.find(s => ((s as any).sportId || s.id) === ((ground as any).sportId || ground.sportId)) : null;
    return {
      groundName: ground?.groundName || "Unknown",
      sportName: sport?.sportName || "Unknown"
    };
  };

  const getPlanTypeIcon = (type: string) => {
    switch (type) {
      case 'hourly':
        return <Clock className="h-4 w-4" />;
      case 'monthly':
        return <Calendar className="h-4 w-4" />;
      case 'yearly':
        return <Trophy className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getPlanTypeBadge = (type: string) => {
    const colors = {
      hourly: "bg-blue-100 text-blue-800",
      monthly: "bg-green-100 text-green-800",
      yearly: "bg-purple-100 text-purple-800"
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
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

  const PlanForm = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="groundId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ground</FormLabel>
              <Select value={field.value?.toString()} onValueChange={(value) => field.onChange(parseInt(value))}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a ground" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {grounds?.filter(ground => ground.isActive).map((ground) => {
                    const sport = sports?.find(s => ((s as any).sportId || s.id) === ((ground as any).sportId || ground.sportId));
                    const groundId = (ground as any).groundId || ground.id;
                    return (
                      <SelectItem key={groundId} value={groundId.toString()}>
                        {ground.groundName} ({sport?.sportName}) - {ground.groundCode}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="planName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plan Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Premium Hourly" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="planType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plan Type</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="basePrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Base Price (₹)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="weekendMultiplier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weekend Multiplier</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" placeholder="1.2" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="peakHourMultiplier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Peak Hour Multiplier</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" placeholder="1.5" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Plan description and features..." {...field} />
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
                  Enable this plan for bookings
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
  disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
  className="flex-1"
>
  {selectedPlan 
    ? (updatePlanMutation.isPending ? "Updating..." : "Update Plan")
    : (createPlanMutation.isPending ? "Creating..." : "Create Plan")
  }
</Button>

          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              if (selectedPlan) {
                setIsEditDialogOpen(false);
                setSelectedPlan(null);
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
  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Plans Management</h1>
  <p className="text-sm lg:text-base text-gray-600">Manage pricing plans for different booking types</p>
</div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  form.reset({
                    groundId: 0,
                    planName: "",
                    planType: "hourly",
                    basePrice: "",
                    weekendMultiplier: "",
                    peakHourMultiplier: "",
                    description: "",
                    isActive: true,
                  });
                  setSelectedPlan(null);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Plan</DialogTitle>
                  <DialogDescription>
                    Create a new pricing plan for ground bookings.
                  </DialogDescription>
                </DialogHeader>
                <PlanForm />
              </DialogContent>
            </Dialog>
          </div>

          {plansLoading ? (
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
              {plans?.map((plan) => {
                const { groundName, sportName } = getGroundInfo(plan.groundId);
                return (
                  <Card key={plan.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          {getPlanTypeIcon(plan.planType)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{plan.planName}</CardTitle>
                          <CardDescription>{plan.planType} • {groundName}</CardDescription>
                        </div>
                      </div>
                      <Badge variant={plan.isActive ? "default" : "secondary"}>
                        {plan.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge className={getPlanTypeBadge(plan.planType)}>
                            {getPlanTypeIcon(plan.planType)}
                            <span className="ml-1 capitalize">{plan.planType}</span>
                          </Badge>
                          <span className="text-lg font-semibold text-primary">
                            ₹{plan.basePrice?.toString()}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          <p><strong>Sport:</strong> {sportName}</p>
                          <p><strong>Ground:</strong> {groundName}</p>
                          <p><strong>Plan Type:</strong> {plan.planType}</p>
                        </div>
                        
                        {(plan.weekendMultiplier || plan.peakHourMultiplier) && (
                          <div className="text-xs text-gray-500">
                            {plan.weekendMultiplier && (
                              <span>Weekend: {plan.weekendMultiplier}x</span>
                            )}
                            {plan.weekendMultiplier && plan.peakHourMultiplier && (
                              <span> • </span>
                            )}
                            {plan.peakHourMultiplier && (
                              <span>Peak: {plan.peakHourMultiplier}x</span>
                            )}
                          </div>
                        )}
                        
                        {plan.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {plan.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(plan)}
                          className="flex-1"
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(plan)}
                          className={plan.isActive ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50" : "text-green-600 hover:text-green-700 hover:bg-green-50"}
                        >
                          {plan.isActive ? <PauseCircle className="h-3 w-3" /> : <PlayCircle className="h-3 w-3" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(plan)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {plans && plans.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No plans found</h3>
                <p className="text-gray-600 mb-6">Get started by adding your first pricing plan.</p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Plan
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
            <DialogTitle>Edit Plan</DialogTitle>
            <DialogDescription>
              Update the pricing plan information.
            </DialogDescription>
          </DialogHeader>
          <PlanForm />
        </DialogContent>
      </Dialog>
    </div>
  );
}