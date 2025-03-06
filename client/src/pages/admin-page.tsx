import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, FileJson, Edit } from "lucide-react";
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
import { Workflow, WorkflowStatus } from "@shared/schema";
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

const workflowSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

// Update the status display logic to handle undefined status and improve formatting
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
  const [selectedStatus, setSelectedStatus] = useState<WorkflowStatus | 'all'>('all');

  const { data: workflows } = useQuery<Workflow[]>({
    queryKey: ["/api/workflows"],
  });

  const form = useForm<z.infer<typeof workflowSchema>>({
    resolver: zodResolver(workflowSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

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

    const fileInput = document.querySelector<HTMLInputElement>('#workflow-file');
    if (fileInput?.files?.[0]) {
      console.log('Uploading workflow file:', fileInput.files[0].name);
      formData.append("workflow-file", fileInput.files[0]);
    } else {
      toast({
        title: "Error",
        description: "Please select a workflow file",
        variant: "destructive",
      });
      return;
    }

    try {
      await createWorkflow.mutateAsync(formData);
    } catch (error) {
      console.error('Error creating workflow:', error);
    }
  };

  const filteredWorkflows = workflows?.filter(workflow =>
    selectedStatus === 'all' ? true : workflow.status === selectedStatus
  );

  return (
    <div className="container mx-auto p-6">
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
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Upload New Workflow</DialogTitle>
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
                <div>
                  <FormLabel htmlFor="workflow-file">Workflow File (JSON)</FormLabel>
                  <Input
                    id="workflow-file"
                    type="file"
                    accept=".json"
                    className="mt-1"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createWorkflow.isPending}
                >
                  Create Workflow
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredWorkflows?.map((workflow) => (
          <div
            key={workflow.id}
            className="p-4 border rounded-lg bg-card hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-medium text-lg">{workflow.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {workflow.description}
                </p>
              </div>
              <FileJson className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            </div>

            <div className="flex items-center justify-between mt-4">
              <span className={`px-2 py-1 rounded text-sm ${statusColors[workflow.status || 'draft']}`}>
                {getStatusDisplay(workflow.status)}
              </span>
              <div className="flex items-center gap-2">
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
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => toast({
                    title: "Coming Soon",
                    description: "Workflow editing will be available soon",
                  })}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}