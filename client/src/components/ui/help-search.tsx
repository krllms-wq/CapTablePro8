import { useState } from "react";
import { Search, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { searchEquityTerms, type EquityTerm } from "@/lib/equity-terms";

export function HelpSearchDialog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<EquityTerm[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 1) {
      const results = searchEquityTerms(query);
      setSearchResults(results.slice(0, 10)); // Limit to first 10 results
    } else {
      setSearchResults([]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4" />
          Equity Terms Help
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Equity Terms Dictionary
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search for equity terms (e.g., 'valuation cap', 'vesting', 'dilution')"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <ScrollArea className="h-[400px] pr-4">
            {searchResults.length > 0 ? (
              <div className="space-y-4">
                {searchResults.map((term, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 space-y-2"
                  >
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                      {term.term}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {term.definition}
                    </p>
                    {term.example && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-600">
                        <span className="font-medium">Example:</span> {term.example}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : searchQuery.trim().length > 1 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                No results found for "{searchQuery}"
              </div>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Search for equity terms to get detailed explanations</p>
                <p className="text-sm mt-2">Try: "SAFE", "vesting schedule", "liquidation preference"</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}