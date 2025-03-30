import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileEdit, Save, AlertTriangle, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface WorkflowDocumentationProps {
  workflowId: number;
}

export default function WorkflowDocumentation({ workflowId }: WorkflowDocumentationProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedDocumentation, setEditedDocumentation] = useState("");

  // Fetch documentation
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/workflows/${workflowId}/documentation`],
  });

  // Save documentation mutation
  const saveDocumentation = useMutation({
    mutationFn: async (documentation: string) => {
      const res = await apiRequest(
        "POST", 
        `/api/workflows/${workflowId}/documentation`,
        { documentation }
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Documentation Saved",
        description: "The documentation has been updated successfully."
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: [`/api/workflows/${workflowId}/documentation`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save documentation",
        variant: "destructive"
      });
    }
  });

  // Start editing the documentation
  const startEditing = () => {
    if (data && data.documentation) {
      setEditedDocumentation(data.documentation);
    } else {
      setEditedDocumentation("# Workflow Documentation\n\nAdd detailed documentation for this workflow here.\n\n## Getting Started\n\n1. Installation steps\n2. Configuration\n3. Usage examples");
    }
    setIsEditing(true);
  };

  // Handle save
  const handleSave = () => {
    saveDocumentation.mutate(editedDocumentation);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-5/6"></div>
          <div className="h-4 bg-muted rounded w-4/6"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Error Loading Documentation
          </CardTitle>
          <CardDescription>
            There was a problem loading the documentation. Please try again later.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Empty state for users
  if (!data?.documentation && !isEditing && user?.role !== "admin") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentation Unavailable
          </CardTitle>
          <CardDescription>
            Documentation for this workflow has not been added yet.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Empty state for admins
  if (!data?.documentation && !isEditing && user?.role === "admin") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            No Documentation Available
          </CardTitle>
          <CardDescription>
            Add documentation to help users understand this workflow.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={startEditing}>
            <FileEdit className="h-4 w-4 mr-2" />
            Add Documentation
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Editing state
  if (isEditing && user?.role === "admin") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Edit Documentation</h2>
          <div className="space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setIsEditing(false)}
              disabled={saveDocumentation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saveDocumentation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {saveDocumentation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
        <Textarea 
          className="min-h-[400px] font-mono text-sm"
          value={editedDocumentation}
          onChange={(e) => setEditedDocumentation(e.target.value)}
          placeholder="Write workflow documentation using Markdown..."
        />
        <div className="text-xs text-muted-foreground">
          Supports Markdown formatting: # Heading, ## Subheading, **bold**, *italic*, lists, etc.
        </div>
      </div>
    );
  }

  // Display state
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Documentation</h2>
        {user?.role === "admin" && (
          <Button variant="outline" onClick={startEditing}>
            <FileEdit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
      </div>
      <div className="prose prose-slate max-w-none">
        <ReactMarkdown>{data?.documentation || ""}</ReactMarkdown>
      </div>
    </div>
  );
}