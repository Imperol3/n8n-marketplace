import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, FileJson, Edit, Image, Trash, Eye, EyeOff } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Workflow, WorkflowStatus, WORKFLOW_CATEGORIES, insertUserSchema } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tier } from "@shared/schema";

const workflowSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  videoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  categories: z.string().min(1, "Please enter at least one category"),
  tags: z.string().optional(),
  requiredTier: z.string().min(1, "Please select a tier"), // Changed to string for dynamic tiers
});

const userSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "user", "viewer"]),
  tier: z.string().min(1, "Please select a tier"),
});

const getStatusDisplay = (status: WorkflowStatus | undefined) => {
  return status ? status.replace(/_/g, ' ').split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ') : 'Draft';
};

const statusColors = {
  draft: "bg-gray-200 text-gray-700",
  in_progress: "bg-blue-200 text-blue-700",
  needs_edit: "bg-yellow-200 text-yellow-700",
  published: "bg-green-200 text-green-700",
};

export default function AdminPage() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editWorkflow, setEditWorkflow] = useState<Workflow | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<WorkflowStatus | 'all'>('all');
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("workflows");
  const [showPassword, setShowPassword] = useState<Record<number, boolean>>({});
  const [isTierDialogOpen, setIsTierDialogOpen] = useState(false);
  const [editTier, setEditTier] = useState<Tier | null>(null);

  // Fetch tiers first to ensure they're available
  const { data: tiers = [] } = useQuery<Tier[]>({
    queryKey: ["/api/tiers"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: number) => {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    },
  });

  const updateUserAccess = useMutation({
    mutationFn: async ({ userId, role, tier }: { userId: number; role: string; tier: string }) => {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role, preferences: { tier } }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User access updated successfully",
      });
    },
  });

  const deleteWorkflow = useMutation({
    mutationFn: async (workflowId: number) => {
      const res = await fetch(`/api/workflows/${workflowId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({
        title: "Success",
        description: "Workflow deleted successfully",
      });
    },
  });

  const { data: workflows } = useQuery<Workflow[]>({
    queryKey: ["/api/workflows"],
  });

  const form = useForm<z.infer<typeof workflowSchema>>({
    resolver: zodResolver(workflowSchema),
    defaultValues: {
      title: "",
      description: "",
      videoUrl: "",
      categories: "",
      tags: "",
      requiredTier: tiers[0]?.name || "free", // Default to first tier
    },
  });

  React.useEffect(() => {
    if (editWorkflow) {
      form.reset({
        title: editWorkflow.title,
        description: editWorkflow.description,
        videoUrl: editWorkflow.videoUrl || "",
        categories: editWorkflow.metadata?.categories?.join(", ") || "",
        tags: editWorkflow.metadata?.tags?.join(", ") || "",
        requiredTier: editWorkflow.metadata?.requiredTier || "free",
      });
    } else {
      form.reset({
        title: "",
        description: "",
        videoUrl: "",
        categories: "",
        tags: "",
        requiredTier: "free",
      });
    }
  }, [editWorkflow]);

  const createWorkflow = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/workflows', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      setIsOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Workflow created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateWorkflow = useMutation({
    mutationFn: async ({ id, formData }: { id: number; formData: FormData }) => {
      const res = await fetch(`/api/workflows/${id}`, {
        method: 'PATCH',
        body: formData,
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      setIsOpen(false);
      setEditWorkflow(null);
      form.reset();
      toast({
        title: "Success",
        description: "Workflow updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateWorkflowStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: WorkflowStatus }) => {
      const res = await fetch(`/api/workflows/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({
        title: "Success",
        description: "Workflow status updated successfully",
      });
    },
  });

  const onSubmit = async (data: z.infer<typeof workflowSchema>) => {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("description", data.description);
    if (data.videoUrl) {
      formData.append("videoUrl", data.videoUrl);
    }

    formData.append("metadata", JSON.stringify({
      categories: data.categories.split(',').map(c => c.trim()),
      tags: data.tags ? data.tags.split(',').map(t => t.trim()) : [],
      requiredTier: data.requiredTier,
    }));

    const workflowFile = document.querySelector<HTMLInputElement>('#workflow-file')?.files?.[0];
    const featuredImage = document.querySelector<HTMLInputElement>('#featuredImage')?.files?.[0];
    const extraImages = document.querySelector<HTMLInputElement>('#extra-images')?.files;

    if (editWorkflow) {
      if (workflowFile) {
        formData.append("workflow-file", workflowFile);
      }
      if (featuredImage) {
        formData.append("featuredImage", featuredImage);
      }
      if (extraImages && extraImages.length > 0) {
        Array.from(extraImages).forEach(file => {
          formData.append("extra-images", file);
        });
      }

      try {
        await updateWorkflow.mutateAsync({ id: editWorkflow.id, formData });
      } catch (error) {
        console.error('Error updating workflow:', error);
      }
    } else {
      if (!workflowFile) {
        toast({
          title: "Error",
          description: "Please select a workflow file",
          variant: "destructive",
        });
        return;
      }

      if (!featuredImage) {
        toast({
          title: "Error",
          description: "Please select a featured image",
          variant: "destructive",
        });
        return;
      }

      formData.append("workflow-file", workflowFile);
      formData.append("featuredImage", featuredImage);

      if (extraImages) {
        Array.from(extraImages).forEach(file => {
          formData.append("extra-images", file);
        });
      }

      try {
        await createWorkflow.mutateAsync(formData);
      } catch (error) {
        console.error('Error creating workflow:', error);
      }
    }
  };

  const filteredWorkflows = workflows?.filter(workflow =>
    selectedStatus === 'all' ? true : workflow.status === selectedStatus
  );

  // Update user form with dynamic tier options
  const userForm = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      email: "",
      role: "viewer",
      tier: tiers[0]?.name || "free", // Default to first tier or "free"
    },
  });

  const createUser = useMutation({
    mutationFn: async (data: z.infer<typeof userSchema>) => {
      const tempPassword = Math.random().toString(36).slice(-8);

      const res = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          password: tempPassword,
          preferences: {
            tier: data.tier,
            interests: []
          }
        }),
      });
      if (!res.ok) throw new Error(await res.text());

      toast({
        title: "User Created Successfully",
        description: `Temporary password: ${tempPassword}\nPlease share this with the user securely.`,
        duration: 10000,
      });

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsUserDialogOpen(false);
      userForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { data: tiersData = [] } = useQuery<Tier[]>({
    queryKey: ["/api/tiers"],
  });

  const createTier = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const res = await fetch('/api/tiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tiers"] });
      toast({
        title: "Success",
        description: "Tier created successfully",
      });
    },
  });

  const updateTier = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Tier> }) => {
      const res = await fetch(`/api/tiers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tiers"] });
      setIsTierDialogOpen(false);
      setEditTier(null);
      toast({
        title: "Success",
        description: "Tier updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTier = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/tiers/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tiers"] });
      toast({
        title: "Success",
        description: "Tier deleted successfully",
      });
    },
  });


  return (
    <div className="container mx-auto p-6">
      <Tabs defaultValue="workflows" className="space-y-6">
        <TabsList>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="tiers">Access Tiers</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">Workflow Management</h1>
              <div className="mt-2">
                <Select
                  value={selectedStatus}
                  onValueChange={(value) => setSelectedStatus(value as WorkflowStatus | 'all')}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="needs_edit">Needs Edit</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditWorkflow(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Workflow
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>
                    {editWorkflow ? 'Edit Workflow' : 'Upload New Workflow'}
                  </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" encType="multipart/form-data">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
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
                            <Textarea {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="categories"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categories (comma-separated)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Sales, Marketing, AI Agents" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tags (comma-separated, optional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="automation, email, crm" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="requiredTier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Required Tier</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a tier" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {tiers.map((tier) => (
                                <SelectItem key={tier.id} value={tier.name}>
                                  {tier.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div>
                      <FormLabel htmlFor="workflow-file">
                        {editWorkflow ? 'Replace Workflow File (Optional)' : 'Workflow File (JSON)'}
                      </FormLabel>
                      <Input
                        id="workflow-file"
                        name="workflow-file"
                        type="file"
                        accept=".json"
                        className="mt-1"
                        required={!editWorkflow}
                      />
                    </div>
                    <div>
                      <FormLabel htmlFor="featuredImage">
                        {editWorkflow ? 'Replace Featured Image (Optional)' : 'Featured Image (Required)'}
                      </FormLabel>
                      <Input
                        id="featuredImage"
                        name="featuredImage"
                        type="file"
                        accept="image/*"
                        className="mt-1"
                        required={!editWorkflow}
                      />
                    </div>
                    <div>
                      <FormLabel htmlFor="extra-images">Additional Images (Optional)</FormLabel>
                      <Input
                        id="extra-images"
                        name="extra-images"
                        type="file"
                        accept="image/*"
                        className="mt-1"
                        multiple
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="videoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Video URL (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} type="url" placeholder="https://..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={createWorkflow.isPending || updateWorkflow.isPending}
                    >
                      {editWorkflow ? 'Update Workflow' : 'Create Workflow'}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredWorkflows?.map((workflow) => (
              <div
                key={workflow.id}
                className="flex flex-col p-6 border rounded-lg bg-card hover:shadow-md transition-shadow"
              >
                <div className="relative w-full h-[200px] mb-4 rounded-md overflow-hidden bg-muted">
                  {workflow.featuredImage ? (
                    <img
                      src={workflow.featuredImage}
                      alt={workflow.title}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full">
                      <Image className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  {/* Add floating action buttons on top */}
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white hover:bg-gray-100"
                      onClick={() => {
                        setEditWorkflow(workflow);
                        setIsOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="bg-white hover:bg-gray-100"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this workflow?')) {
                          deleteWorkflow.mutate(workflow.id);
                        }
                      }}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col">
                  <h3 className="font-medium text-lg mb-2">{workflow.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {workflow.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    {workflow.extraImages && workflow.extraImages.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        +{workflow.extraImages.length} additional images
                      </div>
                    )}
                    {workflow.videoUrl && (
                      <div className="text-sm text-muted-foreground">
                        Video tutorial available
                      </div>
                    )}
                  </div>

                  <div className="mt-auto pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded text-sm ${statusColors[workflow.status || 'draft']}`}>
                        {getStatusDisplay(workflow.status)}
                      </span>
                      <Select
                        value={workflow.status || 'draft'}
                        onValueChange={(value) =>
                          updateWorkflowStatus.mutate({
                            id: workflow.id,
                            status: value as WorkflowStatus
                          })
                        }
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="needs_edit">Needs Edit</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">User Management</h2>
            <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditUser(null);
                  userForm.reset();
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editUser ? 'Edit User' : 'Add New User'}
                  </DialogTitle>
                </DialogHeader>
                <Form {...userForm}>
                  <form onSubmit={userForm.handleSubmit((data) => {
                    if (editUser) {
                      updateUserAccess.mutate({
                        userId: editUser.id,
                        ...data
                      });
                    } else {
                      createUser.mutate(data);
                    }
                  })} className="space-y-4">
                    <FormField
                      control={userForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={userForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={userForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={userForm.control}
                      name="tier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tier</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a tier" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {tiers.map((tier) => (
                                <SelectItem key={tier.id} value={tier.name}>
                                  {tier.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={createUser.isPending || updateUserAccess.isPending}
                    >
                      {editUser ? 'Update User' : 'Create User'}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Temporary Password</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Select
                      defaultValue={user.role}
                      onValueChange={(role) =>
                        updateUserAccess.mutate({
                          userId: user.id,
                          role,
                          tier: user.preferences.tier
                        })
                      }
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      defaultValue={user.preferences.tier}
                      onValueChange={(tier) =>
                        updateUserAccess.mutate({
                          userId: user.id,
                          role: user.role,
                          tier
                        })
                      }
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tiers.map((tier) => (
                          <SelectItem key={tier.id} value={tier.name}>
                            {tier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="relative">
                    <div className="flex items-center space-x-2">
                      <span className={!showPassword[user.id] ? "filter blur-sm" : ""}>
                        {user.password?.split('.')[1] || 'N/A'}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPassword(prev => ({
                          ...prev,
                          [user.id]: !prev[user.id]
                        }))}
                      >
                        {showPassword[user.id] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditUser(user);
                          userForm.reset({
                            username: user.username,
                            email: user.email,
                            role: user.role,
                            tier: user.preferences.tier
                          });
                          setIsUserDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this user?')) {
                            deleteUser.mutate(user.id);
                          }
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="tiers" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Access Tier Management</h2>
            <Dialog open={isTierDialogOpen} onOpenChange={setIsTierDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditTier(null);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tier
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editTier ? 'Edit Access Tier' : 'Create New Access Tier'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const data = {
                    name: formData.get('name') as string,
                    description: formData.get('description') as string,
                  };

                  if (editTier) {
                    updateTier.mutate({ id: editTier.id, data });
                  } else {
                    createTier.mutate(data);
                  }
                }}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        name="name"
                        defaultValue={editTier?.name || ''}
                        required
                      />
                    </div>
                    <div className="space-y2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        defaultValue={editTier?.description || ''}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      {editTier ? 'Update Tier' : 'Create Tier'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tiersData.map((tier) => (
                <TableRow key={tier.id}>
                  <TableCell>{tier.name}</TableCell>
                  <TableCell>{tier.description}</TableCell>
                  <TableCell>{tier.level}</TableCell>
                  <TableCell>
                    <Select
                      defaultValue={tier.active}
                      onValueChange={(active) =>
                        updateTier.mutate({
                          id: tier.id,
                          data: { active }
                        })
                      }
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Active</SelectItem>
                        <SelectItem value="false">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditTier(tier);
                          setIsTierDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this tier?')) {
                            deleteTier.mutate(tier.id);
                          }
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}