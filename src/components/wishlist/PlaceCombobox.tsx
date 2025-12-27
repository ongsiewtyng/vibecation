import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function PlaceCombobox({ 
  value, 
  onChange, 
  options, 
  disabled 
}: {
  value?: string;
  onChange: (v: string) => void;
  options: string[];
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const display = value || "Select or type place name...";
  // Ensure options are strings before sorting
  const stringOptions = options.filter((opt): opt is string => typeof opt === 'string');
  const list = Array.from(new Set(stringOptions)).sort((a, b) => a.localeCompare(b));

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setOpen(false);
    setInputValue("");
  };

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    // Allow free text entry
    if (newValue) {
      onChange(newValue);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          role="combobox" 
          aria-expanded={open} 
          className="w-full justify-between" 
          disabled={disabled}
        >
          <span className="truncate">{display}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Type a place name..." 
            value={inputValue}
            onValueChange={handleInputChange}
          />
          <CommandList>
            <CommandEmpty>Type to add a new place</CommandEmpty>
            <CommandGroup>
              {list.map((opt) => (
                <CommandItem 
                  key={opt} 
                  value={opt} 
                  onSelect={() => handleSelect(opt)}
                >
                  <Check 
                    className={cn(
                      "mr-2 h-4 w-4", 
                      opt === value ? "opacity-100" : "opacity-0"
                    )} 
                  />
                  {opt}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
