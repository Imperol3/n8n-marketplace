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
import { Download, ExternalLink } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const { data: workflows, isLoading } = useQuery<Workflow[]>({
    queryKey: ["/api/workflows"],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
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
          <div className="flex items-center gap-4">
            {user?.role === "admin" && (
              <Link href="/admin">
                <Button variant="outline">Admin Dashboard</Button>
              </Link>
            )}
            <Button variant="destructive" onClick={() => {}}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows?.map((workflow) => (
            <Card key={workflow.id}>
              <CardHeader>
                <CardTitle>{workflow.title}</CardTitle>
                <CardDescription>
                  {workflow.metadata?.category}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
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
              </CardContent>
              <CardFooter className="flex justify-between">
                {workflow.metadata?.previewUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={workflow.metadata.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Preview
                    </a>
                  </Button>
                )}
                {(user?.role === "admin" || user?.role === "user") && (
                  <Button size="sm" asChild>
                    <a href={`/api/workflows/${workflow.id}/download`}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </a>
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
