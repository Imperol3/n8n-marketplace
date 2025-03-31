import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CopyBlock, dracula } from "react-code-blocks";
import { Copy, Server, Database, User, FileText, Star, MessageSquare, Settings, Key, Brush, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ApiDocumentationPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The code has been copied to your clipboard"
    });
  };
  
  // Reusable API endpoint component
  const ApiEndpoint = ({ 
    method, 
    path, 
    description, 
    authentication = true,
    adminOnly = false,
    params = null,
    requestBody = null,
    responseBody = null,
    curl = null,
    fetchExample = null
  }: {
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    path: string;
    description: string;
    authentication?: boolean;
    adminOnly?: boolean;
    params?: null | { name: string; type: string; description: string; required: boolean }[];
    requestBody?: null | string;
    responseBody?: null | string;
    curl?: null | string;
    fetchExample?: null | string;
  }) => {
    const getMethodColor = (method: string) => {
      switch (method) {
        case "GET": return "bg-green-100 text-green-800";
        case "POST": return "bg-blue-100 text-blue-800";
        case "PUT": return "bg-yellow-100 text-yellow-800";
        case "PATCH": return "bg-orange-100 text-orange-800";
        case "DELETE": return "bg-red-100 text-red-800";
        default: return "bg-gray-100 text-gray-800";
      }
    };
    
    return (
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${getMethodColor(method)}`}>
                  {method}
                </span>
                <CardTitle className="text-lg font-mono">{path}</CardTitle>
              </div>
              <CardDescription>{description}</CardDescription>
            </div>
            <div className="flex flex-col gap-1 items-end">
              {authentication && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Key className="h-3 w-3" />
                  Authentication Required
                </Badge>
              )}
              {adminOnly && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <Settings className="h-3 w-3" />
                  Admin Only
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          <Accordion type="single" collapsible className="w-full">
            {params && params.length > 0 && (
              <AccordionItem value="parameters">
                <AccordionTrigger className="text-sm font-medium py-2">Parameters</AccordionTrigger>
                <AccordionContent>
                  <div className="rounded-md border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="py-2 px-4 text-left font-medium">Name</th>
                          <th className="py-2 px-4 text-left font-medium">Type</th>
                          <th className="py-2 px-4 text-left font-medium">Required</th>
                          <th className="py-2 px-4 text-left font-medium">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {params.map((param, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/50'}>
                            <td className="py-2 px-4 font-mono">{param.name}</td>
                            <td className="py-2 px-4">{param.type}</td>
                            <td className="py-2 px-4">{param.required ? 'Yes' : 'No'}</td>
                            <td className="py-2 px-4">{param.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
            
            {requestBody && (
              <AccordionItem value="request-body">
                <AccordionTrigger className="text-sm font-medium py-2">Request Body</AccordionTrigger>
                <AccordionContent>
                  <div className="relative">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2 z-10"
                      onClick={() => copyToClipboard(requestBody)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <CopyBlock
                      text={requestBody}
                      language="json"
                      showLineNumbers={false}
                      theme={dracula}
                      codeBlock
                      wrapLongLines
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
            
            {responseBody && (
              <AccordionItem value="response">
                <AccordionTrigger className="text-sm font-medium py-2">Response</AccordionTrigger>
                <AccordionContent>
                  <div className="relative">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2 z-10"
                      onClick={() => copyToClipboard(responseBody)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <CopyBlock
                      text={responseBody}
                      language="json"
                      showLineNumbers={false}
                      theme={dracula}
                      codeBlock
                      wrapLongLines
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
            
            {curl && (
              <AccordionItem value="curl">
                <AccordionTrigger className="text-sm font-medium py-2">cURL Example</AccordionTrigger>
                <AccordionContent>
                  <div className="relative">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2 z-10"
                      onClick={() => copyToClipboard(curl)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <CopyBlock
                      text={curl}
                      language="bash"
                      showLineNumbers={false}
                      theme={dracula}
                      codeBlock
                      wrapLongLines
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
            
            {fetchExample && (
              <AccordionItem value="fetch">
                <AccordionTrigger className="text-sm font-medium py-2">Fetch API Example</AccordionTrigger>
                <AccordionContent>
                  <div className="relative">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2 z-10"
                      onClick={() => copyToClipboard(fetchExample)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <CopyBlock
                      text={fetchExample}
                      language="javascript"
                      showLineNumbers={false}
                      theme={dracula}
                      codeBlock
                      wrapLongLines
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">API Documentation</h1>
        <p className="text-lg text-muted-foreground">
          Comprehensive documentation for the Workflow Management Platform API endpoints.
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 mb-8">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="workflows" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Workflows
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Users & Auth
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <Brush className="h-4 w-4" />
            Content Tools
          </TabsTrigger>
          <TabsTrigger value="misc" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Misc
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>
                Basic information on how to use the Workflow Management Platform API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Authentication</h3>
                <p className="text-muted-foreground mb-2">
                  Most API endpoints require authentication. The API uses cookie-based authentication
                  through a session cookie that is set after a successful login.
                </p>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>To authenticate, first make a POST request to <code>/api/login</code> with credentials</li>
                  <li>The server will set the session cookie automatically if authentication is successful</li>
                  <li>Subsequent requests will use this cookie for authentication</li>
                  <li>To end the session, make a POST request to <code>/api/logout</code></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Base URL</h3>
                <p className="text-muted-foreground">
                  All API paths are relative to your application's base URL:
                </p>
                <pre className="p-2 bg-muted rounded-md mt-2 text-sm font-mono">
                  https://your-domain.repl.co
                </pre>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Response Format</h3>
                <p className="text-muted-foreground mb-2">
                  All API responses are JSON formatted. Successful responses generally have the following structure:
                </p>
                <div className="relative">
                  <CopyBlock
                    text={`{
  "success": true,
  "data": { ... },  // The actual response data
  "message": "..."  // Optional success message
}`}
                    language="json"
                    showLineNumbers={false}
                    theme={dracula}
                    codeBlock
                  />
                </div>
                
                <p className="text-muted-foreground my-2">
                  Error responses typically have this structure:
                </p>
                <div className="relative">
                  <CopyBlock
                    text={`{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information" // Optional
}`}
                    language="json"
                    showLineNumbers={false}
                    theme={dracula}
                    codeBlock
                  />
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">HTTP Status Codes</h3>
                <div className="rounded-md border overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="py-2 px-4 text-left font-medium">Status Code</th>
                        <th className="py-2 px-4 text-left font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-background">
                        <td className="py-2 px-4 font-mono">200 OK</td>
                        <td className="py-2 px-4">The request was successful</td>
                      </tr>
                      <tr className="bg-muted/50">
                        <td className="py-2 px-4 font-mono">201 Created</td>
                        <td className="py-2 px-4">A new resource was created successfully</td>
                      </tr>
                      <tr className="bg-background">
                        <td className="py-2 px-4 font-mono">400 Bad Request</td>
                        <td className="py-2 px-4">The request was malformed or missing required parameters</td>
                      </tr>
                      <tr className="bg-muted/50">
                        <td className="py-2 px-4 font-mono">401 Unauthorized</td>
                        <td className="py-2 px-4">Authentication is required or the provided credentials are invalid</td>
                      </tr>
                      <tr className="bg-background">
                        <td className="py-2 px-4 font-mono">403 Forbidden</td>
                        <td className="py-2 px-4">You don't have permission to access the requested resource</td>
                      </tr>
                      <tr className="bg-muted/50">
                        <td className="py-2 px-4 font-mono">404 Not Found</td>
                        <td className="py-2 px-4">The requested resource could not be found</td>
                      </tr>
                      <tr className="bg-background">
                        <td className="py-2 px-4 font-mono">500 Internal Server Error</td>
                        <td className="py-2 px-4">An unexpected error occurred on the server</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Updates</CardTitle>
              <CardDescription>
                Recently added or updated API endpoints
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4 p-3 rounded-lg border">
                <div className="flex-shrink-0 mt-1">
                  <Badge variant="default" className="flex items-center gap-1 bg-green-600">
                    <CheckCircle2 className="h-3 w-3" />
                    New
                  </Badge>
                </div>
                <div>
                  <h3 className="font-semibold text-base mb-1">
                    Content Formatting and Editing API
                  </h3>
                  <p className="text-muted-foreground text-sm mb-2">
                    New endpoints for content formatting and inline editing have been added to enhance the
                    workflow description and documentation management.
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-xs text-muted-foreground">
                    <li>Format content with Markdown enhancements via <code>/api/tools/format-content</code></li>
                    <li>Inline edit workflow content via <code>/api/workflows/:id/inline-edit</code></li>
                    <li>New <code>EditableContent</code> React component for in-place content editing with markdown support</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="workflows" className="space-y-6">
          <div className="mb-4">
            <h2 className="text-2xl font-bold">Workflow Endpoints</h2>
            <p className="text-muted-foreground">
              API endpoints for managing workflows, including creation, updates, and retrieval.
            </p>
          </div>
          
          <ApiEndpoint
            method="GET"
            path="/api/workflows"
            description="Retrieve a list of all workflows available to the user"
            authentication={false}
            responseBody={`[
  {
    "id": 42,
    "title": "Lead Enrichment Workflow",
    "description": "Automatically enrich leads with additional data from various sources",
    "filePath": "/uploads/workflow-file-12345.json",
    "featuredImage": "/uploads/featured-image-12345.png",
    "extraImages": [
      "/uploads/extra-image-1.png",
      "/uploads/extra-image-2.png"
    ],
    "videoUrl": "https://youtube.com/watch?v=example",
    "status": "published",
    "metadata": {
      "categories": ["lead-generation", "sales-automation"],
      "tags": ["enrichment", "cold-email", "lead-scoring"],
      "requiredTier": "tier1",
      "previewUrl": "https://demo.example.com/lead-enrichment",
      "averageRating": 4.5,
      "ratings": [
        {
          "userId": 123,
          "rating": 5,
          "review": "Great workflow!",
          "createdAt": "2025-02-15T23:00:00.000Z"
        }
      ]
    }
  }
]`}
            curl={`curl -X GET \\
  "https://your-domain.repl.co/api/workflows" \\
  -H "Content-Type: application/json"`}
            fetchExample={`async function getWorkflows() {
  const response = await fetch('/api/workflows', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch workflows');
  }
  
  return await response.json();
}`}
          />
          
          <ApiEndpoint
            method="GET"
            path="/api/workflows/:id"
            description="Retrieve a specific workflow by ID"
            authentication={false}
            params={[
              {
                name: "id",
                type: "number",
                description: "The ID of the workflow to retrieve",
                required: true
              }
            ]}
            responseBody={`{
  "id": 42,
  "title": "Lead Enrichment Workflow",
  "description": "Automatically enrich leads with additional data from various sources",
  "filePath": "/uploads/workflow-file-12345.json",
  "featuredImage": "/uploads/featured-image-12345.png",
  "extraImages": [
    "/uploads/extra-image-1.png",
    "/uploads/extra-image-2.png"
  ],
  "videoUrl": "https://youtube.com/watch?v=example",
  "status": "published",
  "metadata": {
    "categories": ["lead-generation", "sales-automation"],
    "tags": ["enrichment", "cold-email", "lead-scoring"],
    "requiredTier": "tier1",
    "previewUrl": "https://demo.example.com/lead-enrichment",
    "averageRating": 4.5,
    "ratings": [
      {
        "userId": 123,
        "rating": 5,
        "review": "Great workflow!",
        "createdAt": "2025-02-15T23:00:00.000Z"
      }
    ]
  }
}`}
            curl={`curl -X GET \\
  "https://your-domain.repl.co/api/workflows/42" \\
  -H "Content-Type: application/json"`}
            fetchExample={`async function getWorkflowById(id) {
  const response = await fetch(\`/api/workflows/\${id}\`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch workflow');
  }
  
  return await response.json();
}`}
          />
          
          <ApiEndpoint
            method="POST"
            path="/api/workflows"
            description="Create a new workflow (multipart form submission required for file uploads)"
            authentication={true}
            adminOnly={true}
            requestBody={`// This must be sent as multipart/form-data
{
  "title": "New Workflow",
  "description": "Description of the workflow",
  "videoUrl": "https://youtube.com/watch?v=example",
  "metadata": "{\"categories\":[\"sales-automation\"],\"tags\":[\"cold-email\"],\"requiredTier\":\"free\"}"
  // Plus file uploads for:
  // - workflow-file (required)
  // - featuredImage (required)
  // - extra-images (optional, multiple allowed)
}`}
            responseBody={`{
  "id": 43,
  "title": "New Workflow",
  "description": "Description of the workflow",
  "filePath": "/uploads/workflow-file-67890.json",
  "featuredImage": "/uploads/featured-image-67890.png",
  "extraImages": [
    "/uploads/extra-image-3.png"
  ],
  "videoUrl": "https://youtube.com/watch?v=example",
  "status": "draft",
  "metadata": {
    "categories": ["sales-automation"],
    "tags": ["cold-email"],
    "requiredTier": "free"
  }
}`}
            curl={`curl -X POST \\
  "https://your-domain.repl.co/api/workflows" \\
  -H "Content-Type: multipart/form-data" \\
  -F "title=New Workflow" \\
  -F "description=Description of the workflow" \\
  -F "videoUrl=https://youtube.com/watch?v=example" \\
  -F "metadata={\"categories\":[\"sales-automation\"],\"tags\":[\"cold-email\"],\"requiredTier\":\"free\"}" \\
  -F "workflow-file=@/path/to/workflow.json" \\
  -F "featuredImage=@/path/to/image.png" \\
  -F "extra-images=@/path/to/extra1.png" \\
  -F "extra-images=@/path/to/extra2.png"`}
            fetchExample={`async function createWorkflow(formData) {
  // formData should be a FormData object with all required fields and files
  const response = await fetch('/api/workflows', {
    method: 'POST',
    body: formData,
    // Note: Don't set Content-Type header when using FormData
    // The browser will set it with the correct boundary for multipart/form-data
  });
  
  if (!response.ok) {
    throw new Error('Failed to create workflow');
  }
  
  return await response.json();
}`}
          />
          
          <ApiEndpoint
            method="PATCH"
            path="/api/workflows/:id"
            description="Update an existing workflow (multipart form submission for file updates)"
            authentication={true}
            adminOnly={true}
            params={[
              {
                name: "id",
                type: "number",
                description: "The ID of the workflow to update",
                required: true
              }
            ]}
            requestBody={`// This must be sent as multipart/form-data if updating files
{
  "title": "Updated Workflow Title",
  "description": "Updated description",
  "videoUrl": "https://youtube.com/watch?v=updated",
  "metadata": "{\"categories\":[\"updated-category\"],\"tags\":[\"updated-tag\"],\"requiredTier\":\"tier1\"}"
  // Optional file uploads to replace existing files:
  // - workflow-file
  // - featuredImage
  // - extra-images
}`}
            responseBody={`{
  "id": 42,
  "title": "Updated Workflow Title",
  "description": "Updated description",
  "filePath": "/uploads/workflow-file-12345.json",
  "featuredImage": "/uploads/featured-image-12345.png",
  "extraImages": [
    "/uploads/extra-image-1.png",
    "/uploads/extra-image-2.png"
  ],
  "videoUrl": "https://youtube.com/watch?v=updated",
  "status": "published",
  "metadata": {
    "categories": ["updated-category"],
    "tags": ["updated-tag"],
    "requiredTier": "tier1"
  }
}`}
            curl={`curl -X PATCH \\
  "https://your-domain.repl.co/api/workflows/42" \\
  -H "Content-Type: multipart/form-data" \\
  -F "title=Updated Workflow Title" \\
  -F "description=Updated description" \\
  -F "videoUrl=https://youtube.com/watch?v=updated" \\
  -F "metadata={\"categories\":[\"updated-category\"],\"tags\":[\"updated-tag\"],\"requiredTier\":\"tier1\"}"`}
            fetchExample={`async function updateWorkflow(id, formData) {
  // formData should be a FormData object with fields to update
  const response = await fetch(\`/api/workflows/\${id}\`, {
    method: 'PATCH',
    body: formData,
    // Note: Don't set Content-Type header when using FormData
  });
  
  if (!response.ok) {
    throw new Error('Failed to update workflow');
  }
  
  return await response.json();
}`}
          />
          
          <ApiEndpoint
            method="PATCH"
            path="/api/workflows/:id/description"
            description="Update only the description of a workflow (new endpoint)"
            authentication={true}
            adminOnly={true}
            params={[
              {
                name: "id",
                type: "number",
                description: "The ID of the workflow to update",
                required: true
              }
            ]}
            requestBody={`{
  "description": "This is the updated description content with **markdown** formatting."
}`}
            responseBody={`{
  "success": true,
  "workflow": {
    "id": 42,
    "title": "Lead Enrichment Workflow",
    "description": "This is the updated description content with **markdown** formatting.",
    "filePath": "/uploads/workflow-file-12345.json",
    "featuredImage": "/uploads/featured-image-12345.png",
    "extraImages": [
      "/uploads/extra-image-1.png",
      "/uploads/extra-image-2.png"
    ],
    "videoUrl": "https://youtube.com/watch?v=example",
    "status": "published",
    "metadata": {
      "categories": ["lead-generation", "sales-automation"],
      "tags": ["enrichment", "cold-email", "lead-scoring"],
      "requiredTier": "tier1",
      "previewUrl": "https://demo.example.com/lead-enrichment"
    }
  },
  "message": "Description updated successfully"
}`}
            curl={`curl -X PATCH \\
  "https://your-domain.repl.co/api/workflows/42/description" \\
  -H "Content-Type: application/json" \\
  -d '{"description": "This is the updated description content with **markdown** formatting."}'`}
            fetchExample={`async function updateWorkflowDescription(id, description) {
  const response = await fetch(\`/api/workflows/\${id}/description\`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ description })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update description");
  }
  
  return await response.json();
}`}
          />
          
          <ApiEndpoint
            method="PATCH"
            path="/api/workflows/:id/status"
            description="Update the status of a workflow"
            authentication={true}
            adminOnly={true}
            params={[
              {
                name: "id",
                type: "number",
                description: "The ID of the workflow to update",
                required: true
              }
            ]}
            requestBody={`{
  "status": "published" 
  // Allowed values: "draft", "in_progress", "needs_edit", "published"
}`}
            responseBody={`{
  "id": 42,
  "title": "Lead Enrichment Workflow",
  "description": "Automatically enrich leads with additional data from various sources",
  "filePath": "/uploads/workflow-file-12345.json",
  "featuredImage": "/uploads/featured-image-12345.png",
  "extraImages": [
    "/uploads/extra-image-1.png",
    "/uploads/extra-image-2.png"
  ],
  "videoUrl": "https://youtube.com/watch?v=example",
  "status": "published",
  "metadata": {
    "categories": ["lead-generation", "sales-automation"],
    "tags": ["enrichment", "cold-email", "lead-scoring"],
    "requiredTier": "tier1",
    "previewUrl": "https://demo.example.com/lead-enrichment"
  }
}`}
            curl={`curl -X PATCH \\
  "https://your-domain.repl.co/api/workflows/42/status" \\
  -H "Content-Type: application/json" \\
  -d '{"status": "published"}'`}
            fetchExample={`async function updateWorkflowStatus(id, status) {
  const response = await fetch(\`/api/workflows/\${id}/status\`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status })
  });
  
  if (!response.ok) {
    throw new Error('Failed to update workflow status');
  }
  
  return await response.json();
}`}
          />
          
          <ApiEndpoint
            method="GET"
            path="/api/workflows/:id/download"
            description="Download the workflow file"
            authentication={true}
            params={[
              {
                name: "id",
                type: "number",
                description: "The ID of the workflow to download",
                required: true
              }
            ]}
            responseBody={`// Returns the actual workflow file for download
// Content-Type: application/octet-stream
// Content-Disposition: attachment; filename="workflow-file.json"`}
            curl={`curl -X GET \\
  "https://your-domain.repl.co/api/workflows/42/download" \\
  --cookie "session=your_session_cookie" \\
  -o downloaded_workflow.json`}
            fetchExample={`async function downloadWorkflow(id) {
  // For file downloads, you typically want to trigger a browser download
  // rather than processing the response in JavaScript
  window.location.href = \`/api/workflows/\${id}/download\`;
  
  // Alternatively, if you need to handle the download programmatically:
  /*
  const response = await fetch(\`/api/workflows/\${id}/download\`);
  
  if (!response.ok) {
    throw new Error('Failed to download workflow');
  }
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = 'workflow.json';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  */
}`}
          />
          
          <ApiEndpoint
            method="DELETE"
            path="/api/workflows/:id"
            description="Delete a workflow"
            authentication={true}
            adminOnly={true}
            params={[
              {
                name: "id",
                type: "number",
                description: "The ID of the workflow to delete",
                required: true
              }
            ]}
            responseBody={`{
  "success": true
}`}
            curl={`curl -X DELETE \\
  "https://your-domain.repl.co/api/workflows/42" \\
  -H "Content-Type: application/json"`}
            fetchExample={`async function deleteWorkflow(id) {
  const response = await fetch(\`/api/workflows/\${id}\`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete workflow');
  }
  
  return await response.json();
}`}
          />
        </TabsContent>
        
        <TabsContent value="users" className="space-y-6">
          <div className="mb-4">
            <h2 className="text-2xl font-bold">User Authentication & Management</h2>
            <p className="text-muted-foreground">
              API endpoints for user authentication, registration, and profile management.
            </p>
          </div>
          
          <ApiEndpoint
            method="POST"
            path="/api/login"
            description="Authenticate a user and create a session"
            authentication={false}
            requestBody={`{
  "username": "username",
  "password": "password"
}`}
            responseBody={`{
  "id": 76,
  "username": "username",
  "email": "user@example.com",
  "role": "admin", // or "user" or "viewer"
  "preferences": {
    "tier": "tier1",
    "interests": ["sales", "marketing"],
    "favoriteWorkflows": [42, 43]
  }
}`}
            curl={`curl -X POST \\
  "https://your-domain.repl.co/api/login" \\
  -H "Content-Type: application/json" \\
  -d '{"username": "username", "password": "password"}' \\
  -c cookies.txt`}
            fetchExample={`async function login(username, password) {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password }),
    // Important: include credentials to save and send cookies
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error('Authentication failed');
  }
  
  return await response.json();
}`}
          />
          
          <ApiEndpoint
            method="POST"
            path="/api/logout"
            description="End the current user session"
            authentication={true}
            responseBody={`{
  "success": true
}`}
            curl={`curl -X POST \\
  "https://your-domain.repl.co/api/logout" \\
  -H "Content-Type: application/json" \\
  --cookie "session=your_session_cookie"`}
            fetchExample={`async function logout() {
  const response = await fetch('/api/logout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error('Logout failed');
  }
  
  return await response.json();
}`}
          />
          
          <ApiEndpoint
            method="POST"
            path="/api/v1/users"
            description="Register a new user"
            authentication={false}
            requestBody={`{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "password123"
}`}
            responseBody={`{
  "success": true,
  "message": "User created and logged in successfully",
  "data": {
    "username": "newuser",
    "email": "newuser@example.com",
    "role": "user"
  }
}`}
            curl={`curl -X POST \\
  "https://your-domain.repl.co/api/v1/users" \\
  -H "Content-Type: application/json" \\
  -d '{"username": "newuser", "email": "newuser@example.com", "password": "password123"}' \\
  -c cookies.txt`}
            fetchExample={`async function register(username, email, password) {
  const response = await fetch('/api/v1/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, email, password }),
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error('Registration failed');
  }
  
  return await response.json();
}`}
          />
          
          <ApiEndpoint
            method="GET"
            path="/api/user"
            description="Get the current authenticated user's data"
            authentication={true}
            responseBody={`{
  "id": 76,
  "username": "username",
  "email": "user@example.com",
  "role": "admin", // or "user" or "viewer"
  "preferences": {
    "tier": "tier1",
    "interests": ["sales", "marketing"],
    "favoriteWorkflows": [42, 43]
  }
}`}
            curl={`curl -X GET \\
  "https://your-domain.repl.co/api/user" \\
  -H "Content-Type: application/json" \\
  --cookie "session=your_session_cookie"`}
            fetchExample={`async function getCurrentUser() {
  const response = await fetch('/api/user', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });
  
  if (response.status === 401) {
    // User is not authenticated
    return null;
  }
  
  if (!response.ok) {
    throw new Error('Failed to get user data');
  }
  
  return await response.json();
}`}
          />
          
          <ApiEndpoint
            method="GET"
            path="/api/users"
            description="Get a list of all users (admin only)"
            authentication={true}
            adminOnly={true}
            responseBody={`[
  {
    "id": 76,
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin",
    "preferences": {
      "tier": "tier1",
      "interests": ["sales", "marketing"],
      "favoriteWorkflows": [42, 43]
    }
  },
  {
    "id": 77,
    "username": "user1",
    "email": "user1@example.com",
    "role": "user",
    "preferences": {
      "tier": "free",
      "interests": ["lead-generation"],
      "favoriteWorkflows": []
    }
  }
]`}
            curl={`curl -X GET \\
  "https://your-domain.repl.co/api/users" \\
  -H "Content-Type: application/json" \\
  --cookie "session=your_session_cookie"`}
            fetchExample={`async function getAllUsers() {
  const response = await fetch('/api/users', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error('Failed to get users');
  }
  
  return await response.json();
}`}
          />
          
          <ApiEndpoint
            method="PATCH"
            path="/api/users/:id"
            description="Update a user (admin only)"
            authentication={true}
            adminOnly={true}
            params={[
              {
                name: "id",
                type: "number",
                description: "The ID of the user to update",
                required: true
              }
            ]}
            requestBody={`{
  "role": "admin", // or "user" or "viewer"
  "preferences": {
    "tier": "tier2",
    "interests": ["sales", "marketing", "lead-generation"]
  }
}`}
            responseBody={`{
  "id": 77,
  "username": "user1",
  "email": "user1@example.com",
  "role": "admin",
  "preferences": {
    "tier": "tier2",
    "interests": ["sales", "marketing", "lead-generation"],
    "favoriteWorkflows": []
  }
}`}
            curl={`curl -X PATCH \\
  "https://your-domain.repl.co/api/users/77" \\
  -H "Content-Type: application/json" \\
  -d '{"role": "admin", "preferences": {"tier": "tier2", "interests": ["sales", "marketing", "lead-generation"]}}' \\
  --cookie "session=your_session_cookie"`}
            fetchExample={`async function updateUser(id, userData) {
  const response = await fetch(\`/api/users/\${id}\`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData),
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error('Failed to update user');
  }
  
  return await response.json();
}`}
          />
          
          <ApiEndpoint
            method="DELETE"
            path="/api/users/:id"
            description="Delete a user (admin only)"
            authentication={true}
            adminOnly={true}
            params={[
              {
                name: "id",
                type: "number",
                description: "The ID of the user to delete",
                required: true
              }
            ]}
            responseBody={`{
  "success": true
}`}
            curl={`curl -X DELETE \\
  "https://your-domain.repl.co/api/users/77" \\
  -H "Content-Type: application/json" \\
  --cookie "session=your_session_cookie"`}
            fetchExample={`async function deleteUser(id) {
  const response = await fetch(\`/api/users/\${id}\`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete user');
  }
  
  return await response.json();
}`}
          />
          
          <ApiEndpoint
            method="POST"
            path="/api/favorites/:id"
            description="Add a workflow to the current user's favorites"
            authentication={true}
            params={[
              {
                name: "id",
                type: "number",
                description: "The ID of the workflow to add to favorites",
                required: true
              }
            ]}
            responseBody={`{
  "id": 76,
  "username": "username",
  "email": "user@example.com",
  "role": "user",
  "preferences": {
    "tier": "tier1",
    "interests": ["sales"],
    "favoriteWorkflows": [42, 43, 44] // New workflow ID added
  }
}`}
            curl={`curl -X POST \\
  "https://your-domain.repl.co/api/favorites/44" \\
  -H "Content-Type: application/json" \\
  --cookie "session=your_session_cookie"`}
            fetchExample={`async function addFavorite(workflowId) {
  const response = await fetch(\`/api/favorites/\${workflowId}\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error('Failed to add to favorites');
  }
  
  return await response.json();
}`}
          />
          
          <ApiEndpoint
            method="DELETE"
            path="/api/favorites/:id"
            description="Remove a workflow from the current user's favorites"
            authentication={true}
            params={[
              {
                name: "id",
                type: "number",
                description: "The ID of the workflow to remove from favorites",
                required: true
              }
            ]}
            responseBody={`{
  "id": 76,
  "username": "username",
  "email": "user@example.com",
  "role": "user",
  "preferences": {
    "tier": "tier1",
    "interests": ["sales"],
    "favoriteWorkflows": [42] // Workflow 43 removed
  }
}`}
            curl={`curl -X DELETE \\
  "https://your-domain.repl.co/api/favorites/43" \\
  -H "Content-Type: application/json" \\
  --cookie "session=your_session_cookie"`}
            fetchExample={`async function removeFavorite(workflowId) {
  const response = await fetch(\`/api/favorites/\${workflowId}\`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error('Failed to remove from favorites');
  }
  
  return await response.json();
}`}
          />
          
          <ApiEndpoint
            method="GET"
            path="/api/favorites"
            description="Get all the current user's favorite workflows"
            authentication={true}
            responseBody={`[
  {
    "id": 42,
    "title": "Lead Enrichment Workflow",
    "description": "Automatically enrich leads with additional data from various sources",
    "featuredImage": "/uploads/featured-image-12345.png",
    "status": "published",
    "metadata": {
      "categories": ["lead-generation"],
      "tags": ["enrichment", "cold-email"],
      "requiredTier": "tier1"
    }
  },
  {
    "id": 43,
    "title": "Content Marketing Workflow",
    "description": "Streamline your content creation process",
    "featuredImage": "/uploads/featured-image-67890.png",
    "status": "published",
    "metadata": {
      "categories": ["content-marketing"],
      "tags": ["blog", "social-media"],
      "requiredTier": "free"
    }
  }
]`}
            curl={`curl -X GET \\
  "https://your-domain.repl.co/api/favorites" \\
  -H "Content-Type: application/json" \\
  --cookie "session=your_session_cookie"`}
            fetchExample={`async function getFavorites() {
  const response = await fetch('/api/favorites', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error('Failed to get favorites');
  }
  
  return await response.json();
}`}
          />
        </TabsContent>
        
        <TabsContent value="content" className="space-y-6">
          <div className="mb-4">
            <h2 className="text-2xl font-bold">Content Formatting & Management</h2>
            <p className="text-muted-foreground">
              API endpoints and components for content enhancement, formatting, and documentation management.
            </p>
          </div>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>EditableContent Component</CardTitle>
              <CardDescription>
                A React component for in-place editing of content with markdown support
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Usage</h3>
                <p className="text-muted-foreground mb-3">
                  The EditableContent component provides a seamless way to edit content in-place with markdown support.
                  It displays formatted content in read mode and provides an edit interface when activated.
                </p>
                <div className="relative">
                  <CopyBlock
                    text={`import { EditableContent } from "@/components/editable-content";

// Basic usage
<EditableContent 
  content="# Markdown content here"
  onSave={async (newContent) => {
    // Save the content to your backend
    await updateContent(newContent);
  }}
/>

// With formatting and read-only options
<EditableContent 
  content="Content with **markdown** support"
  enableFormatting={true}
  readOnly={false}
  className="custom-styling"
  onSave={handleSave}
/>`}
                    language="typescript"
                    showLineNumbers={true}
                    theme={dracula}
                    codeBlock
                    wrapLongLines
                  />
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Props</h3>
                <div className="rounded-md border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="py-2 px-4 text-left font-medium">Prop</th>
                        <th className="py-2 px-4 text-left font-medium">Type</th>
                        <th className="py-2 px-4 text-left font-medium">Default</th>
                        <th className="py-2 px-4 text-left font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-background">
                        <td className="py-2 px-4 font-mono">content</td>
                        <td className="py-2 px-4">string</td>
                        <td className="py-2 px-4">Required</td>
                        <td className="py-2 px-4">The content to display and edit (supports markdown)</td>
                      </tr>
                      <tr className="bg-muted/50">
                        <td className="py-2 px-4 font-mono">onSave</td>
                        <td className="py-2 px-4">(newContent: string) =&gt; Promise&lt;void&gt;</td>
                        <td className="py-2 px-4">undefined</td>
                        <td className="py-2 px-4">Function to call when content is saved. If not provided, editing is disabled</td>
                      </tr>
                      <tr className="bg-background">
                        <td className="py-2 px-4 font-mono">className</td>
                        <td className="py-2 px-4">string</td>
                        <td className="py-2 px-4">undefined</td>
                        <td className="py-2 px-4">Additional CSS class to apply to the component</td>
                      </tr>
                      <tr className="bg-muted/50">
                        <td className="py-2 px-4 font-mono">enableFormatting</td>
                        <td className="py-2 px-4">boolean</td>
                        <td className="py-2 px-4">true</td>
                        <td className="py-2 px-4">Whether to render markdown formatting</td>
                      </tr>
                      <tr className="bg-background">
                        <td className="py-2 px-4 font-mono">readOnly</td>
                        <td className="py-2 px-4">boolean</td>
                        <td className="py-2 px-4">false</td>
                        <td className="py-2 px-4">If true, the content cannot be edited even if onSave is provided</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Example Integration with API</h3>
                <div className="relative">
                  <CopyBlock
                    text={`// In a workflow details component
import { EditableContent } from "@/components/editable-content";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

function WorkflowDetails({ workflow }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  
  const updateDescription = async (newContent) => {
    try {
      const response = await fetch(\`/api/workflows/\${workflow.id}/inline-edit\`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          field: 'description',
          content: newContent
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update');
      }
      
      toast({
        title: "Success",
        description: "Description updated successfully"
      });
      
      return await response.json();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };
  
  return (
    <div className="workflow-detail">
      <h1>{workflow.title}</h1>
      <EditableContent
        content={workflow.description}
        onSave={isAdmin ? updateDescription : undefined}
        className="mt-4"
      />
    </div>
  );
}`}
                    language="typescript"
                    showLineNumbers={true}
                    theme={dracula}
                    codeBlock
                    wrapLongLines
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <ApiEndpoint
            method="POST"
            path="/api/tools/format-content"
            description="Format content with enhanced markdown (new endpoint)"
            authentication={true}
            requestBody={`{
  "content": "This is plain text that will be formatted with enhanced markdown features. It will add proper formatting for lists, headers, and other elements."
}`}
            responseBody={`{
  "success": true,
  "formatted": "# This is plain text\n\nThat will be formatted with enhanced markdown features.\n\n* It will add proper formatting for lists\n* Headers\n* And other elements.",
  "message": "Content formatted successfully",
  "wasConverted": true
}`}
            curl={`curl -X POST \\
  "https://your-domain.repl.co/api/tools/format-content" \\
  -H "Content-Type: application/json" \\
  -d '{"content": "This is plain text that will be formatted with enhanced markdown features. It will add proper formatting for lists, headers, and other elements."}' \\
  --cookie "session=your_session_cookie"`}
            fetchExample={`async function formatContent(content) {
  const response = await fetch('/api/tools/format-content', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ content }),
    credentials: 'include'
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to format content");
  }
  
  return await response.json();
}`}
          />
          
          <ApiEndpoint
            method="PATCH"
            path="/api/workflows/:id/inline-edit"
            description="Inline edit workflow content with support for markdown formatting"
            authentication={true}
            adminOnly={true}
            params={[
              {
                name: "id",
                type: "number",
                description: "The ID of the workflow to update",
                required: true
              }
            ]}
            requestBody={`{
  "field": "description",
  "content": "# New workflow description\n\nThis is the updated description with **markdown formatting** support.\n\n* Feature 1\n* Feature 2"
}`}
            responseBody={`{
  "success": true,
  "workflow": {
    "id": 42,
    "description": "# New workflow description\n\nThis is the updated description with **markdown formatting** support.\n\n* Feature 1\n* Feature 2",
    "title": "Workflow Title",
    // other workflow fields...
  },
  "message": "Workflow description updated successfully"
}`}
            curl={`curl -X PATCH \\
  "https://your-domain.repl.co/api/workflows/42/inline-edit" \\
  -H "Content-Type: application/json" \\
  -d '{"field": "description", "content": "# New workflow description\\n\\nThis is the updated description with **markdown formatting** support.\\n\\n* Feature 1\\n* Feature 2"}' \\
  --cookie "session=your_session_cookie"`}
            fetchExample={`async function updateWorkflowDescription(workflowId, content) {
  const response = await fetch(\`/api/workflows/\${workflowId}/inline-edit\`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      field: 'description',
      content
    }),
    credentials: 'include'
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update workflow description");
  }
  
  return await response.json();
}`}
          />
          
          <ApiEndpoint
            method="POST"
            path="/api/workflows/:id/documentation"
            description="Add or update documentation for a workflow"
            authentication={true}
            adminOnly={true}
            params={[
              {
                name: "id",
                type: "number",
                description: "The ID of the workflow to add documentation to",
                required: true
              }
            ]}
            requestBody={`{
  "documentation": "# Workflow Documentation\n\nDetailed documentation for using this workflow, including setup instructions, configuration options, and best practices.\n\n## Getting Started\n\nTo use this workflow, follow these steps...\n\n## Configuration\n\nThis workflow accepts the following input parameters..."
}`}
            responseBody={`{
  "success": true,
  "workflow": {
    "id": 42,
    "title": "Lead Enrichment Workflow",
    "description": "Automatically enrich leads with additional data from various sources",
    "documentation": "# Workflow Documentation\n\nDetailed documentation for using this workflow, including setup instructions, configuration options, and best practices.\n\n## Getting Started\n\nTo use this workflow, follow these steps...\n\n## Configuration\n\nThis workflow accepts the following input parameters..."
  },
  "message": "Documentation updated successfully"
}`}
            curl={`curl -X POST \\
  "https://your-domain.repl.co/api/workflows/42/documentation" \\
  -H "Content-Type: application/json" \\
  -d '{"documentation": "# Workflow Documentation\n\nDetailed documentation for using this workflow, including setup instructions, configuration options, and best practices.\n\n## Getting Started\n\nTo use this workflow, follow these steps...\n\n## Configuration\n\nThis workflow accepts the following input parameters..."}' \\
  --cookie "session=your_session_cookie"`}
            fetchExample={`async function updateDocumentation(id, documentation) {
  const response = await fetch(\`/api/workflows/\${id}/documentation\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ documentation }),
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error('Failed to update documentation');
  }
  
  return await response.json();
}`}
          />
          
          <ApiEndpoint
            method="GET"
            path="/api/workflows/:id/documentation"
            description="Get the documentation for a workflow"
            authentication={false}
            params={[
              {
                name: "id",
                type: "number",
                description: "The ID of the workflow to get documentation for",
                required: true
              }
            ]}
            responseBody={`{
  "documentation": "# Workflow Documentation\n\nDetailed documentation for using this workflow, including setup instructions, configuration options, and best practices.\n\n## Getting Started\n\nTo use this workflow, follow these steps...\n\n## Configuration\n\nThis workflow accepts the following input parameters..."
}`}
            curl={`curl -X GET \\
  "https://your-domain.repl.co/api/workflows/42/documentation" \\
  -H "Content-Type: application/json"`}
            fetchExample={`async function getDocumentation(id) {
  const response = await fetch(\`/api/workflows/\${id}/documentation\`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to get documentation');
  }
  
  return await response.json();
}`}
          />
          
          <ApiEndpoint
            method="POST"
            path="/api/workflows/:id/ratings"
            description="Add or update a rating and review for a workflow"
            authentication={true}
            params={[
              {
                name: "id",
                type: "number",
                description: "The ID of the workflow to rate",
                required: true
              }
            ]}
            requestBody={`{
  "rating": 5,
  "review": "This workflow saved me so much time! Highly recommended."
}`}
            responseBody={`{
  "success": true,
  "workflow": {
    "id": 42,
    "title": "Lead Enrichment Workflow",
    "description": "Automatically enrich leads with additional data from various sources",
    "metadata": {
      "categories": ["lead-generation", "sales-automation"],
      "tags": ["enrichment", "cold-email", "lead-scoring"],
      "requiredTier": "tier1",
      "previewUrl": "https://demo.example.com/lead-enrichment",
      "averageRating": 4.7,
      "ratings": [
        {
          "userId": 76,
          "rating": 5,
          "review": "This workflow saved me so much time! Highly recommended.",
          "createdAt": "2025-03-31T12:34:56.789Z"
        },
        // Other ratings...
      ]
    }
  },
  "message": "Rating submitted successfully"
}`}
            curl={`curl -X POST \\
  "https://your-domain.repl.co/api/workflows/42/ratings" \\
  -H "Content-Type: application/json" \\
  -d '{"rating": 5, "review": "This workflow saved me so much time! Highly recommended."}' \\
  --cookie "session=your_session_cookie"`}
            fetchExample={`async function rateWorkflow(id, rating, review) {
  const response = await fetch(\`/api/workflows/\${id}/ratings\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ rating, review }),
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error('Failed to submit rating');
  }
  
  return await response.json();
}`}
          />
          
          <ApiEndpoint
            method="GET"
            path="/api/workflows/:id/ratings"
            description="Get all ratings and reviews for a workflow"
            authentication={false}
            params={[
              {
                name: "id",
                type: "number",
                description: "The ID of the workflow to get ratings for",
                required: true
              }
            ]}
            responseBody={`{
  "ratings": [
    {
      "userId": 76,
      "rating": 5,
      "review": "This workflow saved me so much time! Highly recommended.",
      "createdAt": "2025-03-31T12:34:56.789Z",
      "username": "username"
    },
    {
      "userId": 77,
      "rating": 4,
      "review": "Great workflow, but could use more documentation.",
      "createdAt": "2025-03-30T10:20:30.456Z",
      "username": "user1"
    }
  ],
  "averageRating": 4.5,
  "totalRatings": 2
}`}
            curl={`curl -X GET \\
  "https://your-domain.repl.co/api/workflows/42/ratings" \\
  -H "Content-Type: application/json"`}
            fetchExample={`async function getWorkflowRatings(id) {
  const response = await fetch(\`/api/workflows/\${id}/ratings\`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to get ratings');
  }
  
  return await response.json();
}`}
          />
          
          <ApiEndpoint
            method="POST"
            path="/api/tools/convert-all"
            description="Run the content conversion tool on all workflow descriptions and documentation (admin only)"
            authentication={true}
            adminOnly={true}
            responseBody={`{
  "success": true,
  "converted": 15,
  "skipped": 3,
  "message": "Successfully converted 15 content items, skipped 3 that were already well-formatted"
}`}
            curl={`curl -X POST \\
  "https://your-domain.repl.co/api/tools/convert-all" \\
  -H "Content-Type: application/json" \\
  --cookie "session=your_session_cookie"`}
            fetchExample={`async function convertAllContent() {
  const response = await fetch('/api/tools/convert-all', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error('Failed to convert content');
  }
  
  return await response.json();
}`}
          />
        </TabsContent>
        
        <TabsContent value="misc" className="space-y-6">
          <div className="mb-4">
            <h2 className="text-2xl font-bold">Miscellaneous Endpoints</h2>
            <p className="text-muted-foreground">
              API endpoints for analytics, system information, and other miscellaneous operations.
            </p>
          </div>
          
          <ApiEndpoint
            method="GET"
            path="/api/analytics"
            description="Get platform analytics data (admin only)"
            authentication={true}
            adminOnly={true}
            responseBody={`{
  "totalUsers": 150,
  "activeUsers": 87,
  "totalDownloads": 1234,
  "activeUsersPercentage": 58,
  "mostDownloadedWorkflows": [
    {
      "workflowId": 42,
      "title": "Lead Enrichment Workflow",
      "downloads": 245
    },
    {
      "workflowId": 43,
      "title": "Content Marketing Workflow",
      "downloads": 189
    }
  ],
  "recentActivity": [
    {
      "userId": 76,
      "username": "username",
      "lastActive": "2025-03-31T12:34:56.789Z",
      "pageViews": 47
    }
  ]
}`}
            curl={`curl -X GET \\
  "https://your-domain.repl.co/api/analytics" \\
  -H "Content-Type: application/json" \\
  --cookie "session=your_session_cookie"`}
            fetchExample={`async function getAnalytics() {
  const response = await fetch('/api/analytics', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error('Failed to get analytics data');
  }
  
  return await response.json();
}`}
          />
          
          <ApiEndpoint
            method="GET"
            path="/api/tiers"
            description="Get all access tiers information"
            authentication={true}
            adminOnly={true}
            responseBody={`[
  {
    "id": 1,
    "name": "free",
    "level": 0,
    "description": "Basic access tier with limited features",
    "price": 0,
    "features": ["View workflows", "Download free workflows"]
  },
  {
    "id": 2,
    "name": "tier1",
    "level": 10,
    "description": "Standard access tier with more capabilities",
    "price": 9.99,
    "features": ["View all workflows", "Download tier1 workflows", "Ratings & reviews"]
  },
  {
    "id": 3,
    "name": "tier2",
    "level": 20,
    "description": "Premium access tier with all features",
    "price": 19.99,
    "features": ["View all workflows", "Download all workflows", "Ratings & reviews", "Priority support"]
  }
]`}
            curl={`curl -X GET \\
  "https://your-domain.repl.co/api/tiers" \\
  -H "Content-Type: application/json" \\
  --cookie "session=your_session_cookie"`}
            fetchExample={`async function getTiers() {
  const response = await fetch('/api/tiers', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error('Failed to get tiers');
  }
  
  return await response.json();
}`}
          />
          
          <ApiEndpoint
            method="POST"
            path="/api/track/pageview"
            description="Track a user pageview for analytics"
            authentication={false}
            responseBody={`// Returns 200, but no content`}
            curl={`curl -X POST \\
  "https://your-domain.repl.co/api/track/pageview" \\
  -H "Content-Type: application/json" \\
  --cookie "session=your_session_cookie"`}
            fetchExample={`async function trackPageview() {
  try {
    await fetch('/api/track/pageview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    // Always succeeds, even if there's an error
    return true;
  } catch (error) {
    // Swallow errors, as page tracking shouldn't affect the user experience
    console.error('Pageview tracking error:', error);
    return false;
  }
}`}
          />
          
          <ApiEndpoint
            method="GET"
            path="/api/domains"
            description="Get all domains information (admin only)"
            authentication={true}
            adminOnly={true}
            responseBody={`[
  {
    "id": 1,
    "domain": "marketing.example.com",
    "description": "Marketing-related workflows",
    "workflowCount": 12
  },
  {
    "id": 2,
    "domain": "sales.example.com",
    "description": "Sales-related workflows",
    "workflowCount": 8
  }
]`}
            curl={`curl -X GET \\
  "https://your-domain.repl.co/api/domains" \\
  -H "Content-Type: application/json" \\
  --cookie "session=your_session_cookie"`}
            fetchExample={`async function getDomains() {
  const response = await fetch('/api/domains', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error('Failed to get domains');
  }
  
  return await response.json();
}`}
          />
        </TabsContent>
      </Tabs>
      
      <div className="bg-muted rounded-lg p-6 mt-8">
        <h2 className="text-xl font-bold mb-2">Need More Help?</h2>
        <p className="text-muted-foreground mb-4">
          This documentation is constantly being improved. If you need help with specific endpoints 
          or have suggestions for improvements, please contact the platform administrators.
        </p>
        <div className="flex flex-col md:flex-row gap-4">
          <Button variant="default">
            <MessageSquare className="h-4 w-4 mr-2" />
            Contact Support
          </Button>
          <Button variant="outline">
            <Star className="h-4 w-4 mr-2" />
            Request Feature
          </Button>
        </div>
      </div>
    </div>
  );
}