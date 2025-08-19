import { ReactNode } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Settings } from 'lucide-react';

interface AdditionalSettingsProps {
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  className?: string;
}

export default function AdditionalSettings({
  children,
  open,
  onOpenChange,
  title = "Additional Settings",
  description = "Optional configuration and advanced options",
  className = "",
}: AdditionalSettingsProps) {
  return (
    <Accordion
      type="single"
      value={open ? "settings" : ""}
      onValueChange={(value) => onOpenChange(value === "settings")}
      className={className}
    >
      <AccordionItem value="settings" className="border rounded-lg">
        <AccordionTrigger className="px-4 py-3 hover:no-underline">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Settings className="h-4 w-4" />
            {title}
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <p className="text-sm text-muted-foreground mb-4">{description}</p>
          <div className="space-y-4">
            {children}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}