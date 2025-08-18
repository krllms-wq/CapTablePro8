// Enhanced companies page with comprehensive UX improvements
export { default } from "@/components/enhanced-companies";
  const { user } = useAuth();

  const { data: companies = [], isLoading, error } = useQuery({
    queryKey: ["/api/companies"],
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const filteredCompanies = (companies as Company[]).filter((company: Company) =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const CompanySkeleton = () => (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </CardContent>
    </Card>
  );

  const LoadingState = () => (
    <AppShell breadcrumbs={[{ label: 'Companies' }]}>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <CompanySkeleton key={i} />
          ))}
        </div>
      </div>
    </AppShell>
  );

  if (isLoading) return <LoadingState />;

  if (error) {
    return (
      <AppShell breadcrumbs={[{ label: 'Companies' }]}>
        <div className="p-6">
          <EmptyState
            icon={<Building2 className="h-6 w-6 text-destructive" />}
            title="Failed to load companies"
            description="There was an error loading your companies. Please try again."
            action={{
              label: "Retry",
              onClick: () => queryClient.refetchQueries({ queryKey: ["/api/companies"] })
            }}
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell breadcrumbs={[{ label: 'Companies' }]}>
      <div className="p-6">
        {/* Search and Create Company */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input
                type="text"
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Link href="/setup">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Company
            </Button>
          </Link>
        </div>

        {/* Companies Grid */}
        {filteredCompanies.length === 0 ? (
          <EmptyState
            icon={<Building2 className="h-6 w-6" />}
            title={companies.length === 0 ? "No companies yet" : "No companies found"}
            description={
              companies.length === 0 
                ? "Get started by creating your first company to manage equity and cap tables." 
                : `No companies match "${searchTerm}". Try a different search term.`
            }
            action={companies.length === 0 ? {
              label: "Create your first company",
              onClick: () => window.location.href = "/setup"
            } : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company: Company) => (
              <Link key={company.id} href={`/companies/${company.id}`}>
                <Card className="hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer group">
                  <CardHeader>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {company.name}
                    </CardTitle>
                    {company.description && (
                      <CardDescription>{company.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-text-muted">Jurisdiction:</span>
                        <Badge variant="secondary">{company.country}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Currency:</span>
                        <span className="font-medium">{company.currency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Authorized Shares:</span>
                        <span className="font-medium">{company.authorizedShares?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Incorporated:</span>
                        <span className="font-medium">
                          {new Date(company.incorporationDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}