import { logEvent } from "firebase/analytics";
import { analytics } from "./firebase.utils";

/**
 * Simplified Analytics Utility for Orchestrator WASM
 * Tracks only essential events: page views, audio downloads, import/exports, and theme toggle
 */

// Event names constants
export const AnalyticsEvents = {
  PAGE_VIEW: "page_view",
  AUDIO_DOWNLOAD: "audio_download",
  FILE_EXPORT: "file_export",
  FILE_IMPORT: "file_import",
  FILE_IMPORT_ERROR: "file_import_error",
  THEME_TOGGLE: "theme_toggle",
} as const;

/**
 * Safely log an event to Firebase Analytics
 */
function safeLogEvent(
  eventName: string,
  eventParams?: Record<string, any>
): void {
  try {
    if (analytics) {
      logEvent(analytics, eventName, eventParams);
    }
  } catch (error) {
    console.warn("Analytics error:", error);
  }
}

/**
 * Track page views
 */
export function trackPageView(pagePath: string, pageTitle?: string): void {
  safeLogEvent(AnalyticsEvents.PAGE_VIEW, {
    page_path: pagePath,
    page_title: pageTitle || pagePath,
    page_location: window.location.href,
  });
}

/**
 * Track audio download
 */
export function trackAudioDownload(params?: { duration?: number }): void {
  safeLogEvent(AnalyticsEvents.AUDIO_DOWNLOAD, {
    ...params,
    timestamp: Date.now(),
  });
}

/**
 * Track file export/import
 */
export function trackFileOperation(
  operation: "export" | "import" | "import_error",
  params?: {
    fileType?: string;
    fileName?: string;
    fileSize?: number;
    noteCount?: number;
    bpm?: number;
    error?: string;
  }
): void {
  const eventName =
    operation === "export"
      ? AnalyticsEvents.FILE_EXPORT
      : operation === "import"
      ? AnalyticsEvents.FILE_IMPORT
      : AnalyticsEvents.FILE_IMPORT_ERROR;

  safeLogEvent(eventName, {
    ...params,
    timestamp: Date.now(),
  });
}

/**
 * Track theme toggle
 */
export function trackThemeToggle(theme: string): void {
  safeLogEvent(AnalyticsEvents.THEME_TOGGLE, {
    theme,
    timestamp: Date.now(),
  });
}
