import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/utils/analytics.utils";

/**
 * Hook to track page views automatically on route changes
 */
export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    // Track page view
    const pageTitle = document.title || location.pathname;
    trackPageView(location.pathname, pageTitle);
  }, [location.pathname]);
}
