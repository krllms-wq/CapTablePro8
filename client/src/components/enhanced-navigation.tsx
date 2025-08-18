import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TourButton, useMainTour } from "@/components/ui/guided-tour";
import { HelpToggle, SensitiveToggle } from "@/components/ui/help-toggle";
import { NewBadge, NewFeaturesIndicator } from "@/components/ui/new-badge";
import { Building, Users, FileText, TrendingUp, Award, Settings, HelpCircle, Info, LogOut, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationProps {
  companyId?: string;
  companyName?: string;
}

export default function Navigation({ companyId, companyName }: NavigationProps) {
  const [location] = useLocation();
  const { startMainTour } = useMainTour();
  const [showHelp, setShowHelp] = useState(false);

  const isActiveRoute = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const navItems = companyId ? [
    {
      href: `/companies/${companyId}`,
      label: "Overview",
      icon: <Building className="h-4 w-4" />,
      tourId: "cap-table"
    },
    {
      href: `/companies/${companyId}/stakeholders`,
      label: "Stakeholders",
      icon: <Users className="h-4 w-4" />,
      tourId: "stakeholders-section"
    },
    {
      href: `/companies/${companyId}/transactions`,
      label: "Transactions",
      icon: <FileText className="h-4 w-4" />
    },
    {
      href: `/companies/${companyId}/scenarios`,
      label: "Scenarios",
      icon: <TrendingUp className="h-4 w-4" />
    },
    {
      href: `/companies/${companyId}/equity-awards`,
      label: "Equity Awards",
      icon: <Award className="h-4 w-4" />
    }
  ] : [
    {
      href: "/companies",
      label: "Companies",
      icon: <Building className="h-4 w-4" />
    }
  ];

  return (
    <nav className="bg-white border-b border-neutral-200" data-tour="navigation">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Company Name */}
          <div className="flex items-center space-x-4">
            <Link href="/">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Building className="h-5 w-5 text-white" />
                </div>
                <span className="font-semibold text-lg">Cap Table</span>
              </div>
            </Link>

            {companyName && (
              <>
                <div className="text-neutral-300">/</div>
                <span className="text-neutral-600 font-medium">{companyName}</span>
              </>
            )}
          </div>

          {/* Main Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <NewBadge key={item.href} featureId={item.tourId || "navigation"}>
                <Link href={item.href}>
                  <Button
                    variant={isActiveRoute(item.href) ? "default" : "ghost"}
                    className="flex items-center space-x-2"
                    data-tour={item.tourId}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Button>
                </Link>
              </NewBadge>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3" data-tour="action-buttons">
            {/* Tour and Help Controls */}
            <div className="hidden lg:flex items-center space-x-2">
              <NewBadge featureId="guided-tour">
                <TourButton />
              </NewBadge>
              
              <NewBadge featureId="help-toggle">
                <HelpToggle />
              </NewBadge>
              
              <NewBadge featureId="sensitive-toggle">
                <SensitiveToggle />
              </NewBadge>
            </div>

            {/* Help Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  Help
                  <NewFeaturesIndicator />
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={startMainTour}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Take Guided Tour
                  <NewBadge featureId="guided-tour" className="ml-auto">
                    <Badge variant="secondary" className="text-xs">New</Badge>
                  </NewBadge>
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={startMainTour}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Replay Tour
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem asChild>
                  <Link href="/system-info">
                    <Info className="h-4 w-4 mr-2" />
                    System Information
                    <NewBadge featureId="system-info" className="ml-auto">
                      <Badge variant="secondary" className="text-xs">New</Badge>
                    </NewBadge>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <a 
                    href="https://docs.captable.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Documentation
                  </a>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <Settings className="h-4 w-4 mr-2" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <a href="/api/logout" className="flex items-center">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-3">
          <div className="flex space-x-1 overflow-x-auto">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActiveRoute(item.href) ? "default" : "ghost"}
                  size="sm"
                  className="flex items-center space-x-1 whitespace-nowrap"
                >
                  {item.icon}
                  <span className="text-xs">{item.label}</span>
                </Button>
              </Link>
            ))}
          </div>
          
          {/* Mobile Help Controls */}
          <div className="flex items-center space-x-2 mt-2 pt-2 border-t">
            <TourButton />
            <HelpToggle />
            <SensitiveToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}