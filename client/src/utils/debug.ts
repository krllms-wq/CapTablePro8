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

    // Only log if we're in development
    if (import.meta.env.DEV) {
      console.group(`🔄 [RENDER] ${componentName} (#${count})`);
      console.log('Timestamp:', debugInfo.timestamp);
      
      if (hooks && hooks.length > 0) {
        console.log('Hooks order:', hooks);
      }
      
      if (props && Object.keys(props).length > 0) {
        console.log('Props:', props);
      }
      
      console.groupEnd();
    }
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
}

export const clientDebugger = ClientDebugger.getInstance();