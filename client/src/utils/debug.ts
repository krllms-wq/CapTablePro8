export interface ComponentDebugInfo {
  component: string;
  renderCount: number;
  timestamp: string;
  hooks?: string[];
  props?: Record<string, any>;
  error?: any;
}

class ClientDebugger {
  private static instance: ClientDebugger;
  private renderCounts = new Map<string, number>();
  private lastHookOrders = new Map<string, string[]>();
  private performanceMarks = new Map<string, number>();
  private errorCounts = new Map<string, number>();
  
  static getInstance(): ClientDebugger {
    if (!this.instance) {
      this.instance = new ClientDebugger();
    }
    return this.instance;
  }

  logRender(componentName: string, props?: Record<string, any>, hooks?: string[]): void {
    const count = (this.renderCounts.get(componentName) || 0) + 1;
    this.renderCounts.set(componentName, count);
    
    const debugInfo: ComponentDebugInfo = {
      component: componentName,
      renderCount: count,
      timestamp: new Date().toISOString(),
      hooks,
      props
    };

    // Detect excessive re-renders
    if (count > 10) {
      console.warn(`⚠️ [EXCESSIVE RENDERS] ${componentName} has rendered ${count} times!`);
      this.logPerformanceWarning(componentName, 'excessive_renders', { renderCount: count });
    }

    // Only log if we're in development
    if (import.meta.env.DEV) {
      const emoji = count > 10 ? '🔥' : count > 5 ? '⚡' : '🔄';
      console.group(`${emoji} [RENDER] ${componentName} (#${count})`);
      console.log('Timestamp:', debugInfo.timestamp);
      
      if (hooks && hooks.length > 0) {
        console.log('Hooks order:', hooks);
        this.validateHooksOrder(componentName, hooks);
      }
      
      if (props && Object.keys(props).length > 0) {
        console.log('Props:', props);
      }
      
      console.groupEnd();
    }
  }

  private validateHooksOrder(componentName: string, currentHooks: string[]): void {
    const lastHooks = this.lastHookOrders.get(componentName);
    
    if (lastHooks && lastHooks.length !== currentHooks.length) {
      console.error(`❌ [HOOKS ORDER] ${componentName} - Hook count changed!`, {
        previous: lastHooks,
        current: currentHooks
      });
      
      this.logHookError(componentName, 'hooks_order_violation', 
        new Error(`Hook count changed from ${lastHooks.length} to ${currentHooks.length}`)
      );
    }
    
    this.lastHookOrders.set(componentName, currentHooks);
  }

  logHookError(componentName: string, hookName: string, error: any): void {
    const debugInfo: ComponentDebugInfo = {
      component: componentName,
      renderCount: this.renderCounts.get(componentName) || 0,
      timestamp: new Date().toISOString(),
      error: {
        hook: hookName,
        message: error.message,
        stack: error.stack
      }
    };

    console.group(`❌ [HOOK ERROR] ${componentName} - ${hookName}`);
    console.error('Error:', error);
    console.log('Render count when error occurred:', debugInfo.renderCount);
    console.log('Timestamp:', debugInfo.timestamp);
    console.groupEnd();

    // Send to server for logging
    if (typeof fetch !== 'undefined') {
      fetch('/api/debug/hook-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(debugInfo)
      }).catch(() => {
        // Ignore network errors when logging debug info
      });
    }
  }

  logQuery(queryKey: string[], status: 'loading' | 'success' | 'error', data?: any): void {
    if (import.meta.env.DEV) {
      const statusEmoji = {
        loading: '⏳',
        success: '✅',
        error: '❌'
      }[status];

      console.log(`${statusEmoji} [QUERY] ${queryKey.join('/')} - ${status}`, data ? { data } : '');
    }
  }

  getRenderCount(componentName: string): number {
    return this.renderCounts.get(componentName) || 0;
  }

  logPerformanceWarning(component: string, issue: string, data?: any): void {
    if (import.meta.env.DEV) {
      console.warn(`⚠️ [PERFORMANCE] ${component} - ${issue}`, data);
    }
    
    // Send to server
    this.sendToServer('/api/debug/performance-warning', {
      component,
      issue,
      data,
      timestamp: new Date().toISOString()
    });
  }

  startPerformanceMark(label: string): void {
    this.performanceMarks.set(label, performance.now());
  }

  endPerformanceMark(label: string, threshold: number = 16): void {
    const startTime = this.performanceMarks.get(label);
    if (startTime) {
      const duration = performance.now() - startTime;
      if (duration > threshold) {
        console.warn(`⚠️ [SLOW OPERATION] ${label}: ${duration.toFixed(2)}ms`);
        this.logPerformanceWarning('Performance', 'slow_operation', { label, duration });
      }
      this.performanceMarks.delete(label);
    }
  }

  logReactError(error: Error, errorInfo?: any): void {
    const errorKey = `${error.name}:${error.message}`;
    const count = (this.errorCounts.get(errorKey) || 0) + 1;
    this.errorCounts.set(errorKey, count);

    console.group('❌ [REACT ERROR]');
    console.error('Error:', error);
    if (errorInfo?.componentStack) {
      console.error('Component Stack:', errorInfo.componentStack);
    }
    console.error('Error count:', count);
    console.groupEnd();

    this.sendToServer('/api/debug/react-error', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo,
      count,
      timestamp: new Date().toISOString()
    });
  }

  private sendToServer(endpoint: string, data: any): void {
    if (typeof fetch !== 'undefined') {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).catch(() => {
        // Ignore network errors when logging debug info
      });
    }
  }

  getDiagnostics(): any {
    return {
      renderCounts: Object.fromEntries(this.renderCounts),
      errorCounts: Object.fromEntries(this.errorCounts),
      activePerformanceMarks: Array.from(this.performanceMarks.keys())
    };
  }
}

export const clientDebugger = ClientDebugger.getInstance();