
import React, { useState, useEffect } from 'react';
import { clientDebugger } from '@/utils/debug';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible';
import { ChevronDown, Bug, Activity, AlertTriangle } from 'lucide-react';

export function DebugPanel() {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [serverDiagnostics, setServerDiagnostics] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const interval = setInterval(() => {
      setDiagnostics(clientDebugger.getDiagnostics());
      
      // Fetch server diagnostics
      fetch('/api/debug/diagnostics')
        .then(res => res.json())
        .then(setServerDiagnostics)
        .catch(() => {});
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!import.meta.env.DEV || !diagnostics) return null;

  const totalRenders = Object.values(diagnostics.renderCounts).reduce((a: number, b: number) => a + b, 0);
  const totalErrors = Object.values(diagnostics.errorCounts).reduce((a: number, b: number) => a + b, 0);

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Card className="bg-gray-900 text-white border-gray-700">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-2 cursor-pointer hover:bg-gray-800 rounded-t-lg">
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Bug className="w-4 h-4" />
                  Debug Panel
                </div>
                <div className="flex items-center gap-2">
                  {totalErrors > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {totalErrors} errors
                    </Badge>
                  )}
                  <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="space-y-3 text-xs">
              {/* Client Stats */}
              <div>
                <h4 className="font-semibold flex items-center gap-1 text-blue-300 mb-1">
                  <Activity className="w-3 h-3" />
                  Client
                </h4>
                <div className="grid grid-cols-2 gap-2 text-gray-300">
                  <div>Renders: {totalRenders}</div>
                  <div>Errors: {totalErrors}</div>
                </div>
              </div>

              {/* Server Stats */}
              {serverDiagnostics && (
                <div>
                  <h4 className="font-semibold flex items-center gap-1 text-green-300 mb-1">
                    <AlertTriangle className="w-3 h-3" />
                    Server
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-gray-300">
                    <div>Memory: {Math.round(serverDiagnostics.memoryUsage?.heapUsed / 1024 / 1024)}MB</div>
                    <div>Critical: {serverDiagnostics.criticalErrors?.length || 0}</div>
                  </div>
                </div>
              )}

              {/* Component Renders */}
              {Object.keys(diagnostics.renderCounts).length > 0 && (
                <div>
                  <h4 className="font-semibold text-yellow-300 mb-1">Top Components</h4>
                  <div className="space-y-1">
                    {Object.entries(diagnostics.renderCounts)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .slice(0, 3)
                      .map(([component, count]) => (
                        <div key={component} className="flex justify-between text-gray-300">
                          <span className="truncate">{component}</span>
                          <Badge variant={count as number > 10 ? "destructive" : "secondary"} className="text-xs">
                            {count}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  console.log('=== DEBUG DIAGNOSTICS ===');
                  console.log('Client:', diagnostics);
                  console.log('Server:', serverDiagnostics);
                }}
                className="w-full text-xs bg-gray-800 border-gray-600 hover:bg-gray-700"
              >
                Log Full Diagnostics
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}
