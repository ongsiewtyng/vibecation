import type { Sheet } from "@/types/workbook";
import BlankGridSheet from "./sheets/BlankGridSheet";
import ItineraryTemplateSheet from "./sheets/ItineraryTemplateSheet";
import BudgetTemplateSheet from "./sheets/BudgetTemplateSheet";
import PlacesTemplateSheet from "./sheets/PlacesTemplateSheet";
import PackingTemplateSheet from "./sheets/PackingTemplateSheet";

interface SheetRendererProps {
  sheet: Sheet;
}

const SheetRenderer = ({ sheet }: SheetRendererProps) => {
  switch (sheet.type) {
    case "blank":
      return <BlankGridSheet sheetId={sheet.id} />;
    
    case "itinerary":
      return <ItineraryTemplateSheet sheet={sheet} />;
    
    case "budget":
      return <BudgetTemplateSheet sheet={sheet} />;
    
    case "places":
      return <PlacesTemplateSheet sheet={sheet} />;
    
    case "packing":
      return <PackingTemplateSheet sheet={sheet} />;
    
    default:
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p>Unknown sheet type: {sheet.type}</p>
        </div>
      );
  }
};

export default SheetRenderer;
