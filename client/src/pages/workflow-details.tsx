import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Workflow } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Download, ExternalLink, ChevronLeft } from "lucide-react";

export default function WorkflowDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  
  const { data: workflow, isLoading } = useQuery<Workflow>({
    queryKey: [`/api/workflows/${id}`],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 animate-pulse">
        <div className="h-[400px] bg-muted rounded-lg mb-6"></div>
        <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-muted rounded w-2/3 mb-8"></div>
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-5/6"></div>
          <div className="h-4 bg-muted rounded w-4/6"></div>
        </div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Workflow not found</h1>
        <Link href="/">
          <Button variant="outline">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Workflows
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" className="mb-6">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Workflows
            </Button>
          </Link>
          <h1 className="text-4xl font-bold mb-2">{workflow.title}</h1>
          {workflow.metadata?.category && (
            <div className="text-muted-foreground mb-4">
              Category: {workflow.metadata.category}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Main Image */}
            <div className="rounded-lg overflow-hidden bg-muted aspect-video">
              <img
                src={workflow.featuredImage}
                alt={workflow.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Description */}
            <div className="prose prose-lg max-w-none">
              <h2 className="text-2xl font-semibold mb-4">Description</h2>
              <p className="whitespace-pre-wrap">{workflow.description}</p>
            </div>

            {/* Additional Images */}
            {workflow.extraImages && workflow.extraImages.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Additional Screenshots</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {workflow.extraImages.map((image, index) => (
                    <div key={index} className="aspect-video rounded-lg overflow-hidden bg-muted">
                      <img
                        src={image}
                        alt={`${workflow.title} screenshot ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <div className="rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Workflow Status</h2>
              <div className="px-3 py-1 rounded text-sm bg-secondary inline-block">
                {workflow.status?.replace(/_/g, ' ').split(' ').map(word =>
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </div>
            </div>

            {/* Download Section */}
            <div className="rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Download Workflow</h2>
              {(user?.role === "admin" || user?.role === "user") ? (
                <Button className="w-full" asChild>
                  <a href={`/api/workflows/${workflow.id}/download`}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Workflow
                  </a>
                </Button>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Sign in to download this workflow and access our full collection.
                  </p>
                  <Button className="w-full" asChild>
                    <Link href="/auth">Sign in to Download</Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Preview Link */}
            {workflow.metadata?.previewUrl && (
              <div className="rounded-lg border p-6">
                <h2 className="text-xl font-semibold mb-4">Live Preview</h2>
                <Button variant="outline" className="w-full" asChild>
                  <a
                    href={workflow.metadata.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Live Demo
                  </a>
                </Button>
              </div>
            )}

            {/* Tags */}
            {workflow.metadata?.tags && workflow.metadata.tags.length > 0 && (
              <div className="rounded-lg border p-6">
                <h2 className="text-xl font-semibold mb-4">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {workflow.metadata.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
