import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { FileText, RefreshCw } from "lucide-react";
import { useState } from "react";

export function ContentConversionTool() {
  const { toast } = useToast();
  const [lastResult, setLastResult] = useState<{
    total: number;
    converted: number;
    documentations?: number;
    descriptions?: number;
    message: string;
    timestamp: string;
  } | null>(null);

  const convertToMarkdown = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/tools/convert-to-markdown', {
        method: 'POST',
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to convert content');
      }
      return res.json();
    },
    onSuccess: (data) => {
      setLastResult({
        total: data.total,
        converted: data.converted,
        documentations: data.documentations,
        descriptions: data.descriptions,
        message: data.message,
        timestamp: new Date().toLocaleString()
      });
      
      toast({
        title: "Content Conversion Complete",
        description: data.message,
      });
    },
    onError: (error) => {
      toast({
        title: "Content Conversion Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" /> 
          Content Formatting Tool
        </CardTitle>
        <CardDescription>
          Convert plain text to proper markdown formatting for better readability
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This tool scans workflow documentation and descriptions for plain text content and enhances them with proper markdown formatting
          for better readability. It detects headers, lists, bold text, and other formatting elements to improve content presentation.
        </p>
        
        {lastResult && (
          <Alert className="mb-4">
            <AlertTitle>Last Conversion Result</AlertTitle>
            <AlertDescription>
              <p>{lastResult.message}</p>
              
              {lastResult.converted > 0 && (
                <div className="mt-3 border-t pt-2">
                  <h4 className="text-sm font-medium mb-1">Statistics:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total workflows:</span>
                      <span className="ml-1 font-medium">{lastResult.total}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Contents converted:</span>
                      <span className="ml-1 font-medium">{lastResult.converted}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Documentations:</span>
                      <span className="ml-1 font-medium">{lastResult.documentations || 0}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Descriptions:</span>
                      <span className="ml-1 font-medium">{lastResult.descriptions || 0}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground mt-2">
                Run at {lastResult.timestamp}
              </p>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={() => convertToMarkdown.mutate()} 
          disabled={convertToMarkdown.isPending}
          className="w-full"
        >
          {convertToMarkdown.isPending ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Converting...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Convert Content to Markdown
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}