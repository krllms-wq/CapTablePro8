import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Building, Save, X, CalendarDays, MapPin, FileText } from "lucide-react";
import Navigation from "@/components/layout/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Company } from "@shared/schema";

const jurisdictions = [
  "Delaware",
  "California", 
  "New York",
  "Texas",
  "Florida",
  "Nevada",
  "Wyoming",
  "Other"
];

const companySettingsSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  description: z.string().optional(),
  jurisdiction: z.string().min(1, "Jurisdiction is required"),
  incorporationDate: z.string().refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime()) && parsed <= new Date();
  }, "Incorporation date must be a valid date and not in the future"),
});

type CompanySettingsForm = z.infer<typeof companySettingsSchema>;

export default function CompanySettings() {
  const { companyId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOtherJurisdiction, setIsOtherJurisdiction] = useState(false);

  const { data: company, isLoading } = useQuery<Company>({
    queryKey: ["/api/companies", companyId],
    enabled: !!companyId,
  });

  const form = useForm<CompanySettingsForm>({
    resolver: zodResolver(companySettingsSchema),
    values: company ? {
      name: company.name,
      description: company.description || "",
      jurisdiction: company.jurisdiction || "Delaware",
      incorporationDate: company.incorporationDate ? format(new Date(company.incorporationDate), "yyyy-MM-dd") : "",
    } : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: CompanySettingsForm) => {
      return apiRequest(`/api/companies/${companyId}`, {
        method: "PUT",
        body: JSON.stringify({
          ...data,
          incorporationDate: new Date(data.incorporationDate + "T00:00:00.000Z"), // Ensure UTC midnight
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "activity"] });
      
      toast({
        title: "Settings saved",
        description: "Company settings have been updated successfully.",
      });
    },
    onError: (error) => {
      console.error("Update error:", error);
      toast({
        title: "Error",
        description: "Failed to update company settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CompanySettingsForm) => {
    updateMutation.mutate(data);
  };

  const handleCancel = () => {
    form.reset();
    setLocation(`/companies/${companyId}`);
  };

  if (!companyId) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600">No company selected</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-neutral-200 rounded animate-pulse"></div>
              <div className="h-8 bg-neutral-200 rounded w-64 animate-pulse"></div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-neutral-200 rounded w-24 animate-pulse"></div>
                    <div className="h-10 bg-neutral-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Building className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">Company Settings</h1>
              <p className="text-neutral-600 mt-1">Manage your company's basic information</p>
            </div>
          </div>

          {/* Settings Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Company Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter company name" 
                            {...field} 
                            className="max-w-md"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Brief description of your company"
                            rows={3}
                            {...field} 
                            className="max-w-lg"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Jurisdiction */}
                  <FormField
                    control={form.control}
                    name="jurisdiction"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Jurisdiction
                        </FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <Select 
                              value={isOtherJurisdiction ? "Other" : field.value} 
                              onValueChange={(value) => {
                                if (value === "Other") {
                                  setIsOtherJurisdiction(true);
                                  field.onChange("");
                                } else {
                                  setIsOtherJurisdiction(false);
                                  field.onChange(value);
                                }
                              }}
                            >
                              <SelectTrigger className="max-w-md">
                                <SelectValue placeholder="Select jurisdiction" />
                              </SelectTrigger>
                              <SelectContent>
                                {jurisdictions.map((jurisdiction) => (
                                  <SelectItem key={jurisdiction} value={jurisdiction}>
                                    {jurisdiction}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            {isOtherJurisdiction && (
                              <Input
                                placeholder="Enter custom jurisdiction"
                                value={field.value}
                                onChange={field.onChange}
                                className="max-w-md"
                              />
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Incorporation Date */}
                  <FormField
                    control={form.control}
                    name="incorporationDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4" />
                          Incorporation Date
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="date"
                            {...field} 
                            className="max-w-md"
                            max={format(new Date(), "yyyy-MM-dd")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Actions */}
                  <div className="flex items-center gap-4 pt-4 border-t border-neutral-200">
                    <Button 
                      type="submit" 
                      disabled={updateMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {updateMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                    
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={handleCancel}
                      disabled={updateMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Additional Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-neutral-600">
                <p className="mb-4">Advanced company settings such as authorized shares, par value, and currency are managed separately in the cap table configuration.</p>
                <Button variant="outline" onClick={() => setLocation(`/companies/${companyId}`)}>
                  View Cap Table Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}