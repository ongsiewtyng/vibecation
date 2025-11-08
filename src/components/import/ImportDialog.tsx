import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { importWorkbook, type ImportResult } from "@/lib/importers/travelImporter";
import { Loader2, CheckCircle2, AlertCircle, Info } from "lucide-react";

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ImportDialog = ({ open, onClose, onSuccess }: ImportDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [dryRun, setDryRun] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      const importResult = await importWorkbook(file, { dryRun });
      setResult(importResult);

      const totalCreated = Object.values(importResult.summary).reduce((sum, s) => sum + s.created, 0);
      const totalUpdated = Object.values(importResult.summary).reduce((sum, s) => sum + s.updated, 0);
      const errorCount = importResult.errors.length;

      if (dryRun) {
        toast.info(`Dry run complete: ${totalCreated} would be created, ${totalUpdated} updated`);
      } else if (errorCount === 0) {
        toast.success(`Import complete: ${totalCreated} created, ${totalUpdated} updated`);
        onSuccess();
      } else {
        toast.warning(`Import completed with ${errorCount} errors`);
      }
    } catch (error: any) {
      toast.error("Import failed: " + error.message);
      setResult({
        summary: {},
        errors: [{ sheet: "N/A", row: 0, reason: error.message }],
        warnings: [],
      });
    } finally {
      setImporting(false);
    }
  };

  const getTotalCreated = () => result ? Object.values(result.summary).reduce((sum, s) => sum + s.created, 0) : 0;
  const getTotalUpdated = () => result ? Object.values(result.summary).reduce((sum, s) => sum + s.updated, 0) : 0;
  const getTotalSkipped = () => result ? Object.values(result.summary).reduce((sum, s) => sum + s.skipped, 0) : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import from Excel/CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Input */}
          <div className="space-y-2">
            <Label htmlFor="file">Select File</Label>
            <Input
              id="file"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          {/* Dry Run Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
            <div className="space-y-0.5">
              <Label htmlFor="dry-run" className="text-sm font-medium cursor-pointer">
                Dry Run Mode
              </Label>
              <p className="text-xs text-muted-foreground">
                Preview import without writing to database
              </p>
            </div>
            <Switch id="dry-run" checked={dryRun} onCheckedChange={setDryRun} />
          </div>

          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <p className="font-semibold mb-2">Smart Import Features:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Automatically detects sheet types by column names (no fixed naming required)</li>
                <li>Flexible column mapping with synonyms (e.g., "city" → "destination", "price" → "cost")</li>
                <li>Supports multiple date formats: YYYY-MM-DD, DD/MM/YYYY, Excel serial numbers</li>
                <li>Links child rows to trips via "trip_ref" field</li>
                <li>Batches large imports for performance (100 rows per batch)</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Result Summary */}
          {result && (
            <div className="space-y-3">
              {/* Overall Stats */}
              <Alert variant={result.errors.length > 0 ? "destructive" : "default"}>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-2">
                    {dryRun ? "Dry Run Results" : "Import Results"}
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                      <span>{dryRun ? "Would create:" : "Created:"} {getTotalCreated()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Info className="h-3 w-3 text-blue-600" />
                      <span>{dryRun ? "Would update:" : "Updated:"} {getTotalUpdated()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 text-orange-600" />
                      <span>Skipped: {getTotalSkipped()}</span>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Per-Table Breakdown */}
              {Object.keys(result.summary).length > 0 && (
                <Alert>
                  <AlertDescription>
                    <p className="font-semibold mb-2 text-sm">Per-Table Summary:</p>
                    <div className="space-y-1 text-xs">
                      {Object.entries(result.summary).map(([table, stats]) => (
                        <div key={table} className="flex justify-between py-1 border-b last:border-0">
                          <span className="font-medium capitalize">{table.replace(/_/g, " ")}:</span>
                          <span>
                            ✅ {stats.created} · 🔄 {stats.updated} · ⚠️ {stats.skipped}
                          </span>
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-semibold mb-1 text-sm">Warnings ({result.warnings.length}):</p>
                    <ul className="text-xs space-y-1 ml-4 list-disc">
                      {result.warnings.map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Errors */}
              {result.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-semibold mb-1 text-sm">
                      Errors ({result.errors.length}) - Showing first 10:
                    </p>
                    <ul className="text-xs space-y-1 ml-4 list-disc max-h-32 overflow-y-auto">
                      {result.errors.slice(0, 10).map((err, i) => (
                        <li key={i}>
                          <span className="font-medium">{err.sheet}</span> (row {err.row}): {err.reason}
                          {err.context && <span className="text-muted-foreground"> - {err.context}</span>}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handleImport} disabled={!file || importing}>
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {dryRun ? "Analyzing..." : "Importing..."}
                </>
              ) : (
                <>{dryRun ? "Preview Import" : "Import Data"}</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportDialog;
