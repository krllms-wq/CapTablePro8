import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NewTransactionButtonProps {
  onTransactionSelect: (type: string) => void;
  className?: string;
}

export default function NewTransactionButton({ onTransactionSelect, className = "" }: NewTransactionButtonProps) {
  const transactionTypes = [
    {
      id: "funding-round",
      name: "Funding Round",
      description: "Manage complete funding round with multiple investors",
    },
    {
      id: "shares",
      name: "Issue Shares",
      description: "Issue common or preferred shares",
    },
    {
      id: "options",
      name: "Grant Options",
      description: "Grant stock options or RSUs",
    },
    {
      id: "safe",
      name: "SAFE Agreement",
      description: "Issue SAFE (Simple Agreement for Future Equity)",
    },
    {
      id: "convertible",
      name: "Convertible Note",
      description: "Issue convertible note or debt",
    },
    {
      id: "secondary",
      name: "Secondary Transfer",
      description: "Transfer existing shares between parties",
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          className={`flex items-center gap-2 ${className}`}
          data-testid="new-transaction-button"
          aria-label="Create new transaction"
        >
          <Plus className="h-4 w-4" />
          New Transaction
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {transactionTypes.map((type) => (
          <DropdownMenuItem
            key={type.id}
            onClick={() => onTransactionSelect(type.id)}
            className="cursor-pointer"
            data-testid={`transaction-option-${type.id}`}
          >
            <div className="flex flex-col gap-1">
              <span className="font-medium">{type.name}</span>
              <span className="text-sm text-neutral-500">{type.description}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}