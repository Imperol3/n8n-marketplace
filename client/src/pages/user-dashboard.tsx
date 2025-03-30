import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Workflow } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Star, 
  Clock, 
  Download, 
  Settings, 
  User
} from "lucide-react";
import WorkflowCard from "@/components/workflow-card";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";

const PLACEHOLDER_IMAGE = "/placeholder-image.svg";

export default function UserDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("favorites");
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});
  
  // Fetch user's favorite workflows
  const { data: favorites, isLoading: favoritesLoading } = useQuery<Workflow[]>({
    queryKey: ["/api/favorites"],
    enabled: !!user,
  });
  
  // Fetch user's download history
  const { data: downloadHistory, isLoading: historyLoading } = useQuery<{ 
    workflowId: number;
    workflow?: Workflow;
    downloadedAt: string;
  }[]>({
    queryKey: ["/api/downloads/history"],
    enabled: !!user,
  });

  // Handle image error
  const handleImageError = (workflowId: number) => {
    setFailedImages((prev) => ({
      ...prev,
      [workflowId]: true,
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <Link href="/">
              <Button variant="outline" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Workflows
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Your Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage your favorites, downloads, and account settings
            </p>
          </div>
          
          <Card className="p-4 bg-muted/30 w-full sm:w-auto">
            <div className="flex items-center">
              <div className="bg-primary/10 rounded-full p-3 mr-4">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">{user?.username}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user?.role} account
                </p>
              </div>
            </div>
          </Card>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="favorites" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Favorites
            </TabsTrigger>
            <TabsTrigger value="downloads" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download History
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Account Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="favorites" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Favorite Workflows</h2>
            </div>
            
            {favoritesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-lg border h-[350px] animate-pulse bg-muted/40"></div>
                ))}
              </div>
            ) : favorites && favorites.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((workflow) => (
                  <WorkflowCard 
                    key={workflow.id} 
                    workflow={workflow}
                    onImageError={() => handleImageError(workflow.id)}
                    useFallbackImage={!!failedImages[workflow.id]}
                    fallbackImage={PLACEHOLDER_IMAGE}
                  />
                ))}
              </div>
            ) : (
              <Card className="bg-muted/50">
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">No Favorites Yet</CardTitle>
                  <CardDescription>
                    You haven't added any workflows to your favorites yet.
                    Explore the marketplace and star workflows you like to save them here.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center pb-6">
                  <Button asChild>
                    <Link href="/">Browse Workflows</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="downloads" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Download History</h2>
            </div>
            
            {historyLoading ? (
              <div className="rounded-lg border animate-pulse bg-muted/40 h-64"></div>
            ) : downloadHistory && downloadHistory.length > 0 ? (
              <div className="space-y-4">
                {downloadHistory.map((item, index) => (
                  <Card key={index} className="overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-1 aspect-video md:aspect-square bg-muted relative overflow-hidden">
                        {item.workflow?.featuredImage ? (
                          <img 
                            src={item.workflow.featuredImage} 
                            alt={item.workflow?.title || "Workflow"} 
                            className="object-cover w-full h-full"
                            onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; }}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <img 
                              src={PLACEHOLDER_IMAGE} 
                              alt="Placeholder" 
                              className="w-16 h-16 opacity-50"
                            />
                          </div>
                        )}
                      </div>
                      <div className="md:col-span-3 p-4 pt-0 md:pt-4 flex flex-col justify-between">
                        <div>
                          <h3 className="text-lg font-medium mb-1">
                            {item.workflow?.title || `Workflow #${item.workflowId}`}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2 flex items-center">
                            <Clock className="h-3 w-3 mr-1 inline" />
                            Downloaded on {format(new Date(item.downloadedAt), 'MMM d, yyyy, h:mm a')}
                          </p>
                          <p className="text-sm line-clamp-2">
                            {item.workflow?.description || "No description available"}
                          </p>
                        </div>
                        <div className="flex justify-end mt-4">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/workflows/${item.workflowId}`}>
                              View Workflow
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-muted/50">
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">No Downloads Yet</CardTitle>
                  <CardDescription>
                    You haven't downloaded any workflows yet.
                    Browse the marketplace to find and download workflows.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center pb-6">
                  <Button asChild>
                    <Link href="/">Browse Workflows</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Account Settings</h2>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Your Profile</CardTitle>
                <CardDescription>
                  Manage your account details and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-1">Username</h3>
                    <p className="text-muted-foreground">{user?.username}</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Email</h3>
                    <p className="text-muted-foreground">{user?.email}</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Account Type</h3>
                    <p className="text-muted-foreground capitalize">{user?.role}</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Member Since</h3>
                    <p className="text-muted-foreground">
                      {user?.createdAt ? format(new Date(user.createdAt), 'MMMM d, yyyy') : 'Unknown'}
                    </p>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-4">Account Actions</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" disabled>
                      Change Password
                    </Button>
                    <Button variant="outline" disabled>
                      Update Email
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}