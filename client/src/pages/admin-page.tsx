import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Workflow } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
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
  title: z.string().min(3),
  description: z.string().min(10),
  metadata: z.object({
    category: z.string(),
    tags: z.array(z.string()),
    previewUrl: z.string().url().optional(),
  }),
});

export default function AdminPage() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const { data: workflows } = useQuery<Workflow[]>({
    queryKey: ["/api/workflows"],
  });

  const form = useForm<z.infer<typeof workflowSchema>>({
    resolver: zodResolver(workflowSchema),
    defaultValues: {
      title: "",
      description: "",
      metadata: {
        category: "",
        tags: [],
        previewUrl: "",
      },
    },
  });

  const createWorkflow = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", "/api/workflows", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      setIsOpen(false);
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

  const deleteWorkflow = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/workflows/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({
        title: "Success",
        description: "Workflow deleted successfully",
      });
    },
  });

  const onSubmit = async (data: z.infer<typeof workflowSchema>) => {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("metadata", JSON.stringify(data.metadata));

    const fileInput = document.querySelector<HTMLInputElement>('#workflow-file');
    if (fileInput?.files?.[0]) {
      formData.append("file", fileInput.files[0]);
    }

    await createWorkflow.mutateAsync(formData);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Workflow Management</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Workflow</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  name="metadata.category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="metadata.previewUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preview URL</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div>
                  <FormLabel htmlFor="workflow-file">Workflow File</FormLabel>
                  <Input
                    id="workflow-file"
                    type="file"
                    accept=".json,.yaml,.yml"
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

      <div className="grid gap-4">
        {workflows?.map((workflow) => (
          <div
            key={workflow.id}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div>
              <h3 className="font-medium">{workflow.title}</h3>
              <p className="text-sm text-muted-foreground">
                {workflow.description}
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteWorkflow.mutate(workflow.id)}
              disabled={deleteWorkflow.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
