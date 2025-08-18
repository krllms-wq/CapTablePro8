import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Building, Users, FileText, TrendingUp, CheckCircle } from "lucide-react";

const countries = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "NL", name: "Netherlands" },
  { code: "CH", name: "Switzerland" },
  { code: "AU", name: "Australia" },
  { code: "NZ", name: "New Zealand" },
  { code: "SG", name: "Singapore" },
  { code: "HK", name: "Hong Kong" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "IN", name: "India" },
  { code: "IL", name: "Israel" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "FI", name: "Finland" },
  { code: "IE", name: "Ireland" },
  { code: "LU", name: "Luxembourg" },
  { code: "BE", name: "Belgium" },
  { code: "AT", name: "Austria" },
  { code: "PT", name: "Portugal" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "AR", name: "Argentina" },
  { code: "CL", name: "Chile" },
  { code: "CO", name: "Colombia" },
  { code: "PE", name: "Peru" },
  { code: "UY", name: "Uruguay" },
  { code: "PL", name: "Poland" },
  { code: "CZ", name: "Czech Republic" },
  { code: "HU", name: "Hungary" },
  { code: "RO", name: "Romania" },
  { code: "BG", name: "Bulgaria" },
  { code: "HR", name: "Croatia" },
  { code: "SI", name: "Slovenia" },
  { code: "SK", name: "Slovakia" },
  { code: "EE", name: "Estonia" },
  { code: "LV", name: "Latvia" },
  { code: "LT", name: "Lithuania" },
];

const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  description: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  incorporationDate: z.string().min(1, "Incorporation date is required"),
  authorizedShares: z.coerce.number().min(1, "Authorized shares must be greater than 0"),
});

const founderSchema = z.object({
  name: z.string().min(1, "Founder name is required"),
  email: z.string().email("Valid email is required"),
  title: z.string().min(1, "Title is required"),
  shares: z.coerce.number().min(1, "Shares must be greater than 0"),
  percentage: z.coerce.number().min(0.01).max(100, "Percentage must be between 0.01 and 100"),
});

type CompanyFormData = z.infer<typeof companySchema>;
type FounderFormData = z.infer<typeof founderSchema>;

interface SetupStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
}

export default function CompanySetup() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [founders, setFounders] = useState<FounderFormData[]>([]);
  const [countryOpen, setCountryOpen] = useState(false);
  const [authorizedShares, setAuthorizedShares] = useState(10000000);

  const steps: SetupStep[] = [
    {
      id: "company",
      title: "Company Information",
      description: "Basic company details and incorporation information",
      icon: <Building className="h-5 w-5" />,
      completed: !!companyId,
    },
    {
      id: "founders",
      title: "Founding Team",
      description: "Add founders and initial equity distribution",
      icon: <Users className="h-5 w-5" />,
      completed: founders.length > 0,
    },
    {
      id: "security-classes",
      title: "Security Classes",
      description: "Set up share classes and their rights",
      icon: <FileText className="h-5 w-5" />,
      completed: false,
    },
    {
      id: "complete",
      title: "Complete Setup",
      description: "Review and finalize your cap table",
      icon: <CheckCircle className="h-5 w-5" />,
      completed: false,
    },
  ];

  const companyForm = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      description: "",
      country: "US",
      incorporationDate: "",
      authorizedShares: "10000000",
    },
  });

  const founderForm = useForm<FounderFormData>({
    resolver: zodResolver(founderSchema),
    defaultValues: {
      name: "",
      email: "",
      title: "",
      shares: 1000000,
      percentage: 10,
    },
  });

  // Watch form values for percentage/shares calculation
  const watchedShares = founderForm.watch("shares");
  const watchedPercentage = founderForm.watch("percentage");

  // Helper functions for percentage/shares conversion
  const calculatePercentage = (shares: number) => {
    return (shares / authorizedShares) * 100;
  };

  const calculateShares = (percentage: number) => {
    return Math.round((percentage / 100) * authorizedShares);
  };

  // Update percentage when shares change
  const handleSharesChange = (shares: number) => {
    const percentage = calculatePercentage(shares);
    founderForm.setValue("percentage", percentage, { shouldValidate: true });
  };

  // Update shares when percentage changes
  const handlePercentageChange = (percentage: number) => {
    const shares = calculateShares(percentage);
    founderForm.setValue("shares", shares, { shouldValidate: true });
  };

  const createCompanyMutation = useMutation({
    mutationFn: async (data: CompanyFormData) => {
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          country: data.country,
          incorporationDate: data.incorporationDate,
          authorizedShares: data.authorizedShares,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    },
    onSuccess: (data: { id: string; authorizedShares: number }) => {
      setCompanyId(data.id);
      setAuthorizedShares(data.authorizedShares);
      setCurrentStep(1);
      toast({
        title: "Success",
        description: "Company created and saved successfully",
      });
    },
    onError: (error: any) => {
      console.error("Company creation error:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to create company",
        variant: "destructive",
      });
    },
  });

  const addFounderMutation = useMutation({
    mutationFn: async (data: FounderFormData) => {
      if (!companyId) throw new Error("No company selected");
      
      console.log("Creating founder with data:", data);
      console.log("Company ID:", companyId);
      
      // Create stakeholder
      const stakeholderResponse = await fetch(`/api/companies/${companyId}/stakeholders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          title: data.title,
          type: "person",
        }),
      });

      if (!stakeholderResponse.ok) {
        const errorData = await stakeholderResponse.json();
        console.error("API error:", errorData);
        throw new Error(errorData.error || `HTTP ${stakeholderResponse.status}`);
      }

      const stakeholder = await stakeholderResponse.json();
      console.log("Created stakeholder:", stakeholder);

      // Get security classes to find the common stock class ID
      const securityClassesResponse = await fetch(`/api/companies/${companyId}/security-classes`);
      const securityClasses = await securityClassesResponse.json();
      const commonStockClass = securityClasses.find((sc: any) => sc.name === "Common Stock");
      
      if (!commonStockClass) {
        throw new Error("No common stock security class found");
      }

      // Create share ledger entry for the founder
      const shareResponse = await fetch(`/api/companies/${companyId}/share-ledger`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          holderId: stakeholder.id,
          classId: commonStockClass.id,
          quantity: data.shares,
          transactionType: "issuance",
          date: new Date().toISOString(),
          pricePerShare: "0.01", // Nominal value for founder shares
        }),
      });

      if (!shareResponse.ok) {
        const errorData = await shareResponse.json();
        console.error("Share ledger API error:", errorData);
        throw new Error(errorData.error || `HTTP ${shareResponse.status}`);
      }

      const shareLedgerEntry = await shareResponse.json();
      console.log("Created share ledger entry:", shareLedgerEntry);
      
      return { stakeholder, shareLedgerEntry };
    },
    onSuccess: (stakeholder) => {
      const newFounder = founderForm.getValues();
      setFounders(prev => [...prev, newFounder]);
      founderForm.reset();
      toast({
        title: "Success",
        description: `${newFounder.name} added as founder`,
      });
    },
    onError: (error: any) => {
      console.error("Founder creation error:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to add founder",
        variant: "destructive",
      });
    },
  });

  const onCreateCompany = (data: CompanyFormData) => {
    createCompanyMutation.mutate(data);
  };

  const onAddFounder = (data: FounderFormData) => {
    addFounderMutation.mutate(data);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const finishSetup = () => {
    if (companyId) {
      window.location.href = `/companies/${companyId}`;
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Cap Table Setup</h1>
          <p className="text-neutral-600">
            Let's set up your company's capitalization table with founders and initial equity
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                index <= currentStep 
                  ? 'bg-primary border-primary text-white' 
                  : step.completed
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'border-neutral-300 text-neutral-400'
              }`}>
                {step.completed ? <CheckCircle className="h-5 w-5" /> : step.icon}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-24 h-0.5 mx-4 ${
                  index < currentStep ? 'bg-primary' : 'bg-neutral-300'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {steps[currentStep].icon}
              {steps[currentStep].title}
            </CardTitle>
            <p className="text-neutral-600">{steps[currentStep].description}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStep === 0 && (
              <Form {...companyForm}>
                <form onSubmit={companyForm.handleSubmit(onCreateCompany)} className="space-y-4">
                  <FormField
                    control={companyForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Acme Corporation" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={companyForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Brief description of your company" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={companyForm.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Country</FormLabel>
                          <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    "justify-between",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value
                                    ? countries.find((country) => country.code === field.value)?.name
                                    : "Select country..."}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0">
                              <Command>
                                <CommandInput placeholder="Search country..." />
                                <CommandList>
                                  <CommandEmpty>No country found.</CommandEmpty>
                                  <CommandGroup>
                                    {countries.map((country) => (
                                      <CommandItem
                                        key={country.code}
                                        value={country.name}
                                        onSelect={() => {
                                          field.onChange(country.code);
                                          setCountryOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            country.code === field.value ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        {country.name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={companyForm.control}
                      name="incorporationDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Incorporation Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={companyForm.control}
                    name="authorizedShares"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Authorized Shares</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="e.g., 10000000" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button type="submit" disabled={createCompanyMutation.isPending}>
                      {createCompanyMutation.isPending ? "Creating..." : "Create Company"}
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            {currentStep === 1 && (
              <div className="space-y-6">
                {/* Add Founder Form */}
                <Form {...founderForm}>
                  <form onSubmit={founderForm.handleSubmit(onAddFounder)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={founderForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={founderForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="john@company.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={founderForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., CEO, CTO" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={founderForm.control}
                        name="shares"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Initial Shares</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="1000000"
                                value={field.value === 0 ? '' : field.value}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === '') {
                                    field.onChange(0);
                                    return;
                                  }
                                  const shares = parseInt(value);
                                  if (!isNaN(shares)) {
                                    field.onChange(shares);
                                    handleSharesChange(shares);
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={founderForm.control}
                        name="percentage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ownership %</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="10.00"
                                value={field.value === 0 ? '' : field.value}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === '') {
                                    field.onChange(0);
                                    return;
                                  }
                                  const percentage = parseFloat(value);
                                  if (!isNaN(percentage)) {
                                    field.onChange(percentage);
                                    handlePercentageChange(percentage);
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={addFounderMutation.isPending}>
                        {addFounderMutation.isPending ? "Adding..." : "Add Founder"}
                      </Button>
                    </div>
                  </form>
                </Form>

                {/* Added Founders List */}
                {founders.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Added Founders</h3>
                    <div className="space-y-2">
                      {founders.map((founder, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-neutral-100 rounded-lg">
                          <div>
                            <div className="font-medium">{founder.name}</div>
                            <div className="text-sm text-neutral-600">{founder.title} • {founder.email}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{founder.shares.toLocaleString()} shares</div>
                            <div className="text-sm text-neutral-600">{founder.percentage.toFixed(2)}% ownership</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={prevStep}>
                    Previous
                  </Button>
                  <Button onClick={nextStep} disabled={founders.length === 0}>
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
                  <h3 className="text-lg font-semibold mb-2">Security Classes Setup</h3>
                  <p className="text-neutral-600 mb-4">
                    Basic security classes have been created for your company
                  </p>
                  <div className="text-left max-w-md mx-auto space-y-2">
                    <div className="p-3 bg-neutral-100 rounded-lg">
                      <div className="font-medium">Common Stock</div>
                      <div className="text-sm text-neutral-600">Standard voting shares for founders and employees</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={prevStep}>
                    Previous
                  </Button>
                  <Button onClick={nextStep}>
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <h3 className="text-lg font-semibold mb-2">Setup Complete!</h3>
                  <p className="text-neutral-600 mb-6">
                    Your cap table has been successfully initialized with the founding team and initial equity distribution.
                  </p>
                  
                  <div className="text-left max-w-md mx-auto space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">What's been created:</h4>
                      <ul className="text-sm text-green-800 space-y-1">
                        <li>• Company profile and basic information</li>
                        <li>• {founders.length} founder(s) with initial equity</li>
                        <li>• Common stock security class</li>
                        <li>• Initial share issuances</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button onClick={finishSetup} size="lg">
                    Go to Cap Table Dashboard
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}