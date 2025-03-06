import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Image as ImageIcon } from "lucide-react";
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
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
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

    // Handle featured image
    const featuredImageInput = document.querySelector<HTMLInputElement>('#featured-image');
    if (featuredImageInput?.files?.[0]) {
      formData.append("featuredImage", featuredImageInput.files[0]);
    }

    // Handle extra images
    const extraImagesInput = document.querySelector<HTMLInputElement>('#extra-images');
    if (extraImagesInput?.files) {
      Array.from(extraImagesInput.files).forEach(file => {
        formData.append("extraImages", file);
      });
    }

    // Handle workflow file
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
                <div className="space-y-4">
                  <div>
                    <FormLabel htmlFor="featured-image">Featured Image</FormLabel>
                    <Input
                      id="featured-image"
                      type="file"
                      accept="image/*"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <FormLabel htmlFor="extra-images">Additional Images</FormLabel>
                    <Input
                      id="extra-images"
                      type="file"
                      accept="image/*"
                      multiple
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <FormLabel htmlFor="workflow-file">Workflow File</FormLabel>
                    <Input
                      id="workflow-file"
                      type="file"
                      accept=".json,.yaml,.yml"
                      className="mt-1"
                    />
                  </div>
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
            <div className="flex items-center gap-4">
              {workflow.featuredImage && (
                <img 
                  src={workflow.featuredImage} 
                  alt={workflow.title}
                  className="w-16 h-16 object-cover rounded"
                />
              )}
              {!workflow.featuredImage && (
                <div className="w-16 h-16 bg-muted flex items-center justify-center rounded">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <h3 className="font-medium">{workflow.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {workflow.description}
                </p>
              </div>
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