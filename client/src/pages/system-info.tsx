import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Copy, Check, Monitor, Globe, Clock, Flag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/enhanced-navigation";

// Mock feature flags - in a real app these would come from your feature flag service
const FEATURE_FLAGS = {
  "enhanced-ui": true,
  "guided-tour": true,
  "help-mode": true,
  "sensitive-masking": true,
  "autosave": true,
  "undo-redo": true,
  "advanced-scenarios": false,
  "real-time-sync": false,
  "audit-logging": true,
  "export-tools": true
};

// Mock version info - in a real app this would come from your build process
const VERSION_INFO = {
  version: "1.1.0",
  buildHash: "a7f3e2d",
  buildDate: new Date().toISOString(),
  environment: import.meta.env.MODE || "development"
};

export default function SystemInfo() {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Gather system information
  const systemInfo = {
    // App information
    appVersion: VERSION_INFO.version,
    buildCommit: VERSION_INFO.buildHash,
    buildDate: new Date(VERSION_INFO.buildDate).toLocaleString(),
    environment: VERSION_INFO.environment,
    
    // Browser information
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    cookiesEnabled: navigator.cookieEnabled,
    onlineStatus: navigator.onLine,
    
    // System information
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    screenResolution: `${screen.width}x${screen.height}`,
    viewportSize: `${window.innerWidth}x${window.innerHeight}`,
    colorDepth: screen.colorDepth,
    pixelRatio: window.devicePixelRatio,
    
    // Performance information
    connectionType: (navigator as any).connection?.effectiveType || "unknown",
    memoryInfo: (performance as any).memory ? {
      usedJSHeapSize: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024),
      totalJSHeapSize: Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024),
      jsHeapSizeLimit: Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024)
    } : null,
    
    // Feature flags
    featureFlags: FEATURE_FLAGS,
    
    // Current timestamp
    timestamp: new Date().toISOString()
  };

  const handleCopyDiagnostics = async () => {
    const diagnosticsText = `Cap Table System Diagnostics
Generated: ${systemInfo.timestamp}

=== Application ===
Version: ${systemInfo.appVersion}
Build: ${systemInfo.buildCommit}
Environment: ${systemInfo.environment}
Build Date: ${systemInfo.buildDate}

=== Browser ===
User Agent: ${systemInfo.userAgent}
Platform: ${systemInfo.platform}
Language: ${systemInfo.language}
Cookies: ${systemInfo.cookiesEnabled ? "Enabled" : "Disabled"}
Online: ${systemInfo.onlineStatus ? "Yes" : "No"}

=== System ===
Timezone: ${systemInfo.timezone}
Timezone Offset: ${systemInfo.timezoneOffset} minutes
Screen: ${systemInfo.screenResolution}
Viewport: ${systemInfo.viewportSize}
Color Depth: ${systemInfo.colorDepth} bits
Pixel Ratio: ${systemInfo.pixelRatio}

=== Performance ===
Connection: ${systemInfo.connectionType}
${systemInfo.memoryInfo ? `Memory Usage: ${systemInfo.memoryInfo.usedJSHeapSize}MB / ${systemInfo.memoryInfo.totalJSHeapSize}MB` : "Memory info not available"}

=== Feature Flags ===
${Object.entries(systemInfo.featureFlags)
  .map(([flag, enabled]) => `${flag}: ${enabled ? "ON" : "OFF"}`)
  .join('\n')}
`;

    try {
      await navigator.clipboard.writeText(diagnosticsText);
      setCopied(true);
      toast({
        title: "Diagnostics Copied",
        description: "System information has been copied to your clipboard."
      });
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy diagnostics to clipboard.",
        variant: "error"
      });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">System Information</h1>
              <p className="text-neutral-600 mt-1">
                Application diagnostics and system details
              </p>
            </div>
            <Button onClick={handleCopyDiagnostics} className="flex items-center gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy Diagnostics"}
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Application Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Application
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Version</span>
                  <Badge variant="outline">{systemInfo.appVersion}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Build</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded">{systemInfo.buildCommit}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Environment</span>
                  <Badge variant={systemInfo.environment === "production" ? "default" : "secondary"}>
                    {systemInfo.environment}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Build Date</span>
                  <span className="text-xs text-muted-foreground">{systemInfo.buildDate}</span>
                </div>
              </CardContent>
            </Card>

            {/* Browser Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Browser
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Platform</span>
                  <span className="text-xs">{systemInfo.platform}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Language</span>
                  <span className="text-xs">{systemInfo.language}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Online</span>
                  <Badge variant={systemInfo.onlineStatus ? "default" : "destructive"}>
                    {systemInfo.onlineStatus ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Cookies</span>
                  <Badge variant={systemInfo.cookiesEnabled ? "default" : "destructive"}>
                    {systemInfo.cookiesEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* System Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  System
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Timezone</span>
                  <span className="text-xs">{systemInfo.timezone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Screen</span>
                  <span className="text-xs">{systemInfo.screenResolution}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Viewport</span>
                  <span className="text-xs">{systemInfo.viewportSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Pixel Ratio</span>
                  <span className="text-xs">{systemInfo.pixelRatio}x</span>
                </div>
              </CardContent>
            </Card>

            {/* Performance Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Connection</span>
                  <Badge variant="outline">{systemInfo.connectionType}</Badge>
                </div>
                {systemInfo.memoryInfo && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Memory Used</span>
                      <span className="text-xs">{systemInfo.memoryInfo.usedJSHeapSize}MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Memory Total</span>
                      <span className="text-xs">{systemInfo.memoryInfo.totalJSHeapSize}MB</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Feature Flags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5" />
                Feature Flags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(systemInfo.featureFlags).map(([flag, enabled]) => (
                  <div key={flag} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm font-medium">{flag.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</span>
                    <Badge variant={enabled ? "default" : "secondary"}>
                      {enabled ? "ON" : "OFF"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* User Agent */}
          <Card>
            <CardHeader>
              <CardTitle>User Agent</CardTitle>
            </CardHeader>
            <CardContent>
              <code className="text-xs break-all bg-muted p-3 rounded block">
                {systemInfo.userAgent}
              </code>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}