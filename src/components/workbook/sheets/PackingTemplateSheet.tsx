import PackingTab from "@/components/trip-details/PackingTab";
import type { Sheet } from "@/types/workbook";

interface PackingTemplateSheetProps {
  sheet: Sheet;
}

const PackingTemplateSheet = ({ sheet }: PackingTemplateSheetProps) => {
  const tripId = sheet.config?.trip_id as string | undefined;
  
  if (!tripId) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
        <p>No trip linked to this sheet.</p>
        <p className="text-sm">Edit the sheet config to link a trip.</p>
      </div>
    );
  }
  
  return (
    <div className="h-full overflow-auto p-4">
      <PackingTab tripId={tripId} />
    </div>
  );
};

export default PackingTemplateSheet;
