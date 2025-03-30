import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Base schema for common fields
const baseAuthSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Login schema (just username and password)
const loginSchema = baseAuthSchema;

// Registration schema (adds email)
const registerSchema = baseAuthSchema.extend({
  email: z.string().email("Please enter a valid email address"),
});

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // Use the appropriate schema based on the active tab
  const currentSchema = activeTab === "login" ? loginSchema : registerSchema;

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(currentSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
    },
    mode: "onChange"
  });

  if (user) {
    setLocation("/");
    return null;
  }

  const onSubmit = async (data: z.infer<typeof registerSchema>) => {
    if (activeTab === "login") {
      // For login, we only need username and password
      await loginMutation.mutateAsync({
        username: data.username,
        password: data.password
      });
    } else {
      // For registration, we need all fields
      await registerMutation.mutateAsync(data);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Welcome to Workflow Marketplace</CardTitle>
            <CardDescription>
              Sign in to access and download workflows
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      Login
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              <TabsContent value="register">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      Register
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="hidden md:flex flex-col justify-center">
          <h2 className="text-4xl font-bold mb-4">
            Discover Amazing n8n Workflows
          </h2>
          <p className="text-muted-foreground mb-8">
            Browse through our curated collection of automation workflows. Register now to download and use them in your projects.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Premium Workflows</h3>
              <p className="text-sm text-muted-foreground">
                Access our collection of tested and optimized workflows
              </p>
            </div>
            <div className="bg-card p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Regular Updates</h3>
              <p className="text-sm text-muted-foreground">
                New workflows added regularly to keep you productive
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
