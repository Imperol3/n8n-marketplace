import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Workflow } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { FormattedContent } from "@/components/formatted-content";
import { 
  Download, 
  ExternalLink, 
  ChevronLeft, 
  Star, 
  StarOff, 
  FileText,
  MessageCircle,
  Brush,
  RefreshCw
} from "lucide-react";
import WorkflowDocumentation from "@/components/workflow-documentation";
import WorkflowRatings from "@/components/workflow-ratings";
import { useState } from "react";

const PLACEHOLDER_IMAGE = "/placeholder-image.svg";

export default function WorkflowDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [formattedDescription, setFormattedDescription] = useState<string | null>(null);
  const [isFormattingDescription, setIsFormattingDescription] = useState(false);
  const numericId = parseInt(id);
  
  const { data: workflow, isLoading } = useQuery<Workflow>({
    queryKey: [`/api/workflows/${id}`],
  });

  // Check if workflow is in user's favorites
  const { data: favorites } = useQuery<Workflow[]>({
    queryKey: ["/api/favorites"],
    enabled: !!user,
  });

  const isFavorite = favorites?.some(fav => fav.id === numericId);

  // Favorite/unfavorite mutations
  const addFavoriteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/favorites/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Added to Favorites",
        description: "Workflow has been added to your favorites"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add to favorites",
        variant: "destructive"
      });
    }
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/favorites/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Removed from Favorites",
        description: "Workflow has been removed from your favorites"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove from favorites",
        variant: "destructive"
      });
    }
  });

  // Format description mutation
  const formatDescriptionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/tools/format-content", { 
        content: workflow?.description || "" 
      });
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.wasConverted) {
        setFormattedDescription(data.formatted);
        toast({
          title: "Description Formatted",
          description: "The description has been enhanced with markdown formatting"
        });
      } else {
        toast({
          title: "Already Formatted",
          description: "The description already has proper formatting"
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to format description",
        variant: "destructive"
      });
    }
  });
  
  // Format the description
  const formatDescription = () => {
    if (!workflow?.description) return;
    setIsFormattingDescription(true);
    formatDescriptionMutation.mutate();
  };
  
  // Toggle favorite status
  const toggleFavorite = () => {
    if (isFavorite) {
      removeFavoriteMutation.mutate();
    } else {
      addFavoriteMutation.mutate();
    }
  };

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
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">{workflow.title}</h1>
              <div className="flex flex-wrap gap-2 mb-2">
                {workflow.metadata?.categories?.map((category) => (
                  <Badge key={category} variant="secondary">
                    {category}
                  </Badge>
                ))}
              </div>
              {workflow.metadata?.averageRating && workflow.metadata.averageRating > 0 && (
                <div className="flex items-center text-amber-500">
                  {Array(5).fill(0).map((_, i) => (
                    <Star 
                      key={i} 
                      className="h-4 w-4" 
                      fill={i < Math.round(workflow.metadata?.averageRating || 0) ? "currentColor" : "none"}
                    />
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">
                    {workflow.metadata.averageRating.toFixed(1)} 
                    {workflow.metadata.ratings && (
                      <span className="ml-1">({workflow.metadata.ratings.length} {workflow.metadata.ratings.length === 1 ? 'review' : 'reviews'})</span>
                    )}
                  </span>
                </div>
              )}
            </div>
            
            {user && (
              <Button 
                variant="outline" 
                onClick={toggleFavorite}
                disabled={addFavoriteMutation.isPending || removeFavoriteMutation.isPending}
                className="min-w-40"
              >
                {isFavorite ? (
                  <>
                    <StarOff className="h-4 w-4 mr-2" />
                    Remove from Favorites
                  </>
                ) : (
                  <>
                    <Star className="h-4 w-4 mr-2" />
                    Add to Favorites
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Main Image */}
            <div className="rounded-lg overflow-hidden bg-muted aspect-video">
              <img
                src={workflow.featuredImage}
                alt={workflow.title}
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; }}
              />
            </div>

            {/* Tabs for different content sections */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <ChevronLeft className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="documentation" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Documentation
                </TabsTrigger>
                <TabsTrigger value="ratings" className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Ratings & Reviews
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-6">
                {/* Description */}
                <div className="prose prose-lg max-w-none">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold m-0">Description</h2>
                    {user && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={formatDescription}
                        disabled={formatDescriptionMutation.isPending || isFormattingDescription}
                        className="flex gap-2 items-center"
                      >
                        {formatDescriptionMutation.isPending ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span>Formatting...</span>
                          </>
                        ) : (
                          <>
                            <Brush className="h-4 w-4" />
                            <span>Format Description</span>
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  
                  {formattedDescription ? (
                    <FormattedContent content={formattedDescription} />
                  ) : (
                    <p className="whitespace-pre-wrap">{workflow.description}</p>
                  )}
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
                            onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="documentation">
                <WorkflowDocumentation workflowId={numericId} />
              </TabsContent>
              
              <TabsContent value="ratings">
                <WorkflowRatings workflowId={numericId} />
              </TabsContent>
            </Tabs>
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
              {user ? (
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
              {workflow.metadata?.requiredTier && workflow.metadata.requiredTier !== "free" && (
                <div className="mt-3 text-sm text-muted-foreground">
                  <p className="font-medium">Required tier: {workflow.metadata.requiredTier}</p>
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
            
            {/* User Dashboard Link */}
            {user && (
              <div className="rounded-lg border p-6 bg-gradient-to-r from-slate-50 to-slate-100">
                <h2 className="text-xl font-semibold mb-4">Your Dashboard</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Access your favorite workflows, download history, and personalized recommendations.
                </p>
                <Button className="w-full" variant="outline" asChild>
                  <Link href="/dashboard">
                    Go to Dashboard
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
