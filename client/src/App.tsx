import React, { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import AdminPage from "@/pages/admin-page";
import WorkflowDetailsPage from "@/pages/workflow-details";
import UserDashboard from "@/pages/user-dashboard";
import ApiDocumentationPage from "@/pages/api-documentation";
import { ProtectedRoute } from "./lib/protected-route";
import { setupAnalyticsTracking, trackPageView } from "./lib/analytics";

function Router() {
  // Get current location to track route changes
  const [location] = useLocation();

  // Track pageview whenever the location changes
  useEffect(() => {
    trackPageView();
  }, [location]);

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={HomePage} />
      <Route path="/workflows/:id" component={WorkflowDetailsPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/api-docs" component={ApiDocumentationPage} />
      
      {/* Protected routes */}
      <ProtectedRoute path="/admin" component={AdminPage} />
      <ProtectedRoute path="/dashboard" component={UserDashboard} />
      
      {/* 404 fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Initialize analytics tracking on app startup
  useEffect(() => {
    setupAnalyticsTracking();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;