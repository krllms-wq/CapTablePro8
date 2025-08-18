/**
 * 500 Error Page
 */

import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function Error500() {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Server Error</CardTitle>
          <CardDescription>
            Something went wrong on our end. We're working to fix the issue.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={handleReload} className="flex-1">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </Link>
          </div>
          
          <div className="text-sm text-muted-foreground">
            If the problem persists, <Link href="/profile" className="text-primary hover:underline">contact support</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}