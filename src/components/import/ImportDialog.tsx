import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { parse, isValid } from "date-fns";

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ImportDialog = ({ open, onClose, onSuccess }: ImportDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const parseDate = (dateValue: any): string | null => {
    if (!dateValue) return null;

    // If it's already a valid ISO string
    if (typeof dateValue === "string" && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateValue;
    }

    // Try parsing DD/MM/YYYY format
    if (typeof dateValue === "string") {
      const parsedDDMMYYYY = parse(dateValue, "dd/MM/yyyy", new Date());
      if (isValid(parsedDDMMYYYY)) {
        return parsedDDMMYYYY.toISOString().split("T")[0];
      }
    }

    // Handle Excel serial dates
    if (typeof dateValue === "number") {
      const excelDate = XLSX.SSF.parse_date_code(dateValue);
      if (excelDate) {
        return `${excelDate.y}-${String(excelDate.m).padStart(2, "0")}-${String(excelDate.d).padStart(2, "0")}`;
      }
    }

    return null;
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });

      let tripsData: any[] = [];
      let itineraryData: any[] = [];
      let accommodationsData: any[] = [];
      let transportsData: any[] = [];
      let expensesData: any[] = [];
      let packingData: any[] = [];
      let wishlistData: any[] = [];

      // Check if multi-sheet or single sheet
      if (workbook.SheetNames.includes("trips")) {
        // Multi-sheet import
        const sheets = {
          trips: "trips",
          itinerary_items: "itinerary_items",
          accommodations: "accommodations",
          transports: "transports",
          expenses: "expenses",
          packing_items: "packing_items",
          wishlist: "wishlist",
        };

        Object.entries(sheets).forEach(([key, sheetName]) => {
          if (workbook.SheetNames.includes(sheetName)) {
            const sheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(sheet);

            switch (key) {
              case "trips":
                tripsData = data;
                break;
              case "itinerary_items":
                itineraryData = data;
                break;
              case "accommodations":
                accommodationsData = data;
                break;
              case "transports":
                transportsData = data;
                break;
              case "expenses":
                expensesData = data;
                break;
              case "packing_items":
                packingData = data;
                break;
              case "wishlist":
                wishlistData = data;
                break;
            }
          }
        });
      } else {
        // Single sheet with section column
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const allData: any[] = XLSX.utils.sheet_to_json(sheet);

        tripsData = allData.filter((row) => row.section === "trips");
        itineraryData = allData.filter((row) => row.section === "itinerary_items");
        accommodationsData = allData.filter((row) => row.section === "accommodations");
        transportsData = allData.filter((row) => row.section === "transports");
        expensesData = allData.filter((row) => row.section === "expenses");
        packingData = allData.filter((row) => row.section === "packing_items");
        wishlistData = allData.filter((row) => row.section === "wishlist");
      }

      let created = 0;
      let updated = 0;
      let errors: string[] = [];
      const tripRefMap = new Map();

      // Import trips
      for (const row of tripsData) {
        try {
          const tripData = {
            title: row.title,
            destination: row.destination,
            country: row.country,
            start_date: parseDate(row.start_date),
            end_date: parseDate(row.end_date),
            budget: row.budget ? parseFloat(row.budget) : null,
            notes: row.notes || null,
          };

          // Check for existing trip
          const { data: existing } = await supabase
            .from("trips")
            .select("id")
            .eq("title", tripData.title)
            .eq("start_date", tripData.start_date)
            .eq("destination", tripData.destination)
            .maybeSingle();

          if (existing) {
            const { data: updatedTrip } = await supabase
              .from("trips")
              .update(tripData)
              .eq("id", existing.id)
              .select()
              .single();
            if (updatedTrip && row.trip_ref) {
              tripRefMap.set(row.trip_ref, updatedTrip.id);
            }
            updated++;
          } else {
            const { data: newTrip } = await supabase
              .from("trips")
              .insert([tripData])
              .select()
              .single();
            if (newTrip && row.trip_ref) {
              tripRefMap.set(row.trip_ref, newTrip.id);
            }
            created++;
          }
        } catch (error: any) {
          errors.push(`Trip row: ${error.message}`);
        }
      }

      // Import related data (itinerary, accommodations, etc.)
      for (const row of itineraryData) {
        if (row.trip_ref && tripRefMap.has(row.trip_ref)) {
          try {
            await supabase.from("itinerary_items").insert([
              {
                trip_id: tripRefMap.get(row.trip_ref),
                day_number: row.day_number,
                date: parseDate(row.date),
                time: row.time || null,
                title: row.title,
                description: row.description || null,
                location: row.location || null,
              },
            ]);
          } catch (error: any) {
            errors.push(`Itinerary row: ${error.message}`);
          }
        }
      }

      // Similar for other tables...
      for (const row of accommodationsData) {
        if (row.trip_ref && tripRefMap.has(row.trip_ref)) {
          try {
            await supabase.from("accommodations").insert([
              {
                trip_id: tripRefMap.get(row.trip_ref),
                name: row.name,
                address: row.address || null,
                check_in: parseDate(row.check_in),
                check_out: parseDate(row.check_out),
                confirmation_number: row.confirmation_number || null,
                cost: row.cost ? parseFloat(row.cost) : null,
                notes: row.notes || null,
              },
            ]);
          } catch (error: any) {
            errors.push(`Accommodation row: ${error.message}`);
          }
        }
      }

      for (const row of expensesData) {
        if (row.trip_ref && tripRefMap.has(row.trip_ref)) {
          try {
            await supabase.from("expenses").insert([
              {
                trip_id: tripRefMap.get(row.trip_ref),
                category: row.category,
                description: row.description,
                amount: parseFloat(row.amount),
                date: parseDate(row.date),
                notes: row.notes || null,
              },
            ]);
          } catch (error: any) {
            errors.push(`Expense row: ${error.message}`);
          }
        }
      }

      for (const row of packingData) {
        if (row.trip_ref && tripRefMap.has(row.trip_ref)) {
          try {
            await supabase.from("packing_items").insert([
              {
                trip_id: tripRefMap.get(row.trip_ref),
                item: row.item,
                category: row.category || null,
                packed: row.packed === true || row.packed === "true" || row.packed === 1,
              },
            ]);
          } catch (error: any) {
            errors.push(`Packing item row: ${error.message}`);
          }
        }
      }

      for (const row of wishlistData) {
        try {
          await supabase.from("wishlist").insert([
            {
              place: row.place,
              country: row.country,
              priority: row.priority ? parseInt(row.priority) : 3,
              tags: row.tags ? row.tags.split(",").map((t: string) => t.trim()) : [],
              notes: row.notes || null,
            },
          ]);
        } catch (error: any) {
          errors.push(`Wishlist row: ${error.message}`);
        }
      }

      setResult({
        created,
        updated,
        errors,
      });

      if (errors.length === 0) {
        toast.success(`Import complete: ${created} created, ${updated} updated`);
        onSuccess();
      } else {
        toast.warning("Import completed with some errors");
      }
    } catch (error: any) {
      toast.error("Import failed: " + error.message);
      setResult({ created: 0, updated: 0, errors: [error.message] });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import from Excel/CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Select File</Label>
            <Input
              id="file"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <Alert>
            <AlertDescription className="text-sm">
              <p className="font-semibold mb-2">Supported formats:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Multi-sheet Excel with sheets named: trips, itinerary_items, accommodations, etc.</li>
                <li>Single sheet with a "section" column</li>
                <li>Dates in DD/MM/YYYY or YYYY-MM-DD format</li>
                <li>Use "trip_ref" to link child rows to trips</li>
              </ul>
            </AlertDescription>
          </Alert>

          {result && (
            <Alert>
              <AlertDescription>
                <p className="font-semibold mb-2">Import Result:</p>
                <ul className="space-y-1">
                  <li>✅ Created: {result.created}</li>
                  <li>🔄 Updated: {result.updated}</li>
                  {result.errors.length > 0 && (
                    <li className="text-destructive">
                      ❌ Errors: {result.errors.length}
                      <ul className="ml-4 mt-1 text-xs">
                        {result.errors.slice(0, 5).map((err: string, i: number) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handleImport} disabled={!file || importing}>
              {importing ? "Importing..." : "Import"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportDialog;
