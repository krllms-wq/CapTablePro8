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
}

export class AdvancedLogger {
  private static instance: AdvancedLogger;
  
  static getInstance(): AdvancedLogger {
    if (!this.instance) {
      this.instance = new AdvancedLogger();
    }
    return this.instance;
  }

  debug(message: string, context?: DebugContext): void {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    log(`[DEBUG] ${message}${contextStr}`, "debug");
  }

  error(message: string, error: Error | any, context?: DebugContext): void {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    const errorStr = error instanceof Error ? error.stack : JSON.stringify(error);
    log(`[ERROR] ${message} | ${errorStr}${contextStr}`, "error");
    
    // Also log to console.error for stack traces
    console.error(`[ERROR] ${message}`, error, context);
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
}

export const logger = AdvancedLogger.getInstance();