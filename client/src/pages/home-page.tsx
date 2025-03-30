import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Workflow } from "@shared/schema";
import { Search, AlertTriangle, Filter, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import WorkflowCard from "@/components/workflow-card";

// Placeholder image to use when workflow image fails to load
const PLACEHOLDER_IMAGE = "/placeholder-image.svg";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<string>("newest");
  
  // Track which images have failed to load
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});

  const handleImageError = (workflowId: number) => {
    setFailedImages(prev => ({
      ...prev,
      [workflowId]: true
    }));
  };

  const { data: workflows = [], isLoading, error, refetch } = useQuery<Workflow[]>({
    queryKey: ["/api/workflows"],
    onError: (error: Error) => {
      toast({
        title: "Error loading workflows",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Get the user's tier
  const userTier = useMemo(() => {
    if (!user || !user.preferences) return null;
    return user.preferences.tier;
  }, [user]);
  
  // Function to check if a workflow is available to the current user
  const isWorkflowAvailable = (workflow: Workflow) => {
    // For admin, all workflows are available
    if (user?.role === "admin") return true;
    
    // For regular users, check tier and status
    const requiredTier = workflow.metadata?.requiredTier || "free";
    const tierMatch = !requiredTier || requiredTier === userTier;
    const statusMatch = workflow.status === "published";
    return tierMatch && statusMatch;
  };

  // Apply search term
  const searchedWorkflows = useMemo(() => {
    if (!workflows) return [];
    if (!searchTerm.trim()) return workflows;
    
    const searchLower = searchTerm.toLowerCase();
    return workflows.filter((workflow) => {
      // Search in title and description
      const titleMatch = workflow.title?.toLowerCase().includes(searchLower);
      const descMatch = workflow.description?.toLowerCase().includes(searchLower);
      
      // Search in categories from metadata
      const categoryMatch = workflow.metadata?.categories?.some(
        (cat: string) => cat.toLowerCase().includes(searchLower)
      );
      
      // Search in tags from metadata
      const tagMatch = workflow.metadata?.tags?.some(
        (tag: string) => tag.toLowerCase().includes(searchLower)
      );
      
      return titleMatch || descMatch || categoryMatch || tagMatch;
    });
  }, [workflows, searchTerm]);

  // Filter workflows based on user role, tier, and category
  const filteredWorkflows = useMemo(() => {
    if (!searchedWorkflows) return [];

    // Filter by category if selected
    let filtered = searchedWorkflows;
    if (selectedCategory !== "all") {
      filtered = filtered.filter(workflow => workflow.metadata?.categories?.includes(selectedCategory));
    }

    // Apply availability filter
    if (user?.role !== "admin") {
      filtered = filtered.filter(isWorkflowAvailable);
    }
    
    // Apply sorting
    return [...filtered].sort((a, b) => {
      if (sortOrder === "newest") {
        // Create date objects using a fallback pattern
        const getDate = (w: Workflow) => {
          // In a real app, these fields would be added by the database
          const dateStr = new Date().toISOString();
          return new Date(dateStr);
        };
        
        return getDate(b).getTime() - getDate(a).getTime();
      } else if (sortOrder === "oldest") {
        const getDate = (w: Workflow) => {
          const dateStr = new Date().toISOString();
          return new Date(dateStr);
        };
        
        return getDate(a).getTime() - getDate(b).getTime();
      } else if (sortOrder === "name_asc") {
        return (a.title || "").localeCompare(b.title || "");
      } else if (sortOrder === "name_desc") {
        return (b.title || "").localeCompare(a.title || "");
      }
      return 0;
    });
  }, [searchedWorkflows, user, selectedCategory, userTier, sortOrder]);

  // Get unique categories from workflows
  const categories = useMemo(() => {
    if (!workflows) return [];
    
    // Extract categories from workflow metadata
    const allCategories = workflows.flatMap(workflow => 
      workflow.metadata?.categories || []
    ).filter(Boolean); // Remove any undefined or null categories
    
    const uniqueCategories = Array.from(new Set(allCategories)).sort();
    return ["all", ...uniqueCategories];
  }, [workflows]);
  
  // Count workflows per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    
    workflows.forEach((workflow: Workflow) => {
      if (isWorkflowAvailable(workflow)) {
        counts.all = (counts.all || 0) + 1;
        
        workflow.metadata?.categories?.forEach((category: string) => {
          if (category) {
            counts[category] = (counts[category] || 0) + 1;
          }
        });
      }
    });
    
    return counts;
  }, [workflows, user, userTier, isWorkflowAvailable]);

  // Handle retry loading
  const handleRetry = () => {
    refetch();
    setFailedImages({});
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">Workflow Marketplace</h1>
            <Skeleton className="h-10 w-24" />
          </div>
        </header>

        <main className="container mx-auto p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Skeleton className="h-10 w-full md:w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          
          <div className="mb-6">
            <Skeleton className="h-10 w-full" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex flex-col gap-2 border rounded-lg p-4">
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex gap-2 mt-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">Workflow Marketplace</h1>
            {user ? (
              <Button variant="outline" onClick={() => logoutMutation.mutate()}>Logout</Button>
            ) : (
              <Link href="/auth">
                <Button variant="outline">Sign in</Button>
              </Link>
            )}
          </div>
        </header>

        <main className="container mx-auto p-6">
          <div className="flex flex-col items-center justify-center h-64">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error loading workflows</h2>
            <p className="text-muted-foreground mb-4">{error.message}</p>
            <Button onClick={handleRetry}>Retry</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Workflow Marketplace
          </h1>
          {!user ? (
            <Link href="/auth">
              <Button variant="outline">Sign in</Button>
            </Link>
          ) : (
            <div className="flex items-center gap-4">
              {user.role === "admin" && (
                <Link href="/admin">
                  <Button variant="outline">Admin Dashboard</Button>
                </Link>
              )}
              <Button 
                variant="outline" 
                onClick={() => logoutMutation.mutate()}
              >
                Logout
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto p-6">
        {/* Search and filter controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              className="pl-10 h-10"
              placeholder="Search workflows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-[180px] h-10">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                <SelectItem value="name_desc">Name (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Category filter */}
        <div className="mb-6 overflow-x-auto pb-2">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="mb-4">
              {categories.map(category => (
                <TabsTrigger key={category} value={category} className="capitalize whitespace-nowrap">
                  {category}
                  {categoryCounts[category] > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {categoryCounts[category] || 0}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {filteredWorkflows.length === 0 ? (
          <Card className="bg-muted/50 border border-muted-foreground/20">
            <CardHeader className="text-center">
              <CardDescription className="text-lg">
                {searchTerm ? (
                  <>
                    No workflows found matching "{searchTerm}"
                    {selectedCategory !== "all" && (
                      <> in the {selectedCategory} category</>
                    )}
                  </>
                ) : (
                  <>
                    No workflows available for your current access level. 
                    {selectedCategory !== "all" ? (
                      <> Try selecting a different category or </>
                    ) : (
                      <> Please </>
                    )}
                    contact an administrator to upgrade your tier.
                  </>
                )}
              </CardDescription>
              {searchTerm && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setSearchTerm("")}
                >
                  Clear Search
                </Button>
              )}
            </CardHeader>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkflows.map((workflow) => (
              <WorkflowCard 
                key={workflow.id} 
                workflow={workflow} 
                onImageError={() => handleImageError(workflow.id)}
                useFallbackImage={!!failedImages[workflow.id]}
                fallbackImage={PLACEHOLDER_IMAGE}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}