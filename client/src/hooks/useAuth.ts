import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import * as React from "react";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
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
  };
}

export function logout() {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("user");
  window.location.href = "/";
}