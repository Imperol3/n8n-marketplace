import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Workflow } from "@shared/schema";
import { Download, ExternalLink, Image as ImageIcon, ArrowRight } from "lucide-react";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const { data: workflows = [], isLoading } = useQuery<Workflow[]>({
    queryKey: ["/api/workflows"],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse h-[480px]">
              <div className="h-[200px] bg-muted" />
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted rounded w-2/3"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Workflow Marketplace</h1>
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
                variant="destructive" 
                onClick={() => logoutMutation.mutate()}
              >
                Logout
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows?.map((workflow) => (
            <Card key={workflow.id} className="flex flex-col h-[480px] overflow-hidden group">
              <Link href={`/workflows/${workflow.id}`} className="flex-1 cursor-pointer">
                <div className="relative w-full h-[200px]">
                  {workflow.featuredImage ? (
                    <img
                      src={workflow.featuredImage}
                      alt={workflow.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-1">{workflow.title}</CardTitle>
                  <CardDescription className="line-clamp-1">
                    {workflow.metadata?.category}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <p className="text-sm text-muted-foreground line-clamp-3 min-h-[4.5rem]">
                    {workflow.description}
                  </p>
                  {workflow.metadata?.tags && (
                    <div className="flex gap-2 mt-4 flex-wrap">
                      {workflow.metadata.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {workflow.extraImages && workflow.extraImages.length > 0 && (
                    <div className="mt-4 text-sm text-muted-foreground">
                      +{workflow.extraImages.length} additional images
                    </div>
                  )}
                </CardContent>
              </Link>
              <CardFooter className="flex justify-between border-t pt-4">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/workflows/${workflow.id}`}>
                    View Details
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                {(user?.role === "admin" || user?.role === "user") ? (
                  <Button size="sm" asChild className="ml-auto">
                    <a href={`/api/workflows/${workflow.id}/download`}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </a>
                  </Button>
                ) : (
                  <Button size="sm" asChild className="ml-auto" variant="secondary">
                    <Link href="/auth">
                      Sign in to Download
                    </Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}