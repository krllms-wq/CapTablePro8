import Navigation from "@/components/layout/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown, Book, Calculator, FileText, Users, Banknote, TrendingUp, Settings } from "lucide-react";

interface HelpSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export default function Help() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['cap-table']));

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const helpSections: HelpSection[] = [
    {
      id: "cap-table",
      title: "Cap Table Calculations",
      icon: <Calculator className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-neutral-800 mb-3">Understanding Ownership Calculations</h4>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h5 className="font-medium text-blue-900 mb-2">Current Ownership (Outstanding View)</h5>
                <p className="text-blue-800 text-sm mb-2">Shows actual issued shares and exercised options only.</p>
                <code className="text-xs bg-blue-100 p-2 rounded block">
                  Ownership % = (Stakeholder Shares + Exercised Options) / Total Outstanding Shares
                </code>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h5 className="font-medium text-green-900 mb-2">Fully Diluted Ownership</h5>
                <p className="text-green-800 text-sm mb-2">Includes all shares, options, and unallocated option pool.</p>
                <code className="text-xs bg-green-100 p-2 rounded block">
                  Ownership % = (Shares + All Options) / (Total Shares + All Options + Unallocated Pool)
                </code>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-neutral-800 mb-3">Valuation Calculation Sources</h4>
            <ul className="space-y-2 text-sm text-neutral-700">
              <li><strong>Latest Priced Round:</strong> Uses most recent round's price per share</li>
              <li><strong>Latest Share Transaction:</strong> Uses most recent share issuance price</li>
              <li><strong>409A Valuation:</strong> Uses formal third-party valuation (if available)</li>
              <li><strong>Manual Override:</strong> Company-set valuation for scenario modeling</li>
            </ul>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h5 className="font-medium text-yellow-900 mb-2">Important: No Double Counting</h5>
            <p className="text-yellow-800 text-sm">
              Our system prevents double counting by only including unexercised options in fully diluted calculations. 
              Once options are exercised, they become shares and are removed from the option count.
            </p>
          </div>
        </div>
      )
    },
    
    {
      id: "safe-conversions",
      title: "SAFE Conversions",
      icon: <FileText className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-neutral-800 mb-3">Pre-Money SAFE</h4>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-orange-800 text-sm mb-3">
                Conversion price = min(discount price, cap price, round price)
              </p>
              <div className="space-y-2 text-xs">
                <div><strong>Discount Price:</strong> Round Price × (1 - Discount Rate)</div>
                <div><strong>Cap Price:</strong> Valuation Cap ÷ Pre-Round Fully Diluted Shares</div>
                <div><strong>Shares Issued:</strong> Investment Amount ÷ Conversion Price</div>
              </div>
              <div className="mt-3 p-3 bg-orange-100 rounded">
                <strong className="text-orange-900">Example:</strong> $500K investment, 20% discount, $5M cap, $2 round price
                <br />
                <span className="text-xs">Discount: $1.60 | Cap: $0.59 | Best: $0.59 → 847K shares</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-neutral-800 mb-3">Post-Money SAFE</h4>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-purple-800 text-sm mb-3">
                Ownership-based calculation that preserves target ownership percentage
              </p>
              <div className="space-y-2 text-xs">
                <div><strong>Target Ownership:</strong> Investment ÷ Valuation Cap</div>
                <div><strong>Shares Issued:</strong> (Target % × Pre-Round Shares) ÷ (1 - Target %)</div>
              </div>
              <div className="mt-3 p-3 bg-purple-100 rounded">
                <strong className="text-purple-900">Example:</strong> $500K investment, $5M cap
                <br />
                <span className="text-xs">Target: 10% ownership → 944K shares (better for investor)</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-neutral-800 mb-3">Custom SAFE</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-800 text-sm">
                Custom SAFEs use either pre-money or post-money logic based on the postMoney flag. 
                The framework field determines the calculation method but allows for non-standard terms.
              </p>
            </div>
          </div>
        </div>
      )
    },

    {
      id: "equity-awards",
      title: "Equity Awards & Vesting",
      icon: <Users className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-neutral-800 mb-3">Award Types</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h5 className="font-medium text-blue-900 mb-2">Stock Options (ISO/NSO)</h5>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Require strike price (exercise price)</li>
                  <li>• Vest over time (typically 4 years)</li>
                  <li>• 1-year cliff before any vesting</li>
                  <li>• Monthly or quarterly vesting cadence</li>
                </ul>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h5 className="font-medium text-green-900 mb-2">RSUs (Restricted Stock Units)</h5>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• No strike price required</li>
                  <li>• Vest directly into shares</li>
                  <li>• Same vesting schedule as options</li>
                  <li>• Higher tax implications</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-neutral-800 mb-3">Vesting Calculations</h4>
            <div className="bg-neutral-50 p-4 rounded-lg">
              <div className="space-y-3">
                <div>
                  <strong>Cliff Period:</strong> No vesting until cliff is reached (typically 12 months)
                </div>
                <div>
                  <strong>Vesting Schedule:</strong> After cliff, vest proportionally each period
                </div>
                <div>
                  <strong>Accelerated Vesting:</strong> Can be triggered by termination or acquisition events
                </div>
              </div>
              <div className="mt-3 p-3 bg-neutral-100 rounded">
                <code className="text-xs">
                  Vested = max(0, min(Total, (Months Since Start - Cliff) / Total Months × Total Granted))
                </code>
              </div>
            </div>
          </div>
        </div>
      )
    },

    {
      id: "convertible-notes",
      title: "Convertible Notes",
      icon: <Banknote className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-neutral-800 mb-3">Interest Calculation</h4>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-800 text-sm mb-3">
                Uses Actual/365 day count convention for interest accrual
              </p>
              <code className="text-xs bg-blue-100 p-2 rounded block">
                Interest = Principal × (Interest Rate / 100) × (Days Since Issue / 365)
              </code>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-neutral-800 mb-3">Conversion Logic</h4>
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h5 className="font-medium text-green-900 mb-2">Conversion Price</h5>
                <p className="text-green-800 text-sm mb-2">
                  Takes the minimum of: round price, discount price, or cap price
                </p>
                <div className="text-xs space-y-1">
                  <div><strong>Total Amount:</strong> Principal + Accrued Interest</div>
                  <div><strong>Shares Issued:</strong> Total Amount ÷ Conversion Price</div>
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h5 className="font-medium text-yellow-900 mb-2">Conversion Triggers</h5>
                <ul className="text-yellow-800 text-sm space-y-1">
                  <li>• Qualified financing event (priced round)</li>
                  <li>• Maturity date reached</li>
                  <li>• Voluntary conversion by holder</li>
                  <li>• Company acquisition/liquidity event</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )
    },

    {
      id: "corporate-actions",
      title: "Corporate Actions",
      icon: <TrendingUp className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-neutral-800 mb-3">Stock Splits</h4>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-800 text-sm mb-3">
                Adjusts share quantities and prices proportionally
              </p>
              <div className="space-y-2 text-xs">
                <div><strong>Forward Split (2:1):</strong> Double shares, halve price</div>
                <div><strong>Reverse Split (1:2):</strong> Halve shares, double price</div>
                <div><strong>Fractional Treatment:</strong> Uses "bankers rounding" by default</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-neutral-800 mb-3">Impact on Instruments</h4>
            <div className="space-y-3">
              <div className="bg-green-50 p-3 rounded-lg">
                <strong className="text-green-900">Options & RSUs:</strong>
                <span className="text-green-800 text-sm ml-2">
                  Quantities and strike prices adjusted proportionally
                </span>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <strong className="text-purple-900">Convertibles:</strong>
                <span className="text-purple-800 text-sm ml-2">
                  Conversion prices adjusted to maintain economic equivalence
                </span>
              </div>
            </div>
          </div>
        </div>
      )
    },

    {
      id: "scenarios",
      title: "Scenario Modeling",
      icon: <TrendingUp className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-neutral-800 mb-3">Funding Round Modeling</h4>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-800 text-sm mb-3">
                Model the impact of new funding rounds on existing stakeholders
              </p>
              <div className="space-y-2 text-xs">
                <div><strong>Pre-Money Valuation:</strong> Company value before new investment</div>
                <div><strong>Post-Money Valuation:</strong> Pre-money + Investment Amount</div>
                <div><strong>Price Per Share:</strong> Pre-money ÷ Pre-Round Shares Outstanding</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-neutral-800 mb-3">SAFE Conversion Scenarios</h4>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-orange-800 text-sm mb-3">
                Model how SAFEs convert at different round valuations
              </p>
              <ul className="text-orange-800 text-sm space-y-1">
                <li>• Test discount vs cap scenarios</li>
                <li>• Compare pre-money vs post-money SAFEs</li>
                <li>• Calculate dilution impact on founders</li>
                <li>• Model option pool increases</li>
              </ul>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-neutral-800 mb-3">Scenario Persistence</h4>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-green-800 text-sm">
                Save and load scenarios for future reference. Compare multiple scenarios 
                side-by-side to make informed decisions about funding terms and valuation.
              </p>
            </div>
          </div>
        </div>
      )
    },

    {
      id: "data-integrity",
      title: "Data Integrity & Validation",
      icon: <Settings className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-neutral-800 mb-3">Input Validation</h4>
            <div className="space-y-3">
              <div className="bg-blue-50 p-3 rounded-lg">
                <strong className="text-blue-900">Share Quantities:</strong>
                <span className="text-blue-800 text-sm ml-2">
                  Must be positive integers, automatically strips commas and spaces
                </span>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <strong className="text-green-900">Money Amounts:</strong>
                <span className="text-green-800 text-sm ml-2">
                  Supports currency symbols, commas, rounded to 4 decimal places
                </span>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <strong className="text-purple-900">Percentages:</strong>
                <span className="text-purple-800 text-sm ml-2">
                  Stored as decimals (20% = 0.20), displayed with 2 decimal places
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-neutral-800 mb-3">Referential Integrity</h4>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <ul className="text-yellow-800 text-sm space-y-1">
                <li>• All transactions linked to valid stakeholders</li>
                <li>• Security classes must exist before share issuance</li>
                <li>• Option plans validated before equity awards</li>
                <li>• Conversion records maintain audit trail</li>
              </ul>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-neutral-800 mb-3">Audit Logging</h4>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-red-800 text-sm mb-2">
                All transactions are logged with detailed metadata:
              </p>
              <ul className="text-red-800 text-xs space-y-1">
                <li>• User who performed the action</li>
                <li>• Timestamp of the transaction</li>
                <li>• Before and after values</li>
                <li>• Transaction type and purpose</li>
                <li>• Related stakeholder information</li>
              </ul>
            </div>
          </div>
        </div>
      )
    }
  ];

  const allSectionIds = helpSections.map(section => section.id);
  
  const expandAll = () => setExpandedSections(new Set(allSectionIds));
  const collapseAll = () => setExpandedSections(new Set());

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 mb-6">
          <div className="p-6 border-b border-neutral-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Book className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-neutral-900">Help & Documentation</h1>
                  <p className="text-neutral-600 mt-1">
                    Complete guide to cap table calculations and business logic
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={expandAll}
                  className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                  data-testid="expand-all-sections"
                >
                  Expand All
                </button>
                <button
                  onClick={collapseAll}
                  className="px-3 py-1 text-sm bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors"
                  data-testid="collapse-all-sections"
                >
                  Collapse All
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 text-amber-600 mt-0.5">
                  <i className="fas fa-lightbulb"></i>
                </div>
                <div>
                  <h3 className="font-medium text-amber-800 mb-1">Living Documentation</h3>
                  <p className="text-amber-700 text-sm">
                    This documentation is automatically updated when logic changes in the application. 
                    It reflects the current implementation as of the latest deployment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {helpSections.map((section) => (
            <div key={section.id} className="bg-white rounded-xl shadow-sm border border-neutral-200">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-neutral-50 transition-colors"
                data-testid={`section-toggle-${section.id}`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center">
                    {section.icon}
                  </div>
                  <h2 className="text-lg font-semibold text-neutral-900">{section.title}</h2>
                </div>
                {expandedSections.has(section.id) ? (
                  <ChevronDown className="w-5 h-5 text-neutral-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-neutral-500" />
                )}
              </button>
              
              {expandedSections.has(section.id) && (
                <div className="px-6 pb-6 border-t border-neutral-100">
                  <div className="pt-6" data-testid={`section-content-${section.id}`}>
                    {section.content}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 mt-6 p-6">
          <div className="text-center">
            <h3 className="font-semibold text-neutral-900 mb-2">Need More Help?</h3>
            <p className="text-neutral-600 text-sm mb-4">
              Can't find what you're looking for? Our team is here to help with any questions about cap table management.
            </p>
            <div className="flex justify-center space-x-4">
              <Button className="bg-primary text-white hover:bg-primary-dark">
                Contact Support
              </Button>
              <Button variant="outline">
                Schedule Demo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}