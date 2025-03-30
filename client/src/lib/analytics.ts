import { apiRequest } from "./queryClient";

/**
 * Tracks a page view for analytics
 * This function is called silently in the background and does not await the response
 */
export function trackPageView() {
  try {
    apiRequest("POST", "/api/track/pageview")
      .catch((error) => {
        // Silent failure - don't interrupt user experience for analytics
        console.error("Failed to track pageview:", error);
      });
  } catch (error) {
    // Catch any errors to prevent app crashes
    console.error("Analytics error:", error);
  }
}

/**
 * Sets up analytics tracking on the page
 * This includes tracking on initial page load and when the route changes
 */
export function setupAnalyticsTracking() {
  // Track on initial page load
  trackPageView();
  
  // Set up tracking at regular intervals (every 5 minutes)
  // This helps track session duration more accurately
  const TRACKING_INTERVAL = 5 * 60 * 1000; // 5 minutes
  setInterval(() => {
    trackPageView();
  }, TRACKING_INTERVAL);
}