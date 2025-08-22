import { log } from "../vite";

export interface DebugContext {
  userId?: string;
  companyId?: string;
  action?: string;
  component?: string;
  hook?: string;
  renderCount?: number;
  hooks?: string[];
  data?: Record<string, any>;
  stackTrace?: string;
  timestamp?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  performance?: {
    memoryUsage?: NodeJS.MemoryUsage;
    duration?: number;
    slowQuery?: boolean;
  };
}

export class AdvancedLogger {
  private static instance: AdvancedLogger;
  private errorCounts = new Map<string, number>();
  private performanceMetrics = new Map<string, number[]>();
  private criticalErrors: any[] = [];
  
  static getInstance(): AdvancedLogger {
    if (!this.instance) {
      this.instance = new AdvancedLogger();
    }
    return this.instance;
  }

  private getMemoryUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  }

  private trackError(errorKey: string): void {
    const count = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, count + 1);
    
    if (count > 10) {
      this.criticalError(`High error frequency detected: ${errorKey}`, { 
        data: { errorCount: count },
        severity: 'critical' 
      });
    }
  }

  debug(message: string, context?: DebugContext): void {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    log(`[DEBUG] ${message}${contextStr}`, "debug");
  }

  error(message: string, error: Error | any, context?: DebugContext): void {
    const timestamp = new Date().toISOString();
    const memoryUsage = this.getMemoryUsage();
    const errorKey = `${message}:${error?.name || 'Unknown'}`;
    
    this.trackError(errorKey);
    
    const enhancedContext = {
      ...context,
      timestamp,
      stackTrace: error instanceof Error ? error.stack : undefined,
      memoryUsage,
      severity: context?.severity || 'medium'
    };
    
    const contextStr = ` | ${JSON.stringify(enhancedContext)}`;
    const errorStr = error instanceof Error ? error.stack : JSON.stringify(error);
    log(`[ERROR] ${message} | ${errorStr}${contextStr}`, "error");
    
    // Store critical errors for analysis
    if (enhancedContext.severity === 'critical') {
      this.criticalErrors.push({ message, error, context: enhancedContext, timestamp });
    }
    
    console.error(`[ERROR] ${message}`, error, enhancedContext);
  }

  criticalError(message: string, context?: DebugContext): void {
    this.error(message, new Error('Critical Error'), { ...context, severity: 'critical' });
  }

  slowQuery(query: string, duration: number, threshold: number = 1000): void {
    if (duration > threshold) {
      this.performance(`Slow Query: ${query}`, Date.now() - duration, {
        performance: { duration, slowQuery: true }
      });
    }
  }

  memoryWarning(): void {
    const usage = this.getMemoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    
    if (heapUsedMB > 100) { // 100MB threshold
      this.debug(`High memory usage detected: ${heapUsedMB}MB`, {
        performance: { memoryUsage: usage },
        severity: 'high'
      });
    }
  }

  performance(label: string, startTime: number, context?: DebugContext): void {
    const duration = Date.now() - startTime;
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    log(`[PERF] ${label}: ${duration}ms${contextStr}`, "perf");
  }

  apiCall(method: string, path: string, userId?: string, companyId?: string): void {
    this.debug(`API Call: ${method} ${path}`, { userId, companyId, action: 'api_call' });
  }

  hookError(hookName: string, component: string, error: any): void {
    this.error(`React Hook Error in ${component}`, error, { 
      component, 
      hook: hookName, 
      action: 'hook_error' 
    });
  }

  renderOrder(component: string, renderCount: number, hooks: string[]): void {
    this.debug(`Render Order in ${component}`, { 
      component, 
      renderCount, 
      hooks, 
      action: 'render_tracking' 
    });
  }

  reactError(component: string, error: any, hookName?: string): void {
    this.error(`React Error in ${component}${hookName ? ` (${hookName})` : ''}`, error, {
      component,
      hook: hookName,
      severity: 'critical',
      action: 'react_error'
    });
  }

  getDiagnostics(): any {
    return {
      errorCounts: Object.fromEntries(this.errorCounts),
      criticalErrors: this.criticalErrors.slice(-10), // Last 10 critical errors
      memoryUsage: this.getMemoryUsage(),
      performanceMetrics: Object.fromEntries(this.performanceMetrics)
    };
  }

  logDatabaseQuery(query: string, params: any[], duration: number): void {
    const isSlowQuery = duration > 100; // 100ms threshold
    
    if (isSlowQuery) {
      this.slowQuery(query, duration);
    }
    
    this.debug(`DB Query: ${query.substring(0, 100)}${query.length > 100 ? '...' : ''}`, {
      action: 'database_query',
      data: { params: params?.slice(0, 3), duration, isSlowQuery }
    });
  }
}

// Enhanced monitoring middleware helper
export const withPerformanceLogging = <T extends (...args: any[]) => any>(
  fn: T,
  label: string
): T => {
  return ((...args: any[]) => {
    const start = Date.now();
    try {
      const result = fn(...args);
      
      // Handle async functions
      if (result && typeof result.then === 'function') {
        return result
          .then((res: any) => {
            logger.performance(label, start);
            return res;
          })
          .catch((error: any) => {
            logger.error(`Performance logged function failed: ${label}`, error);
            throw error;
          });
      }
      
      logger.performance(label, start);
      return result;
    } catch (error) {
      logger.error(`Performance logged function failed: ${label}`, error);
      throw error;
    }
  }) as T;
};

export const logger = AdvancedLogger.getInstance();