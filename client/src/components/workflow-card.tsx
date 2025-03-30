import { useState } from "react";
import { Link } from "wouter";
import { Workflow } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, ArrowRight, Image as ImageIcon, Star, StarOff } from "lucide-react";

interface WorkflowCardProps {
  workflow: Workflow;
  onImageError?: () => void;
  useFallbackImage?: boolean;
  fallbackImage?: string;
}

export default function WorkflowCard({
  workflow,
  onImageError,
  useFallbackImage = false,
  fallbackImage = ""
}: WorkflowCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Extract workflow metadata
  const categories = workflow.metadata?.categories || [];
  const requiredTier = workflow.metadata?.requiredTier || "free";
  
  // Check if workflow is in user's favorites
  const { data: favorites } = useQuery<Workflow[]>({
    queryKey: ["/api/favorites"],
    enabled: !!user,
  });

  const isFavorite = favorites?.some(fav => fav.id === workflow.id);
  
  // Add to favorites mutation
  const addFavoriteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/favorites/${workflow.id}`);
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

  // Remove from favorites mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/favorites/${workflow.id}`);
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

  // Toggle favorite status
  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to save workflows to favorites",
        variant: "default"
      });
      return;
    }
    
    if (isFavorite) {
      removeFavoriteMutation.mutate();
    } else {
      addFavoriteMutation.mutate();
    }
  };
  
  // Determine if the user can download this workflow
  const canDownload = (): boolean => {
    if (!user) return false;
    if (user.role === "admin") return true;
    
    const userTier = user.preferences?.tier || "";
    
    // Allow download if no tier is required or user's tier matches/exceeds required tier
    return !requiredTier || userTier === requiredTier;
  };
  
  // Handle image loading errors
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.onerror = null; // Prevent infinite loop
    onImageError?.();
  };
  
  // Show image loading status
  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  return (
    <Card className="flex flex-col overflow-hidden transition-all duration-200 hover:shadow-md h-full">
      <Link href={`/workflows/${workflow.id}`} className="flex-1 cursor-pointer">
        <div className="relative w-full h-48 bg-muted/40 overflow-hidden">
          {/* Favorite button */}
          {user && (
            <Button
              size="icon"
              variant={isFavorite ? "default" : "outline"}
              className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full shadow-md bg-background/80 hover:bg-background transition-colors duration-200"
              onClick={toggleFavorite}
            >
              {isFavorite ? (
                <Star className="h-4 w-4" fill="currentColor" />
              ) : (
                <Star className="h-4 w-4" />
              )}
              <span className="sr-only">{isFavorite ? 'Remove from favorites' : 'Add to favorites'}</span>
            </Button>
          )}
          
          {!useFallbackImage && workflow.featuredImage ? (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              )}
              <img
                src={workflow.featuredImage}
                alt={workflow.title}
                onError={handleImageError}
                onLoad={handleImageLoad}
                className={`w-full h-full object-cover transition-transform duration-500 hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted/30">
              {fallbackImage ? (
                <img 
                  src={fallbackImage} 
                  alt="Placeholder" 
                  className="w-24 h-24 opacity-60"
                />
              ) : (
                <ImageIcon className="w-12 h-12 text-muted-foreground opacity-50" />
              )}
            </div>
          )}
        </div>
        
        <CardHeader className="pb-2">
          <CardTitle className="line-clamp-1 text-lg font-semibold leading-tight">
            {workflow.title}
          </CardTitle>
          {categories && categories.length > 0 && (
            <CardDescription className="line-clamp-1 text-xs">
              {categories.join(" • ")}
            </CardDescription>
          )}
        </CardHeader>
        
        <CardContent className="flex-1 pb-2">
          <p className="text-sm text-muted-foreground line-clamp-3 mb-2">
            {workflow.description || "No description available."}
          </p>
          
          <div className="flex flex-wrap gap-1 mt-2">
            {requiredTier && requiredTier !== "free" && (
              <Badge variant="outline" className="text-xs">
                {requiredTier} tier
              </Badge>
            )}
            {workflow.status && (
              <Badge 
                variant={workflow.status === "published" ? "default" : "secondary"} 
                className="text-xs"
              >
                {workflow.status}
              </Badge>
            )}
            {workflow.metadata?.tags && workflow.metadata.tags.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {workflow.metadata.tags.length} tags
              </Badge>
            )}
          </div>
        </CardContent>
      </Link>
      
      <CardFooter className="border-t pt-3 pb-3 flex justify-between gap-2">
        <Button variant="ghost" size="sm" asChild className="h-8">
          <Link href={`/workflows/${workflow.id}`}>
            Details
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </Button>
        
        {user ? (
          canDownload() ? (
            <Button size="sm" asChild className="ml-auto h-8">
              <a href={`/api/workflows/${workflow.id}/download`} download>
                <Download className="h-3.5 w-3.5 mr-1" />
                Download
              </a>
            </Button>
          ) : (
            <Button size="sm" variant="secondary" className="ml-auto h-8" disabled>
              {requiredTier ? `Requires ${requiredTier} tier` : "Not available"}
            </Button>
          )
        ) : (
          <Button size="sm" variant="outline" asChild className="ml-auto h-8">
            <Link href="/auth">
              Sign in to download
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}