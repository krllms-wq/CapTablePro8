import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import * as React from "react";

export function useAuth() {
  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  // Clear auth data on 401 error
  React.useEffect(() => {
    if (error && error.message.includes("401")) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
    }
  }, [error]);

  return {
    user: user as User | undefined,
    isLoading,
    isAuthenticated: !!user,
    refetch,
  };
}

export async function logout(): Promise<void> {
  try {
    // Call server logout endpoint
    await fetch('/api/auth/logout', { 
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Logout API call failed:', error);
    // Continue with client-side logout even if server call fails
  }
  
  // Clear client-side auth data
  localStorage.removeItem("auth_token");
  localStorage.removeItem("user");
  
  // Redirect to login page
  window.location.href = "/login";
}