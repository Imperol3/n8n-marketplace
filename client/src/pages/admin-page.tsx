import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
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

  const onSubmit = async (data: z.infer<typeof workflowSchema>) => {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("description", data.description);

    // Handle workflow file
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
              <DialogTitle>Upload New Workflow</DialogTitle>
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
          </div>
        ))}
      </div>
    </div>
  );
}