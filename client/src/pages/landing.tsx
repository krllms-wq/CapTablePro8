import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

export default function Landing() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      return await apiRequest("/api/auth/login", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: (data: any) => {
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      toast({
        title: "Welcome back!",
        description: "You've successfully logged in.",
      });
      // Force a full page reload to ensure auth state is properly updated
      window.location.href = "/companies";
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; firstName: string; lastName: string }) => {
      return await apiRequest("/api/auth/register", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: (data: any) => {
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      toast({
        title: "Account created!",
        description: "Welcome to CapTable Pro. Your account has been created successfully.",
      });
      // Force a full page reload to ensure auth state is properly updated
      window.location.href = "/companies";
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      if (isLogin) {
        const validated = loginSchema.parse({
          email: formData.email,
          password: formData.password,
        });
        loginMutation.mutate(validated);
      } else {
        const validated = registerSchema.parse(formData);
        registerMutation.mutate(validated);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full flex items-center justify-between">
        {/* Hero Section */}
        <div className="flex-1 max-w-2xl pr-8">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <i className="fas fa-chart-pie text-white text-xl"></i>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">CapTable Pro</h1>
            </div>
            
            <h2 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Manage Your Cap Table with
              <span className="text-primary"> Professional Precision</span>
            </h2>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              The comprehensive platform for startups to track equity, manage stakeholders, 
              model funding rounds, and maintain compliance with advanced scenario planning.
            </p>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-check text-green-600 text-sm"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Advanced Modeling</h3>
                  <p className="text-gray-600 text-sm">SAFEs, convertibles, and complex waterfall scenarios</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-users text-blue-600 text-sm"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Team Collaboration</h3>
                  <p className="text-gray-600 text-sm">Share cap tables securely with investors and advisors</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-shield-alt text-purple-600 text-sm"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Compliance Ready</h3>
                  <p className="text-gray-600 text-sm">Built-in audit trails and regulatory compliance</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-chart-line text-orange-600 text-sm"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Real-time Analytics</h3>
                  <p className="text-gray-600 text-sm">Live dilution tracking and ownership calculations</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Auth Form */}
        <div className="w-96 flex-shrink-0">
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                {isLogin ? "Sign In" : "Create Account"}
              </CardTitle>
              <CardDescription>
                {isLogin 
                  ? "Welcome back! Sign in to access your cap tables." 
                  : "Join thousands of founders managing their equity with CapTable Pro."
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Input
                        type="text"
                        placeholder="First name"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                        className={errors.firstName ? "border-red-500" : ""}
                      />
                      {errors.firstName && (
                        <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                      )}
                    </div>
                    <div>
                      <Input
                        type="text"
                        placeholder="Last name"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                        className={errors.lastName ? "border-red-500" : ""}
                      />
                      {errors.lastName && (
                        <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                      )}
                    </div>
                  </div>
                )}
                
                <div>
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                  )}
                </div>
                
                <div>
                  <Input
                    type="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className={errors.password ? "border-red-500" : ""}
                  />
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loginMutation.isPending || registerMutation.isPending}
                >
                  {loginMutation.isPending || registerMutation.isPending 
                    ? "Processing..." 
                    : isLogin ? "Sign In" : "Create Account"
                  }
                </Button>
              </form>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setErrors({});
                      setFormData({ email: "", password: "", firstName: "", lastName: "" });
                    }}
                    className="ml-1 text-primary hover:underline font-medium"
                  >
                    {isLogin ? "Sign up" : "Sign in"}
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}