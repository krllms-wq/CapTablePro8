/**
 * UX/UI Showcase page demonstrating enhanced components
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AppShell } from '@/components/layout/AppShell';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  EnhancedInput, 
  EnhancedDatePicker, 
  StickyFormFooter, 
  FormSection 
} from '@/components/ui/enhanced-form';
import { CsvImport } from '@/components/ui/csv-import';
import { useEnhancedToast } from '@/components/ui/enhanced-toast';
import { useUrlState } from '@/hooks/use-url-state';
import { useAutosave } from '@/hooks/use-autosave';
import { useUndoRedo } from '@/hooks/use-undo-redo';
import { useMotionSafe } from '@/hooks/use-motion-safe';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Save, 
  Upload,
  Sparkles,
  Zap,
  Shield,
  Accessibility
} from 'lucide-react';

interface DemoFormData {
  companyName: string;
  valuation: string;
  foundingDate: string;
  shares: string;
  email: string;
}

export default function UXShowcase() {
  const { success, error, warning, info } = useEnhancedToast();
  const { motionSafe } = useMotionSafe();
  const [activeTab, setActiveTab] = useUrlState('tab', { 
    defaultValue: 'forms', 
    storageKey: 'ux-showcase-tab' 
  });

  // Demo form
  const form = useForm<DemoFormData>({
    defaultValues: {
      companyName: '',
      valuation: '',
      foundingDate: '',
      shares: '',
      email: '',
    },
  });

  // Autosave demo
  const { saveNow, clearDraft, hasDraft } = useAutosave({
    form,
    onSave: async (data) => {
      console.log('Autosaving:', data);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
    },
    storageKey: 'ux-showcase-form',
    delay: 2000,
  });

  // Undo/Redo demo
  const { 
    currentState, 
    pushState, 
    undo, 
    redo, 
    canUndo, 
    canRedo 
  } = useUndoRedo('Initial state', {
    onUndo: (state) => info('Undid action', `Reverted to: ${state}`),
    onRedo: (state) => info('Redid action', `Applied: ${state}`),
  });

  const [demoActions, setDemoActions] = useState<string[]>([]);

  const addDemoAction = (action: string) => {
    const newActions = [...demoActions, action];
    setDemoActions(newActions);
    pushState(`Action ${newActions.length}: ${action}`);
  };

  // Toast demos
  const showSuccessToast = () => {
    success(
      'Company Created!', 
      'TechCorp has been successfully added to your portfolio.',
      { href: '/companies', label: 'View Companies' }
    );
  };

  const showErrorToast = () => {
    error(
      'Validation Failed', 
      'Please check the highlighted fields and try again.',
      { onClick: () => form.setFocus('companyName'), label: 'Focus First Error' }
    );
  };

  const showWarningToast = () => {
    warning(
      'Unsaved Changes', 
      'You have unsaved changes that will be lost if you navigate away.'
    );
  };

  const showInfoToast = () => {
    info(
      'Feature Update', 
      'New cap table calculation engine is now available.',
      { href: '/help', label: 'Learn More' }
    );
  };

  // CSV Import demo
  const handleCsvImport = (result: any) => {
    success(
      'Data Imported', 
      `Successfully imported ${result.validRows} rows with ${result.errors.length} warnings.`
    );
  };

  const onSubmit = (data: DemoFormData) => {
    console.log('Form submitted:', data);
    success('Form Submitted', 'Demo form data has been processed.');
  };

  return (
    <AppShell breadcrumbs={[
      { label: 'Showcase', href: '/ux-showcase' },
      { label: 'UX Components' }
    ]}>
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-3xl font-bold">
            <Sparkles className="h-8 w-8 text-primary" />
            Enhanced UX Components
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A comprehensive collection of enhanced UI components with accessibility, 
            motion preferences, autosave, undo/redo, and modern UX patterns.
          </p>
          
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Badge variant="secondary" className="gap-1">
              <Accessibility className="h-3 w-3" />
              WCAG 2.1 Compliant
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Zap className="h-3 w-3" />
              Auto-save
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Shield className="h-3 w-3" />
              Error Boundaries
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Main content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="forms">Enhanced Forms</TabsTrigger>
            <TabsTrigger value="toasts">Toast System</TabsTrigger>
            <TabsTrigger value="history">Undo/Redo</TabsTrigger>
            <TabsTrigger value="import">CSV Import</TabsTrigger>
          </TabsList>

          {/* Enhanced Forms Tab */}
          <TabsContent value="forms" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Enhanced Form Components</CardTitle>
                <CardDescription>
                  Form inputs with improved validation, accessibility, and UX patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormSection 
                    title="Company Information"
                    description="Basic details about your company"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <EnhancedInput
                        name="companyName"
                        label="Company Name"
                        placeholder="Enter company name"
                        required
                        form={form}
                        helpText="The legal name of your company as it appears in incorporation documents"
                        autoComplete="organization"
                      />
                      
                      <EnhancedInput
                        name="email"
                        label="Contact Email"
                        type="email"
                        placeholder="contact@company.com"
                        form={form}
                        helpText="Primary contact email for this company"
                        autoComplete="email"
                      />
                    </div>
                  </FormSection>

                  <FormSection 
                    title="Financial Details"
                    description="Valuation and share information"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <EnhancedInput
                        name="valuation"
                        label="Company Valuation"
                        type="currency"
                        placeholder="$10,000,000"
                        required
                        form={form}
                        helpText="Current company valuation in USD"
                        min={0}
                      />
                      
                      <EnhancedInput
                        name="shares"
                        label="Authorized Shares"
                        type="shares"
                        placeholder="1,000,000"
                        required
                        form={form}
                        helpText="Total number of authorized shares"
                        min={1}
                      />
                      
                      <EnhancedDatePicker
                        name="foundingDate"
                        label="Founding Date"
                        placeholder="Select founding date"
                        required
                        form={form}
                        helpText="Date when the company was incorporated"
                        maxDate={new Date()}
                      />
                    </div>
                  </FormSection>

                  <StickyFormFooter>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {hasDraft() && (
                          <Badge variant="outline">Draft Saved</Badge>
                        )}
                        <span>Motion: {motionSafe ? 'Enabled' : 'Reduced'}</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={clearDraft}>
                          Clear Draft
                        </Button>
                        <Button type="button" variant="outline" onClick={saveNow}>
                          <Save className="h-4 w-4 mr-2" />
                          Save Now
                        </Button>
                        <Button type="submit">
                          Submit Form
                        </Button>
                      </div>
                    </div>
                  </StickyFormFooter>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Toast System Tab */}
          <TabsContent value="toasts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Enhanced Toast Notifications</CardTitle>
                <CardDescription>
                  Accessible toast system with actions and variants
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button onClick={showSuccessToast} variant="outline" className="h-20 flex-col">
                    <div className="text-green-600 mb-1">✓</div>
                    Success Toast
                  </Button>
                  
                  <Button onClick={showErrorToast} variant="outline" className="h-20 flex-col">
                    <div className="text-red-600 mb-1">✕</div>
                    Error Toast
                  </Button>
                  
                  <Button onClick={showWarningToast} variant="outline" className="h-20 flex-col">
                    <div className="text-yellow-600 mb-1">⚠</div>
                    Warning Toast
                  </Button>
                  
                  <Button onClick={showInfoToast} variant="outline" className="h-20 flex-col">
                    <div className="text-blue-600 mb-1">ℹ</div>
                    Info Toast
                  </Button>
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Features:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• ARIA-compliant notifications</li>
                    <li>• Action buttons with navigation or callbacks</li>
                    <li>• Auto-dismiss with custom durations</li>
                    <li>• Duplicate prevention</li>
                    <li>• Keyboard accessible (Tab to focus, Enter to activate)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Undo/Redo Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Undo/Redo System</CardTitle>
                <CardDescription>
                  Full action history with keyboard shortcuts (⌘/Ctrl+Z, ⌘/Ctrl+Shift+Z)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={undo} 
                    disabled={!canUndo}
                    variant="outline"
                    size="sm"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Undo
                  </Button>
                  
                  <Button 
                    onClick={redo} 
                    disabled={!canRedo}
                    variant="outline"
                    size="sm"
                  >
                    <RotateCw className="h-4 w-4 mr-2" />
                    Redo
                  </Button>
                  
                  <Separator orientation="vertical" className="h-6" />
                  
                  <Button 
                    onClick={() => addDemoAction('Added stakeholder')}
                    variant="outline"
                    size="sm"
                  >
                    Add Stakeholder
                  </Button>
                  
                  <Button 
                    onClick={() => addDemoAction('Issued shares')}
                    variant="outline"
                    size="sm"
                  >
                    Issue Shares
                  </Button>
                  
                  <Button 
                    onClick={() => addDemoAction('Updated valuation')}
                    variant="outline"
                    size="sm"
                  >
                    Update Valuation
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Current State</Badge>
                    <span className="text-sm">{currentState}</span>
                  </div>
                  
                  {demoActions.length > 0 && (
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Action History:</h4>
                      <ul className="text-sm space-y-1">
                        {demoActions.map((action, index) => (
                          <li key={index} className="text-muted-foreground">
                            {index + 1}. {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CSV Import Tab */}
          <TabsContent value="import" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>CSV Import System</CardTitle>
                <CardDescription>
                  Advanced CSV parsing with error handling and data preview
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CsvImport
                  onImport={handleCsvImport}
                  expectedHeaders={['name', 'email', 'shares']}
                  maxFileSize={1024 * 1024} // 1MB for demo
                  maxRows={100}
                  validateRow={(row, index) => {
                    const errors = [];
                    if (!row.name?.trim()) {
                      errors.push({
                        row: index,
                        column: 'name',
                        message: 'Name is required',
                        severity: 'error' as const,
                      });
                    }
                    if (row.email && !row.email.includes('@')) {
                      errors.push({
                        row: index,
                        column: 'email',
                        message: 'Invalid email format',
                        severity: 'warning' as const,
                      });
                    }
                    return errors;
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}